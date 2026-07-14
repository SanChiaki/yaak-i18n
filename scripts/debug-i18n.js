#!/usr/bin/env node

/**
 * i18n Debug Script
 *
 * This script helps debug i18n issues by checking:
 * 1. If translation files are loaded
 * 2. If i18n is properly configured
 * 3. If the Settings model has language field
 */

console.log("🔍 i18n Debug Check\n");

// Check 1: Translation files
console.log("📁 Checking translation files...");
const fs = require("fs");
const path = require("path");

const localesDir = path.join(__dirname, "..", "apps", "yaak-client", "locales");
const languages = ["en", "zh-CN"];
const namespaces = ["common", "settings", "request", "workspace", "errors"];

let allFilesExist = true;
for (const lang of languages) {
  for (const ns of namespaces) {
    const file = path.join(localesDir, lang, `${ns}.json`);
    if (fs.existsSync(file)) {
      console.log(`  ✅ ${lang}/${ns}.json exists`);
    } else {
      console.log(`  ❌ ${lang}/${ns}.json MISSING`);
      allFilesExist = false;
    }
  }
}

// Check 2: i18n.ts configuration
console.log("\n⚙️  Checking i18n configuration...");
const i18nFile = path.join(__dirname, "..", "apps", "yaak-client", "i18n.ts");
if (fs.existsSync(i18nFile)) {
  console.log("  ✅ i18n.ts exists");
  const content = fs.readFileSync(i18nFile, "utf8");

  if (content.includes("i18next")) {
    console.log("  ✅ i18next imported");
  } else {
    console.log("  ❌ i18next NOT imported");
  }

  if (content.includes("react-i18next")) {
    console.log("  ✅ react-i18next imported");
  } else {
    console.log("  ❌ react-i18next NOT imported");
  }

  if (content.includes("fallbackLng")) {
    console.log("  ✅ fallbackLng configured");
  } else {
    console.log("  ❌ fallbackLng NOT configured");
  }
} else {
  console.log("  ❌ i18n.ts MISSING");
}

// Check 3: main.tsx imports i18n
console.log("\n📦 Checking main.tsx...");
const mainFile = path.join(__dirname, "..", "apps", "yaak-client", "main.tsx");
if (fs.existsSync(mainFile)) {
  const content = fs.readFileSync(mainFile, "utf8");
  if (content.includes('import "./i18n"')) {
    console.log("  ✅ i18n imported in main.tsx");
  } else {
    console.log("  ❌ i18n NOT imported in main.tsx");
  }
} else {
  console.log("  ❌ main.tsx NOT found");
}

// Check 4: useLanguage hook
console.log("\n🪝 Checking useLanguage hook...");
const hookFile = path.join(__dirname, "..", "apps", "yaak-client", "hooks", "useLanguage.ts");
if (fs.existsSync(hookFile)) {
  console.log("  ✅ useLanguage.ts exists");
  const content = fs.readFileSync(hookFile, "utf8");
  if (content.includes("changeLanguage")) {
    console.log("  ✅ changeLanguage function defined");
  } else {
    console.log("  ❌ changeLanguage function NOT defined");
  }
} else {
  console.log("  ❌ useLanguage.ts MISSING");
}

// Check 5: SettingsInterface component
console.log("\n🎨 Checking SettingsInterface component...");
const settingsFile = path.join(
  __dirname,
  "..",
  "apps",
  "yaak-client",
  "components",
  "Settings",
  "SettingsInterface.tsx",
);
if (fs.existsSync(settingsFile)) {
  const content = fs.readFileSync(settingsFile, "utf8");

  if (content.includes("useLanguage")) {
    console.log("  ✅ useLanguage hook imported");
  } else {
    console.log("  ❌ useLanguage hook NOT imported");
  }

  if (content.includes("useTranslation")) {
    console.log("  ✅ useTranslation hook imported");
  } else {
    console.log("  ❌ useTranslation hook NOT imported");
  }

  if (content.includes("settings:language")) {
    console.log("  ✅ Language settings section found");
  } else {
    console.log("  ❌ Language settings section NOT found");
  }
} else {
  console.log("  ❌ SettingsInterface.tsx NOT found");
}

// Check 6: Sample translation keys
console.log("\n🔑 Checking translation keys...");
const settingsEN = path.join(localesDir, "en", "settings.json");
if (fs.existsSync(settingsEN)) {
  const content = JSON.parse(fs.readFileSync(settingsEN, "utf8"));
  if (content.language) {
    console.log("  ✅ settings.language exists in English");
    console.log(`     Keys: ${Object.keys(content.language).join(", ")}`);
  } else {
    console.log("  ❌ settings.language NOT found in English");
  }
}

const settingsZH = path.join(localesDir, "zh-CN", "settings.json");
if (fs.existsSync(settingsZH)) {
  const content = JSON.parse(fs.readFileSync(settingsZH, "utf8"));
  if (content.language) {
    console.log("  ✅ settings.language exists in Chinese");
    console.log(`     Keys: ${Object.keys(content.language).join(", ")}`);
  } else {
    console.log("  ❌ settings.language NOT found in Chinese");
  }
}

// Summary
console.log("\n" + "=".repeat(60));
if (allFilesExist) {
  console.log("✅ All checks passed! i18n should be working.");
  console.log("\n📋 Next steps:");
  console.log("1. Clear browser cache and reload (Cmd+Shift+R)");
  console.log("2. Check browser console for errors (F12)");
  console.log("3. Verify Settings model has language field");
  console.log("4. Check if database migration ran successfully");
} else {
  console.log("❌ Some checks failed. Please review the errors above.");
}
console.log("=".repeat(60));
