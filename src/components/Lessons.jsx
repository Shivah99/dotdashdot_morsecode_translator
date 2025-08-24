import React, { useState } from 'react';
import { LESSONS } from '../utils/morse.js';
export default function Lessons({ onInsert }){
  const [open,setOpen]=useState(false);
  return (
    <details style={{margin:'12px 18px'}} open={open} onToggle={e=>setOpen(e.target.open)}>
      <summary style={{cursor:'pointer', fontWeight:600}}>📚 Lessons (A–Z, 0–9, punctuation)</summary>
      <div className="lessons-grid">
        {LESSONS.map(([ch,code])=>
          <div className="lesson-card" key={ch} onClick={()=>onInsert(ch)} title={`Insert ${ch}`}>
            <strong>{ch}</strong>
            <code>{code}</code>
          </div>
        )}
      </div>
    </details>
  );
}
