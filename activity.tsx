import * as React from 'react';
import {createRoot} from 'react-dom/client';
import ContributionSkyline from './components/ui/contribution-skyline';
import {aggregateExports,todayRome} from './activity-data.js';

function Activity(){
 const [data,setData]=React.useState<{date:string,count:number}[]>([]);
 const [status,setStatus]=React.useState('');
 const [loaded,setLoaded]=React.useState(false);
 const [demo,setDemo]=React.useState(false);
 const inputRef=React.useRef<HTMLInputElement>(null);
 const endDate=todayRome();
 const hasActivity=loaded||demo;

 async function loadFiles(event:React.ChangeEvent<HTMLInputElement>){
  try{
   const files=[...event.target.files||[]];
   if(!files.length)return;
   if(files.some(f=>f.size>100*1024*1024))throw new Error('File troppo grande. Usa i file JSON suddivisi dell’export, fino a 100 MB ciascuno.');
   const docs=await Promise.all(files.map(async f=>JSON.parse(await f.text())));
   const days=aggregateExports(docs);
   setData(days);setDemo(false);setLoaded(true);
   setStatus(`${files.length} ${files.length===1?'file importato':'file importati'} · ${days.length} giorni con dati · fuso orario di Roma.`);
  }catch(error){
   setStatus(error instanceof SyntaxError?'Uno dei file non contiene dati JSON validi.':error instanceof Error?error.message:'Importazione non riuscita.');
  }
  event.target.value='';
 }

 function download(){
  const blob=new Blob([JSON.stringify({version:1,source:'ChatGPT export',unit:'user_messages',timeZone:'Europe/Rome',updatedAt:new Date().toISOString(),days:data},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='activity-daily.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 }

 function toggleDemo(){
  setDemo(!demo);
  setStatus(!demo?'Demo con dati di esempio, non collegati al mio account.':loaded?'Dati importati ripristinati.':'');
 }

 return <>
  <div className="section-heading">
   <p className="eyebrow">02 / Diario</p>
   <div>
    <h2>Dentro il processo.</h2>
    <p>Le conversazioni con ChatGPT, giorno per giorno.</p>
    <a className="activity-profile" href="https://chatgpt.com/u/xmarco_ap" target="_blank" rel="noopener noreferrer">Il mio profilo ChatGPT <span>@xmarco_ap ↗</span></a>
   </div>
  </div>

  {!hasActivity&&<div className="activity-empty">
   <div><span className="activity-empty-label">DIARIO PERSONALE</span><h3>Nessuna attività importata.</h3><p>Importa i dati per esplorare messaggi e giorni consecutivi.</p></div>
   <span className="activity-empty-mark" aria-hidden="true">↗</span>
  </div>}

  <div className="activity-toolbar">
   <div className="activity-controls">
    <button type="button" className="activity-import" onClick={()=>inputRef.current?.click()}>Importa dati <span aria-hidden="true">＋</span></button>
    <input ref={inputRef} id="chatgpt-export" type="file" accept="application/json,.json" multiple hidden onChange={loadFiles}/>
    <button type="button" className="activity-demo" aria-pressed={demo} onClick={toggleDemo}>{demo?'Chiudi demo':'Esplora una demo'}</button>
    {loaded&&!demo&&<button type="button" onClick={download}>Esporta i totali ↗</button>}
    {loaded&&<button type="button" onClick={()=>{setData([]);setLoaded(false);setDemo(false);setStatus('Dati rimossi dal browser.');}}>Rimuovi dati</button>}
   </div>
   <p className="activity-status" role="status">{status}</p>
  </div>

  {hasActivity&&<div className="activity-chart">
   {demo&&<p className="activity-demo-note">DEMO · Dati di esempio, non statistiche personali.</p>}
   <ContributionSkyline
    className="activity-skyline"
    data={demo?undefined:data}
    endDate={endDate}
    defaultView="3d"
    locale="it-IT"
    weekStart={1}
    palette={{light:['#b2bbc5','#8794a2','#586777','#344352'],dark:['#35414d','#5b6b7b','#8fa0af','#d2dce4']}}
    title={demo?'Messaggi nell’ultimo anno · esempio':'Messaggi nell’ultimo anno'}
    unit="messaggio"
    unitPlural="messaggi"
   />
  </div>}

  <details className="activity-details">
   <summary>Come funziona il diario <span aria-hidden="true">＋</span></summary>
   <div>
    <p>Il profilo pubblico di ChatGPT non espone statistiche di utilizzo. Il diario conta i messaggi inviati e i giorni consecutivi dai dati che importi; non stima ore di lavoro o token.</p>
    <p>Puoi caricare <code>conversations.json</code>, più file JSON dell’export ChatGPT, oppure il file dei totali giornalieri. Il calcolo avviene nel browser: le conversazioni non vengono inviate a un server e i dati si azzerano quando ricarichi la pagina. Per pubblicare l’attività, esporta soltanto i totali.</p>
    <a href="https://help.openai.com/en/articles/7260999-export-your-data-from-chatgpt" target="_blank" rel="noopener noreferrer">Come ottenere i dati da ChatGPT ↗</a>
   </div>
  </details>
 </>;
}

createRoot(document.getElementById('activity-root')!).render(<Activity/>);

