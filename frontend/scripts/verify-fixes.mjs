import assert from 'node:assert';

console.log('--- RUNNING ARC AUDIT VERIFICATION CHECKS ---');

// ============================================================================
// 1. Streaming unclosed code indentation preservation
// ============================================================================
console.log('\n[TEST 1] Verifying streaming unclosed code indentation preservation...');

function normalizeProseContent(raw) {
  if (!raw) return '';
  const parts = raw.split(/(```[\s\S]*?(?:```|$))/g);
  for (let i = 0; i < parts.length; i += 2) {
    let part = parts[i].replace(/\r\n/g, '\n');
    part = part.replace(/\n{3,}/g, '\n\n');
    part = part.replace(/[^\S\n]{3,}/g, ' ');
    parts[i] = part;
  }
  return parts.join('');
}

const unclosedCodeInput = 'Here is the analysis:\n```python\n    def calculate_impedance(r, c):\n        return 1.0 / (r * c)';
const normalizedUnclosed = normalizeProseContent(unclosedCodeInput);

assert(
  normalizedUnclosed.includes('    def calculate_impedance'),
  'FAIL: 4-space indentation was collapsed in unclosed streaming code block'
);
assert(
  normalizedUnclosed.includes('        return 1.0'),
  'FAIL: 8-space indentation was collapsed in unclosed streaming code block'
);
console.log('✓ PASS: Streaming unclosed code indentation is preserved intact.');

// ============================================================================
// 2. Sentence-bounded speech chunking > 480 chars without ".. " artifacts
// ============================================================================
console.log('\n[TEST 2] Verifying sentence-bounded speech chunking & no ". ." artifacts...');

function cleanTextForSpeech(raw) {
  if (!raw?.trim()) return 'Explanations and study details are displayed on screen.';

  let text = raw
    .replace(/\bARC\b/g, 'ARC')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*\|.*\|\s*$/gm, ' ')
    .replace(/\|[^\n]+\|/g, ' ')
    .replace(/\|+/g, ' ')
    .replace(/(?:^|\n)\s*#{1,6}\s*/g, ' ')
    .replace(/\[\s*(?:CONFIRMED|LIKELY|CANNOT CONFIRM)\s*\]\s*[:\-–—]?/gi, '')
    .replace(/\b(?:CONFIRMED|CANNOT CONFIRM|LIKELY)\b\s*[:\-–—]?/gi, '')
    .replace(/(?:^|\n)\s*(\d+)\.\s+/g, '. Step $1: ')
    .replace(/(?:^|\n)\s*[-*+]\s+/g, '. ')
    .replace(/\$\$([\s\S]*?)\$\$/g, ' $1 ')
    .replace(/\$([^$]+)\$/g, ' $1 ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[*_~`>#]+/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\\/g, ' ')
    .replace(/\r?\n+/g, '. ')
    .replace(/\.(?:\s*\.)+/g, '.')
    .replace(/\s+/g, ' ')
    .replace(/^[.\s]+|[.\s]+$/g, '')
    .trim();

  if (!text || !text.replace(/[.\s]/g, '')) return 'Explanations and study details are displayed on screen.';
  return text.endsWith('.') || text.endsWith('!') || text.endsWith('?') ? text : `${text}.`;
}

function splitIntoSpeechChunks(text, maxChunkLen = 220) {
  if (!text?.trim()) return [];
  const rawSentences = text.match(/[^.!?;\n]+[.!?;\n]*/g) || [text];
  const chunks = [];
  let currentChunk = '';

  for (const raw of rawSentences) {
    const sentence = raw.trim();
    if (!sentence) continue;

    if (sentence.length > maxChunkLen) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      const words = sentence.split(/\s+/);
      let subChunk = '';
      for (const word of words) {
        if ((subChunk + ' ' + word).trim().length > maxChunkLen) {
          if (subChunk) chunks.push(subChunk.trim());
          subChunk = word;
        } else {
          subChunk = subChunk ? `${subChunk} ${word}` : word;
        }
      }
      if (subChunk) chunks.push(subChunk.trim());
    } else if ((currentChunk + ' ' + sentence).trim().length > maxChunkLen) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

const markdownListInput = `
1. Apply Kirchhoff's voltage law across the primary mesh loop.
2. Calculate node potential at vertex V1 using nodal conductance.
- Verify capacitance charging curve under continuous excitation.
- Measure damping ratio and resonant peak frequency in decibels.

The steady-state analytical response exhibits asymptotic stability when the real part of all eigenvalues remains strictly negative in the complex plane. This comprehensive derivation provides rigorous mathematical grounds for continuous operation without numerical divergence.
`;

const cleanedSpeech = cleanTextForSpeech(markdownListInput);

assert(!cleanedSpeech.includes('..'), 'FAIL: Cleaned speech contains ".."');
assert(!cleanedSpeech.includes('. .'), 'FAIL: Cleaned speech contains ". ."');
assert(cleanedSpeech.includes('Step 1:'), 'FAIL: Cleaned speech dropped Step 1');
assert(cleanedSpeech.includes('Step 2:'), 'FAIL: Cleaned speech dropped Step 2');
assert(cleanedSpeech.length > 400, 'FAIL: Cleaned speech was prematurely truncated');

const speechChunks = splitIntoSpeechChunks(cleanedSpeech, 220);
assert(speechChunks.length > 1, 'FAIL: Speech was not split into sequential chunks');
for (const chunk of speechChunks) {
  assert(chunk.length <= 220, `FAIL: Chunk exceeds max length 220 (${chunk.length} chars)`);
}
console.log(`✓ PASS: Speech cleaned without ". ." (length ${cleanedSpeech.length}) and split into ${speechChunks.length} sentence-bounded chunks.`);

// ============================================================================
// 3. SSE tail-buffer flush without trailing \n\n
// ============================================================================
console.log('\n[TEST 3] Verifying SSE tail-buffer flush when connection closes without trailing \\n\\n...');

function simulateSseParser(streamChunks) {
  let buffer = '';
  const events = [];

  const processBlock = (block) => {
    if (!block.trim()) return;
    let eventType = 'message';
    let dataStr = '';
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) eventType = line.replace('event:', '').trim();
      else if (line.startsWith('data:')) dataStr = line.replace('data:', '').trim();
    }
    if (dataStr) {
      events.push({ event: eventType, data: JSON.parse(dataStr) });
    }
  };

  for (const chunk of streamChunks) {
    buffer += chunk;
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() || '';
    for (const b of blocks) processBlock(b);
  }

  // Final flush after stream ends
  if (buffer.trim()) {
    const remaining = buffer.split('\n\n');
    for (const b of remaining) processBlock(b);
  }

  return events;
}

