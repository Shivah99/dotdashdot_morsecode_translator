import React, { useState, useRef } from 'react';
export default function Keyer({ onCommit }){
  // ...existing Keyer code unchanged...
  const [buffer,setBuffer]=useState('');
  const startRef=useRef(0);
  const thresholdRef=useRef(120);
  const [led,setLed]=useState(false);
  function pressStart(){ if(!startRef.current){ startRef.current=performance.now(); setLed(true);} }
  function pressEnd(){
    if(!startRef.current) return;
    const dur=performance.now()-startRef.current;
    startRef.current=0;
    const isDot = dur < thresholdRef.current;
    thresholdRef.current=(thresholdRef.current*9 + dur)/10;
    setBuffer(b=> b + (isDot?'.':'-'));
    flashLed();
  }
  function flashLed(){ setLed(true); setTimeout(()=> setLed(false),140); }
  function add(sym){ setBuffer(b=> b + sym); flashLed(); }
  function commit(){ if(!buffer.trim()) return; onCommit(buffer.trim()); setBuffer(''); }
  return (
    <div className="keyer-panel">
      {/* ...existing JSX... */}
      <h3 style={{margin:'0 0 4px', fontSize:'.95rem'}}>Key Input</h3>
      <small style={{opacity:.6}}>Press & hold: short = dot, long = dash (adaptive)</small>
      <div className="keyer-buttons">
        <span className={`keyer-led ${led?'on':''}`} aria-label="keyer LED" />
        <button onClick={()=> add('.')}>• Dit</button>
        <button onClick={()=> add('-')}>— Dah</button>
        <button onMouseDown={pressStart} onMouseUp={pressEnd}
          onTouchStart={e=>{e.preventDefault();pressStart();}}
          onTouchEnd={e=>{e.preventDefault();pressEnd();}}>● Hold</button>
        <div className="key-buffer">{buffer || <span style={{opacity:.35}}>...buffer</span>}</div>
        <button onClick={()=> add(' ')}>Letter Space</button>
        <button onClick={()=> add(' / ')}>Word Space</button>
        <button onClick={()=> setBuffer('')}>Clear</button>
        <button onClick={commit}>To Input</button>
      </div>
    </div>
  );
}
