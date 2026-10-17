// Fonte unica di verità dello stato su desktop: JSON nell'app data dir.
// Serve anche ai percorsi nativi (bevi dal menu/finestrella, promemoria
// che scattano) che girano mentre il webview è sospeso (issue #16).

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use crate::schedule::{day_key_of, today_key};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
  pub ts: i64,
  pub ml: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
  pub enabled: bool,
  pub interval_min: u32,
  pub start_hour: u32,
  pub end_hour: u32,
  pub auto_window: bool,
  pub auto_interval: bool,
  pub last_adjusted: String,
  pub weight_kg: Option<f64>,
  pub activity: String,
  // Abitudini: forma posseduta dalla UI (JS). Rust non la interpreta, la
  // conserva soltanto — senza questo campo il round-trip la perderebbe.
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub habits: Option<serde_json::Value>,
}

impl Default for Settings {
  fn default() -> Self {
    Self {
      enabled: false,
      interval_min: 60,
      start_hour: 9,
      end_hour: 22,
      auto_window: true,
      auto_interval: true,
      last_adjusted: String::new(),
      weight_kg: None,
      activity: "moderate".into(),
      habits: None,
    }
  }
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AppState {
  pub name: String,
  pub lang: String,
  pub glass_ml: u32,
  pub entries: Vec<Entry>,
  pub settings: Settings,
}

impl Default for AppState {
  fn default() -> Self {
    Self {
      name: String::new(),
      lang: "it".into(),
      glass_ml: 250,
      entries: Vec::new(),
      settings: Settings::default(),
    }
  }
}

impl AppState {
  pub fn total_today(&self, now_ms: i64) -> u32 {
    let k = today_key(now_ms);
    self
      .entries
      .iter()
      .filter(|e| day_key_of(e.ts) == k)
      .map(|e| e.ml)
      .sum()
  }

  pub fn last_log_ts(&self) -> i64 {
    self.entries.iter().map(|e| e.ts).max().unwrap_or(0)
  }
}

pub struct Store {
  path: PathBuf,
  pub state: AppState,
  pub goal_ml: u32,
  pub last_reminder_ts: i64,
  pub next_fire_at: Option<i64>,
  pub fired_unconfirmed: bool,
}

impl Store {
  pub fn load(path: &Path) -> Self {
    let state = fs::read_to_string(path)
      .ok()
      .and_then(|raw| serde_json::from_str::<AppState>(&raw).ok())
      .unwrap_or_default();
    Self {
      path: path.to_path_buf(),
      state,
      goal_ml: 0,
      last_reminder_ts: 0,
      next_fire_at: None,
      fired_unconfirmed: false,
    }
  }

  pub fn persist(&self) {
    if let Ok(raw) = serde_json::to_string_pretty(&self.state) {
      let _ = fs::write(&self.path, raw);
    }
  }

  pub fn save(&mut self, state: AppState) {
    // Un bicchiere in più è una conferma: il promemoria pendente decade.
    // (Il webview scrive qui quando l'utente registra dalla UI.)
    let grew = state.last_log_ts() > self.state.last_log_ts();
    self.state = state;
    if grew {
      self.fired_unconfirmed = false;
    }
    self.persist();
  }

  pub fn append_entry(&mut self, ml: u32, now_ms: i64) {
    self.state.entries.push(Entry { ts: now_ms, ml });
    self.fired_unconfirmed = false;
    self.persist();
  }

  pub fn reset(&mut self) {
    self.state = AppState::default();
    self.goal_ml = 0;
    self.last_reminder_ts = 0;
    self.next_fire_at = None;
    self.fired_unconfirmed = false;
    self.persist();
  }

  pub fn glass_ml(&self) -> u32 {
    if self.state.glass_ml > 0 {
      self.state.glass_ml
    } else {
      250
    }
  }

  pub fn goal_ml(&self) -> u32 {
    if self.goal_ml > 0 { self.goal_ml } else { 2000 }
  }

