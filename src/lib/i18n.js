let LOCALE = 'it'

const dict = {
  'nav.home': { it: 'Home', en: 'Home' },
  'nav.stats': { it: 'Statistiche', en: 'Stats' },
  'nav.profile': { it: 'Profilo', en: 'Profile' },

  'home.ciao': { it: 'Ciao, {name}', en: 'Hi, {name}' },
  'home.streak': { it: '{n} gg', en: '{n}d' },
  'home.pctLabel': { it: 'idratato oggi', en: 'hydrated today' },
  'home.mlOf': { it: '{total} / {goal} ml', en: '{total} / {goal} ml' },
  'home.glassWord': { it: 'bicchieri', en: 'glasses' },
  'home.sip': { it: '+ un bicchiere', en: '+ a glass' },
  'home.undo.aria': { it: 'Annulla l’ultimo bicchiere', en: 'Undo last glass' },
  'home.add.aria': { it: 'Aggiungi un bicchiere', en: 'Add a glass' },
  'home.pill.title': { it: 'È ora di bere!', en: 'Drink time!' },
  'home.pill.body': {
    it: 'Il promemoria è scattato: un sorso adesso.',
    en: 'Your reminder is up: take a sip now.'
  },
  'home.pill.sip': { it: 'Bevi ora un bicchiere', en: 'Drink a glass now' },
  'home.week': { it: 'Ultimi 7 giorni', en: 'Last 7 days' },
  'home.week.goal': { it: 'obiettivo {n} bicchieri', en: 'goal {n} glasses' },

  'stats.title': { it: 'Statistiche', en: 'Statistics' },
  'stats.sub': { it: 'I tuoi numeri, senza fronzoli', en: 'Your numbers, no fluff' },
  'kpi.streak': { it: 'Serie attuale', en: 'Current streak' },
  'kpi.best': { it: 'Serie migliore', en: 'Best streak' },
  'kpi.avg': { it: 'Media 7 giorni', en: '7-day average' },
  'kpi.rate': { it: 'Obiettivi 30 gg', en: '30-day goal rate' },
  'stats.week7': { it: 'Ultimi 7 giorni', en: 'Last 7 days' },
  'stats.week30': { it: 'Ultimi 30 giorni', en: 'Last 30 days' },
  'stats.month': { it: 'Mappa del mese', en: 'Month map' },
  'leg.empty': { it: 'vuoto', en: 'empty' },
  'leg.low': { it: 'sotto', en: 'below' },
  'leg.mid': { it: 'quasi', en: 'almost' },
  'leg.hi': { it: 'goal', en: 'goal' },

  'profile.you': { it: 'Tu', en: 'You' },
  'profile.name': { it: 'Nome', en: 'Name' },
  'profile.name.hint': { it: 'Così ti chiamiamo nelle notifiche.', en: 'So we can call you by name.' },
  'profile.weight': { it: 'Peso (kg)', en: 'Weight (kg)' },
  'profile.weight.hint': { it: 'Da qui calcoliamo quanto bere.', en: 'This drives your target.' },
  'profile.activity': { it: 'Attività', en: 'Activity' },
  'profile.activity.hint': { it: 'Quanto ti muovi di solito?', en: 'How active are you?' },
  'prof.sedentary': { it: 'Poco (scrivania, pc)', en: 'Light (desk, pc)' },
  'prof.moderate': { it: 'Moderato (cammino…)', en: 'Moderate (walking…)' },
  'prof.active': { it: 'Molto (sport, lavoro fisico)', en: 'Heavy (sport, physical work)' },
  'profile.glass': { it: 'Il bicchiere', en: 'The glass' },
  'profile.glass.hint': {
    it: 'Quanto ci metti? È il modo in cui contiamo: «un bicchiere».',
    en: 'How much is a glass for you?'
  },
  'profile.ob': { it: 'Obiettivo automatico', en: 'Automatic goal' },
  'profile.ob.formula': {
    it: 'Il conto: {base} ml ({w} kg × 33 ml) × {act} ×{af} × stagione ×{sf} → {round} ml, {g} bicchieri.',
    en: 'The math: {base} ml ({w} kg × 33 ml) × {act} ×{af} × season ×{sf} → {round} ml, {g} glasses.'
  },
  'profile.ob.hintWeight': {
    it: 'Imposta il peso qui sopra: quel numero è la base del conto.',
    en: 'Set your weight above: it is the base of the math.'
  },
  'profile.ob.balance': {
    it: 'Lo bilanciamo anche con la media dei tuoi ultimi 7 giorni di bevute (mai sotto 1.500, mai sopra 4.000 ml).',
    en: 'We balance it with your last-7-days average (never below 1,500, never above 4,000 ml).'
  },
  'profile.rem': { it: 'Promemoria', en: 'Reminders' },
  'profile.remind': { it: 'Ricordami di bere', en: 'Remind me to drink' },
  'profile.enable': { it: 'Attiva i promemoria', en: 'Turn on reminders' },
  'perm.granted': { it: 'Attive', en: 'On' },
  'perm.default': {
    it: 'Ti chiediamo il permesso al primo avvio.',
    en: 'We will ask for permission.'
  },
  'perm.denied': { it: 'Bloccate: riattiva dalle Impostazioni di sistema', en: 'Blocked: enable in System Settings' },
  'prof.every': { it: 'Ogni {n} minuti', en: 'Every {n} minutes' },
  'prof.every.auto': {
    it: 'Ogni {n} minuti — automatico, segue i tuoi risultati',
    en: 'Every {n} minutes — automatic, follows your results'
  },
  'prof.autoInterval': { it: 'Intervallo automatico', en: 'Automatic interval' },
  'prof.autoInterval.hint': {
    it: 'Se manchi il goal ti ricorda più spesso; se lo centri con margine, rallenta.',
    en: 'Miss your goal and it reminds more often; crush it and it eases off.'
  },
  'prof.autoInterval.toggle': { it: 'Adatta da solo', en: 'Self-adapting' },
  'prof.when': { it: 'Quando ricordarti', en: 'When to remind' },
  'prof.when.auto.on': {
    it: 'In automatico: dalle {s} alle {e}, dalle ore in cui bevi.',
    en: 'Automatic: from {s} to {e}, following your drinking hours.'
  },
  'prof.when.manual': { it: 'Le hai regolate a mano.', en: 'Set manually.' },
  'prof.when.toggle': { it: 'Fascia oraria automatica', en: 'Automatic window' },
  'prof.from': { it: 'Dalle', en: 'From' },
  'prof.to': { it: 'Alle', en: 'To' },
  'prof.b.named': { it: 'Ti chiama per nome nelle notifiche.', en: 'Calls you by name.' },
  'prof.b.stop': { it: 'Si fermano appena raggiungi il goal.', en: 'Stop once you hit the goal.' },
  'prof.b.sip': {
    it: 'L’intervallo riparte dall’ultimo sorso, non da orari fissi.',
    en: 'The countdown restarts from your last sip.'
  },
  'prof.b.sound': { it: 'Con suono discreto, mai di notte, mai pubblicità.', en: 'Discreet sound, never at night.' },
  'prof.b.desktop': {
    it: 'Con l’app desktop girano anche con la finestra chiusa: l’app vive nel menu in alto.',
    en: 'On desktop they work with the window closed: the app lives in the menubar.'
  },
  'prof.b.tap': {
    it: 'La risposta a «bevi» è un tap su «Bevi un bicchiere 💧» nel menu in alto.',
    en: 'Answer with a tap on «Drink a glass 💧» in the menubar.'
  },
  'profile.lang': { it: 'Lingua', en: 'Language' },
  'profile.data': { it: 'Dati', en: 'Data' },
  'profile.reset': { it: 'Cancella tutti i dati', en: 'Delete all data' },
  'profile.reset.confirm': {
    it: 'Cancellare tutti i dati? Non si può tornare indietro.',
    en: 'Delete all your data? This cannot be undone.'
  },
  'profile.footer': {
    it: 'Hydrate v0.1.0 — gratis, senza account, senza ads.',
    en: 'Hydrate v0.1.0 — free, no account, no ads.'
  },

  'notify.title.default': { it: 'Hydrate', en: 'Hydrate' },
  'notify.title.named': { it: '{name}, bevi 💧', en: '{name}, drink up 💧' },
  'notify.body.named': {
    it: 'È l’ora di un bicchiere. Tocca «Bevi un bicchiere 💧» nel menu in alto.',
    en: 'Time for a glass. Tap «Drink a glass 💧» in the menubar.'
  },
  'notify.body.plain': {
    it: 'È l’ora di un bicchiere 💧 Tocca «Bevi un bicchiere» nel menu in alto.',
    en: 'Time for a glass 💧 Tap «Drink a glass» in the menubar.'
  },
  'notify.browser.body': {
    it: 'È l’ora di un bicchiere 💧 Tocca «Ho bevuto» quando lo hai bevuto.',
    en: 'Time for a glass 💧 Tap «I drank» when you drink.'
  },
  'notify.browser.log': { it: 'Ho bevuto', en: 'I drank' },
  'notify.browser.later': { it: 'Più tardi', en: 'Later' },
  'notify.ok': { it: '✓ suono Ping', en: '✓ Ping sound' },
  'notify.off': { it: '—', en: '—' },

  'tray.drink': { it: 'Bevi un bicchiere 💧', en: 'Drink a glass 💧' },
  'tray.now': { it: 'ora!', en: 'now!' },
  'tray.done': { it: '✓ 100%', en: '✓ 100%' },
  'tray.today': { it: 'Oggi {p}% · mancano {m} ml', en: 'Today {p}% · {m} ml to go' },
  'tray.alldone': { it: 'Oggi: obiettivo raggiunto ✓', en: 'Today: goal met ✓' },
  'tray.time.starts': { it: 'La giornata riparte alle {h}:00', en: 'New day at {h}:00' },
  'tray.time.closed': {
    it: 'Giornata chiusa: riparte alle {h}:00',
    en: 'Day done: starts again at {h}:00'
  },
  'tray.time.left': { it: 'Restano {h}h alla giornata (fino alle {e}:00)', en: '{h}h left today (until {e}:00)' },
  'tray.notif': { it: 'Notifiche: {s}', en: 'Notifications: {s}' },

  'bottle.aria': { it: 'Bottiglia piena al {p}%', en: 'Bottle {p}% full' }
}

export function setLocale(l) {
  LOCALE = l === 'en' ? 'en' : 'it'
}

export function getLocale() {
  return LOCALE
}

export function t(key, vars) {
  const entry = dict[key]
  let s = entry ? entry[LOCALE] || entry.it : key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v))
  }
  return s
}

export const dateLocale = () => (LOCALE === 'en' ? 'en-US' : 'it-IT')

export function fmtNum(n) {
  return Number(n).toLocaleString(dateLocale())
}