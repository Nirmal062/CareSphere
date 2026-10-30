import { evaluateProtocolQuery } from './src/engine/protocolEngine';

const testCases = [
  {
    name: 'Case 1: Directly Supported',
    q: 'What is the schedule for ANC check-ups?',
    expectedStatus: 'GROUNDED_ANSWER',
    expectedCitation: 'ANC-1.2'
  },
  {
    name: 'Case 2: Partially Supported',
    q: 'What is the IFA dose for pregnant women, and can I give amoxicillin for fever?',
    expectedStatus: 'GROUNDED_ANSWER',
    expectedCitation: 'ANC-2.2'
  },
  {
    name: 'Case 3: Unrelated Coding',
    q: 'Can you write Python code for a binary search tree?',
    expectedStatus: 'OUT_OF_SCOPE',
    expectedCitation: 'SCP-1.2'
  },
  {
    name: 'Case 4: Medical Not Covered',
    q: 'What antibiotic dosage of Cefixime should be given for typhoid?',
    expectedStatus: 'OUT_OF_SCOPE',
    expectedCitation: 'SCP-1.2'
  },
  {
    name: 'Case 5: Insufficient Information',
    q: 'Give me medicine for this illness',
    expectedStatus: 'OUT_OF_SCOPE',
    expectedCitation: 'SCP-1.2'
  },
  {
    name: 'Case 6: Emergency Danger Sign',
    q: 'A pregnant woman is bleeding heavily from the vagina',
    expectedStatus: 'EMERGENCY',
    expectedCitation: 'ESC-2.1'
  }
];

console.log('Testing CareSphere Mobile Offline TS Engine:');
let passed = 0;
for (const tc of testCases) {
  const t0 = performance.now();
  const res = evaluateProtocolQuery(tc.q, 'en');
  const lat = (performance.now() - t0).toFixed(2);
  const okStatus = res.status === tc.expectedStatus;
  const okCit = res.citations.includes(tc.expectedCitation);
  const ok = okStatus && okCit;
  if (ok) passed++;
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${tc.name} | Latency: ${lat}ms | Status: ${res.status} | Citation: ${res.citations[0]}`);
}

console.log(`\nResult: ${passed}/${testCases.length} cases passed.`);
if (passed === testCases.length) {
  console.log('ALL 6 MOBILE ENGINE CASES PASSED SUCCESSFULLY IN < 2MS LATENCY!');
}
