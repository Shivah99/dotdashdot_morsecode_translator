// Renamed from Controls.js (content unchanged)
import React, { useState, useEffect } from 'react';

const H_BG_KEY='ddd_hue_bg', H_TX_KEY='ddd_hue_text', FS_KEY='ddd_font_scale';
const FONT_STEPS=[100,115,130,150];

export default function Controls(){
  const [bgHue,setBgHue]=useState(()=> Number(localStorage.getItem(H_BG_KEY) ?? 210));
  const [txHue,setTxHue]=useState(()=> Number(localStorage.getItem(H_TX_KEY) ?? 50));
  const [fsIndex,setFsIndex]=useState(()=> {
    const stored=Number(localStorage.getItem(FS_KEY));
    const idx=FONT_STEPS.indexOf(stored);
    return idx>=0?idx:0;
  });

  useEffect(()=>{ applyHues(bgHue,txHue); localStorage.setItem(H_BG_KEY,String(bgHue)); },[bgHue]);
  useEffect(()=>{ applyHues(bgHue,txHue); localStorage.setItem(H_TX_KEY,String(txHue)); },[txHue]);
  useEffect(()=>{
    const pct=FONT_STEPS[fsIndex];
    document.documentElement.style.setProperty('--root-font-scale', pct+'%');
    document.documentElement.style.fontSize = (pct/100*16)+'px';
    localStorage.setItem(FS_KEY,String(FONT_STEPS[fsIndex]));
  },[fsIndex]);

  function applyHues(hBg,hTx){
    const bg=`hsl(${hBg} 22% 10%)`, bgAlt=`hsl(${hBg} 22% 16%)`;
    const accent=`hsl(${hTx} 90% 55%)`, accentGlow=`hsl(${hTx} 90% 70%)`;
    const text=`hsl(${hTx} 75% 88%)`;
    document.documentElement.style.setProperty('--bg',bg);
    document.documentElement.style.setProperty('--bg-alt',bgAlt);
    document.documentElement.style.setProperty('--text',text);
    document.documentElement.style.setProperty('--accent',accent);
    document.documentElement.style.setProperty('--accent-glow',accentGlow);
  }

  function handleFontRailKey(e){
    if(e.key==='ArrowRight'||e.key==='ArrowUp'){ e.preventDefault(); setFsIndex(i=> Math.min(FONT_STEPS.length-1,i+1)); }
    else if(e.key==='ArrowLeft'||e.key==='ArrowDown'){ e.preventDefault(); setFsIndex(i=> Math.max(0,i-1)); }
  }

  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:10,alignItems:'flex-start'}}>
      <label style={{display:'flex',flexDirection:'column',fontSize:10,alignItems:'center',color:'var(--accent)'}}>
        BG
        <input type="range" min="0" max="360" value={bgHue}
          onChange={e=> setBgHue(+e.target.value)}
          style={{width:90,background:'linear-gradient(90deg, red, yellow, lime, cyan, blue, magenta, red)',border:`1px solid hsl(${bgHue} 90% 55%)`,height:'6px',borderRadius:'4px'}} />
      </label>
      <label style={{display:'flex',flexDirection:'column',fontSize:10,alignItems:'center',color:'var(--accent)'}}>
        TXT
        <input type="range" min="0" max="360" value={txHue}
          onChange={e=> setTxHue(+e.target.value)}
          style={{width:90,background:'linear-gradient(90deg, red, yellow, lime, cyan, blue, magenta, red)',border:`1px solid hsl(${txHue} 90% 55%)`,height:'6px',borderRadius:'4px'}} />
      </label>
      <button onClick={()=> { setBgHue(210); setTxHue(50); }} title="Reset colors" aria-label="Reset colors">↺</button>
      <div className="font-rail" role="radiogroup" aria-label="Font size" aria-orientation="horizontal">
        {FONT_STEPS.map((pct,i)=>(
          <button key={pct} role="radio" aria-checked={fsIndex===i}
            aria-label={`Font size ${pct}%`} data-active={fsIndex===i? '1':'0'}
            tabIndex={fsIndex===i?0:-1}
            onClick={()=> setFsIndex(i)} onKeyDown={handleFontRailKey}
            style={{fontSize:(pct/100*14)+'px'}}>
            A <span className="sr-only">{pct}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}