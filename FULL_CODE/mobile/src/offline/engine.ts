/**
 * CareSphere Native Offline Clinical Decision Engine.
 *
 * Implements deterministic <5ms clinical decision support:
 * 1. Native Emergency Gating (ESC danger signs -> audio tone + 108 referral)
 * 2. Scope Refusal Gate (MoHFW Sec 6.4 -> SCP-1.2)
 * 3. In-memory / SQLite protocol retrieval with exact number/timeline preservation
 * 4. Multilingual speech synthesis via expo-speech
 */
import * as Speech from 'expo-speech';
import { AskResponse, Language } from '../types';
import { detectEmergencyGating, triggerEmergencyAlert } from './emergencyDetector';
import { detectScopeRefusal, isQueryOutOfScope } from './refusalDetector';
import { evaluateProtocolQuery } from '../engine/protocolEngine';
import { getProtocolSectionById } from './database';

export interface OfflineEngineOptions {
  enableAudioAlerts?: boolean;
  serverBaseUrl?: string;
}

/**
 * Execute zero-latency (<5ms) deterministic clinical decision triage on mobile.
 */
export async function processClinicalQueryOffline(
  query: string,
  lang: Language = 'en',
  options?: OfflineEngineOptions
): Promise<AskResponse> {
  const startTime = Date.now();
  const cleanQ = query.trim();

  // Tier 1: Pre-Model Emergency Gating
  const emergencyCheck = detectEmergencyGating(cleanQ);
  if (emergencyCheck.escalate) {
    if (options?.enableAudioAlerts !== false) {
      triggerEmergencyAlert().catch(() => {});
    }
  }

  // Tier 2 & Tier 3: Evaluated by deterministic benchmark engine
  const res = evaluateProtocolQuery(cleanQ, lang);
  const latency = Date.now() - startTime;

  return {
    ...res,
    escalate: res.is_emergency,
    refused: res.is_out_of_scope,
    latency_ms: Math.max(0.2, latency)
  };
}

/**
 * Multilingual speech readout using native expo-speech.
 */
export function speakClinicalAnswer(
  text: string,
  lang: Language = 'en',
  onDone?: () => void
): void {
  Speech.stop();

  let voiceLang = 'en-IN';
  if (lang === 'te') {
    voiceLang = 'te-IN';
  } else if (lang === 'hi') {
    voiceLang = 'hi-IN';
  }

  Speech.speak(text, {
    language: voiceLang,
    pitch: 1.0,
    rate: 0.95,
    onDone
  });
}

/**
 * Stop any ongoing speech readout.
 */
export function stopClinicalSpeech(): void {
  Speech.stop();
}
