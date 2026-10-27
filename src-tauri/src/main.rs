// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "linux")]
    {
        // Fix para WebKitGTK em Linux (Intel Sandy Bridge HD 3000 / Mesa)
        // Impede o crash do WebProcess ("internallyFailedLoadTimerFired" / tela preta)
        if std::env::var("WEBKIT_DISABLE_DMABUF_RENDERER").is_err() {
            unsafe {
                std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
            }
        }
    }

    app_lib::run();
}

