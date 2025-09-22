import React, { useMemo, useState, useEffect } from 'react';
import { englishToMorse, morseToEnglish, detectDirection, analyzeInput, decodeContinuousMorse } from '../utils/morse.js';
import { stopMorse, playKeyClick, isPlaying,
  KEY_SOUNDS, setKeySoundStyle, getCurrentKeySound,
  MORSE_TONES, setMorseToneStyle, getMorseToneStyle } from '../utils/audio.js';

export default function Translator(props){
  const { input,setInput,output, onClear,onSave,onPlay,wpm,setWpm,freq,setFreq } = props;
  const [keySound, setKeySound] = useState('soft');
  const [tone, setTone] = useState(()=> getMorseToneStyle());
  useEffect(()=>{ setKeySound(getCurrentKeySound?.()||'soft'); setTone(getMorseToneStyle()); }, []);
  const analysis = useMemo(()=> analyzeInput(input), [input]);

  const { englishWords, morseWords, continuousDecoded } = useMemo(()=>{
    if(!input.trim()) return { englishWords:[], morseWords:[], continuousDecoded:'' };
    if(analysis.direction==='morse'){
      if(analysis.continuous){
        const decoded = decodeContinuousMorse(analysis.sanitized);
        return { englishWords: decoded ? decoded.split(/\s+/) : [], morseWords:[analysis.sanitized], continuousDecoded: decoded };
      }
      const eng = morseToEnglish(analysis.sanitized);
      const mw = analysis.sanitized.split(' / ').map(w=> w.trim()).filter(Boolean);
      return { englishWords: eng.split(/\s+/).filter(Boolean), morseWords: mw, continuousDecoded:'' };
    }
    const morseTranslation = englishToMorse(input);
    return {
      englishWords: input.trim().split(/\s+/),
      morseWords: morseTranslation.split(' / '),
      continuousDecoded:''
    };
  }, [input, analysis]);

  function downloadCurrent(){
    const blob=new Blob([output],{type:'text/plain'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='translation.txt'; a.click();
  }
  return (
    <section style={{background:'var(--panel,#121821)',border:'1px solid #273447',borderRadius:16,padding:'18px 20px'}}>
      <header style={{marginBottom:4}}>
        <h2 style={{margin:'0 0 4px', fontSize:'1.05rem'}}>Translator</h2>
        <div style={{fontSize:'.65rem', opacity:.7}}>
          Auto Detect: {analysis.direction==='morse'?'Morse → English':'English → Morse'}
          {analysis.direction==='morse' && analysis.changed &&
            <span style={{marginLeft:8, color:'var(--accent)'}}>Sanitized</span>}
          {analysis.direction==='morse' && analysis.continuous &&
            <span style={{marginLeft:8, color:'var(--accent)'}}>continuous (auto-segment)</span>}
        </div>
      </header>
      {/* INPUT (editable) */}
      <textarea
        value={input}
        onChange={e=>setInput(e.target.value)}
        onKeyDown={e=>{
          if(keySound !== 'mute' && (e.key.length===1 || ['Backspace','Enter',' '].includes(e.key))){
            playKeyClick();
          }
        }}
        placeholder="Type English or Morse (.-)..." />
      {/* CONVERTED OUTPUT (read-only plain text) */}
      <div style={{marginTop:10}}>
        <label style={{display:'block', fontSize:12, opacity:.85, marginBottom:4}}>
          {analysis.direction==='morse' ? 'Converted English' : 'Converted Morse'}
        </label>
        <textarea
          value={output || ''}
          readOnly
          spellCheck={false}
          aria-label={analysis.direction==='morse' ? 'Converted English' : 'Converted Morse'}
          onFocus={e=> e.target.select()}
          style={{width:'100%', minHeight:70, background:'#0f141c', color:'var(--text)', border:'1px solid #2a3747', borderRadius:10, padding:'10px 12px', fontFamily:'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'}}
          placeholder={analysis.direction==='morse' ? 'English result will appear here' : 'Morse result will appear here'}
        />
        <div style={{display:'flex', gap:8, marginTop:6}}>
          <button type="button" onClick={()=> { if(navigator.clipboard){ navigator.clipboard.writeText(output||''); } }} title="Copy converted text">Copy</button>
        </div>
      </div>
      <div className="translate-toolbar">
        {/* buttons & controls */}
        <button onClick={onClear}>🧹 Clear</button>
        <button onClick={onSave}>💾 Save</button>
        <button onClick={downloadCurrent}>⬇️ Download</button>
        <button onClick={onPlay} title="First tap enables audio on iOS.">▶ Play</button>
        <button onClick={stopMorse}>⏹ Stop</button>
        <label style={{display:'flex',alignItems:'center',gap:4,fontSize:11}}>
          Key:
          <select value={keySound} onChange={e=>{ const v=e.target.value; setKeySound(v); setKeySoundStyle(v); }}
            style={{background:'#222530',color:'var(--accent)',border:'1px solid var(--accent)',borderRadius:6,padding:'2px 4px',fontSize:11}}>
            {KEY_SOUNDS.map(s=> <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button type="button" style={{fontSize:10,padding:'2px 6px'}} onClick={()=> playKeyClick()} title="Test current key sound">Test</button>
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
        {analysis.direction==='morse' && analysis.continuous && (
          <div style={{fontSize:'.55rem', opacity:.6, margin:'2px 0 6px'}}>
            Hint: No spaces detected in Morse. Display is one block; add spaces or slashes to adjust segmentation.
          </div>
        )}
        <div className="output-english">
          {englishWords.map((w,i)=><span className="english-word" key={i}>{w}</span>)}
        </div>
        <div className="output-morse">
          {morseWords.map((mw,i)=>{
            const letters = analysis.continuous ? [mw] : mw.split(' ').filter(Boolean);
            return (
              <span key={i}>
                <span className="morse-word">
                  {letters.map((L,j)=>
                    <span className="morse-letter" key={j}>{L}{(!analysis.continuous && j < letters.length-1) && ' '}</span>
                  )}
                </span>
                {!analysis.continuous && i < morseWords.length-1 && <span className="morse-sep">/</span>}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
