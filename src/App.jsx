import React, { useState, useMemo, useEffect } from 'react';
import Controls from './components/Controls.jsx';
import Translator from './components/Translator.jsx';
import Keyer from './components/Keyer.jsx';
import History from './components/History.jsx';
import Lessons from './components/Lessons.jsx';
import Tips from './components/Tips.jsx';
import { useHistoryStore } from './hooks/useHistory.js';
import { translateAuto } from './utils/morse.js';
import { playMorse } from './utils/audio.js';

export default function App(){
  const [input, setInput] = useState('HELLO WORLD');
  const [wpm, setWpm] = useState(15);
  const [freq, setFreq] = useState(600);
  const history = useHistoryStore();
  const translation = useMemo(()=> translateAuto(input), [input]);
  const output = translation.direction === 'morse'
    ? translation.english
    : translation.morse;

  function save(){ if(!input.trim()||!output.trim()) return; history.add({ input, output }); }
  function play(){ playMorse(translation.morse, { wpm, freq }); }

  useEffect(()=>{ console.info('[DDD] App mounted', { initialInput: input, wpm, freq }); },[]);

  // Optional ad slots (left/right/bottom) scaffold via localStorage flag "ddd_ads=1"
  const showAds = typeof localStorage !== 'undefined' && localStorage.getItem('ddd_ads') === '1';

  return (
    <div className="wrap" style={{maxWidth:1100, margin:'24px auto 80px', padding:'0 16px'}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18,paddingTop:18}}>
        <div className="brand" style={{display:'flex',gap:12,alignItems:'center'}}>
          <div className="badge" aria-hidden="true"></div>
          <div>
            <h1 style={{margin:0}}>DotDashDot</h1>
            <div className="tag">Translate & learn Morse in a fun retro way</div>
          </div>
        </div>
        <Controls />
      </header>
      {showAds && (
        <div className="ad-bar" aria-hidden="true">
          <div className="ad-slot ad-left"></div>
          <div></div>
          <div className="ad-slot ad-right"></div>
        </div>
      )}
      <div style={{display:'grid', gap:24, gridTemplateColumns:'minmax(0,1fr) 380px', paddingBottom: showAds ? 90 : 0}}>
        <div>
          <Translator
            input={input} setInput={setInput} output={output}
            onClear={()=>setInput('')} onSave={save}
            wpm={wpm} setWpm={setWpm} freq={freq} setFreq={setFreq}
          />
          <Keyer onCommit={(m)=> setInput(i=> (i? i+' '+m : m))} />
        </div>
        <div className="history-shell">
          <History history={history.items} onExport={history.exportAll} onClear={history.clear} onPlay={play} />
          <Lessons onInsert={(ch)=> setInput(i=> (i ? i+' '+ch : ch))} />
          <Tips />
        </div>
      </div>
      <footer className="footer-fun" style={{marginBottom: showAds ? 100 : undefined}}>
        🚀 <span className="em">DotDashDot</span> • MIT Licensed • Made with ⚡ for learners & kids
      </footer>
      {showAds && (
        <div className="ad-bottom ad-slot" aria-hidden="true"></div>
      )}
    </div>
  );
}