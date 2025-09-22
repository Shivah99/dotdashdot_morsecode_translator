// Human‑oriented Web Audio utilities: Morse tone playback + key click styles.
// Emphasis on small, readable steps and guarded resource usage.

let ctx;
let active = []; // track current play sessions
let keyClicks = [];
let keySoundStyle; // initialized below from persistence
let masterGain, masterComp;
let clickDuck = 1; // reduced when Morse playing
let sparkleNoiseBuffer = null;
const STYLE_STORAGE_KEY = 'ddd_key_sound_style_v1';
const USER_SET_FLAG = 'ddd_key_sound_user_set';
const MORSE_TONE_KEY = 'ddd_morse_tone_style_v1';
let morseToneStyle = 'sine';
const HAPTICS_KEY = 'ddd_haptics_on_v1';
let hapticsOn = false;
try { hapticsOn = localStorage.getItem(HAPTICS_KEY)==='1'; } catch {}

// Voice gain pool (reuse to reduce GC)
const VOICE_POOL_SIZE = 5;
let voicePool = [];
let voiceIndex = 0;

// Recent click timestamps to modulate gain if spamming
let recentClickTimes = [];

// Autoplay toast guard
let showedAutoplayToast = false;

// Prefers reduced (auto mute unless user explicitly chose)
const prefersReduced = (()=> {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ||
           window.matchMedia?.('(prefers-reduced-transparency: reduce)')?.matches;
  } catch { return false; }
})();

// Default style logic
(function initStyle(){
  try {
    const stored = localStorage.getItem(STYLE_STORAGE_KEY);
    const userSet = localStorage.getItem(USER_SET_FLAG) === '1';
    if(stored) {
      keySoundStyle = stored;
    } else {
      keySoundStyle = 'soft';
    }
    if(prefersReduced && !userSet) keySoundStyle = 'mute';
    const toneStored = localStorage.getItem(MORSE_TONE_KEY);
    if(toneStored) morseToneStyle = toneStored;
  } catch (e){
    console.warn('[DDD] localStorage unavailable, defaults used', e);
    keySoundStyle = 'mute';
  }
})();

// KEY_SOUNDS now includes 'mech'
export const KEY_SOUNDS = [
  { id:'soft',    label:'Soft Pop' },
  { id:'bubble',  label:'Bubble' },
  { id:'click',   label:'Click' },
  { id:'wood',    label:'Wood Tap' },
  { id:'bell',    label:'Bell Ping' },
  { id:'retro',   label:'Retro Blip' },
  { id:'sparkle', label:'Sparkle' },
  { id:'mech',    label:'Mechanical Key' }, // NEW
  { id:'mute',    label:'Mute' }
];

export const MORSE_TONES = [
  { id:'sine',     label:'Pure' },
  { id:'square',   label:'Square' },
  { id:'triangle', label:'Triangle' },
  { id:'saw',      label:'Saw' },
  { id:'chime',    label:'Chime' },
  { id:'buzz',     label:'Buzz' }
];

export function setKeySoundStyle(id){
  if(!KEY_SOUNDS.some(s=>s.id===id)) return;
  keySoundStyle = id;
  localStorage.setItem(STYLE_STORAGE_KEY, id);
  localStorage.setItem(USER_SET_FLAG, '1');
}

export function setMorseToneStyle(id){
  if(!MORSE_TONES.some(t=>t.id===id)) return;
  morseToneStyle = id;
  localStorage.setItem(MORSE_TONE_KEY, id);
}

export function getMorseToneStyle(){ return morseToneStyle; }

export function setHaptics(on){
  hapticsOn = !!on;
  try { localStorage.setItem(HAPTICS_KEY, hapticsOn?'1':'0'); } catch {}
}

export function getHaptics(){ return hapticsOn; }

function ensureCtx(){
  try {
    if(!ctx){
      ctx = new (window.AudioContext||window.webkitAudioContext)();
      // Master bus
      masterComp = ctx.createDynamicsCompressor();
      masterComp.threshold.value = -10;
      masterComp.knee.value = 20;
      masterComp.ratio.value = 4;
      masterComp.attack.value = 0.003;
      masterComp.release.value = 0.15;

      masterGain = ctx.createGain();
      masterGain.gain.value = 0.6;

      masterComp.connect(masterGain).connect(ctx.destination);

      // Prepare voice pool
      for(let i=0;i<VOICE_POOL_SIZE;i++){
        const g = ctx.createGain();
        g.gain.value = 0;
        g.connect(masterComp);
        voicePool.push(g);
      }

      // Autoplay unlock listeners
      ['pointerdown','touchstart','keydown'].forEach(ev=>{
        window.addEventListener(ev, resumeIfNeeded, { once:false, passive:true });
      });
    }
  } catch (e){
    console.error('[DDD] AudioContext init failed (likely browser/security setting):', e);
    return null;
  }
  return ctx;
}

