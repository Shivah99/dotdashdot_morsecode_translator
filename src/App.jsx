import React, { useState, useMemo, useEffect } from 'react';
import Controls from './components/Controls.jsx';
import Translator from './components/Translator.jsx';
import Keyer from './components/Keyer.jsx';
import History from './components/History.jsx';
import Lessons from './components/Lessons.jsx';
import Tips from './components/Tips.jsx';
import { useHistoryStore } from './hooks/useHistory.js';
import { isMorse, englishToMorse, morseToEnglish } from './utils/morse.js';
import { playMorse } from './utils/audio.js';

export default function App(){
  const [input, setInput] = useState('HELLO WORLD');
  const [wpm, setWpm] = useState(15);
  const [freq, setFreq] = useState(600);
  const history = useHistoryStore();
  const output = useMemo(()=> !input.trim() ? '' : (isMorse(input)? morseToEnglish(input): englishToMorse(input)), [input]);
  function swap(){ setInput(output); }
  function save(){ if(!input.trim()||!output.trim()) return; history.add({ input, output }); }
  function play(){ const morse = isMorse(input)? input: englishToMorse(input); playMorse(morse,{ wpm,freq }); }

  useEffect(()=>{ console.info('[DDD] App mounted', { initialInput: input, wpm, freq }); },[]);

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
      <div style={{display:'grid', gap:24, gridTemplateColumns:'minmax(0,1fr) 380px'}}>
        <div>
          <Translator
            input={input} setInput={setInput} output={output}
            onSwap={swap} onClear={()=>setInput('')} onSave={save} onPlay={play}
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
      <footer className="footer-fun">
        🚀 <span className="em">DotDashDot</span> • Open Source MIT • Made with ⚡ for learners & kids
      </footer>
    </div>
  );
}