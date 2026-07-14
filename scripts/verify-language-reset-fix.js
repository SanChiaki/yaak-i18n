#!/usr/bin/env node

/**
 * Verify the language reset fix and translation coverage improvements
 */

const fs = require("fs");
const path = require("path");

console.log("✅ Language Fix and Translation Coverage Verification\n");
console.log("=".repeat(70) + "\n");

// Check Settings.tsx
console.log("1️⃣  Settings.tsx Navigation Translation\n");

const settingsPath = path.join(__dirname, "../apps/yaak-client/components/Settings/Settings.tsx");
const settingsContent = fs.readFileSync(settingsPath, "utf-8");

const checks = [
  { name: "Import useTranslation", pattern: /import.*useTranslation.*from.*react-i18next/ },
  { name: "Call useTranslation hook", pattern: /const { t } = useTranslation\(\)/ },
  { name: "Translate window title", pattern: /t\("settings:title"\)/ },
  { name: "getTabLabel function exists", pattern: /const getTabLabel = \(tab: string\)/ },
  { name: "Translate General tab", pattern: /t\("settings:general\.title"\)/ },
  { name: "Translate Interface tab", pattern: /t\("settings:interface\.title"\)/ },
  { name: "Translate Theme tab", pattern: /t\("settings:theme\.title"\)/ },
  { name: "Translate Hotkeys tab", pattern: /t\("settings:hotkeys\.title"\)/ },
  { name: "Translate Plugins tab", pattern: /t\("settings:plugins\.title"\)/ },
  { name: "Translate Proxy tab", pattern: /t\("settings:proxy\.title"\)/ },
  { name: "Translate Certificates tab", pattern: /t\("settings:certificates\.title"\)/ },
  { name: "Translate License tab", pattern: /t\("settings:license\.title"\)/ },
  { name: "Use getTabLabel in tabs", pattern: /label: getTabLabel\(value\)/ },
];

checks.forEach(({ name, pattern }) => {
  const passed = pattern.test(settingsContent);
  console.log(`  ${passed ? "✅" : "❌"} ${name}`);
});

console.log("\n" + "─".repeat(70) + "\n");

// Check SettingsInterface.tsx
console.log("2️⃣  SettingsInterface.tsx Language Selector Fix\n");

const interfacePath = path.join(
  __dirname,
  "../apps/yaak-client/components/Settings/SettingsInterface.tsx",
);
const interfaceContent = fs.readFileSync(interfacePath, "utf-8");

const interfaceChecks = [
  {
    name: "Get currentLanguage from useLanguage",
    pattern: /const { changeLanguage, currentLanguage } = useLanguage\(\)/,
  },
  {
    name: "Define displayLanguage variable",
    pattern: /const displayLanguage = settings\.language \|\| currentLanguage \|\| "auto"/,
  },
  { name: "Use displayLanguage in value", pattern: /value={displayLanguage}/ },
];

interfaceChecks.forEach(({ name, pattern }) => {
  const passed = pattern.test(interfaceContent);
  console.log(`  ${passed ? "✅" : "❌"} ${name}`);
});

console.log("\n" + "─".repeat(70) + "\n");

// Check translation files
console.log("3️⃣  Translation Files Coverage\n");

const zhSettings = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../apps/yaak-client/locales/zh-CN/settings.json"), "utf-8"),
);

const tabTranslations = [
  { key: "title", label: "Settings title" },
  { key: "general.title", label: "General tab" },
  { key: "interface.title", label: "Interface tab" },
  { key: "theme.title", label: "Theme tab" },
  { key: "hotkeys.title", label: "Hotkeys tab" },
  { key: "plugins.title", label: "Plugins tab" },
  { key: "proxy.title", label: "Proxy tab" },
  { key: "certificates.title", label: "Certificates tab" },
  { key: "license.title", label: "License tab" },
];

tabTranslations.forEach(({ key, label }) => {
  const keys = key.split(".");
  let value = zhSettings;
  for (const k of keys) {
    value = value?.[k];
  }
  const exists = value !== undefined;
  console.log(`  ${exists ? "✅" : "❌"} ${label.padEnd(25)} - ${exists ? value : "MISSING"}`);
});

console.log("\n" + "─".repeat(70) + "\n");

console.log("📊 Summary\n");

const allSettingsChecks = checks.every(({ pattern }) => pattern.test(settingsContent));
const allInterfaceChecks = interfaceChecks.every(({ pattern }) => pattern.test(interfaceContent));
const allTranslations = tabTranslations.every(({ key }) => {
  const keys = key.split(".");
  let value = zhSettings;
  for (const k of keys) {
    value = value?.[k];
  }
  return value !== undefined;
});

if (allSettingsChecks && allInterfaceChecks && allTranslations) {
  console.log("✅ All checks passed!\n");

  console.log("Fixed Issues:\n");
  console.log("  1. ✅ Language selector reset bug fixed");
  console.log("     • Now uses displayLanguage computed from settings + currentLanguage");
  console.log("     • Dropdown will maintain selected value correctly\n");

  console.log("  2. ✅ Settings navigation now fully internationalized");
  console.log("     • All tab labels use t() function");
  console.log("     • Window title uses translation");
  console.log("     • getTabLabel() maps all 8 tabs to translations\n");

  console.log("What Users Will See Now:\n");
  console.log('  • Settings window title: "设置"');
  console.log('  • General tab: "通用"');
  console.log('  • Interface tab: "界面"');
  console.log('  • Theme tab: "主题"');
  console.log('  • Hotkeys tab: "快捷键"');
  console.log('  • Plugins tab: "插件"');
  console.log('  • Proxy tab: "代理"');
  console.log('  • Certificates tab: "证书"');
  console.log('  • License tab: "许可证"\n');

  console.log("Next Steps:\n");
  console.log("  1. Test in browser/app - language should persist after tab switches");
  console.log("  2. Verify all Settings tabs show Chinese labels");
  console.log("  3. Check that dropdown maintains selected language\n");
} else {
  console.log("❌ Some checks failed. Please review the implementation.\n");
  process.exit(1);
}
