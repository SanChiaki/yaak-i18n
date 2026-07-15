pub use tauri::AppHandle;
use tauri::Runtime;
use tauri::menu::{
    AboutMetadata, HELP_SUBMENU_ID, Menu, MenuItemBuilder, PredefinedMenuItem, Submenu,
    WINDOW_SUBMENU_ID,
};

fn is_chinese_locale(locale: Option<&str>) -> bool {
    let normalized = locale.unwrap_or_default().trim().to_ascii_lowercase().replace('_', "-");
    normalized == "zh"
        || normalized.starts_with("zh-cn")
        || normalized.starts_with("zh-hans")
        || normalized.starts_with("zh-sg")
}

pub fn app_menu<R: Runtime>(app_handle: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let system_locale = tauri_plugin_os::locale();
    let is_chinese = is_chinese_locale(system_locale.as_deref());
    let label = |english: &'static str, chinese: &'static str| {
        if is_chinese { chinese } else { english }
    };
    let pkg_info = app_handle.package_info();
    let config = app_handle.config();
    let about_metadata = AboutMetadata {
        name: Some(pkg_info.name.clone()),
        version: Some(pkg_info.version.to_string()),
        copyright: config.bundle.copyright.clone(),
        authors: config.bundle.publisher.clone().map(|p| vec![p]),
        ..Default::default()
    };

    let window_menu = Submenu::with_id_and_items(
        app_handle,
        WINDOW_SUBMENU_ID,
        label("Window", "窗口"),
        true,
        &[
            &PredefinedMenuItem::minimize(app_handle, Some(label("Minimize", "最小化")))?,
            &PredefinedMenuItem::maximize(app_handle, Some(label("Maximize", "最大化")))?,
            #[cfg(target_os = "macos")]
            &PredefinedMenuItem::separator(app_handle)?,
            &PredefinedMenuItem::close_window(app_handle, Some(label("Close Window", "关闭窗口")))?,
        ],
    )?;

    #[cfg(target_os = "macos")]
    {
        window_menu.set_as_windows_menu_for_nsapp()?;
    }

    let help_menu = Submenu::with_id_and_items(
        app_handle,
        HELP_SUBMENU_ID,
        label("Help", "帮助"),
        true,
        &[
            #[cfg(not(target_os = "macos"))]
            &PredefinedMenuItem::about(
                app_handle,
                Some(label("About", "关于")),
                Some(about_metadata.clone()),
            )?,
        ],
    )?;

    #[cfg(target_os = "macos")]
    {
        help_menu.set_as_windows_menu_for_nsapp()?;
    }

    let menu = Menu::with_items(
        app_handle,
        &[
            #[cfg(target_os = "macos")]
            &Submenu::with_items(
                app_handle,
                pkg_info.name.clone(),
                true,
                &[
                    &PredefinedMenuItem::about(
                        app_handle,
                        Some(label("About", "关于")),
                        Some(about_metadata),
                    )?,
                    &PredefinedMenuItem::separator(app_handle)?,
                    &PredefinedMenuItem::services(app_handle, Some(label("Services", "服务")))?,
                    &PredefinedMenuItem::separator(app_handle)?,
                    &PredefinedMenuItem::hide(
                        app_handle,
                        Some(&format!("{} {}", label("Hide", "隐藏"), pkg_info.name)),
                    )?,
                    &PredefinedMenuItem::hide_others(
                        app_handle,
                        Some(label("Hide Others", "隐藏其他")),
                    )?,
                    &PredefinedMenuItem::separator(app_handle)?,
                    &MenuItemBuilder::with_id(
                        "hacked_quit".to_string(),
                        format!("{} {}", label("Quit", "退出"), app_handle.package_info().name),
                    )
                    .accelerator("CmdOrCtrl+q")
                    .build(app_handle)?,
                ],
            )?,
            #[cfg(not(any(
                target_os = "linux",
                target_os = "dragonfly",
                target_os = "freebsd",
                target_os = "netbsd",
                target_os = "openbsd"
            )))]
            &Submenu::with_items(
                app_handle,
                label("File", "文件"),
                true,
                &[
                    &PredefinedMenuItem::close_window(
                        app_handle,
                        Some(label("Close Window", "关闭窗口")),
                    )?,
                    #[cfg(not(target_os = "macos"))]
                    &PredefinedMenuItem::quit(app_handle, Some(label("Quit", "退出")))?,
                ],
            )?,
            &Submenu::with_items(
                app_handle,
                label("Edit", "编辑"),
                true,
                &[
                    &PredefinedMenuItem::undo(app_handle, Some(label("Undo", "撤销")))?,
                    &PredefinedMenuItem::redo(app_handle, Some(label("Redo", "重做")))?,
                    &PredefinedMenuItem::separator(app_handle)?,
                    &PredefinedMenuItem::cut(app_handle, Some(label("Cut", "剪切")))?,
                    &PredefinedMenuItem::copy(app_handle, Some(label("Copy", "复制")))?,
                    &PredefinedMenuItem::paste(app_handle, Some(label("Paste", "粘贴")))?,
                    &PredefinedMenuItem::select_all(app_handle, Some(label("Select All", "全选")))?,
                ],
            )?,
            &Submenu::with_items(
                app_handle,
                label("View", "显示"),
                true,
                &[
                    #[cfg(target_os = "macos")]
                    &PredefinedMenuItem::fullscreen(
                        app_handle,
                        Some(label("Enter Full Screen", "进入全屏幕")),
                    )?,
                ],
            )?,
            &window_menu,
            &help_menu,
            #[cfg(dev)]
            &Submenu::with_items(
                app_handle,
                label("Develop", "开发"),
                true,
                &[
                    &MenuItemBuilder::with_id("dev.refresh".to_string(), label("Refresh", "刷新"))
                        .accelerator("CmdOrCtrl+Shift+r")
                        .build(app_handle)?,
                    &MenuItemBuilder::with_id(
                        "dev.toggle_devtools".to_string(),
                        label("Open Devtools", "打开开发者工具"),
                    )
                    .accelerator("CmdOrCtrl+Option+i")
                    .build(app_handle)?,
                ],
            )?,
        ],
    )?;

    Ok(menu)
}

#[cfg(test)]
mod tests {
    use super::is_chinese_locale;

    #[test]
    fn detects_chinese_system_locales() {
        assert!(is_chinese_locale(Some("zh-CN")));
        assert!(is_chinese_locale(Some("zh_Hans_CN")));
        assert!(is_chinese_locale(Some("zh-SG")));
        assert!(!is_chinese_locale(Some("zh-Hant-TW")));
        assert!(!is_chinese_locale(Some("en-US")));
        assert!(!is_chinese_locale(None));
    }
}