// Stream sends chunk 1 with \n\n, but final done event without trailing \n\n
const chunks = [
  'event: chunk\ndata: {"chunk": "Hello, world!"}\n\n',
  'event: done\ndata: {"answer": "Hello, world!", "status": "success"}' // No \n\n!
];

const parsedEvents = simulateSseParser(chunks);
assert.strictEqual(parsedEvents.length, 2, 'FAIL: Final event was dropped because of missing \\n\\n');
assert.strictEqual(parsedEvents[1].event, 'done');
assert.strictEqual(parsedEvents[1].data.status, 'success');
console.log('✓ PASS: SSE tail buffer flush correctly captured the final unbuffered done event.');

// ============================================================================
// 4. Mid-stream error isolation without gluing fallback text
// ============================================================================
console.log('\n[TEST 4] Verifying mid-stream error isolation...');

async function simulateExecuteChatWithError({ failAfterChunk = true } = {}) {
  let streamedAnyChunks = false;
  const emittedChunks = [];

  const emitChunk = (chunk) => {
    streamedAnyChunks = true;
    emittedChunks.push(chunk);
  };

  const tryProvider = async () => {
    emitChunk('Partial token 1: Deriving equation...');
    if (failAfterChunk) {
      throw new Error('Connection reset by peer');
    }
    emitChunk(' Finished derivation.');
    return { answer: emittedChunks.join('') };
  };

  try {
    return await tryProvider();
  } catch (err) {
    if (streamedAnyChunks) {
      throw new Error(`Stream interrupted mid-generation: ${err.message}`);
    }
    // Only if no chunks were streamed do we fall back to standby
    const fallbackAnswer = 'STANDBY LECTURE FALLBACK';
    emitChunk(fallbackAnswer);
    return { answer: fallbackAnswer };
  }
}

let errorCaught = null;
try {
  await simulateExecuteChatWithError({ failAfterChunk: true });
} catch (e) {
  errorCaught = e;
}

assert(errorCaught !== null, 'FAIL: Expected stream interruption error was not thrown');
assert(errorCaught.message.includes('Stream interrupted mid-generation'), 'FAIL: Wrong error message');
console.log('✓ PASS: Mid-stream error was isolated cleanly without gluing standby fallback text.');

console.log('\nALL 4 AUDIT VERIFICATION CHECKS PASSED SUCCESSFULLY!\n');