function resumeIfNeeded(){
  if(!ctx) return;
  if(ctx.state !== 'running'){
    ctx.resume().then(()=>{
      if(!showedAutoplayToast){
        showedAutoplayToast = true;
        showToast('🔊 Tap to enable sound.');
      }
    });
  }
}

function showToast(msg){
  let t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:14px;left:50%;transform:translateX(-50%);background:#222a33;color:#ffd83b;padding:6px 10px;border:1px solid #3a4653;border-radius:8px;font-size:12px;box-shadow:0 4px 16px rgba(0,0,0,.4);z-index:9999;animation:fadeIn .25s;';
  document.body.appendChild(t);
  setTimeout(()=>{ t.style.transition='opacity .4s'; t.style.opacity='0'; }, 2500);
  setTimeout(()=> t.remove(), 3200);
}

function getVoiceGain(){
  ensureCtx();
  const g = voicePool[voiceIndex++ % VOICE_POOL_SIZE];
  return g;
}

export function isPlaying(){
  return active.length > 0;
}

export function stopMorse(){
  if(!ctx) return;
  if(!active.length){
    clickDuck = 1;
    return;
  }
  active.forEach(a=>{
    try {
      a.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.005);
      a.osc.stop(ctx.currentTime + 0.02);
    } catch{}
    clearTimeout(a.cleanupTimer);
  });
  active = [];
  // restore ducking after small delay
  setTimeout(()=>{ clickDuck = 1; }, 40);
}

export function playMorse(morse, { wpm=15, freq=600, toneStyle } = {}){
  if(!morse) return;
  if(!ensureCtx()) return;

  // Clamp freq
  freq = Math.min(1200, Math.max(300, freq));

  const unit = 1200 / wpm; // ms for dot
  const dot = unit/1000;
  const dash = dot*3;
  const gapIntra = dot;
  const gapLetter = dot*3;
  const gapWord = dot*7;

  const style = toneStyle || morseToneStyle;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  gain.gain.value=0;

  let postNode = gain;

  switch(style){
    case 'square': osc.type='square'; break;
    case 'triangle': osc.type='triangle'; break;
    case 'saw': {
      osc.type='sawtooth';
      // gentle low-pass to mellow harshness
      const lp = ctx.createBiquadFilter();
      lp.type='lowpass'; lp.frequency.value=freq*2.2; lp.Q.value=0.7;
      gain.connect(lp);
      postNode = lp;
      break;
    }
    case 'chime': {
      osc.type='sine';
      // add two soft harmonic partials
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      o2.type='sine'; o2.frequency.value=freq*2;
      g2.gain.value=0; o2.connect(g2).connect(gain);
      o2.start();
      const o3 = ctx.createOscillator();
      const g3 = ctx.createGain();
      o3.type='sine'; o3.frequency.value=freq*3;
      g3.gain.value=0; o3.connect(g3).connect(gain);
      o3.start();
      // schedule their envelopes inside tone() (see below with refs)
      osc._partials = [{ g:g2, peak:0.25 }, { g:g3, peak:0.15 }];
      break;
    }
    case 'buzz': {
      osc.type='sawtooth';
      const oDet = ctx.createOscillator();
      oDet.type='sawtooth'; oDet.frequency.value=freq; oDet.detune.value=6;
      const mixGain = ctx.createGain(); mixGain.gain.value=1;
      const detGain = ctx.createGain(); detGain.gain.value=1;
      oDet.connect(detGain).connect(gain);
      oDet.start();
      // mild band-pass for character
      const bp = ctx.createBiquadFilter();
      bp.type='bandpass'; bp.frequency.value=freq*1.2; bp.Q.value=6;
      gain.connect(bp);
      postNode = bp;
      break;
    }
    default:
      osc.type='sine';
  }

  osc.frequency.value=freq;
  osc.connect(gain).connect(masterComp);
  postNode.connect(masterComp);
  osc.start();

  clickDuck = 0.6; // lower key click gain while tone playing (~ -4 dB)

  let t = ctx.currentTime + 0.02;

  function tone(d){
    // Smooth tiny attack/release avoids digital clicks on start/stop
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.55, t + 0.002);
    const off = t + d - 0.003;
    gain.gain.exponentialRampToValueAtTime(0.0001, off);
    // partials envelopes (if chime)
    if(osc._partials){
      osc._partials.forEach(p=>{
        p.g.gain.setValueAtTime(0.0001, t);
        p.g.gain.exponentialRampToValueAtTime(p.peak, t+0.004);
        p.g.gain.exponentialRampToValueAtTime(0.0001, off);
      });
    }
    t += d;
    t += gapIntra;
  }
  function wait(d){ t += d; }

  morse.trim().split(' / ').forEach((word, wi, words)=>{
    const letters = word.split(' ');
    letters.forEach((L, li)=>{
      for(const c of L){
        tone(c==='.'?dot:dash);
      }
      if(li < letters.length-1) wait(gapLetter - gapIntra);
    });
    if(wi < words.length-1) wait(gapWord - gapLetter);
  });

  const endAt = t + 0.05;
  const cleanupTimer = setTimeout(()=> stopMorse(), (endAt - ctx.currentTime)*1000);
  active.push({ osc, gain, cleanupTimer });
}

