// Core Morse code maps
const ENGLISH_TO_MORSE = {
  A: '.-',   B: '-...', C: '-.-.', D: '-..',  E: '.',    F: '..-.',
  G: '--.',  H: '....', I: '..',   J: '.---', K: '-.-',  L: '.-..',
  M: '--',   N: '-.',   O: '---',  P: '.--.', Q: '--.-', R: '.-.',
  S: '...',  T: '-',    U: '..-',  V: '...-', W: '.--',  X: '-..-',
  Y: '-.--', Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
  5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.',
  '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
  '$': '...-..-', '@': '.--.-.', '¿': '..-.-', '¡': '--...-'
};
const MORSE_TO_ENGLISH = Object.fromEntries(
  Object.entries(ENGLISH_TO_MORSE).map(([k,v]) => [v,k])
);

// Exportable pure functions (if needed elsewhere)
export function encodeEnglish(input) {
  if (!input) return { output: '', invalid: [] };
  const invalid = [];
  const words = input
    .replace(/\r?\n+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const encodedWords = words.map(word => {
    return word.split('').map(ch => {
      const up = ch.toUpperCase();
      if (ENGLISH_TO_MORSE[up]) return ENGLISH_TO_MORSE[up];
      invalid.push(ch);
      return '?';
    }).join(' ');
  });

  return { output: encodedWords.join(' / '), invalid };
}

export function decodeMorse(input) {
  if (!input) return { output: '', invalid: [] };
  const invalid = [];
  // Normalize separators: allow /, |, 3+ spaces
  const words = input
    .trim()
    .replace(/\|/g,'/')
    .replace(/\s{3,}/g,' / ')
    .split(/\s*\/\s*/);

  const decodedWords = words.map(word => {
    return word
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(code => {
        if (MORSE_TO_ENGLISH[code]) return MORSE_TO_ENGLISH[code];
        invalid.push(code);
        return '?';
      }).join('');
  });

  return { output: decodedWords.join(' '), invalid };
}

// Safe DOM util
function $(id){ return document.getElementById(id); }

function applyInvalidHighlight(el, hasError) {
  if (!el) return;
  el.classList.toggle('conversion-error', !!hasError);
}

// Debounce helper
function debounce(fn, ms=180){
  let t;
  return (...a)=>{
    clearTimeout(t);
    t=setTimeout(()=>fn(...a),ms);
  };
}

function updateStatus(el, invalid, mode) {
  if (!el) return;
  if (!invalid.length) {
    el.textContent = '';
    el.hidden = true;
    return;
  }
  el.hidden = false;
  el.textContent = mode === 'encode'
    ? `Ignored/unknown characters: ${[...new Set(invalid)].join(' ')}`
    : `Unknown Morse tokens: ${[...new Set(invalid)].join(' ')}`
}

// Main hookup (runs automatically)
document.addEventListener('DOMContentLoaded', () => {
  // Expected (adjust IDs if your HTML differs):
  // English input textarea:  id="english-input"
  // Morse input textarea (optional for reverse): id="morse-input"
  // Output targets (if using one-way): id="morse-output" / id="english-output"
  // Buttons (optional): id="btn-to-morse", id="btn-to-english"
  // Status span(s): id="status-english", id="status-morse"

  const englishIn  = $('english-input');
  const morseOut   = $('morse-output');
  const morseIn    = $('morse-input');
  const englishOut = $('english-output');
  const btnToMorse = $('btn-to-morse');
  const btnToEng   = $('btn-to-english');
  const statusEng  = $('status-english');
  const statusMorse= $('status-morse');

  // Auto encode English -> Morse
  if (englishIn && morseOut) {
    const doEncode = () => {
      const { output, invalid } = encodeEnglish(englishIn.value);
      morseOut.value !== undefined ? (morseOut.value = output) : (morseOut.textContent = output);
      applyInvalidHighlight(englishIn, invalid.length);
      updateStatus(statusEng, invalid, 'encode');
    };
    englishIn.addEventListener('input', debounce(doEncode,120));
    // Initial
    doEncode();
  }

  // Auto decode Morse -> English
  if (morseIn && englishOut) {
    const doDecode = () => {
      const { output, invalid } = decodeMorse(morseIn.value);
      englishOut.value !== undefined ? (englishOut.value = output) : (englishOut.textContent = output);
      applyInvalidHighlight(morseIn, invalid.length);
      updateStatus(statusMorse, invalid, 'decode');
    };
    morseIn.addEventListener('input', debounce(doDecode,120));
    doDecode();
  }

  // Buttons (optional triggers)
  if (btnToMorse && englishIn && morseOut) {
    btnToMorse.addEventListener('click', () => {
      const { output, invalid } = encodeEnglish(englishIn.value);
      morseOut.value !== undefined ? (morseOut.value = output) : (morseOut.textContent = output);
      applyInvalidHighlight(englishIn, invalid.length);
      updateStatus(statusEng, invalid, 'encode');
    });
  }
  if (btnToEng && morseIn && englishOut) {
    btnToEng.addEventListener('click', () => {
      const { output, invalid } = decodeMorse(morseIn.value);
      englishOut.value !== undefined ? (englishOut.value = output) : (englishOut.textContent = output);
      applyInvalidHighlight(morseIn, invalid.length);
      updateStatus(statusMorse, invalid, 'decode');
    });
  }
});
