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
  'home.next': { it: 'prossimo bicchiere {when}', en: 'next glass {when}' },

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
  'profile.habits': { it: 'Le tue abitudini', en: 'Your habits' },
  'profile.habits.hint': {
    it: 'Due domande e siamo noi a decidere quando farti bere.',
    en: 'A few questions and we decide when to remind you.'
  },
  'prof.h.wake': { it: 'Mi sveglio', en: 'I wake up' },
  'prof.h.sleep': { it: 'Vado a dormire', en: 'I go to bed' },
  'prof.h.meals': { it: 'Pasti', en: 'Meals' },
  'prof.h.breakfast': { it: 'Colazione', en: 'Breakfast' },
  'prof.h.lunch': { it: 'Pranzo', en: 'Lunch' },
  'prof.h.dinner': { it: 'Cena', en: 'Dinner' },
  'prof.h.workout': { it: 'Attività fisica', en: 'Exercise' },
  'prof.h.workout.time': { it: 'A che ora', en: 'What time' },
  'prof.h.workout.none': { it: 'Nessuna', en: 'None' },
  'prof.h.workout.light': { it: 'Leggera', en: 'Light' },
  'prof.h.workout.intense': { it: 'Intensa', en: 'Intense' },
  'prof.h.coffee': { it: 'Caffè al giorno', en: 'Coffees a day' },
  'prof.h.alcohol': { it: 'Bevo alcol', en: 'I drink alcohol' },
  'prof.h.dayType': { it: 'Tipo di giornata', en: 'Kind of day' },
  'prof.h.day.office': { it: 'Ufficio', en: 'Office' },
  'prof.h.day.home': { it: 'Casa', en: 'Home' },
  'prof.h.day.outdoor': { it: 'Fuori', en: 'Outdoors' },
  'profile.plan': { it: 'Il tuo piano', en: 'Your plan' },
  'prof.plan.window': { it: 'Ti ricordiamo dalle {s} alle {e}', en: 'We remind you from {s} to {e}' },
  'prof.plan.every': { it: 'Un bicchiere ogni {n} minuti', en: 'A glass every {n} minutes' },
  'prof.plan.glasses': {
    it: '≈ {n} bicchieri nella giornata, calcolati sulle tue abitudini.',
    en: '≈ {n} glasses a day, derived from your habits.'
  },
  'prof.when.habits': {
    it: 'Seguono le tue abitudini: dalle {s} alle {e}.',
    en: 'Following your habits: from {s} to {e}.'
  },
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
  'profile.act.sedentary': { it: 'sedentario', en: 'sedentary' },
  'profile.act.moderate': { it: 'moderato', en: 'moderate' },
  'profile.act.active': { it: 'sportivo', en: 'active' },
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
    it: 'Hydrate {v} — gratis, senza account, senza ads.',
    en: 'Hydrate {v} — free, no account, no ads.'
  },

  'onb.title': { it: 'Benvenuto in Hydrate', en: 'Welcome to Hydrate' },
  'onb.sub': {
    it: 'Dicci come vive la tua giornata: pensiamo noi a quando farti bere.',
    en: 'Tell us about your day: we will figure out when to remind you.'
  },
  'onb.start': { it: 'Inizia', en: 'Get started' },
  'onb.skip': { it: 'Salta, usa i valori di base', en: 'Skip, use defaults' },

  'mini.close': { it: 'Chiudi', en: 'Close' },

  'notify.title.default': { it: 'Hydrate', en: 'Hydrate' },
  'notify.title.named': { it: '{name}, bevi 💧', en: '{name}, drink up 💧' },
  'notify.body.named': {
    it: 'È l’ora di un bicchiere. Confermalo nella finestrella appena apparsa.',
    en: 'Time for a glass. Confirm it in the little window.'
  },
  'notify.body.plain': {
    it: 'È l’ora di un bicchiere 💧 Confermalo nella finestrella appena apparsa.',
    en: 'Time for a glass 💧 Confirm it in the little window.'
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

export function fmtCountdown(ms) {
  if (ms == null) return null
  const en = LOCALE === 'en'
  if (ms <= 0) return en ? 'now' : 'adesso'
  const m = Math.max(1, Math.round(ms / 60000))
  if (m < 60) return en ? `in ${m} min` : `tra ${m} min`
  const h = Math.floor(m / 60)
  const mm = m % 60
  const part = mm ? `${h}h ${String(mm).padStart(2, '0')}m` : `${h}h`
  return `${en ? 'in' : 'tra'} ${part}`
}