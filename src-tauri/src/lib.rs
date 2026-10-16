use std::sync::Mutex;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use tauri::{
  menu::{Menu, MenuItem, PredefinedMenuItem},
  tray::TrayIconBuilder,
  AppHandle, Emitter, Manager, State,
};

mod schedule;
mod store;
mod strings;

use schedule::{compose_title, next_delay, ScheduleCfg};
use store::{state_path, AppState, SharedStore, Store};
use strings::{is_en, notify_texts, tray_alldone, tray_drink, tray_notif, tray_time, tray_today};

const TICK_SECS: u64 = 20;
const SNOOZE_MIN: u32 = 15;

fn now_ms() -> i64 {
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .map(|d| d.as_millis() as i64)
    .unwrap_or(0)
}

pub struct TrayMeta {
  notify_text: String,
}

pub struct TrayState {
  tray: tauri::tray::TrayIcon,
  today_item: MenuItem<tauri::Wry>,
  time_item: MenuItem<tauri::Wry>,
  notify_item: MenuItem<tauri::Wry>,
  drink_item: MenuItem<tauri::Wry>,
  meta: Mutex<TrayMeta>,
}

fn send_notification(app: &AppHandle, title: &str, body: &str) -> Result<(), String> {
  #[cfg(target_os = "macos")]
  {
    use mac_notification_sys::Notification;
    let _ = mac_notification_sys::set_application(app.config().identifier.as_str());
    let mut n = Notification::new();
    n.title(title).message(body).sound("Ping");
    match n.send() {
      Ok(_) => Ok(()),
      Err(e) => Err(format!("{e:?}")),
    }
  }
  #[cfg(not(target_os = "macos"))]
  {
    let _ = (app, title, body);
    Err("notifiche native non supportate su questa piattaforma".into())
  }
}

fn show_mini(app: &AppHandle) -> Result<(), String> {
  if let Some(window) = app.get_webview_window("mini") {
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
  }
  Ok(())
}

fn drink_now(app: &AppHandle, event: &str) -> Result<(), String> {
  let ml;
  {
    let store = app.state::<SharedStore>();
    let mut s = store.0.lock().map_err(|e| e.to_string())?;
    ml = s.glass_ml();
    s.append_entry(ml, now_ms());
  }
  app.emit(event, ()).map_err(|e| e.to_string())?;
  refresh_tray(app);
  Ok(())
}

fn refresh_tray(app: &AppHandle) {
  let Some(tray) = app.try_state::<TrayState>() else {
    return;
  };
  let now = now_ms();
  let (title, today, time, notify, drink);
  {
    let store = app.state::<SharedStore>();
    let Ok(s) = store.0.lock() else {
      return;
    };
    let total = s.state.total_today(now);
    let goal = s.goal_ml();
    let pct = ((total as f64 / goal as f64) * 100.0).round().clamp(0.0, 100.0) as u32;
    let goal_met = total >= goal;
    let en = is_en(&s.state.lang);
    let ml_left = goal.saturating_sub(total);
    let notify_status = tray
      .meta
      .lock()
      .map(|m| m.notify_text.clone())
      .unwrap_or_else(|_| "—".into());
    title = compose_title(pct, goal_met, s.next_fire_at, s.fired_unconfirmed, now, en);
    today = if goal_met {
      tray_alldone(en).to_string()
    } else {
      tray_today(pct, ml_left, en)
    };
    time = tray_time(now, s.state.settings.start_hour, s.state.settings.end_hour, en);
    notify = tray_notif(&notify_status, en);
    drink = tray_drink(en, s.fired_unconfirmed);
  }
  let _ = tray
    .tray
    .set_title(if title.is_empty() { None } else { Some(title) });
  let _ = tray.today_item.set_text(today);
  let _ = tray.time_item.set_text(time);
  let _ = tray.notify_item.set_text(notify);
  let _ = tray.drink_item.set_text(drink);
}

fn scheduler_tick(app: &AppHandle) {
  let now = now_ms();
  let mut fire: Option<(String, String)> = None;
  {
    let store = app.state::<SharedStore>();
    let Ok(mut s) = store.0.lock() else {
      return;
    };
    let cfg = ScheduleCfg {
      enabled: s.state.settings.enabled,
      interval_min: s.state.settings.interval_min,
      start_hour: s.state.settings.start_hour,
      end_hour: s.state.settings.end_hour,
      last_log_ts: s.state.last_log_ts(),
      last_reminder_ts: s.last_reminder_ts,
      goal_met: s.state.total_today(now) >= s.goal_ml(),
    };
    let delay = next_delay(&cfg, now);
    s.next_fire_at = delay.map(|d| now + d);
    if delay == Some(0) {
      s.last_reminder_ts = now;
      s.fired_unconfirmed = true;
      let after = ScheduleCfg {
        last_reminder_ts: now,
        ..cfg
      };
      s.next_fire_at = next_delay(&after, now).map(|d| now + d);
      let en = is_en(&s.state.lang);
      fire = Some(notify_texts(&s.state.name, en));
    }
  }
  if let Some((title, body)) = fire {
    let _ = send_notification(app, &title, &body);
    let _ = show_mini(app);
    let _ = app.emit("reminder:due", ());
  }
  refresh_tray(app);
}

#[tauri::command]
fn tray_update(state: State<'_, TrayState>, notify: String) -> Result<(), String> {
  {
    let mut meta = state.meta.lock().map_err(|e| e.to_string())?;
    meta.notify_text = notify;
  }
  let app = state.tray.app_handle();
  refresh_tray(app);
  Ok(())
}

