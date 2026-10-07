use tauri::{
  menu::{Menu, MenuItem, PredefinedMenuItem},
  tray::TrayIconBuilder,
  Emitter, Manager, State,
};

pub struct TrayState {
  tray: tauri::tray::TrayIcon,
  today_item: MenuItem<tauri::Wry>,
  time_item: MenuItem<tauri::Wry>,
  notify_item: MenuItem<tauri::Wry>,
  drink_item: MenuItem<tauri::Wry>,
}

#[tauri::command]
fn tray_update(
  state: State<TrayState>,
  title: String,
  today: String,
  time: String,
  notify: String,
  drink: String,
) -> Result<(), String> {
  state
    .tray
    .set_title(if title.is_empty() { None } else { Some(title) })
    .map_err(|e| e.to_string())?;
  state.today_item.set_text(today).map_err(|e| e.to_string())?;
  state.time_item.set_text(time).map_err(|e| e.to_string())?;
  state.notify_item.set_text(notify).map_err(|e| e.to_string())?;
  state.drink_item.set_text(drink).map_err(|e| e.to_string())?;
  Ok(())
}

#[tauri::command]
fn native_notify(
  app: tauri::AppHandle,
  title: String,
  body: String,
) -> Result<(), String> {
  #[cfg(target_os = "macos")]
  {
    use mac_notification_sys::Notification;
    let _ = mac_notification_sys::set_application(app.config().identifier.as_str());
    let mut n = Notification::new();
    n.title(&title).message(&body).sound("Ping");
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_notification::init())
    .invoke_handler(tauri::generate_handler![tray_update, native_notify])
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
            if let Some(window) = app.get_webview_window("main") {
              let _ = window.emit("tray:drink", ());
            }
          }
          "test-notif" => {
            #[cfg(target_os = "macos")]
            {
              use mac_notification_sys::Notification;
              let _ = mac_notification_sys::set_application(app.config().identifier.as_str());
              let mut n = Notification::new();
              n.title("Hydrate")
                .message("Prova notifica — se senti il suono, le notifiche funzionano 💧")
                .sound("Ping");
              let _ = n.send();
            }
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
