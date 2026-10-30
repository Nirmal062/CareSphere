#!/usr/bin/env python3
"""Reproducible GPU Fine-Tuning Workflow for CareSphere Qwen2.5-0.5B.

Designed for execution on free Google Colab / Kaggle GPU (T4 / A100) or local CUDA machine.
Uses Hugging Face Transformers, PEFT (LoRA), and TRL SFTTrainer.

Steps:
1. Load base Qwen/Qwen2.5-0.5B-Instruct in 4-bit (QLoRA) or bfloat16.
2. Train on verified protocol dataset (training/caresphere_sft_dataset.jsonl).
3. Export merged weights and generate Ollama Modelfile.

Usage:
    pip install transformers peft trl bitsandbytes accelerate datasets
    python training/train_lora_qwen.py --epochs 3 --batch-size 4 --lr 2e-4
"""
import os
import sys
import argparse
from pathlib import Path

def train(args):
    print("=" * 60)
    print("CareSphere Qwen2.5-0.5B-Instruct LoRA Fine-Tuning Workflow")
    print("=" * 60)

    try:
        import torch
        from transformers import (
            AutoModelForCausalLM,
            AutoTokenizer,
            TrainingArguments,
            BitsAndBytesConfig
        )
        from peft import LoraConfig, get_peft_model, TaskType
        from trl import SFTTrainer
        from datasets import load_dataset
    except ImportError as e:
        print(f"\n[ERROR] Required GPU packages not installed: {e}")
        print("Please run this script on a GPU environment (Google Colab / Kaggle / CUDA host):")
        print("  pip install torch transformers peft trl bitsandbytes accelerate datasets\n")
        return

    if not torch.cuda.is_available():
        print("[WARNING] CUDA is not available. Fine-tuning on CPU is prohibitively slow.")
        print("Please run this script on a machine with an NVIDIA GPU.")
        if not args.force_cpu:
            return

    model_id = args.model_id
    dataset_file = args.dataset_file
    output_dir = args.output_dir

    print(f"Base Model:       {model_id}")
    print(f"Dataset Path:     {dataset_file}")
    print(f"Output Directory: {output_dir}")

    # 1. Load Tokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # 2. BitsAndBytes 4-bit quantization config (QLoRA)
    bnb_config = None
    if torch.cuda.is_available() and args.use_4bit:
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16,
            bnb_4bit_use_double_quant=True
        )

    # 3. Load Model
    print("Loading base model...")
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        quantization_config=bnb_config,
        device_map="auto" if torch.cuda.is_available() else "cpu",
        trust_remote_code=True
    )

    # 4. LoRA Configuration
    peft_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=0.05,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
    )

    # 5. Load Dataset
    dataset = load_dataset("json", data_files=dataset_file, split="train")
    print(f"Loaded {len(dataset)} verified training examples.")

    # Format function applying Qwen ChatML template
    def formatting_prompts_func(example):
        texts = []
        for msgs in example["messages"]:
            text = tokenizer.apply_chat_template(msgs, tokenize=False, add_generation_prompt=False)
            texts.append(text)
        return texts

    # 6. Training Arguments
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        learning_rate=args.lr,
        logging_steps=10,
        save_strategy="epoch",
        evaluation_strategy="no",
        fp16=torch.cuda.is_available() and not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_available() and torch.cuda.is_bf16_supported(),
        report_to="none"
    )

    # 7. SFT Trainer
    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        peft_config=peft_config,
        dataset_text_field="text",
        formatting_func=formatting_prompts_func,
        max_seq_length=512,
        tokenizer=tokenizer
    )

    print("\nStarting LoRA Fine-Tuning...")
    trainer.train()

    # 8. Save adapter
    adapter_dir = os.path.join(output_dir, "caresphere_qwen_adapter")
    trainer.model.save_pretrained(adapter_dir)
    tokenizer.save_pretrained(adapter_dir)
    print(f"\n[SUCCESS] LoRA adapter saved to: {adapter_dir}")

    # Instructions for Ollama GGUF Export
    print("\n" + "=" * 60)
    print("EXPORT TO OLLAMA INSTRUCTIONS:")
    print("=" * 60)
    print("1. Merge weights:")
    print("   python -c \"from peft import AutoPeftModelForCausalLM; model = AutoPeftModelForCausalLM.from_pretrained('" + adapter_dir + "'); model.merge_and_unload().save_pretrained('" + output_dir + "/merged')\"")
    print("2. Convert to GGUF using llama.cpp:")
    print("   python llama.cpp/convert_hf_to_gguf.py " + output_dir + "/merged --outtype q4_k_m --outfile " + output_dir + "/caresphere_qwen.gguf")
    print("3. Create Ollama Model:")
    print("   ollama create caresphere-qwen -f training/Modelfile.caresphere")
    print("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CareSphere Qwen LoRA Fine-Tuner")
    parser.add_argument("--model-id", type=str, default="Qwen/Qwen2.5-0.5B-Instruct")
    parser.add_argument("--dataset-file", type=str, default="training/caresphere_sft_dataset.jsonl")
    parser.add_argument("--output-dir", type=str, default="models/caresphere_qwen_lora")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--grad-accum", type=int, default=4)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--lora-r", type=int, default=16)
    parser.add_argument("--lora-alpha", type=int, default=32)
    parser.add_argument("--use-4bit", action="store_true", default=True)
    parser.add_argument("--force-cpu", action="store_true", default=False)
    args = parser.parse_args()

    train(args)
