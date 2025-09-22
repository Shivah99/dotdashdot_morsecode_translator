// Morse helpers: maps + encode/decode + simple detector.
export const CHAR_TO_MORSE = {
  A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',
  M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',
  0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.',
  '.':'.-.-.-', ',':'--..--', '?':'..--..', '/':'-..-.', '@':'.--.-.', '-':'-....-', ':':'---...', '\'':'.----.'
};
export const MORSE_TO_CHAR = Object.fromEntries(Object.entries(CHAR_TO_MORSE).map(([k,v])=>[v,k]));
export const LESSONS = Object.entries(CHAR_TO_MORSE);

export function sanitizeMorseSymbols(str){
  // Keep only dot, dash, slash, space & newlines (preserve structure)
  return str.replace(/[^.\-\/\s\n]/g,'');
}

export function normalizeMorse(str){
  return str
    .replace(/[•·∙◦∘]/g,'.')            // bullet / middle dot variants => dot
    .replace(/[–—−﹣－]/g,'-')           // unicode dashes => ASCII -
    .replace(/\u2026/g,'...')           // ellipsis …
    .replace(/[|]/g,' / ')              // vertical bar as word sep
    .replace(/\s+/g,' ')                // collapse whitespace
    .trim();
}

export function detectDirection(str){
  if(!str || !str.trim()) return 'english';
  const raw = str;
  const norm = normalizeMorse(raw);
  // Fast strict path
  if(/^[.\-\/\s]+$/.test(norm) && /[.\-]/.test(norm)) return 'morse';

  // Sanitize & re-evaluate
  const sanitized = sanitizeMorseSymbols(norm);
  if(sanitized && /[.\-]/.test(sanitized)){
    const tokens = sanitized.trim().split(/\s+/);
    if(tokens.every(t=> /^[.\-]+$/.test(t))) return 'morse';
    // Heuristic: majority of characters are valid Morse symbols
    const ratio = sanitized.replace(/\s+/g,'').length / norm.replace(/\s+/g,'').length;
    if(ratio > 0.7) return 'morse';
  }
  return 'english';
}

// Update isMorse to leverage normalization (kept for legacy callers)
export function isMorse(str){
  if(!str) return false;
  const norm = normalizeMorse(str);
  return /^[.\-\/\s]+$/.test(norm) && /[.\-]/.test(norm);
}

export function englishToMorse(text){
  return text
    .replace(/\s+/g,' ')                // collapse early
    .toUpperCase()
    .split('\n').map(line=> line.split(' ').map(word=>
      word.split('').map(ch=> CHAR_TO_MORSE[ch]||'').filter(Boolean).join(' ')
    ).join(' / ')).join('\n');
}

export function morseToEnglish(morse){
  const norm = normalizeMorse(morse);
  return norm.split('\n').map(line=> line.split(' / ').map(word=>
    word.trim().split(' ').map(code=> MORSE_TO_CHAR[code]||'').join('')
  ).join(' ')).join('\n');
}

export function decodeContinuousMorse(str){
  const s = str.replace(/\s+/g,'').trim();
  if(!/^[.\-]+$/.test(s)) return '';
  // Precompute max code length
  const codes = MORSE_TO_CHAR;
  const maxLen = Object.keys(codes).reduce((m,k)=> Math.max(m,k.length),0);
  let out = '';
  for(let i=0;i<s.length;){
    let matched = '';
    // try longest first
    for(let L = Math.min(maxLen, s.length - i); L>=1; L--){
      const slice = s.slice(i, i+L);
      if(codes[slice]){
        matched = codes[slice];
        out += matched;
        i += L;
        break;
      }
    }
    if(!matched){
      out += '?';
      i += 1; // skip one symbol to avoid infinite loop
    }
  }
  return out;
}

export function analyzeInput(str){
  const direction = detectDirection(str);
  if(direction === 'morse'){
    const norm = normalizeMorse(str);
    const sanitized = sanitizeMorseSymbols(norm);
    const cleaned = normalizeMorse(sanitized);
    const continuous = /^[.\-]+$/.test(cleaned); // no spaces or slashes
    return {
      direction,
      normalized: cleaned,
      sanitized: cleaned,
      continuous,
      changed: cleaned !== str.trim()
    };
  }
  return { direction, normalized: str, sanitized: str, continuous:false, changed:false };
}

/**
 * Auto translate either direction with normalization.
 * Returns { direction, english, morse, continuous, changed }
 */
export function translateAuto(str){
  const analysis = analyzeInput(str);
  if(!str.trim()) return { direction:'english', english:'', morse:'', continuous:false, changed:false };
  if(analysis.direction === 'morse'){
    if(analysis.continuous){
      const english = decodeContinuousMorse(analysis.sanitized);
      return {
        direction:'morse',
        english,
        morse: analysis.sanitized,
        continuous:true,
        changed:analysis.changed
      };
    }
    const english = morseToEnglish(analysis.sanitized);
    return {
      direction:'morse',
      english,
      morse: analysis.sanitized,
      continuous:false,
      changed:analysis.changed
    };
  }
  // English input
  const morse = englishToMorse(analysis.normalized);
  return {
    direction:'english',
    english: analysis.normalized,
    morse,
    continuous:false,
    changed:false
  };
}
