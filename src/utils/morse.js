// Morse helpers: maps + encode/decode + simple detector.
export const CHAR_TO_MORSE = {
  A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',
  M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',
  0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.',
  '.':'.-.-.-', ',':'--..--', '?':'..--..', '/':'-..-.', '@':'.--.-.', '-':'-....-', ':':'---...', '\'':'.----.'
};
export const MORSE_TO_CHAR = Object.fromEntries(Object.entries(CHAR_TO_MORSE).map(([k,v])=>[v,k]));
export const LESSONS = Object.entries(CHAR_TO_MORSE);

export function isMorse(str){
  // True if only dot/dash/space/slash and at least one signal symbol
  return /^[.\-\/\s]+$/.test(str.trim()) && /[.\-]/.test(str);
}

export function englishToMorse(text){
  return text.toUpperCase()
    .split('\n').map(line=> line.split(' ').map(word=>
      word.split('').map(ch=> CHAR_TO_MORSE[ch]||'').filter(Boolean).join(' ')
    ).join(' / ')).join('\n');
}

export function morseToEnglish(morse){
  return morse.split('\n').map(line=> line.split(' / ').map(word=>
    word.trim().split(' ').map(code=> MORSE_TO_CHAR[code]||'').join('')
  ).join(' ')).join('\n');
}
