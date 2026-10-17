// Port di src/lib/hydrate.js#nextReminderDelay + i18n.js#fmtCountdown:
// il cervello dei promemoria vive qui perché il webview viene sospeso
// da WebKit quando la finestra è nascosta (issue #16).

use chrono::{Datelike, Days, Local, TimeZone, Timelike};

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ScheduleCfg {
  pub enabled: bool,
  pub interval_min: u32,
  pub start_hour: u32,
  pub end_hour: u32,
  pub last_log_ts: i64,
  pub last_reminder_ts: i64,
  pub goal_met: bool,
}

const HOUR_MS: i64 = 3_600_000;
const MIN_MS: i64 = 60_000;

fn local_from_ms(ms: i64) -> chrono::DateTime<Local> {
  Local
    .timestamp_millis_opt(ms)
    .single()
    .unwrap_or_else(|| Local.timestamp_opt(0, 0).unwrap())
}

fn start_of_day_hour(ms: i64, hour: u32) -> i64 {
  let d = local_from_ms(ms);
  let naive = d.date_naive().and_hms_opt(hour, 0, 0).unwrap();
  match Local.from_local_datetime(&naive) {
    chrono::LocalResult::Single(dt) => dt.timestamp_millis(),
    chrono::LocalResult::Ambiguous(dt, _) => dt.timestamp_millis(),
    chrono::LocalResult::None => {
      let naive = d.date_naive().and_hms_opt(12, 0, 0).unwrap();
      Local
        .from_local_datetime(&naive)
        .earliest()
        .map(|dt| dt.timestamp_millis())
        .unwrap_or(ms)
    }
  }
}

fn hour_of(ms: i64) -> u32 {
  local_from_ms(ms).hour()
}

pub fn next_delay(cfg: &ScheduleCfg, now_ms: i64) -> Option<i64> {
  if !cfg.enabled || cfg.goal_met || cfg.interval_min == 0 {
    return None;
  }
  let anchor = cfg.last_log_ts.max(cfg.last_reminder_ts).min(now_ms);
  let mut target = if anchor > 0 {
    let t = anchor + cfg.interval_min as i64 * MIN_MS;
    if t <= now_ms { now_ms } else { t }
  } else {
    start_of_day_hour(now_ms, cfg.start_hour).max(now_ms)
  };
  let h = hour_of(target);
  if h < cfg.start_hour {
    target = start_of_day_hour(now_ms, cfg.start_hour);
  } else if h >= cfg.end_hour {
    let tomorrow = local_from_ms(now_ms).date_naive() + Days::new(1);
    let naive = tomorrow.and_hms_opt(cfg.start_hour, 0, 0).unwrap();
    target = match Local.from_local_datetime(&naive) {
      chrono::LocalResult::Single(dt) => dt.timestamp_millis(),
      chrono::LocalResult::Ambiguous(dt, _) => dt.timestamp_millis(),
      chrono::LocalResult::None => start_of_day_hour(now_ms, cfg.start_hour) + 24 * HOUR_MS,
    };
  }
  Some((target - now_ms).max(0))
}

pub fn day_bounds_ms(now_ms: i64, start_hour: u32, end_hour: u32) -> (i64, i64) {
  (
    start_of_day_hour(now_ms, start_hour),
    start_of_day_hour(now_ms, end_hour),
  )
}

pub fn fmt_countdown(ms: i64, en: bool) -> String {
  if ms <= 0 {
    return if en { "now".into() } else { "adesso".into() };
  }
  let m = ((ms + MIN_MS / 2) / MIN_MS).max(1);
  if m < 60 {
    return if en {
      format!("in {m} min")
    } else {
      format!("tra {m} min")
    };
  }
  let h = m / 60;
  let mm = m % 60;
  let part = if mm > 0 {
    format!("{h}h {mm:02}m")
  } else {
    format!("{h}h")
  };
  if en {
    format!("in {part}")
  } else {
    format!("tra {part}")
  }
}

pub fn compose_title(
  pct: u32,
  goal_met: bool,
  next_fire_at: Option<i64>,
  due: bool,
  now_ms: i64,
  en: bool,
) -> String {
  if goal_met {
    return "✓ 100%".into();
  }
  let countdown = if due {
    Some(if en { "now" } else { "adesso" }.to_string())
  } else {
    next_fire_at.map(|at| fmt_countdown((at - now_ms).max(0), en))
  };
  match countdown {
    Some(c) => format!("⏳ {c} {pct}%"),
    None => format!("{pct}%"),
  }
}

