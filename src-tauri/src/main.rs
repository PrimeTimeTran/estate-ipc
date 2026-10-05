use estate::prelude::{
	ipc::{EstateClient, *},
	*,
};
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::UnixStream;

pub mod client;
pub use client::*;

pub mod settings;
pub use settings::*;

fn main() {
	let mode = UiMode::from_args();
	let estate = EstateClient::new();

	let runtime = tokio::runtime::Builder::new_multi_thread()
		.enable_all()
		.build()
		.expect("failed to create Tokio runtime");

	runtime.block_on(async move {
		tauri::Builder::default()
			.manage(estate)
			.setup(move |app| {
				start_estate_event_bridge(app.handle().clone());

				match mode {
					UiMode::Main => create_main_window(app)?,
					UiMode::Settings => create_settings_window(app)?,
					UiMode::Rail => create_rail_window(app)?,
					UiMode::Palette => create_palette_window(app)?,
				}

				Ok(())
			})
			.invoke_handler(tauri::generate_handler![
				settings::tauri_context,
				settings::estate_context,
				settings::estate_command,
				settings::fs_list,
				settings::fs_read,
				settings::fs_create,
				settings::fs_update,
				settings::fs_delete,
			])
			.run(tauri::generate_context!())
			.expect("error while running Tauri application");
	});
}

fn create_main_window(app: &mut tauri::App) -> tauri::Result<()> {
	let monitor = app
		.primary_monitor()?
		.ok_or_else(|| tauri::Error::AssetNotFound("No primary monitor".into()))?;

	let work_area = monitor.work_area();

	let padding = 24.0;

	let width = work_area.size.width as f64 - padding * 2.0;
	let height = work_area.size.height as f64 - padding * 2.0;

	let x = work_area.position.x as f64 + padding;
	let y = work_area.position.y as f64 + padding;

	WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
		.title("Estate")
		.inner_size(width, height)
		.position(x, y)
		.build()?;

	Ok(())
}
fn create_settings_window(app: &mut tauri::App) -> tauri::Result<()> {
	WebviewWindowBuilder::new(app, "settings", WebviewUrl::App("settings.html".into()))
		.title("Estate Settings")
		.build()?;

	Ok(())
}
fn create_rail_window(app: &mut tauri::App) -> tauri::Result<()> {
	let monitor = app
		.primary_monitor()?
		.ok_or_else(|| tauri::Error::AssetNotFound("No primary monitor".into()))?;

	let work_area = monitor.work_area();

	let rail_width = 64.0;
	let rail_height = work_area.size.height as f64;

	let x = work_area.position.x as f64;
	let y = work_area.position.y as f64;

	WebviewWindowBuilder::new(app, "rail", WebviewUrl::App("rail.html".into()))
		.title("Estate")
		.decorations(false)
		.resizable(false)
		.maximizable(false)
		.minimizable(false)
		.closable(false)
		.skip_taskbar(true)
		.always_on_top(true)
		.inner_size(rail_width, rail_height)
		.position(x, y)
		.build()?;

	Ok(())
}
fn create_palette_window(app: &mut tauri::App) -> tauri::Result<()> {
	WebviewWindowBuilder::new(app, "palette", WebviewUrl::App("palette.html".into()))
		.title("Estate Command Palette")
		.decorations(false)
		.resizable(false)
		.build()?;

	Ok(())
}
// fn create_rail(app: &tauri::AppHandle) -> tauri::Result<()> {
// let monitor = app
// .primary_monitor()?
// .ok_or_else(|| tauri::Error::AssetNotFound("No primary monitor".into()))?;
//
// let work_area = monitor.work_area();
//
// let rail_width = 64.0;
// let rail_height = work_area.size.height as f64;
//
// let x = work_area.position.x as f64;
// let y = work_area.position.y as f64;
//
// WebviewWindowBuilder::new(app, "rail", WebviewUrl::App("rail.html".into()))
// .title("Estate")
// .decorations(false)
// .resizable(false)
// .maximizable(false)
// .minimizable(false)
// .closable(false)
// .skip_taskbar(true)
// .always_on_top(true)
// .inner_size(rail_width, rail_height)
// .position(x, y)
// .build()?;
//
// Ok(())
// }
//
#[derive(Debug, Clone, Copy)]
enum UiMode {
	Main,
	Settings,
	Rail,
	Palette,
}

impl UiMode {
	/// Change this to choose the UI launched when no CLI flag is provided.
	const DEFAULT: Self = Self::Main;

	fn from_args() -> Self {
		match std::env::args().nth(1).as_deref() {
			Some("--main") => Self::Main,
			Some("--settings") => Self::Settings,
			Some("--rail") => Self::Rail,
			Some("--palette") => Self::Palette,
			_ => Self::DEFAULT,
		}
	}
}
