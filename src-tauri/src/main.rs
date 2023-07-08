// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

extern crate reqwest;
extern crate json;

use std::time::Duration;
use std::path::Path;

use reqwest::header::{AUTHORIZATION, ACCEPT};
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};
use reqwest::{multipart, Body};
use tokio::fs::File;
use tokio_util::codec::{BytesCodec, FramedRead};
use mime_guess::from_path;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
async fn get_meta_from_url(url: &str) -> Result<String, String> {
    println!("{:?}", url);

    let client = reqwest::Client::builder().timeout(Duration::new(5, 0)).build().map_err(|e| e.to_string())?;

    let res = client.get(url).send().await;

    let ret = match res {
        Ok(body) => {
            let res2 = body.text().await.map_err(|e| e.to_string()).into();
            let ret2 = match res2 {
                Ok(body) => Ok(body.into()),
                Err(error) => Err(error.into())
            };
            return ret2;
        },
        Err(error) => Err(error.to_string())
    };

    ret
}

#[tauri::command]
async fn upload_rev(path: &str, key: &str) -> Result<String, String> {
    println!("{} {}", path, key);

    let path_obj = Path::new(path);
    let filename_option = path_obj.file_name().unwrap().to_str();
    let mime_type_option = from_path(path).first();

    if !mime_type_option.is_some() || !filename_option.is_some() {
        return Err("file path error".to_string());
    };

    let filename = filename_option.unwrap().to_string();
    let mime_type = mime_type_option.unwrap();
    let mime_str = mime_type.essence_str();

    let file = File::open(path).await.map_err(|e| e.to_string())?;
    let stream = FramedRead::new(file, BytesCodec::new());
    let file_body = Body::wrap_stream(stream);

    let file_part = multipart::Part::stream(file_body)
        .file_name(filename) // temporary
        .mime_str(mime_str) // temporary
        .map_err(|e| e.to_string())?;

    let form = multipart::Form::new()
        .part("media", file_part);

    println!("{:?}", form);

    let client = reqwest::Client::new();

    let res = client
        .post("https://api.rev.ai/speechtotext/v1/jobs")
        .multipart(form)
        .header(AUTHORIZATION, format!("Bearer {}", key))
        .send()
        .await
        .map_err(|e| e.to_string());

    println!("{:?}", res);

    let ret = match res {
        Ok(body) => {
            let res2 = body.text().await.map_err(|e| e.to_string()).into();
            let ret2 = match res2 {
                Ok(body) => Ok(body.into()),
                Err(error) => Err(error.into())
            };
            return ret2;
        },
        Err(error) => Err(error.to_string())
    };
    
    ret
}

#[tauri::command]
async fn check_rev(id: &str, key: &str) -> Result<String, String> {
    let client = reqwest::Client::new();

    let url = format!("https://api.rev.ai/speechtotext/v1/jobs/{}", id);

    let res = client
        .get(url)
        .header(AUTHORIZATION, format!("Bearer {}", key))
        .send()
        .await;

    let ret = match res {
        Ok(body) => {
            let res2 = body.text().await.map_err(|e| e.to_string()).into();
            let ret2 = match res2 {
                Ok(body) => Ok(body.into()),
                Err(error) => Err(error.into())
            };
            return ret2;
        },
        Err(error) => Err(error.to_string())
    };
    
    ret
}

#[tauri::command]
async fn transcript_rev(id: &str, key: &str) -> Result<String, String> {
    let client = reqwest::Client::new();

    let url = format!("https://api.rev.ai/speechtotext/v1/jobs/{}/transcript", id);

    let res = client
        .get(url)
        .header(AUTHORIZATION, format!("Bearer {}", key))
        .header(ACCEPT, "text/plain")
        .send()
        .await;

    let ret = match res {
        Ok(body) => {
            let res2 = body.text().await.map_err(|e| e.to_string()).into();
            let ret2 = match res2 {
                Ok(body) => Ok(body.into()),
                Err(error) => Err(error.into())
            };
            return ret2;
        },
        Err(error) => Err(error.to_string())
    };
    
    ret
}

fn main() {
    let firstmenu = Submenu::new("App", Menu::new()
        .add_native_item(MenuItem::Quit)
        .add_item(CustomMenuItem::new("settings", "Settings").accelerator("cmdOrControl+,"))
    );

    let filemenu = Submenu::new("File", Menu::new()
        .add_item(CustomMenuItem::new("open", "Open Folder").accelerator("cmdOrControl+O"))
        .add_item(CustomMenuItem::new("new", "New File").accelerator("cmdOrControl+N"))
        .add_item(CustomMenuItem::new("save", "Save File").accelerator("cmdOrControl+S"))
    );

    let editmenu = Submenu::new("Edit", Menu::new()
        .add_native_item(MenuItem::Copy)
        .add_native_item(MenuItem::Cut)
        .add_native_item(MenuItem::Paste)
        .add_native_item(MenuItem::Undo)
        .add_native_item(MenuItem::Redo)
        .add_native_item(MenuItem::SelectAll)
    );

    let windowmenu = Submenu::new("Window", Menu::new()
        .add_native_item(MenuItem::CloseWindow)
        .add_item(CustomMenuItem::new("new_window", "New Window").accelerator("cmdOrControl+shift+N"))
    );

    let menu = Menu::new()
        .add_submenu(firstmenu)
        .add_submenu(filemenu)
        .add_submenu(editmenu)
        .add_submenu(windowmenu);

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_meta_from_url, upload_rev, check_rev, transcript_rev])
        .menu(menu)
        .on_menu_event(|event| match event.menu_item_id() {
            "open" => {
                let _ = event.window().emit("menu-event", "open-event");
            }
            "new" => {
                let _ = event.window().emit("menu-event", "new-event");
            }
            "save" => {
                let _ = event.window().emit("menu-event", "save-event");
            }
            "settings" => {
                let _ = event.window().emit("menu-event", "settings-event");
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}