pub fn today_key(ms: i64) -> String {
  let d = local_from_ms(ms);
  format!(
    "{:04}-{:02}-{:02}",
    d.year(),
    d.month(),
    d.day()
  )
}

pub fn day_key_of(ts: i64) -> String {
  today_key(ts)
}

#[cfg(test)]
mod tests {
  use super::*;

  const W: ScheduleCfg = ScheduleCfg {
    enabled: true,
    interval_min: 60,
    start_hour: 9,
    end_hour: 22,
    last_log_ts: 0,
    last_reminder_ts: 0,
    goal_met: false,
  };
  const H: i64 = HOUR_MS;

  fn at(h: u32, min: u32) -> i64 {
    Local
      .with_ymd_and_hms(2026, 3, 5, h, min, 0)
      .unwrap()
      .timestamp_millis()
  }

  #[test]
  fn disabled_goal_or_bad_interval_gives_none() {
    assert_eq!(next_delay(&ScheduleCfg { enabled: false, ..W }, at(10, 0)), None);
    assert_eq!(next_delay(&ScheduleCfg { goal_met: true, ..W }, at(10, 0)), None);
    assert_eq!(next_delay(&ScheduleCfg { interval_min: 0, ..W }, at(10, 0)), None);
  }

  #[test]
  fn no_history_first_fire_at_window_open_or_now_inside() {
    assert_eq!(next_delay(&W, at(7, 0)), Some(2 * H));
    assert_eq!(next_delay(&W, at(10, 0)), Some(0));
  }

  #[test]
  fn interval_counts_from_last_log() {
    let last = at(10, 0);
    let cfg = ScheduleCfg { last_log_ts: last, ..W };
    assert_eq!(next_delay(&cfg, at(10, 30)), Some(30 * MIN_MS));
    assert_eq!(next_delay(&cfg, at(12, 30)), Some(0));
  }

  #[test]
  fn recent_log_pushes_forward() {
    let d = next_delay(&ScheduleCfg { last_log_ts: at(10, 0), ..W }, at(10, 30));
    let d2 = next_delay(&ScheduleCfg { last_log_ts: at(10, 30), ..W }, at(10, 30));
    assert_eq!(d, Some(30 * MIN_MS));
    assert_eq!(d2, Some(60 * MIN_MS));
  }

  #[test]
  fn outside_window_waits_for_open_never_night() {
    let cfg = ScheduleCfg { last_log_ts: at(10, 0), ..W };
    assert_eq!(next_delay(&cfg, at(23, 30)), Some(9 * H + H / 2));
    assert_eq!(next_delay(&cfg, at(7, 0)), Some(2 * H));
  }

  #[test]
  fn fmt_countdown_shapes() {
    assert_eq!(fmt_countdown(0, false), "adesso");
    assert_eq!(fmt_countdown(0, true), "now");
    assert_eq!(fmt_countdown(30 * MIN_MS, false), "tra 30 min");
    assert_eq!(fmt_countdown(30 * MIN_MS, true), "in 30 min");
    assert_eq!(fmt_countdown(30_000, false), "tra 1 min");
    assert_eq!(fmt_countdown(90_000, false), "tra 2 min");
    assert_eq!(fmt_countdown(59 * MIN_MS + 40_000, false), "tra 1h");
    assert_eq!(fmt_countdown(60 * MIN_MS, false), "tra 1h");
    assert_eq!(fmt_countdown(90 * MIN_MS, false), "tra 1h 30m");
    assert_eq!(fmt_countdown(90 * MIN_MS, true), "in 1h 30m");
  }

  #[test]
  fn compose_title_cases() {
    let now = at(10, 0);
    assert_eq!(compose_title(50, true, None, false, now, false), "✓ 100%");
    assert_eq!(compose_title(50, false, Some(now + 30 * MIN_MS), false, now, false), "⏳ tra 30 min 50%");
    assert_eq!(compose_title(50, false, Some(now + 30 * MIN_MS), false, now, true), "⏳ in 30 min 50%");
    assert_eq!(compose_title(50, false, None, true, now, false), "⏳ adesso 50%");
    assert_eq!(compose_title(50, false, None, false, now, false), "50%");
  }
}
