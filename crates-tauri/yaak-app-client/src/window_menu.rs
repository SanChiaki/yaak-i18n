use crate::models_ext::QueryManagerExt;
pub use tauri::AppHandle;
use tauri::Runtime;
use tauri::menu::{
    AboutMetadata, HELP_SUBMENU_ID, Menu, MenuItemBuilder, PredefinedMenuItem, Submenu,
    WINDOW_SUBMENU_ID,
};

#[derive(Clone, Copy)]
struct MenuLabels {
    about: &'static str,
    close_window: &'static str,
    copy: &'static str,
    cut: &'static str,
    #[cfg(dev)]
    develop: &'static str,
    edit: &'static str,
    feedback: &'static str,
    file: &'static str,
    fullscreen: &'static str,
    #[cfg(dev)]
    generate_theme_css: &'static str,
    help: &'static str,
    hide: &'static str,
    hide_others: &'static str,
    maximize: &'static str,
    minimize: &'static str,
    #[cfg(dev)]
    open_devtools: &'static str,
    paste: &'static str,
    quit: &'static str,
    redo: &'static str,
    #[cfg(dev)]
    refresh: &'static str,
    #[cfg(dev)]
    reset_size: &'static str,
    #[cfg(dev)]
    resize_16x10: &'static str,
    #[cfg(dev)]
    resize_16x9: &'static str,
    select_all: &'static str,
    services: &'static str,
    settings: &'static str,
    undo: &'static str,
    view: &'static str,
    window: &'static str,
    zoom_in: &'static str,
    zoom_out: &'static str,
    zoom_reset: &'static str,
}

const ENGLISH_LABELS: MenuLabels = MenuLabels {
    about: "About",
    close_window: "Close Window",
    copy: "Copy",
    cut: "Cut",
    #[cfg(dev)]
    develop: "Develop",
    edit: "Edit",
    feedback: "Give Feedback",
    file: "File",
    fullscreen: "Enter Full Screen",
    #[cfg(dev)]
    generate_theme_css: "Generate Theme CSS",
    help: "Help",
    hide: "Hide",
    hide_others: "Hide Others",
    maximize: "Maximize",
    minimize: "Minimize",
    #[cfg(dev)]
    open_devtools: "Open Devtools",
    paste: "Paste",
    quit: "Quit",
    redo: "Redo",
    #[cfg(dev)]
    refresh: "Refresh",
    #[cfg(dev)]
    reset_size: "Reset Size",
    #[cfg(dev)]
    resize_16x10: "Resize to 16x10",
    #[cfg(dev)]
    resize_16x9: "Resize to 16x9",
    select_all: "Select All",
    services: "Services",
    settings: "Settings",
    undo: "Undo",
    view: "View",
    window: "Window",
    zoom_in: "Zoom In",
    zoom_out: "Zoom Out",
    zoom_reset: "Zoom to Actual Size",
};

const CHINESE_LABELS: MenuLabels = MenuLabels {
    about: "关于",
    close_window: "关闭窗口",
    copy: "复制",
    cut: "剪切",
    #[cfg(dev)]
    develop: "开发",
    edit: "编辑",
    feedback: "提交反馈",
    file: "文件",
    fullscreen: "进入全屏幕",
    #[cfg(dev)]
    generate_theme_css: "生成主题 CSS",
    help: "帮助",
    hide: "隐藏",
    hide_others: "隐藏其他",
    maximize: "最大化",
    minimize: "最小化",
    #[cfg(dev)]
    open_devtools: "打开开发者工具",
    paste: "粘贴",
    quit: "退出",
    redo: "重做",
    #[cfg(dev)]
    refresh: "刷新",
    #[cfg(dev)]
    reset_size: "重置大小",
    #[cfg(dev)]
    resize_16x10: "调整为 16x10",
    #[cfg(dev)]
    resize_16x9: "调整为 16x9",
    select_all: "全选",
    services: "服务",
    settings: "设置",
    undo: "撤销",
    view: "显示",
    window: "窗口",
    zoom_in: "放大",
    zoom_out: "缩小",
    zoom_reset: "实际大小",
};

fn labels_for_language(language: &str) -> MenuLabels {
    let normalized = language.trim().to_ascii_lowercase().replace('_', "-");
    if normalized == "zh"
        || normalized.starts_with("zh-cn")
        || normalized.starts_with("zh-hans")
        || normalized.starts_with("zh-sg")
    {
        CHINESE_LABELS
    } else {
        ENGLISH_LABELS
    }
}

pub fn app_menu<R: Runtime>(app_handle: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let preference = app_handle.db().get_settings().language;
    let language = preference
        .filter(|language| language != "auto")
        .or_else(tauri_plugin_os::locale)
        .unwrap_or_else(|| "en".to_string());
    app_menu_for_language(app_handle, &language)
}

