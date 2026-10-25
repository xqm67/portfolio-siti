# xmarco — portfolio

Versione completa per Freebuff: [ramo xmarco-portfolio](https://github.com/xqm67/portfolio-siti/tree/xmarco-portfolio). Usare questo ramo; `main` contiene un altro sito.

**Per importarlo in Freebuff:** leggere [FREEBUFF_IMPORT.md](FREEBUFF_IMPORT.md), che contiene il messaggio da incollare e la checklist di verifica. La mappa di tutti i componenti è in [COMPONENTS.md](COMPONENTS.md).

Il sito è già compilato: `index.html`, JavaScript, CSS, `assets/` e `vendor/` sono pronti per un hosting statico. Non richiede chiavi API, un database o servizi a pagamento. Per vederlo usa un server HTTP: aprire direttamente il file HTML non è sufficiente per i moduli JavaScript.

## Avvio e modifiche

Con Node.js 20 o successivo, dalla cartella del progetto:

```sh
npm install
npm run build
npm run preview
```

Apri [http://127.0.0.1:4173/](http://127.0.0.1:4173/). `npm run preview` funziona anche senza installazione o build quando si usano i file compilati inclusi. La porta si può cambiare con la variabile d'ambiente `PORT` (per esempio, in PowerShell: `$env:PORT=4174`).

- `index.html`, `site.css`, `app.js`: contenuti, impaginazione e console 3D. `site.css` è il foglio autorevole; i precedenti fogli di direzione non sono più caricati.
- `projects.js`: dati condivisi tra console e raccolta progetti.
- `experience.tsx`: raccolta progetti; lo sfondo è CSS statico.
- `activity.tsx`, `activity-data.js`, `components/ui/contribution-skyline.tsx`: sezione attività.
- `npm run build`: ricompila `experience.js`, `skyline.js` e `skyline.css`; pubblica solo file completati.

La PSP si usa direttamente dai tasti sul modello: □/○ per i progetti, × per play/pausa, croce direzionale per ±10 secondi, LOAD per un video locale, VOL per l’audio, HOME per ripristinare la vista e VIEW per ingrandirla. Tab e Invio permettono di usare gli stessi tasti da tastiera. Non c’è un player esterno duplicato.

Lo scorrimento è nativo. La raccolta non blocca lo scroll per aprire le carte; la console resta stabile durante i comandi, senza oscillazione automatica.

## Passaggio a Freebuff

Fornisci l'intera cartella a Freebuff e chiedi di sostituire il sito precedente con questi file, mantenendo struttura e nomi. La directory pubblicata deve contenere `index.html` nella radice e preservare `assets/` e `vendor/`. I file compilati sono già disponibili; `node_modules/`, eventuali file temporanei e gli script di build non servono sull'hosting statico. Mantieni le licenze e [CREDITS.md](CREDITS.md) nel materiale consegnato.

Prima di sostituire il sito pubblico, conserva una copia della versione precedente e controlla la preview di Freebuff su desktop e telefono. Verifica immagini, font, apertura/chiusura della console e collegamenti ai progetti.

## Contenuti ancora da fornire

La console ispirata alla PSP è un modello procedurale originale, non una scansione o un modello ufficiale Sony. Alcune copertine dei progetti sono illustrazioni concettuali. I trailer di Meridiano e TapDeck forniti dall’utente sono inclusi in `assets/videos/` (18,28 secondi ciascuno, formato quadrato). Si avviano con × o “Trailer nella PSP”. Il video riempie lo schermo con un ritaglio centrale, senza deformazioni; toccando lo schermo si alterna la vista piena e quella integrale. Per altri trailer aggiungi gli asset e il campo `trailer` in `projects.js`. LOAD permette anche una prova con un video locale.

Il link al profilo ChatGPT non espone le statistiche d'uso. L'importatore legge un export sul dispositivo; non carica le conversazioni su un server. Per pubblicare l'attività serve un export reale e, dopo il controllo dei dati, il solo aggregato giornaliero. La demo contiene dati sintetici. Token consumati e ore lavorate non si possono ricavare fedelmente dal numero dei messaggi.

Non sono incluse chiavi API né conversazioni personali.

## Prestazioni

La console viene ridisegnata solo durante un’interazione, una transizione o un nuovo fotogramma video. Fuori schermo e nelle schede nascoste il video si sospende e riprende quando torna visibile. Lo sfondo usa CSS, senza un secondo contesto WebGL. I trailer sono ottimizzati a 720×720 e 30 fps. La preview si aggiorna con un normale ricaricamento, senza polling dei bundle.
