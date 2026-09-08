use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use base64::Engine;
use serde::Deserialize;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PortfolioFile {
    relative_path: String,
    content_base64: Option<String>,
    delete: Option<bool>,
}

fn assert_safe_relative(path: &str) -> Result<(), String> {
    let normalized = path.replace('\\', "/");
    if normalized.starts_with('/') || normalized.contains(':') {
        return Err("Path must be relative.".into());
    }
    if !normalized.starts_with("public/content/") {
        return Err("Files can only be written under public/content/.".into());
    }
    for part in normalized.split('/') {
        if part.is_empty() || part == "." || part == ".." {
            return Err("Invalid path.".into());
        }
        if !part
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '-' || c == '_')
        {
            return Err(format!("Invalid path segment: {part}"));
        }
    }
    Ok(())
}

fn resolve_inside(root: &str, relative: &str) -> Result<PathBuf, String> {
    assert_safe_relative(relative)?;
    let root = Path::new(root);
    if !root.is_dir() {
        return Err("The selected portfolio folder does not exist.".into());
    }
    let target = relative.split('/').fold(root.to_path_buf(), |acc, part| acc.join(part));
    Ok(target)
}

fn looks_like_portfolio(dir: &Path) -> bool {
    let text = match fs::read_to_string(dir.join("package.json")) {
        Ok(value) => value,
        Err(_) => return false,
    };
    text.contains("\"name\": \"memory-card-portfolio\"")
        || text.contains("\"name\":\"memory-card-portfolio\"")
}

fn search_portfolio_from(start: PathBuf) -> Option<PathBuf> {
    let mut current = Some(start);
    while let Some(dir) = current {
        if looks_like_portfolio(&dir) {
            return Some(dir);
        }
        current = dir.parent().map(Path::to_path_buf);
    }
    None
}

#[tauri::command]
fn resolve_portfolio_root() -> Result<String, String> {
    let mut starts = Vec::new();
    if let Ok(cwd) = std::env::current_dir() {
        starts.push(cwd);
    }
    if let Some(manifest) = option_env!("CARGO_MANIFEST_DIR") {
        starts.push(PathBuf::from(manifest));
    }
    for start in starts {
        if let Some(found) = search_portfolio_from(start) {
            return Ok(found.to_string_lossy().into_owned());
        }
    }
    Err("Could not find the Memory System folder on this computer.".into())
}

#[tauri::command]
fn write_portfolio_files(root: String, files: Vec<PortfolioFile>) -> Result<Vec<String>, String> {
    let mut written = Vec::new();
    for file in files {
        let target = resolve_inside(&root, &file.relative_path)?;
        if file.delete.unwrap_or(false) {
            if target.exists() {
                fs::remove_file(&target).map_err(|e| e.to_string())?;
            }
            written.push(format!("deleted {}", file.relative_path));
            continue;
        }
        let encoded = file
            .content_base64
            .ok_or_else(|| format!("Missing content for {}", file.relative_path))?;
        let bytes = BASE64.decode(encoded.trim()).map_err(|e| e.to_string())?;
        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        fs::write(&target, bytes).map_err(|e| e.to_string())?;
        written.push(file.relative_path);
    }
    Ok(written)
}

#[tauri::command]
fn read_portfolio_file(root: String, relative_path: String) -> Result<String, String> {
    let target = resolve_inside(&root, &relative_path)?;
    fs::read_to_string(target).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_portfolio_media(root: String) -> Result<Vec<String>, String> {
    let folder = resolve_inside(&root, "public/content/media")?;
    if !folder.exists() {
        return Ok(Vec::new());
    }
    let mut names = Vec::new();
    for entry in fs::read_dir(folder).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if entry.file_type().map(|kind| kind.is_file()).unwrap_or(false) {
            if let Some(name) = entry.file_name().to_str() {
                if name.starts_with('.') {
                    continue;
                }
                names.push(name.to_string());
            }
        }
    }
    names.sort();
    Ok(names)
}

fn npm_build(root: &str) -> Result<String, String> {
    if !Path::new(root).join("package.json").exists() {
        return Err("That folder does not look like the portfolio (package.json missing).".into());
    }
    let mut command = if cfg!(windows) {
        Command::new("npm.cmd")
    } else {
        Command::new("npm")
    };
    command.args(["run", "build"]).current_dir(root);
    #[cfg(windows)]
    {
        command.creation_flags(CREATE_NO_WINDOW);
    }
    let output = command.output().map_err(|e| {
        format!("Could not run npm run build. Is Node.js on PATH? {e}")
    })?;
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let combined = format!("{stdout}{stderr}");
    if !output.status.success() {
        return Err(if combined.trim().is_empty() {
            "npm run build failed.".into()
        } else {
            combined
        });
    }
    Ok(combined)
}

#[tauri::command]
async fn run_portfolio_build(root: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || npm_build(&root))
        .await
        .map_err(|e| e.to_string())?
}

const BASE64: base64::engine::GeneralPurpose = base64::engine::general_purpose::STANDARD;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            write_portfolio_files,
            read_portfolio_file,
            list_portfolio_media,
            run_portfolio_build,
            resolve_portfolio_root
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
