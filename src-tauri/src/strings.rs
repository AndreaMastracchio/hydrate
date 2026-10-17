// Dizionario specchio di src/lib/i18n.js — solo le stringhe che servono ai
// percorsi nativi (tray e notifiche) che girano col webview sospeso.
// Fonte di verità delle traduzioni: i18n.js; qui si duplicano perché il
// cervello nativo non può dipendere dalla UI. Tenere in sync.

pub fn is_en(lang: &str) -> bool {
  lang == "en"
}

fn fmt(s: &str, vars: &[(&str, String)]) -> String {
  let mut out = s.to_string();
  for (k, v) in vars {
    out = out.replace(&format!("{{{k}}}"), v);
  }
  out
}

pub fn tray_today(pct: u32, ml_left: u32, en: bool) -> String {
  let tpl = if en {
    "Today {p}% · {m} ml to go"
  } else {
    "Oggi {p}% · mancano {m} ml"
  };
  fmt(
    tpl,
    &[
      ("p", pct.to_string()),
      ("m", ml_left.to_string()),
    ],
  )
}

pub fn tray_alldone(en: bool) -> &'static str {
  if en {
    "Today: goal met ✓"
  } else {
    "Oggi: obiettivo raggiunto ✓"
  }
}

pub fn tray_time(now_ms: i64, start_hour: u32, end_hour: u32, en: bool) -> String {
  let (start, end) = crate::schedule::day_bounds_ms(now_ms, start_hour, end_hour);
  if now_ms < start {
    fmt(
      if en {
        "New day at {h}:00"
      } else {
        "La giornata riparte alle {h}:00"
      },
      &[("h", start_hour.to_string())],
    )
  } else if now_ms >= end {
    fmt(
      if en {
        "Day done: starts again at {h}:00"
      } else {
        "Giornata chiusa: riparte alle {h}:00"
      },
      &[("h", start_hour.to_string())],
    )
  } else {
    let h_left = (((end - now_ms) as f64 / 3_600_000.0).round() as u32).max(1);
    fmt(
      if en {
        "{h}h left today (until {e}:00)"
      } else {
        "Restano {h}h alla giornata (fino alle {e}:00)"
      },
      &[
        ("h", h_left.to_string()),
        ("e", end_hour.to_string()),
      ],
    )
  }
}

pub fn tray_drink(en: bool, due: bool) -> String {
  let base = if en {
    "Drink a glass 💧"
  } else {
    "Bevi un bicchiere 💧"
  };
  if due {
    let now = if en { "now!" } else { "ora!" };
    format!("{base} — {now}")
  } else {
    base.to_string()
  }
}

pub fn tray_notif(status: &str, en: bool) -> String {
  fmt(
    if en {
      "Notifications: {s}"
    } else {
      "Notifiche: {s}"
    },
    &[("s", status.to_string())],
  )
}

pub fn tray_snooze(en: bool) -> &'static str {
  if en {
    "Snooze 15 min"
  } else {
    "Rimanda 15 min"
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn today_and_time_strings() {
    assert_eq!(tray_today(50, 1000, false), "Oggi 50% · mancano 1000 ml");
    assert_eq!(tray_today(50, 1000, true), "Today 50% · 1000 ml to go");
    assert_eq!(tray_alldone(false), "Oggi: obiettivo raggiunto ✓");
    assert_eq!(tray_drink(false, false), "Bevi un bicchiere 💧");
    assert_eq!(tray_drink(false, true), "Bevi un bicchiere 💧 — ora!");
    assert_eq!(tray_drink(true, true), "Drink a glass 💧 — now!");
  }
}
