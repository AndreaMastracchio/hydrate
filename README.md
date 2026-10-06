# Hydrate 💧

App desktop (macOS) per ricordarti di bere acqua con costanza — dark, minima, senza account.

## Come funziona

- **L'app ti dice quando bere**: ogni N minuti (default 120) una notifica «È l'ora di un bicchiere 💧», mai di notte.
- **Tu rispondi con un tap**: «Bevi un bicchiere 💧» nel menu in alto — registra e riconteggia, anche con la finestra chiusa.
- **L'obiettivo lo calcola lei**: peso × attività × stagione, mediato con la tua realtà degli ultimi 7 giorni. Non lo chiedi, non lo imposti (mai sotto 1.500, mai sopra 4.000 ml).
- **Icona nel menu bar** con accanto `fatti/totali`; nel menu, ml mancanti e ore rimaste alla giornata.
- Tutto in locale (localStorage), nessuna nube, nessuna pubblicità.

## Sviluppo

```bash
npm install
npm test          # 39 test (dominio: goal, streak, reminder)
docker compose up -d   # dev server su http://localhost:5173
npx tauri dev     # finestra desktop
npx tauri build   # Hydrate.app + .dmg
```

Requisiti: Node 22+, Docker, Rust (`rustup`), Xcode Command Line Tools.

## Stack

Vite + React 19 + Tailwind 4 · Tauri 2 (tray, notifiche native) · Vitest.