  pub fn is_empty(&self) -> bool {
    self.state == AppState::default()
  }
}

pub struct SharedStore(pub Mutex<Store>);

pub fn state_path(dir: &Path) -> PathBuf {
  dir.join("hydrate-state.json")
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::time::{SystemTime, UNIX_EPOCH};

  fn tmp_store() -> (Store, PathBuf) {
    let nanos = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .unwrap()
      .as_nanos();
    let dir = std::env::temp_dir().join(format!("hydrate-store-test-{nanos}"));
    fs::create_dir_all(&dir).unwrap();
    let path = state_path(&dir);
    (Store::load(&path), path)
  }

  fn noon_today() -> i64 {
    let now = chrono::Local::now();
    now
      .with_hour(12)
      .unwrap()
      .with_minute(0)
      .unwrap()
      .with_second(0)
      .unwrap()
      .timestamp_millis()
  }

  use chrono::Timelike;

  #[test]
  fn append_persists_and_survives_reload() {
    let (mut store, path) = tmp_store();
    store.append_entry(250, noon_today());
    let reloaded = Store::load(&path);
    assert_eq!(reloaded.state.entries.len(), 1);
    assert_eq!(reloaded.state.entries[0].ml, 250);
    let _ = fs::remove_dir_all(path.parent().unwrap());
  }

  #[test]
  fn total_today_counts_only_local_day() {
    let (mut store, _path) = tmp_store();
    let now = noon_today();
    store.append_entry(250, now - 86_400_000);
    store.append_entry(700, now);
    assert_eq!(store.state.total_today(now), 700);
    assert_eq!(store.state.last_log_ts(), now);
  }

  #[test]
  fn camel_case_roundtrip_matches_js_keys() {
    let (mut store, path) = tmp_store();
    let raw = r#"{"name":"A","lang":"it","glassMl":200,"entries":[{"ts":1,"ml":250}],"settings":{"enabled":true,"intervalMin":45,"startHour":8,"endHour":21,"autoWindow":false,"autoInterval":false,"lastAdjusted":"2026-10-16","weightKg":72.5,"activity":"active"}}"#;
    let parsed: AppState = serde_json::from_str(raw).unwrap();
    store.save(parsed.clone());
    let reloaded = Store::load(&path);
    assert_eq!(reloaded.state, parsed);
    assert_eq!(reloaded.state.settings.interval_min, 45);
    assert_eq!(reloaded.state.settings.weight_kg, Some(72.5));
    let back = serde_json::to_string(&reloaded.state).unwrap();
    assert!(back.contains("glassMl"));
    assert!(back.contains("intervalMin"));
    assert!(back.contains("weightKg"));
    let _ = fs::remove_dir_all(path.parent().unwrap());
  }

  #[test]
  fn habits_roundtrip_survives_without_being_understood() {
    let (mut store, path) = tmp_store();
    let raw = r#"{"name":"A","lang":"it","glassMl":250,"entries":[],"settings":{"enabled":true,"intervalMin":60,"startHour":7,"endHour":22,"autoWindow":false,"autoInterval":false,"lastAdjusted":"","weightKg":72.0,"activity":"moderate","habits":{"wake":"07:00","sleep":"23:00","coffee":3,"alcohol":true,"dayType":"outdoor","meals":{"lunch":"13:00"},"workout":{"type":"intense"}}}}"#;
    let parsed: AppState = serde_json::from_str(raw).unwrap();
    store.save(parsed);
    let reloaded = Store::load(&path);
    let h = reloaded
      .state
      .settings
      .habits
      .as_ref()
      .expect("habits conservate");
    assert_eq!(h["dayType"], "outdoor");
    assert_eq!(h["coffee"], 3);
    assert_eq!(h["workout"]["type"], "intense");
    let back = serde_json::to_string(&reloaded.state).unwrap();
    assert!(back.contains("\"habits\""));
    let _ = fs::remove_dir_all(path.parent().unwrap());
  }

  #[test]
  fn missing_habits_field_still_parses_old_files() {
    let raw = r#"{"name":"","lang":"it","glassMl":250,"entries":[],"settings":{"enabled":false,"intervalMin":60,"startHour":9,"endHour":22,"autoWindow":true,"autoInterval":true,"lastAdjusted":"","weightKg":null,"activity":"moderate"}}"#;
    let parsed: AppState = serde_json::from_str(raw).unwrap();
    assert!(parsed.settings.habits.is_none());
  }

  #[test]
  fn reset_returns_default_and_clears_file() {
    let (mut store, path) = tmp_store();
    store.append_entry(250, noon_today());
    store.reset();
    assert_eq!(store.state, AppState::default());
    assert!(Store::load(&path).state.entries.is_empty());
    let _ = fs::remove_dir_all(path.parent().unwrap());
  }

  #[test]
  fn save_with_new_entry_clears_pending_reminder() {
    let (mut store, _path) = tmp_store();
    let now = noon_today();
    store.fired_unconfirmed = true;
    let mut next = store.state.clone();
    next.entries.push(Entry { ts: now, ml: 250 });
    store.save(next);
    assert!(!store.fired_unconfirmed);
  }

  #[test]
  fn save_settings_only_keeps_pending_reminder() {
    let (mut store, _path) = tmp_store();
    store.fired_unconfirmed = true;
    let mut next = store.state.clone();
    next.settings.interval_min = 45;
    store.save(next);
    assert!(store.fired_unconfirmed);
  }

  #[test]
  fn glass_and_goal_fallbacks() {
    let (mut store, _path) = tmp_store();
    assert_eq!(store.glass_ml(), 250);
    assert_eq!(store.goal_ml(), 2000);
    store.state.glass_ml = 0;
    assert_eq!(store.glass_ml(), 250);
    store.goal_ml = 1800;
    assert_eq!(store.goal_ml(), 1800);
  }
}
