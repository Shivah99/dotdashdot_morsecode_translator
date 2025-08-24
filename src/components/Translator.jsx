import React, { useMemo, useState, useEffect } from 'react';
import { isMorse, englishToMorse, morseToEnglish } from '../utils/morse.js';
import { stopMorse, playKeyClick, isPlaying,
  KEY_SOUNDS, setKeySoundStyle, getCurrentKeySound,
  MORSE_TONES, setMorseToneStyle, getMorseToneStyle } from '../utils/audio.js';
// ...existing Translator code unchanged...
export default function Translator(props){
  const { input,setInput,output,onSwap,onClear,onSave,onPlay,wpm,setWpm,freq,setFreq } = props;
  const [keySound, setKeySound] = useState('soft');
  const [tone, setTone] = useState(()=> getMorseToneStyle());
  useEffect(()=>{ setKeySound(getCurrentKeySound?.()||'soft'); setTone(getMorseToneStyle()); }, []);
  const { englishWords, morseWords } = useMemo(()=>{
    if(!input.trim()) return { englishWords:[], morseWords:[] };
    if(isMorse(input)){
      const englishTranslation = morseToEnglish(input);
      return { englishWords: englishTranslation.split(/\s+/), morseWords: input.trim().replace(/\s+/g,' ').split(' / ') };
    }
    const morseTranslation = englishToMorse(input);
    return { englishWords: input.trim().split(/\s+/), morseWords: morseTranslation.split(' / ') };
  }, [input]);
  function downloadCurrent(){
    const blob=new Blob([output],{type:'text/plain'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='translation.txt'; a.click();
  }
  return (
    <section style={{background:'var(--panel,#121821)',border:'1px solid #273447',borderRadius:16,padding:'18px 20px'}}>
      {/* ...existing JSX unchanged... */}
      <header style={{marginBottom:4}}>
        <h2 style={{margin:'0 0 4px', fontSize:'1.05rem'}}>Translator</h2>
        <div style={{fontSize:'.65rem', opacity:.7}}>Auto Detect: {isMorse(input)?'Morse → English':'English → Morse'}</div>
      </header>
      <textarea
        value={input}
        onChange={e=>setInput(e.target.value)}
        onKeyDown={e=>{
          if(keySound !== 'mute' && (e.key.length===1 || ['Backspace','Enter',' '].includes(e.key))){
            playKeyClick();
          }
        }}
        placeholder="Type English or Morse (.-)..." />
      <div className="translate-toolbar">
        {/* buttons & controls */}
        <button onClick={onSwap}>⇄ Swap</button>
        <button onClick={onClear}>🧹 Clear</button>
        <button onClick={onSave}>💾 Save</button>
        <button onClick={downloadCurrent}>⬇️ Download</button>
        <button onClick={onPlay}>▶ Play</button>
        <button onClick={stopMorse}>⏹ Stop</button>
        <label style={{display:'flex',alignItems:'center',gap:4,fontSize:11}}>
          Key:
          <select value={keySound} onChange={e=>{ const v=e.target.value; setKeySound(v); setKeySoundStyle(v); }}
            style={{background:'#222530',color:'var(--accent)',border:'1px solid var(--accent)',borderRadius:6,padding:'2px 4px',fontSize:11}}>
            {KEY_SOUNDS.map(s=> <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <label style={{display:'flex',alignItems:'center',gap:4,fontSize:11}}>
          Tone:
          <select value={tone} onChange={e=>{ const v=e.target.value; setTone(v); setMorseToneStyle(v); if(isPlaying()){ stopMorse(); onPlay(); } }}
            style={{background:'#222530',color:'var(--accent)',border:'1px solid var(--accent)',borderRadius:6,padding:'2px 4px',fontSize:11}}>
            {MORSE_TONES.map(t=> <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </label>
        <label style={{fontSize:11,display:'flex',alignItems:'center',gap:4,marginLeft:'auto'}}>WPM
          <input type="range" min="5" max="30" value={wpm}
            onChange={e=>{ const val=+e.target.value; setWpm(val); if(isPlaying()){ stopMorse(); onPlay(); } }} />
        </label>
        <label style={{fontSize:11,display:'flex',alignItems:'center',gap:4}}>Hz
          <input type="range" min="300" max="900" value={freq}
            onChange={e=>{ const val=+e.target.value; setFreq(val); if(isPlaying()){ stopMorse(); onPlay(); } }} />
        </label>
      </div>
      <div className="output-block" aria-live="polite">
        <div className="output-english">
          {englishWords.map((w,i)=><span className="english-word" key={i}>{w}</span>)}
        </div>
        <div className="output-morse">
          {morseWords.map((mw,i)=>
            <span className="morse-word" key={i}>
              {mw.split(' ').map((L,j)=>
                <span className="morse-letter" key={j}>{L}{j < mw.split(' ').length-1 && ' '}</span>
              )}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
