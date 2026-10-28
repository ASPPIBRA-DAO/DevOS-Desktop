// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "linux")]
    {
        // Fix para WebKitGTK em Linux (Intel Sandy Bridge HD 3000 / Wayland / Mesa)
        // Impede o crash do WebProcess ("internallyFailedLoadTimerFired" / tela preta)
        unsafe {
            if std::env::var("WEBKIT_DISABLE_DMABUF_RENDERER").is_err() {
                std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
            }
            if std::env::var("GDK_BACKEND").is_err() {
                std::env::set_var("GDK_BACKEND", "x11");
            }
        }
    }

    app_lib::run();
}

