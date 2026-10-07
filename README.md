# Hydrate 💧

App desktop (macOS, con versione web PWA) per **chi sta davanti al pc**: calcola da sola
quanto, come e quando ricordarti di bere — e si regola sui tuoi risultati.

Dark, minima, offline, senza account e senza nuvole: i dati vivono sul tuo disco.

## Cosa fa da sola

| Cosa | Come |
|---|---|
| **Quanto bere** | goal giornaliero = `peso × 33 ml` × attività (sedentario/moderato/sportivo) × stagione, mediato con la media degli ultimi 7 giorni, arrotondato ai tuoi bicchieri (mai sotto 1.500, mai sopra 4.000 ml). Il conto è visibile nel Profilo. |
| **Quando ricordarti** | fascia oraria automatica, ricostruita dalle ore in cui bevi davvero (percentili 10–90 sugli ultimi 30 giorni). Finché la storia è poca (meno di 4 giorni) resta sul default 9–22. |
| **Ogni quanto** | intervallo automatico e adattivo: se per più giorni manchi il goal, ti ricorda **più spesso** (fino a ogni 30 min); se lo centri con margine, rallenta (fino a 240 min). Nessuno slider da toccare, ma si può portare a mano. |
| **Quando smettere** | al raggiungimento del goal, e di notte. |
| **Come chiamarti** | la notifica ti saluta per nome: *«Andrea, bevi 💧»*. |

## Interazione

- Notifiche native con titolo e corpo; dalla notifica/banner puoi **bere** o **ricordamelo tra 15 min**.
- **Menu bar**: percentuale del giorno (`0%` → `✓ 100%`), ml mancanti, ore rimaste alla fascia;
  voce **Bevi un bicchiere 💧** (con «ora!» quando il promemoria scatta) e **Prova notifica**.
- Home con **percentuale grande**, conteggio ml e bicchieri, **pillola 💧 ambra** quando è ora di bere.
- Italiano e **English** (Profilo → Lingua), anche per menu bar e notifiche.
- Tutto offline in `localStorage`; nessuna telemetria.

## Screenshot

Benvenuto a non mostrarli qui: l'app è dark, minima, reattiva. La vedi su macOS dalla dock.

## Sviluppo

Requisiti: Node 22+, Rust (`rustup`) per il desktop, Xcode Command Line Tools su macOS.

```bash
npm install
npm test          # Vitest: 51 test sul dominio (goal, window, intervallo, streak, reminder)
npm run dev       # PWA di sviluppo su http://localhost:5173
npx tauri dev     # finestra desktop Tauri
```

Build desktop:

```bash
npx tauri build   # Hydrate.app + .dmg (macOS)
```

CI: il workflow `.github/workflows/test.yml` gira `npm test` + `npm run build` a ogni push/PR.

## Struttura

```
src/
  lib/hydrate.js      # dominio puro (goal, finestra, intervallo, streak, reminder) — testato
  lib/i18n.js         # dizionario it/en, t(), dateLocale, fmtNum
  lib/notify.js       # gateway notifiche native (desktop) e PWA (service worker)
  lib/storage.js      # persistenza localStorage + default
  App.jsx             # stato, tray, reminder, adattamento intervallo
  pages/              # Home, Stats, Profile
  components/         # Avatar, Bottle, BottomNav, BarChart, Heatmap
src-tauri/            # shell Tauri: tray, notifiche native, icone
assets/               # sorgente vettoriale dell'icona (icon-source.svg)
```

Icona: il PNG 1024×1024 si genera da `assets/icon-source.svg` (rasterizzazione macOS),
poi `npx tauri icon <png>` rigenera tutti i set in `src-tauri/icons/`.

## Release

- Tag su `main`, numerato dall'ultima cifra: `v0.1.0 → v0.1.1 → … → v0.1.100`, poi `v0.2.0`.
- Le release GitHub caricano il DMG generato da `npx tauri build`.
- `main` è protetto da un **ruleset** (CI `test` verde + strict, niente force-push, niente cancellazioni).