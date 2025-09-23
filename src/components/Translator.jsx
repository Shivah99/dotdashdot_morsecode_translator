import React, { useEffect, useState, useRef } from 'react';
import { englishToMorse, morseToEnglish, detectDirection } from '../utils/morse.js';
import { KEY_SOUNDS, setKeySoundStyle, getCurrentKeySound, MORSE_TONES, setMorseToneStyle, getMorseToneStyle, playKeyClick, previewKeyClick } from '../utils/audio.js';

export default function Translator(props){
  const { input, setInput, output, onClear, onSave, wpm, setWpm, freq, setFreq } = props;

  const inRef = useRef(null);
  const outRef = useRef(null);

  // which box is the current source editor
  const [editSide, setEditSide] = useState('input'); // 'input' | 'output'
  const [outputDraft, setOutputDraft] = useState('');

  function autoSize(el){
    if(!el) return;
    const prev = el.style.width;
    el.style.width = el.offsetWidth + 'px';
    el.style.height = 'auto';
    const max = Math.round(window.innerHeight * 0.7); // cap at 70vh
    const next = Math.min(el.scrollHeight, max);
    el.style.height = Math.max(next, 120) + 'px';
    el.style.overflowY = el.scrollHeight > next ? 'auto' : 'hidden';
    el.style.width = prev || '';
  }

  useEffect(()=>{ autoSize(inRef.current); }, []);
  useEffect(()=>{ autoSize(inRef.current); }, [input]);
  useEffect(()=>{ if(editSide!=='output'){ autoSize(outRef.current); } }, [output, editSide]);
  useEffect(()=>{ if(editSide==='output'){ autoSize(outRef.current); } }, [outputDraft, editSide]);

  // keep outputDraft in sync when switching to output edit mode
  useEffect(()=>{
    if(editSide==='output') setOutputDraft(output || '');
  }, [editSide]);

  function copy(text){
    if(!text) return;
    try { navigator.clipboard?.writeText(text); } catch {}
  }

  function swap(){
    if(editSide==='input'){
      if(!output) return; setInput(output);
    } else {
      // when editing output, make the output the new source by inversing
      const txt = (outputDraft || '').trim();
      if(!txt) return;
      const dir = detectDirection(txt);
      if(dir === 'morse') setInput(morseToEnglish(txt)); else setInput(englishToMorse(txt));
      setEditSide('input');
    }
  }

  const [keySound, setKeySound] = useState('soft');
  const [tone, setTone] = useState('sine');
  useEffect(()=>{
    try {
      setKeySound(getCurrentKeySound?.() || 'soft');
      setTone(getMorseToneStyle?.() || 'sine');
    } catch {}
  },[]);

  // removed downloadCurrent per request

  return (
    <main className="translator-app" style={{maxWidth:900, margin:'16px auto', padding:'0 12px'}}>
      {/* INPUT BOX */}
      <section className="input-section">
        <label htmlFor="input-text">Input (English or Morse)</label>
        <div className="input-container" style={{position:'relative'}}>
          <textarea
            id="input-text"
            ref={inRef}
            placeholder="Type Morse or English here..."
            value={input}
            onFocus={()=> setEditSide('input')}
            onChange={e=> { if(editSide!=='input'){ return; } setInput(e.target.value); autoSize(e.target); }}
            onKeyDown={e=>{
              const k=e.key;
              if(k.length===1 || k==='Backspace' || k==='Enter' || k===' '){ playKeyClick(); }
            }}
            spellCheck={false}
            wrap="soft"
            aria-label="Input (English or Morse)"
            readOnly={editSide!=='input'}
          />
          <button type="button" className="copy-btn" aria-label="Copy input"
            onClick={()=> copy(input)} title="Copy input"
            style={{position:'absolute', right:8, bottom:8, padding:'4px 8px'}}>🪄</button>
        </div>
      </section>

      {/* OUTPUT BOX */}
      <section className="output-section" style={{marginTop:14}}>
        <label htmlFor="output-text">Output (Auto Converted)</label>
        <div className="output-container" style={{position:'relative'}}>
          <textarea
            id="output-text"
            ref={outRef}
            readOnly={editSide!=='output' ? true : false}
            value={editSide==='output' ? (outputDraft ?? '') : (output ?? '')}
            onFocus={()=> { setEditSide('output'); setOutputDraft(output || ''); }}
            onChange={e=> {
              if(editSide!=='output') return;
              const txt = e.target.value;
              setOutputDraft(txt);
              // inverse convert to derive source input
              const dir = detectDirection(txt);
              const nextInput = dir==='morse' ? morseToEnglish(txt) : englishToMorse(txt);
              setInput(nextInput);
              autoSize(e.target);
            }}
            onKeyDown={e=>{
              const k=e.key;
              if(k.length===1 || k==='Backspace' || k==='Enter' || k===' '){ playKeyClick(); }
            }}
            spellCheck={false}
            wrap="soft"
            aria-label="Output (Auto Converted)"
          />
          <button type="button" className="copy-btn" aria-label="Copy output"
            onClick={()=> copy((editSide==='output' ? outputDraft : output) || '')} title="Copy output"
            style={{position:'absolute', right:8, bottom:8, padding:'4px 8px'}}>🪄</button>
        </div>
      </section>

      {/* CONTROLS (below output) */}
      <section className="controls" style={{marginTop:14}}>
        <div className="buttons-row" style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:8}}>
          <button onClick={swap}>↔ Swap</button>
          <button onClick={()=>{ setEditSide('input'); setOutputDraft(''); onClear(); }}>🧹 Clear</button>
          <button onClick={onSave}>💾 Save</button>
        </div>

        <div className="options-row" style={{display:'flex',flexWrap:'wrap',gap:12,alignItems:'center'}}>
          <label>Key:{' '}
            <select value={keySound} onChange={e=>{ const v=e.target.value; setKeySound(v); setKeySoundStyle(v); previewKeyClick(v); }}>
              {KEY_SOUNDS.map(s=> (
                <option key={s.id} value={s.id} onMouseEnter={()=> previewKeyClick(s.id)} title="Hover to preview">
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label>Hz <input type="range" min="300" max="900" value={freq ?? 600} onChange={e=> setFreq?.(+e.target.value)} /></label>
          <label>WPM <input type="range" min="5" max="30" value={wpm ?? 15} onChange={e=> setWpm?.(+e.target.value)} /></label>
          <label>Tone:{' '}
            <select value={tone} onChange={e=>{ const v=e.target.value; setTone(v); setMorseToneStyle(v); }}>
              {MORSE_TONES.map(t=> (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

    </main>
  );
}