function ensureSparkleNoise(){
  if(sparkleNoiseBuffer || !ctx) return;
  sparkleNoiseBuffer = ctx.createBuffer(1, ctx.sampleRate*0.12, ctx.sampleRate);
  const d = sparkleNoiseBuffer.getChannelData(0);
  for(let i=0;i<d.length;i++){
    const fade=1-i/d.length;
    d[i]=(Math.random()*2-1)*fade*0.18;
  }
}

// === Multi-style key sounds with pooling & ducking ===
function vib(){ if(hapticsOn && 'vibrate' in navigator){ navigator.vibrate(10); } }

export function playKeyClick(){
  if(keySoundStyle === 'mute') return;
  ensureCtx();
  resumeIfNeeded();
  vib();

  // Track rapid repeats (held key) to soften volume if user is hammering keys.
  const now = performance.now();
  recentClickTimes = recentClickTimes.filter(t=> now - t < 150);
  recentClickTimes.push(now);
  let spamFactor = 1;
  if(recentClickTimes.length > 3){
    // reduce amplitude progressively
    spamFactor = Math.max(0.25, 1 - (recentClickTimes.length - 3)*0.15);
  }

  // Polyphony throttle
  keyClicks = keyClicks.filter(k=> k.t > ctx.currentTime - 0.35);
  if(keyClicks.length > 6) return;

  const startTime = ctx.currentTime; // renamed from t0 for readability
  const targetGain = 1 * clickDuck * spamFactor;

  function env(g, peaks=[0.4], times=[0.012]){
    // Utility: simple soft pop style env
    g.gain.setValueAtTime(0.0001,startTime);
    g.gain.exponentialRampToValueAtTime(peaks[0]*targetGain, startTime+times[0]);
  }

  function scheduleRelease(g, decayEnd){
    g.gain.exponentialRampToValueAtTime(0.0001, decayEnd);
  }

  const style = keySoundStyle;

  if(style === 'sparkle') ensureSparkleNoise();

  // Acquire a reusable pooled gain node for this click voice
  const g = getVoiceGain();
  try { g.gain.cancelScheduledValues(startTime); } catch{}
  g.gain.setValueAtTime(0.0001, startTime);

  const voices = []; // keep references to stop automatically via natural end

  function addOsc({ type='sine', freq, detune=0, dur=0.15, attack=0.005, peak=0.4, decay=0.12 }){
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, startTime);
    if(detune) o.detune.setValueAtTime(detune, startTime);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, startTime);
    og.connect(g);
    o.connect(og);
    // envelope
    og.gain.exponentialRampToValueAtTime(peak*targetGain, startTime+attack);
    og.gain.exponentialRampToValueAtTime(0.0001, startTime+decay);
    o.start(startTime);
    o.stop(startTime+dur);
    voices.push(o);
  }

  function addNoise({ type='bandpass', freq=3000, q=4, dur=0.08, peak=0.35, attack=0.004, decay=0.06, buffer }){
    let src;
    if(buffer){
      src = ctx.createBufferSource();
      src.buffer = buffer;
    } else {
      const len = ctx.sampleRate*dur;
      const nb = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = nb.getChannelData(0);
      for(let i=0;i<d.length;i++){
        const fade = 1 - i/d.length;
        d[i] = (Math.random()*2-1)*fade;
      }
      src = ctx.createBufferSource();
      src.buffer = nb;
    }
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, startTime);
    src.connect(filter).connect(ng).connect(g);
    ng.gain.exponentialRampToValueAtTime(peak*targetGain, startTime+attack);
    ng.gain.exponentialRampToValueAtTime(0.0001, startTime+decay);
    src.start(startTime);
    src.stop(startTime+dur);
    voices.push(src);
  }

  switch(style){
    case 'soft': {
      const base = 480 + Math.random()*140;
      addOsc({ type:'sine', freq:base, dur:0.16, attack:0.012, peak:0.35, decay:0.14 });
      break;
    }
    case 'bubble': {
      const startF = 300 + Math.random()*60;
      const o = ctx.createOscillator();
      o.type='sine';
      o.frequency.setValueAtTime(startF, startTime);
      o.frequency.exponentialRampToValueAtTime(startF*2.1, startTime+0.09);
      addOsc({ type:'sine', freq:startF, dur:0.22, attack:0.015, peak:0.4, decay:0.2 });
      break;
    }
    case 'click': {
      addOsc({ type:'square', freq:1500 + Math.random()*250, dur:0.08, attack:0.004, peak:0.28, decay:0.07 });
      break;
    }
    case 'wood': {
      const baseFreq = 260 + Math.random()*15; // renamed from f
      addOsc({ type:'sine', freq:baseFreq, dur:0.16, attack:0.008, peak:0.5, decay:0.14 });
      addOsc({ type:'sine', freq:baseFreq*1.5, dur:0.12, attack:0.006, peak:0.3, decay:0.10 });
      break;
    }
    case 'bell': {
      const base = 680 + Math.random()*40;
      addOsc({ type:'sine', freq:base, dur:0.4, attack:0.01, peak:0.42, decay:0.35 });
      addOsc({ type:'triangle', freq:base*2.01, dur:0.35, attack:0.01, peak:0.24, decay:0.32 });
      break;
    }
    case 'retro': {
      const startF = 900 + Math.random()*120;
      addOsc({ type:'sawtooth', freq:startF, dur:0.25, attack:0.006, peak:0.3, decay:0.22 });
      break;
    }
    case 'sparkle': {
      // reuse noise buffer & add sine ping
      addNoise({ type:'highpass', freq:1500, q:0.7, dur:0.18, peak:0.38, attack:0.01, decay:0.22, buffer: sparkleNoiseBuffer });
      addOsc({ type:'sine', freq:1400 + Math.random()*200, dur:0.24, attack:0.01, peak:0.25, decay:0.22 });
      break;
    }
    case 'mech': {
      // Mechanical: tick + thock + subtle mid
      // Tick (bandpass noise 3–4 kHz)
      addNoise({ type:'bandpass', freq: 3200 + Math.random()*500, q:6, dur:0.045, peak:0.35, attack:0.003, decay:0.04 });
      // Thock body (low)
      const base = 150 + Math.random()*80;
      const detuneCents = (Math.random()*40 - 20); // ±20 cents
      const driftHz = base * Math.pow(2, detuneCents/1200);
      addOsc({ type:'sine', freq: driftHz, dur:0.18+Math.random()*0.02, attack:0.005, peak:0.48, decay:0.16 });
      // Mid faint component
      addOsc({ type:'triangle', freq: base*4.2, dur:0.14, attack:0.004, peak:0.12, decay:0.11 });
      break;
    }
    case 'mute':
    default:
      break;
  }

  // Shared shaping (fast pop up then decay). startTime used instead of t0.
  const decayEnd = startTime + 0.25;
  g.gain.setValueAtTime(0.0001, startTime);
  g.gain.exponentialRampToValueAtTime(0.9*targetGain, startTime+0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, decayEnd);

  keyClicks.push({ t: ctx.currentTime });
}

// Optional API exposure for haptics toggle (kept small)
export function getCurrentKeySound(){ return keySoundStyle; }
