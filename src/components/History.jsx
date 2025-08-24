import React from 'react';
import { playMorse } from '../utils/audio.js';
import { englishToMorse, isMorse } from '../utils/morse.js';
export default function History({ history, onExport, onClear }){
  function downloadRec(rec){
    const blob = new Blob([`ID: ${rec.id}\nTime: ${new Date(rec.ts).toISOString()}\n\nEnglish:\n${rec.output}\n\nMorse:\n${isMorse(rec.input)? rec.input: englishToMorse(rec.input)}\n`], {type:'text/plain'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`dotdashdot_${rec.id}.txt`; a.click();
  }
  return (
    <div style={{ padding: '18px 18px 6px' }}>
      {/* ...existing JSX... */}
      <h3 style={{ margin: '0 0 10px', fontSize: '0.9rem' }}>History (last 10)</h3>
      {history.slice().reverse().map(rec=>{
        const morse = isMorse(rec.input)? rec.input : englishToMorse(rec.input);
        return (
          <details key={rec.id}>
            <summary>
              <span style={{ fontFamily: 'monospace', color: '#ffd83b' }}>{rec.id}</span>
              <span style={{ marginLeft: 8, fontSize: '.6rem', opacity: .65 }}>{new Date(rec.ts).toLocaleTimeString()}</span>
            </summary>
            <div className="history-item-body">
              <div style={{ color: '#9ee493', fontWeight: 600, fontSize: '.8rem' }}>EN: {rec.output}</div>
              <div style={{ color: '#ffd83b', fontWeight: 600, fontSize: '.75rem', marginTop: 4 }}>MO: {morse}</div>
              <div className="history-mini-buttons">
                <button onClick={()=> playMorse(morse)}>▶ play</button>
                <button onClick={()=> downloadRec(rec)}>⬇ save</button>
              </div>
            </div>
          </details>
        );
      })}
      {!history.length && <div style={{ opacity: .5, fontSize: '.7rem' }}>No history yet</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button onClick={onExport} style={{ fontSize: '.65rem' }}>⬇ Export All</button>
        <button onClick={onClear} style={{ fontSize: '.65rem' }}>🗑 Clear</button>
      </div>
    </div>
  );
}
