# Hydrate 💧

App desktop (macOS, con versione web PWA) per **chi sta davanti al pc**: calcola da sola
quanto, come e quando ricordarti di bere — e si regola sui tuoi risultati.

Dark, minima, offline, senza account e senza nuvole: i dati vivono sul tuo disco.

## Cosa fa da sola

| Cosa | Come |
|---|---|
| **Quanto bere** | goal giornaliero = `peso × 33 ml` × attività (sedentario/moderato/sportivo) × stagione, mediato con la media degli ultimi 7 giorni, arrotondato ai tuoi bicchieri (mai sotto 1.500, mai sopra 4.000 ml). Il conto è visibile nel Profilo. |
| **Con che ritmo** | alla prima apertura un breve onboarding (sveglia, sonno, caffè, sport…) ricava fascia oraria e intervallo. Se lo salti restano i default. |
| **Quando ricordarti** | fascia oraria dalle tue abitudini, o — senza abitudini — ricostruita dalle ore in cui bevi davvero (percentili 10–90 sugli ultimi 30 giorni; sotto i 4 giorni di storia resta sul default 9–22). |
| **Ogni quanto** | intervallo automatico e adattivo: se per più giorni manchi il goal, ti ricorda **più spesso** (fino a ogni 30 min); se lo centri con margine, rallenta (fino a 240 min). Nessuno slider da toccare, ma si può portare a mano. |
| **Quando smettere** | al raggiungimento del goal, e di notte. |
| **Come chiamarti** | nel browser (PWA) la notifica ti saluta per nome: *«Andrea, bevi 💧»*. |

## Interazione

- **Desktop**: al momento giusto compare un **popup centrato** sullo schermo principale, con
  **Bevi un bicchiere 💧** e **Rimanda 15 min** (Esc per chiudere). Nessun banner di sistema.
- **Browser (PWA)**: notifica con azioni **Bevi** / **Ricordamelo tra 15 min**.
- **Menu bar**: percentuale del giorno (`0%` → `✓ 100%`), ml mancanti, ore rimaste alla fascia;
  voce **Bevi un bicchiere 💧** (con «ora!» quando il promemoria scatta) e **Prova notifica**,
  il cui esito è scritto nel menu (niente fallimenti silenziosi).
- Home con **percentuale grande**, conteggio ml e bicchieri, **pillola 💧 ambra** quando è ora di bere.
- Italiano e **English** (Profilo → Lingua), anche per menu bar, popup e notifiche.
- Tutto offline: `localStorage` nel browser, un file di stato nella cartella dati dell'app su macOS.
  Nessuna telemetria.

## Screenshot

Non li mostriamo: l'app è dark, minima, reattiva. Vive nella **menu bar** (nessuna icona nel Dock).

## Sviluppo

Requisiti: Node 22+, Rust (`rustup`) per il desktop, Xcode Command Line Tools su macOS.

```bash
npm install
npm test          # Vitest: 71 test sul dominio (goal, finestra, intervallo, streak, reminder, abitudini, i18n)
npm run lint      # ESLint
npm run check     # test + lint + build (gate pre-commit)
npm run dev       # PWA di sviluppo su http://localhost:5173
npx tauri dev     # popup desktop Tauri (avvia anche il dev server via docker compose)
```

Test della shell nativa:

```bash
cd src-tauri
cargo test                       # 18 test (store, schedule, strings)
cargo clippy --all-targets -- -D warnings
cargo fmt --check
```

Build desktop:

```bash
npx tauri build   # Hydrate.app + .dmg (macOS)
```

CI: `.github/workflows/test.yml` — job **test** (frontend: `npm run check`) e job **rust**
(`cargo fmt --check`, `clippy -D warnings`, `cargo test`) a ogni push/PR.

## Struttura

```
src/
  lib/hydrate.js        # dominio puro (goal, finestra, intervallo, streak, reminder, abitudini → piano) — testato
  lib/i18n.js           # dizionario it/en, t(), dateLocale, fmtNum
  lib/notify.js         # gateway notifiche: native (desktop) e PWA (service worker)
  lib/storage.js        # persistenza localStorage + default
  sw.js                 # service worker PWA (injectManifest)
  App.jsx               # stato, tray, reminder, adattamento intervallo
  pages/                # Home, Stats, Profile
  components/           # Avatar, Bottle, BottomNav, BarChart, Heatmap, Toggle, HabitsForm, Onboarding, Mini
src-tauri/src/
  lib.rs                # shell Tauri: tray, popup, notifiche native, scheduler
  store.rs              # stato su file + impostazioni (incl. abitudini)
  schedule.rs           # calcolo del prossimo promemoria
  strings.rs            # stringhe dello shell (menu, notifica) it/en
assets/                 # sorgente vettoriale dell'icona (icon-source.svg)
```

Icona: il PNG 1024×1024 si genera da `assets/icon-source.svg` (rasterizzazione macOS),
poi `npx tauri icon <png>` rigenera tutti i set in `src-tauri/icons/`.

## Release

- Tag su `main`, numerato dall'ultima cifra: `v0.1.0 → v0.1.1 → … → v0.1.100`, poi `v0.2.0`.
- Le release GitHub caricano il DMG generato da `npx tauri build`.
- `main` è protetto da un **ruleset** (CI verde + strict, niente force-push, niente cancellazioni).
