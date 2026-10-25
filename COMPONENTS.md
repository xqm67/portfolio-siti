# Componenti e struttura del sito

| File o cartella | Responsabilità |
| --- | --- |
| `index.html` | Struttura completa, ID della console, navigazione, presentazione, contatti e import map. |
| `site.css` | Sistema visivo autorevole: font, palette, layout, responsive, vista espansa e controlli della console. |
| `app.js` | Console Three.js, geometria procedurale, raycasting dei pulsanti, trascinamento, player video, dialogo espanso, tastiera, gestione prestazioni e copia email. |
| `projects.js` | Catalogo condiviso: nomi, descrizioni, esperienze, immagini, collegamenti e trailer. |
| `experience.tsx` | Punto di montaggio React della raccolta progetti. |
| `components/ui/project-gallery.tsx` | Tre schede principali, accesso ai trailer nella PSP e descrizioni delle esplorazioni n8n/hardware. Animazioni con Motion. |
| `activity.tsx` | Interfaccia del diario ChatGPT: importazione JSON, demo esplicita, esportazione dei totali e note sul funzionamento. |
| `activity-data.js` | Aggregazione locale dei messaggi giornalieri, deduplicazione e fuso orario Europe/Rome. |
| `components/ui/contribution-skyline.tsx` | Componente del grafico attività 2D/3D, adattato dal componente fornito dall’utente. |
| `experience.js` | Bundle compilato della raccolta: caricato direttamente dalla pagina. |
| `skyline.js`, `skyline.css` | Bundle e utilities compilate per il diario. Caricati dalla pagina. |
| `assets/` | Immagini reali, illustrazioni, font locali con licenze e trailer ottimizzati. |
| `vendor/three.module.js`, `vendor/three.core.js` | Runtime Three.js locale; mantenere entrambi e l’import map. |
| `scripts/build.cjs` | Build con esbuild e Tailwind; sostituisce soltanto output completati. |
| `scripts/serve.cjs` | Preview statica con MIME corretti e richieste Range per i video. |
| `preview-sync.js` | Segnaposto senza polling: ricaricare normalmente la preview dopo le modifiche. |
| `CREDITS.md` | Font, licenze, componenti e riferimenti grafici. |

## Console PSP

È un modello procedurale originale costruito in `app.js`; non richiede file GLB esterni. La PSP è il player, sia nella pagina sia nella vista espansa. I pulsanti sul modello hanno equivalenti semantici per la tastiera e gli screen reader. Nessun pannello player separato va aggiunto sotto la console.

Il rendering si attiva per interazioni, transizioni e nuovi fotogrammi video. Il modello resta fermo a riposo. L’upload LOAD usa un URL locale `blob:` e non invia il video a un server.

## Progetti e asset

- **Meridiano**: screenshot in `assets/meridiano.png`, trailer in `assets/videos/meridiano.mp4`, sito `https://meridiano.freebuff.app`.
- **TapDeck**: copertina illustrata in `assets/tapdeck.svg`, trailer reale in `assets/videos/tapdeck.mp4`, codice `https://github.com/xqm67/tapdeck`.
- **Padel Village**: screenshot in `assets/padel.png`, sito `https://padelvillage.club`.
- **n8n + AI / PC building**: esperienze testuali in `projects.js`. Le illustrazioni sono concettuali; non inventare demo, clienti o risultati aggiuntivi.
- **Prompting / OpenClaw e agenti AI**: descrizioni nella sezione personale di `index.html`, coerenti con il portfolio originale.

## Diario ChatGPT

Il link pubblico del profilo non fornisce statistiche d’uso. L’importatore conta dati provenienti da un export locale e non ha accesso automatico all’account. I dati caricati non persistono al ricaricamento. La demo non rappresenta l’attività personale dell’autore. Ore e token non vanno dedotti dal numero dei messaggi.

## Font e dipendenze

I font visibili sono Geist e JetBrains Mono, caricati da `assets/fonts/`. Le dipendenze e le versioni sono fissate in `package.json` e `package-lock.json`. Per le licenze consultare `CREDITS.md` e i file LICENSE distribuiti con gli asset.