pub fn app_menu_for_language<R: Runtime>(
    app_handle: &AppHandle<R>,
    language: &str,
) -> tauri::Result<Menu<R>> {
    let labels = labels_for_language(language);
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
        labels.window,
        true,
        &[
            &PredefinedMenuItem::minimize(app_handle, Some(labels.minimize))?,
            &PredefinedMenuItem::maximize(app_handle, Some(labels.maximize))?,
            #[cfg(target_os = "macos")]
            &PredefinedMenuItem::separator(app_handle)?,
            &PredefinedMenuItem::close_window(app_handle, Some(labels.close_window))?,
        ],
    )?;

    #[cfg(target_os = "macos")]
    {
        window_menu.set_as_windows_menu_for_nsapp()?;
    }

    let help_menu = Submenu::with_id_and_items(
        app_handle,
        HELP_SUBMENU_ID,
        labels.help,
        true,
        &[
            #[cfg(not(target_os = "macos"))]
            &PredefinedMenuItem::about(
                app_handle,
                Some(labels.about),
                Some(about_metadata.clone()),
            )?,
            #[cfg(target_os = "macos")]
            &MenuItemBuilder::with_id("open_feedback".to_string(), labels.feedback)
                .build(app_handle)?,
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
                        Some(labels.about),
                        Some(about_metadata),
                    )?,
                    &PredefinedMenuItem::separator(app_handle)?,
                    &MenuItemBuilder::with_id("settings".to_string(), labels.settings)
                        .accelerator("CmdOrCtrl+,")
                        .build(app_handle)?,
                    &PredefinedMenuItem::separator(app_handle)?,
                    &PredefinedMenuItem::services(app_handle, Some(labels.services))?,
                    &PredefinedMenuItem::separator(app_handle)?,
                    &PredefinedMenuItem::hide(
                        app_handle,
                        Some(&format!("{} {}", labels.hide, pkg_info.name)),
                    )?,
                    &PredefinedMenuItem::hide_others(app_handle, Some(labels.hide_others))?,
                    &PredefinedMenuItem::separator(app_handle)?,
                    // NOTE: Replace the predefined quit item with a custom one because, for some
                    //  reason, ExitRequested events are not fired on cmd+Q. Perhaps this will be
                    //  fixed in the future?
                    //  https://github.com/tauri-apps/tauri/issues/9198
                    &MenuItemBuilder::with_id(
                        "hacked_quit".to_string(),
                        format!("{} {}", labels.quit, app_handle.package_info().name),
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
                labels.file,
                true,
                &[
                    &PredefinedMenuItem::close_window(app_handle, Some(labels.close_window))?,
                    #[cfg(not(target_os = "macos"))]
                    &PredefinedMenuItem::quit(app_handle, Some(labels.quit))?,
                ],
            )?,
            &Submenu::with_items(
                app_handle,
                labels.edit,
                true,
                &[
                    &PredefinedMenuItem::undo(app_handle, Some(labels.undo))?,
                    &PredefinedMenuItem::redo(app_handle, Some(labels.redo))?,
                    &PredefinedMenuItem::separator(app_handle)?,
                    &PredefinedMenuItem::cut(app_handle, Some(labels.cut))?,
                    &PredefinedMenuItem::copy(app_handle, Some(labels.copy))?,
                    &PredefinedMenuItem::paste(app_handle, Some(labels.paste))?,
                    &PredefinedMenuItem::select_all(app_handle, Some(labels.select_all))?,
                ],
            )?,
            &Submenu::with_items(
                app_handle,
                labels.view,
                true,
                &[
                    #[cfg(target_os = "macos")]
                    &PredefinedMenuItem::fullscreen(app_handle, Some(labels.fullscreen))?,
                    #[cfg(target_os = "macos")]
                    &PredefinedMenuItem::separator(app_handle)?,
                    &MenuItemBuilder::with_id("zoom_reset".to_string(), labels.zoom_reset)
                        .accelerator("CmdOrCtrl+0")
                        .build(app_handle)?,
                    &MenuItemBuilder::with_id("zoom_in".to_string(), labels.zoom_in)
                        .accelerator("CmdOrCtrl+=")
                        .build(app_handle)?,
                    &MenuItemBuilder::with_id("zoom_out".to_string(), labels.zoom_out)
                        .accelerator("CmdOrCtrl+-")
                        .build(app_handle)?,
                ],
            )?,
            &window_menu,
            &help_menu,
            #[cfg(dev)]
            &Submenu::with_items(
                app_handle,
                labels.develop,
                true,
                &[
                    &MenuItemBuilder::with_id("dev.refresh".to_string(), labels.refresh)
                        .accelerator("CmdOrCtrl+Shift+r")
                        .build(app_handle)?,
                    &MenuItemBuilder::with_id(
                        "dev.toggle_devtools".to_string(),
                        labels.open_devtools,
                    )
                    .accelerator("CmdOrCtrl+Option+i")
                    .build(app_handle)?,
                    &MenuItemBuilder::with_id("dev.reset_size".to_string(), labels.reset_size)
                        .build(app_handle)?,
                    &MenuItemBuilder::with_id(
                        "dev.reset_size_16x9".to_string(),
                        labels.resize_16x9,
                    )
                    .build(app_handle)?,
                    &MenuItemBuilder::with_id(
                        "dev.reset_size_16x10".to_string(),
                        labels.resize_16x10,
                    )
                    .build(app_handle)?,
                    &MenuItemBuilder::with_id(
                        "dev.generate_theme_css".to_string(),
                        labels.generate_theme_css,
                    )
                    .build(app_handle)?,
                ],
            )?,
        ],
    )?;

    Ok(menu)
}

#[cfg(test)]
mod tests {
    use super::labels_for_language;

    #[test]
    fn selects_chinese_labels_for_supported_chinese_locales() {
        assert_eq!(labels_for_language("zh-CN").settings, "设置");
        assert_eq!(labels_for_language("zh_CN").window, "窗口");
        assert_eq!(labels_for_language("zh-Hans-CN").feedback, "提交反馈");
        assert_eq!(labels_for_language("zh-SG").settings, "设置");
    }

    #[test]
    fn defaults_non_chinese_locales_to_english() {
        assert_eq!(labels_for_language("en").settings, "Settings");
        assert_eq!(labels_for_language("fr-FR").window, "Window");
        assert_eq!(labels_for_language("zh-Hant-TW").settings, "Settings");
    }
}
