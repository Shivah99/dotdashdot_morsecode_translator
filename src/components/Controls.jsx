// Renamed from Controls.js (content unchanged)
import React, { useState, useEffect, useRef } from 'react';
import { getHaptics, setHaptics } from '../utils/audio.js';

const H_BG_KEY='ddd_hue_bg', H_TX_KEY='ddd_hue_text', FS_KEY='ddd_font_scale';
const FONT_STEPS=[100,115,130,150];

function HueDial({ bgHue, setBgHue, txHue, setTxHue }){
  const canvasRef = useRef(null);
  const draggingRef = useRef(null);

  function getSize(){
    const parent = canvasRef.current?.parentElement; const w = Math.min(180, Math.max(120, parent?.clientWidth||148));
    return w;
  }

  useEffect(()=>{ draw(); function onResize(){ draw(); } window.addEventListener('resize', onResize); return ()=> window.removeEventListener('resize', onResize); }, [bgHue, txHue]);

  function draw(){
    const c = canvasRef.current; if(!c) return;
    const SIZE = getSize();
    const CX = SIZE/2, CY = SIZE/2;
    const OUTER_R = Math.round(SIZE*0.36);
    const OUTER_W = Math.round(SIZE*0.11);
    const INNER_R = Math.round(SIZE*0.24);
    const INNER_W = Math.round(SIZE*0.09);

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    c.width = SIZE * dpr; c.height = SIZE * dpr; c.style.width = SIZE+'px'; c.style.height = SIZE+'px';
    const ctx = c.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,SIZE,SIZE);

    // subtle bg
    ctx.beginPath(); ctx.arc(CX,CY, OUTER_R+OUTER_W/2+8, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(20,28,36,.55)'; ctx.fill();

    function strokeHueRing(radius, width, light){
      ctx.lineWidth = width; ctx.lineCap = 'butt';
      for(let a=0; a<360; a+=2){
        const start = (a-1) * Math.PI/180, end = (a+1) * Math.PI/180;
        ctx.beginPath(); ctx.arc(CX,CY, radius, start, end);
        // very light colors
        ctx.strokeStyle = `hsl(${a} 60% ${light}%)`;
        ctx.globalAlpha = 0.85;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    strokeHueRing(OUTER_R, OUTER_W, 70); // BG ring
    strokeHueRing(INNER_R, INNER_W, 62); // TXT ring

    function drawArrow(angleDeg, radius, dir){
      const ang = (angleDeg) * Math.PI/180;
      const tipR = radius + (dir>0 ? (Math.max(4, OUTER_W/2)) : -(Math.max(4, OUTER_W/2)));
      const tipX = CX + Math.cos(ang)*tipR;
      const tipY = CY + Math.sin(ang)*tipR;
      const baseR = radius + (dir>0 ? -6 : 6);
      const baseX = CX + Math.cos(ang)*baseR;
      const baseY = CY + Math.sin(ang)*baseR;
      const perpAng = ang + Math.PI/2; const w = 7;
      const bx1 = baseX + Math.cos(perpAng)*w, by1 = baseY + Math.sin(perpAng)*w;
      const bx2 = baseX - Math.cos(perpAng)*w, by2 = baseY - Math.sin(perpAng)*w;
      const ctx = c.getContext('2d');
      ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(bx1, by1); ctx.lineTo(bx2, by2); ctx.closePath();
      ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 3; ctx.fill(); ctx.shadowBlur = 0;
    }

    drawArrow(bgHue, OUTER_R + OUTER_W/2, -1);
    drawArrow(txHue, INNER_R - INNER_W/2, 1);
  }

  // pointer logic recalculated with dynamic sizes
  function getGeom(){
    const SIZE = getSize();
    return {
      SIZE,
      CX: SIZE/2,
      CY: SIZE/2,
      OUTER_R: Math.round(SIZE*0.36), OUTER_W: Math.round(SIZE*0.11),
      INNER_R: Math.round(SIZE*0.24), INNER_W: Math.round(SIZE*0.09)
    };
  }
  function angleToHue(x,y,geom){
    const { CX, CY } = geom; const ang = Math.atan2(y - CY, x - CX); let deg = ang * 180/Math.PI; return (deg + 360) % 360;
  }
  function whichRing(x,y,geom){
    const { CX,CY, OUTER_R, OUTER_W, INNER_R, INNER_W } = geom; const r = Math.hypot(x-CX,y-CY);
    const outerEdge = OUTER_R + OUTER_W/2, outerInner = OUTER_R - OUTER_W/2;
    const innerEdge = INNER_R + INNER_W/2, innerInner = INNER_R - INNER_W/2;
    const inOuter = r >= outerInner-6 && r <= outerEdge+6; const inInner = r >= innerInner-6 && r <= innerEdge+6;
    if(inOuter && !inInner) return 'bg'; if(inInner && !inOuter) return 'tx'; if(inOuter && inInner) return (Math.abs(r-OUTER_R) < Math.abs(r-INNER_R)) ? 'bg':'tx';
    return (Math.abs(r-OUTER_R) < Math.abs(r-INNER_R)) ? 'bg':'tx';
  }
  function onPointerDown(e){
    const rect = canvasRef.current.getBoundingClientRect(); const x = e.clientX - rect.left, y = e.clientY - rect.top; const geom = getGeom();
    const ring = whichRing(x,y,geom); draggingRef.current = ring; const hue = angleToHue(x,y,geom); (ring==='bg'? setBgHue : setTxHue)(Math.round(hue));
    window.addEventListener('pointermove', onPointerMove); window.addEventListener('pointerup', onPointerUp, { once:true });
  }
  function onPointerMove(e){
    const rect = canvasRef.current.getBoundingClientRect(); const x = e.clientX - rect.left, y = e.clientY - rect.top; const geom = getGeom();
    const hue = angleToHue(x,y,geom); const ring = draggingRef.current; if(!ring) return; (ring==='bg'? setBgHue : setTxHue)(Math.round(hue));
  }
  function onPointerUp(){ draggingRef.current = null; window.removeEventListener('pointermove', onPointerMove); }

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
      <canvas ref={canvasRef}
        onPointerDown={onPointerDown}
        style={{cursor:'pointer', borderRadius:12, boxShadow:'inset 0 0 0 1px #273447, 0 6px 18px rgba(0,0,0,.22)'}}/>
    </div>
  );
}

export default function Controls(){
  const [bgHue,setBgHue]=useState(()=> Number(localStorage.getItem(H_BG_KEY) ?? 210));
  const [txHue,setTxHue]=useState(()=> Number(localStorage.getItem(H_TX_KEY) ?? 50));
  const [fsIndex,setFsIndex]=useState(()=> {
    const stored=Number(localStorage.getItem(FS_KEY));
    const idx=FONT_STEPS.indexOf(stored);
    return idx>=0?idx:0;
  });
  const [haptics,setHapticsState] = useState(()=> getHaptics());
  const [showHue,setShowHue] = useState(false);
  const huePopRef = useRef(null);
  const hueBtnRef = useRef(null);

  useEffect(()=>{ applyHues(bgHue,txHue); localStorage.setItem(H_BG_KEY,String(bgHue)); },[bgHue]);
  useEffect(()=>{ applyHues(bgHue,txHue); localStorage.setItem(H_TX_KEY,String(txHue)); },[txHue]);
  useEffect(()=>{
    const pct=FONT_STEPS[fsIndex];
    document.documentElement.style.setProperty('--root-font-scale', pct+'%');
    document.documentElement.style.fontSize = (pct/100*16)+'px';
    localStorage.setItem(FS_KEY,String(FONT_STEPS[fsIndex]));
  },[fsIndex]);

  useEffect(()=>{
    if(!showHue) return;
    function onDocDown(e){
      if(huePopRef.current?.contains(e.target) || hueBtnRef.current?.contains(e.target)) return;
      setShowHue(false);
    }
    function onEsc(e){ if(e.key==='Escape') setShowHue(false); }
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onEsc);
    // focus popover for keyboard adjustments
    setTimeout(()=>{ huePopRef.current?.focus(); }, 0);
    return ()=>{ document.removeEventListener('mousedown', onDocDown); document.removeEventListener('keydown', onEsc); };
  },[showHue]);

  function toggleHue(){ setShowHue(v=> !v); }

  function onHueKey(e){
    if(e.key==='ArrowLeft' || e.key==='ArrowRight'){
      e.preventDefault();
      const delta = e.key==='ArrowRight' ? 3 : -3;
      if(e.shiftKey){
        setBgHue(h=> ( (h + delta + 360) % 360 ));
      } else {
        setTxHue(h=> ( (h + delta + 360) % 360 ));
      }
    }
  }

  const hueTitle = `Pick BG/TXT hues (BG ${bgHue}°, TXT ${txHue}°). Tip: Arrow keys adjust TXT; hold Shift for BG.`;

  function applyHues(hBg,hTx){
    const bg=`hsl(${hBg} 22% 10%)`, bgAlt=`hsl(${hBg} 22% 16%)`;
    const accent=`hsl(${hTx} 90% 55%)`, accentGlow=`hsl(${hTx} 90% 70%)`;
    const text=`hsl(${hTx} 75% 88%)`;
    const root = document.documentElement;
    root.style.setProperty('--bg',bg);
    root.style.setProperty('--bg-alt',bgAlt);
    root.style.setProperty('--text',text);
    root.style.setProperty('--accent',accent);
    root.style.setProperty('--accent-glow',accentGlow);
    root.style.setProperty('--bg-hue', String(hBg));
    root.style.setProperty('--tx-hue', String(hTx));
  }

  function handleFontRailKey(e){
    if(e.key==='ArrowRight'||e.key==='ArrowUp'){ e.preventDefault(); setFsIndex(i=> Math.min(FONT_STEPS.length-1,i+1)); }
    else if(e.key==='ArrowLeft'||e.key==='ArrowDown'){ e.preventDefault(); setFsIndex(i=> Math.max(0,i-1)); }
  }

  function toggleHaptics(){ setHapticsState(h=> { const nv=!h; setHaptics(nv); return nv; }); }

  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:12,alignItems:'flex-start'}}>
      {/* Mini hue trigger + popover */}
      <div className="hue-mini" style={{position:'relative'}}>
        <button ref={hueBtnRef} className="hue-chip" onClick={toggleHue}
          aria-haspopup="dialog" aria-expanded={showHue} aria-controls="hue-popover"
          title={hueTitle} aria-label={hueTitle}>
          <span className="swatch" aria-hidden="true" />
          Hue
        </button>
        {showHue && (
          <div id="hue-popover" ref={huePopRef} role="dialog" className="hue-popover"
            style={{position:'absolute',zIndex:20,top:'calc(100% + 8px)',left:0,background:'var(--bg-alt)',border:'1px solid #273447',borderRadius:12,padding:10,boxShadow:'0 10px 28px rgba(0,0,0,.35)'}}
            onMouseDown={e=> e.stopPropagation()} tabIndex={-1} onKeyDown={onHueKey}>
            <HueDial bgHue={bgHue} setBgHue={setBgHue} txHue={txHue} setTxHue={setTxHue} />
            <div style={{fontSize:10,opacity:.7,marginTop:6,textAlign:'center'}}>Arrows adjust TXT; hold Shift for BG. Click ring to drag.</div>
          </div>
        )}
      </div>

      {/* Controls to the right */}
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        <div style={{display:'flex',alignItems:'center',gap:8,color:'var(--accent)',fontSize:10}}>
          <button onClick={()=> { setBgHue(210); setTxHue(50); }} title="Reset colors" aria-label="Reset colors">↺ Reset</button>
          <label title="Mobile vibration on key clicks" style={{display:'flex',alignItems:'center',gap:6}}>
            <input type="checkbox" checked={haptics} onChange={toggleHaptics} style={{accentColor:'var(--accent)'}} /> Haptics
          </label>
        </div>
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
    </div>
  );
}