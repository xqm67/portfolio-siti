// Only daily counts leave this function. No conversation text or titles are retained.
export function todayRome(now=new Date()) {
 const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const get=k=>p.find(x=>x.type===k).value;return `${get('year')}-${get('month')}-${get('day')}`;
}
export function aggregateExports(documents){
 const counts=new Map(),seen=new Set();let recognized=false;
 for(const doc of documents){
  const list=Array.isArray(doc)?doc:doc?.days;
  if(!Array.isArray(list))throw new Error('Formato non riconosciuto. Seleziona conversations.json oppure un file di soli totali giornalieri.');
  for(const item of list){
   if(item&&typeof item.date==='string'&&'count'in item){
    const date=item.date,count=Number(item.count);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isInteger(count)||count<0||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw new Error('Un totale giornaliero non è valido.');
    counts.set(date,(counts.get(date)||0)+count);recognized=true;continue;
   }
   if(!item?.mapping||typeof item.mapping!=='object')continue;recognized=true;
   for(const node of Object.values(item.mapping)){
    const message=node?.message;
    if(message?.author?.role!=='user'||!message.id||seen.has(message.id))continue;
    seen.add(message.id);const timestamp=Number(message.create_time);if(!Number.isFinite(timestamp)||timestamp<=0)continue;
    const date=todayRome(new Date(timestamp*1000));counts.set(date,(counts.get(date)||0)+1);
   }
  }
 }
 if(!recognized)throw new Error('Non ho trovato conversazioni o totali giornalieri validi.');
 return [...counts].map(([date,count])=>({date,count})).sort((a,b)=>a.date.localeCompare(b.date));
}
