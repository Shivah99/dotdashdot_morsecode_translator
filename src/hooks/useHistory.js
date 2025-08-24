import { useState, useCallback, useEffect } from 'react';

const KEY = 'dotdash_history_react_v1';

export function useHistoryStore(){
  const [items,setItems] = useState(()=> {
    try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { return []; }
  });

  useEffect(()=> {
    try {
      localStorage.setItem(KEY, JSON.stringify(items.slice(-10)));
    } catch (e){
      console.warn('[DDD] history persistence failed', e);
    }
  }, [items]);

  const add = useCallback(rec=>{
    setItems(prev=> [...prev.slice(-9), { id: genId(), ts: Date.now(), ...rec }]);
  },[]);
  const clear = useCallback(()=> setItems([]),[]);
  const exportAll = useCallback(()=>{
    if(!items.length) return;
    const txt = items.map(r=> `[${new Date(r.ts).toISOString()}] ${r.id}\n${r.input}\n=>\n${r.output}\n`).join('\n');
    const blob = new Blob([txt], {type:'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dotdash_history.txt';
    a.click();
  },[items]);

  return { items, add, clear, exportAll };
}

function genId(){ return 'DD-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6).toUpperCase(); }