#[tauri::command]
fn mini_action(app: AppHandle, action: String) -> Result<(), String> {
  if let Some(window) = app.get_webview_window("mini") {
    let _ = window.hide();
  }
  match action.as_str() {
    "drink" => drink_now(&app, "mini:drink"),
    "later" => {
      {
        let store = app.state::<SharedStore>();
        let Ok(mut s) = store.0.lock() else {
          return Ok(());
        };
        let interval = s.state.settings.interval_min;
        s.last_reminder_ts = now_ms() - (interval.saturating_sub(SNOOZE_MIN) as i64) * 60_000;
        s.fired_unconfirmed = false;
      }
      app.emit("mini:later", ()).map_err(|e| e.to_string())?;
      refresh_tray(&app);
      Ok(())
    }
    _ => Ok(()),
  }
}

#[tauri::command]
fn state_load(app: AppHandle) -> AppState {
  let store = app.state::<SharedStore>();
  store
    .0
    .lock()
    .map(|s| s.state.clone())
    .unwrap_or_default()
}

#[tauri::command]
fn state_save(app: AppHandle, state: AppState) -> Result<(), String> {
  {
    let store = app.state::<SharedStore>();
    let mut s = store.0.lock().map_err(|e| e.to_string())?;
    s.save(state);
  }
  refresh_tray(&app);
  Ok(())
}

#[tauri::command]
fn state_reset(app: AppHandle) -> AppState {
  let store = app.state::<SharedStore>();
  let result = store
    .0
    .lock()
    .map(|mut s| {
      s.reset();
      s.state.clone()
    })
    .unwrap_or_default();
  refresh_tray(&app);
  result
}

#[tauri::command]
fn state_is_default(app: AppHandle) -> bool {
  let store = app.state::<SharedStore>();
  store.0.lock().map(|s| s.is_empty()).unwrap_or(true)
}

#[tauri::command]
fn schedule_sync_goal(app: AppHandle, goal_ml: u32) {
  if let Ok(mut s) = app.state::<SharedStore>().0.lock() {
    s.goal_ml = goal_ml;
  }
}

#[tauri::command]
fn schedule_next_at(app: AppHandle) -> Option<i64> {
  app
    .state::<SharedStore>()
    .0
    .lock()
    .ok()
    .and_then(|s| s.next_fire_at)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_notification::init())
    .invoke_handler(tauri::generate_handler![
      tray_update,
      mini_action,
      state_load,
      state_save,
      state_reset,
      state_is_default,
      schedule_sync_goal,
      schedule_next_at
    ])
    .setup(|app| {
      app.handle()
        .set_activation_policy(tauri::ActivationPolicy::Accessory)?;

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      let data_dir = app.path().app_data_dir()?;
      std::fs::create_dir_all(&data_dir).ok();
      let store = Store::load(&state_path(&data_dir));
      app.manage(SharedStore(Mutex::new(store)));

      let today_item = MenuItem::with_id(app, "status-today", "Oggi: —", false, None::<&str>)?;
      let time_item = MenuItem::with_id(app, "status-time", "La giornata: —", false, None::<&str>)?;
      let notify_item = MenuItem::with_id(app, "status-notify", "Notifiche: —", false, None::<&str>)?;
      let separator = PredefinedMenuItem::separator(app)?;
      let drink_i = MenuItem::with_id(app, "drink", "Bevi un bicchiere 💧", true, None::<&str>)?;
      let test_i = MenuItem::with_id(app, "test-notif", "Prova notifica", true, None::<&str>)?;
      let open_i = MenuItem::with_id(app, "open", "Apri Hydrate", true, None::<&str>)?;
      let quit_i = MenuItem::with_id(app, "quit", "Esci", true, None::<&str>)?;
      let menu = Menu::with_items(
        app,
        &[
          &today_item,
          &time_item,
          &notify_item,
          &separator,
          &drink_i,
          &test_i,
          &open_i,
          &quit_i,
        ],
      )?;

      let tray = TrayIconBuilder::with_id("hydrate-tray")
        .icon(app.default_window_icon().expect("window icon").clone())
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id.as_ref() {
          "drink" => {
            let _ = drink_now(app, "tray:drink");
          }
          "test-notif" => {
            let _ = send_notification(
              app,
              "Hydrate",
              "Prova notifica — se senti il suono, le notifiche funzionano 💧",
            );
          }
          "open" => {
            if let Some(window) = app.get_webview_window("main") {
              let _ = window.unminimize();
              let _ = window.show();
              let _ = window.set_focus();
            }
          }
          "quit" => app.exit(0),
          _ => {}
        })
        .build(app)?;

      app.manage(TrayState {
        tray: tray.clone(),
        today_item: today_item.clone(),
        time_item: time_item.clone(),
        notify_item: notify_item.clone(),
        drink_item: drink_i.clone(),
        meta: Mutex::new(TrayMeta {
          notify_text: "—".into(),
        }),
      });

      refresh_tray(app.handle());

      let tick_handle = app.handle().clone();
      std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_secs(TICK_SECS));
        scheduler_tick(&tick_handle);
      });

      Ok(())
    })
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    .run(|app, event| {
      if let tauri::RunEvent::WindowEvent {
        event: tauri::WindowEvent::CloseRequested { api, .. },
        ..
      } = event
      {
        api.prevent_close();
        if let Some(window) = app.get_webview_window("main") {
          let _ = window.hide();
        }
      }
    });
}
