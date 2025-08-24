import React from 'react';
export default function Tips(){
  return (
    <details style={{margin:'12px 18px'}}>
      <summary style={{cursor:'pointer', fontWeight:600}}>💡 Tips & FAQ</summary>
      <ul className="tips-list">
        <li>✨ Auto-detect English ↔ Morse.</li>
        <li>🔊 Adjust WPM & Hz for comfortable listening.</li>
        <li>💾 History keeps last 10 translations locally.</li>
        <li>🟡 Practice with the keyer to learn timing.</li>
      </ul>
    </details>
  );
}
