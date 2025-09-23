import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/base.css';
import './styles/translator.css';
import './styles/controls.css';
import App from './App.jsx';

if (!import.meta?.hot && location.protocol === 'file:') {
  console.warn('[DDD] file:// load detected. Use: npm run dev');
}

window.addEventListener('error', e => {
  console.error('[DDD] Global Error:', e.error || e.message);
  showVisualError(e.error?.message || e.message);
});
window.addEventListener('unhandledrejection', e => {
  console.error('[DDD] Unhandled Promise Rejection:', e.reason);
  showVisualError(String(e.reason));
});

function showVisualError(msg){
  const host = document.getElementById('boot-status') || document.getElementById('root');
  if(!host) return;
  host.innerHTML = `<div style="background:#2b1c1c;border:1px solid #662;max-width:640px;margin:32px auto;padding:16px 18px;border-radius:10px;font:13px/1.4 monospace;color:#ffb3b3">
  <strong style="color:#ff6666">Startup Error</strong><br>${escapeHtml(msg)}<br><br>
  Check DevTools Console (F12) for full stack trace.</div>`;
}
function escapeHtml(s){
  return s.replace(/[&<>"']/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

try {
  const el = document.getElementById('root');
  if(!el){
    showVisualError('Root element #root not found.');
  } else {
    createRoot(el).render(<App />);
    requestAnimationFrame(()=> {
      document.getElementById('boot-status')?.remove();
    });
  }
} catch(err){
  console.error('[DDD] Render failed:', err);
  showVisualError(err.message || 'Render failed');
}

setTimeout(()=>{
  const boot = document.getElementById('boot-status');
  if(boot){
    boot.textContent = 'Still loading... (Open Console)';
    boot.style.color = '#ff9966';
  }
}, 3000);
