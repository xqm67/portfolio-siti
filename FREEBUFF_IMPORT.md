# Importazione del portfolio xmarco in Freebuff

Repository da importare: https://github.com/xqm67/portfolio-siti/tree/xmarco-portfolio

**Ramo: `xmarco-portfolio`.** Il ramo `main` contiene un altro sito: per questa importazione leggere esplicitamente `xmarco-portfolio`.

## Obiettivo

Sostituire il portfolio attuale con una copia fedele di questo repository: contenuti, impaginazione, tipografia, colori, componenti e interazioni. Il repository contiene il prodotto da riprodurre, non soltanto una descrizione da usare come ispirazione.

Leggere anche `README.md`, `COMPONENTS.md` e `CREDITS.md` prima di intervenire.

## Messaggio da incollare in Freebuff

> Importa https://github.com/xqm67/portfolio-siti dal ramo `xmarco-portfolio` e usa i suoi file come sorgente della nuova versione del mio portfolio. Voglio una copia fedele del sito implementato nel repository, compresi tutti gli asset e i componenti. Sostituisci l’interfaccia precedente con questa versione dopo aver verificato la preview.
>
> Il progetto è già compilato ed è un sito statico. Parti da `index.html`: conserva `site.css`, `app.js`, `projects.js`, `experience.js`, `skyline.js`, `skyline.css`, le cartelle `assets/` e `vendor/`, e i percorsi relativi. Non ricreare la pagina sulla base di una tua interpretazione grafica. Usa gli stessi font locali, immagini, testi e video.
>
> Mantieni la PSP 3D procedurale in Three.js con i tasti interattivi: cambio progetto, play/pausa, salti di 10 secondi, volume, caricamento locale, ripristino e vista ingrandita. Il player è la PSP stessa: non aggiungere un player esterno. Il modello deve restare stabile durante la pressione dei pulsanti. Toccando lo schermo si alternano video pieno e inquadratura completa.
>
> Includi i trailer reali di Meridiano e TapDeck presenti in `assets/videos/`. Conserva le ottimizzazioni: rendering della console su richiesta, sospensione dei video fuori schermo o nelle schede nascoste, sfondo CSS e assenza di polling della preview.
>
> Mantieni la raccolta con tre progetti principali, le descrizioni di n8n e PC building, le prove di prompting/OpenClaw, il diario ChatGPT e la sezione contatti con `marco.aprea910@gmail.com`. Il diario funziona con importazione locale: non inventare statistiche personali, ore o token e non simulare una connessione al mio account.
>
> Se il tuo hosting richiede React/Vite o un’altra struttura, adatta soltanto l’integrazione tecnica necessaria: il risultato visivo e funzionale deve rimanere fedele al codice fornito. Prima di modificare l’implementazione, leggi `COMPONENTS.md`. Non inserire servizi, API, chiavi o dipendenze a pagamento. Conserva licenze e crediti.
>
> Controlla su desktop e telefono tutti i punti della checklist in `FREEBUFF_IMPORT.md` e mostrami la preview del risultato prima di sostituire la versione pubblica.

## Avvio e hosting

### Usare i file già compilati

È la strada più diretta. Pubblicare il contenuto della radice del repository come sito statico. `index.html` deve stare nella radice pubblica, insieme ai file CSS/JS e alle cartelle `assets/` e `vendor/`.

Per una preview locale, con Node.js 20 o successivo:

```sh
npm run preview
```

Questo comando non richiede `npm install` perché serve i file già compilati. Aprire l’HTML tramite HTTP, non facendo doppio clic su un file locale.

### Ricompilare i componenti

```sh
npm ci
npm run build
npm run preview
```

La build ricompila `experience.js`, `skyline.js` e `skyline.css`. Non produce una cartella `dist/`: i file pubblicabili restano nella radice del progetto. Non è un’app Vite standard e non esiste `npm run dev`.

### Adattamento a un hosting con struttura propria

- Conservare i nomi e i percorsi dei file statici. Se gli asset vengono spostati, aggiornare tutti i riferimenti in HTML, CSS, `projects.js` e import map.
- L’import map di `index.html` risolve `three` verso `vendor/three.module.js`, che importa anche `three.core.js`. Entrambi i file sono necessari.
- Evitare di caricare contemporaneamente i bundle compilati e i componenti TSX sorgente, altrimenti si montano due volte le stesse sezioni.
- Evitare che React sostituisca il DOM gestito da `app.js`: la console usa gli ID presenti in `index.html`.
- `scripts/serve.cjs` è solo un server di preview, non un backend applicativo.
- Servire i video come `video/mp4`, i font come `font/woff2` e i moduli come JavaScript. Supportare le richieste HTTP Range per l’avanzamento nei video.
- In pubblicazione usare HTTPS per la copia dell’email e le altre API del browser che lo richiedono.

## Verifica prima della sostituzione

- La pagina usa la palette scura, Geist e JetBrains Mono locali, e lo stesso ordine delle sezioni.
- Lo scroll è nativo e la pagina non ha overflow orizzontale su telefono.
- Immagini, font, entrambi i video e moduli Three.js si caricano senza errori o richieste 404.
- □/○ cambiano progetto, × riproduce e mette in pausa, croce sinistra/destra salta ±10 secondi e VOL controlla l’audio.
- Il video riempie lo schermo senza deformazioni; un tocco sullo schermo ripristina la vista integrale.
- HOME ripristina la vista e VIEW/“Ingrandisci” apre la vista grande; Chiudi ed Esc la chiudono e ripristinano il focus.
- La pressione dei tasti non ruota il modello. La rotazione richiede un trascinamento intenzionale fuori dai comandi.
- Il video si sospende quando la console non è visibile e riprende al ritorno, se stava riproducendo.
- Da ferma la console non viene ridisegnata continuamente e non c’è un secondo sfondo WebGL.
- I collegamenti dei progetti portano alle destinazioni di `projects.js`.
- Il diario mostra come demo soltanto dati esplicitamente etichettati; l’importazione avviene sul dispositivo.
- Il link email è `mailto:marco.aprea910@gmail.com` e il pulsante Copia indirizzo funziona o mostra il fallback previsto.
- Non sono richieste chiavi API, login al sito, database o servizi esterni per vedere il portfolio.

La cartella `work/`, gli export personali, credenziali e `node_modules/` non fanno parte della consegna.
