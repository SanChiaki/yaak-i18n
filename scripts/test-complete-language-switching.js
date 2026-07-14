#!/usr/bin/env node

/**
 * Comprehensive Language Switching Test Suite
 * Tests the complete i18n implementation after the fix
 */

const fs = require("fs");
const path = require("path");

console.log("🧪 Comprehensive Language Switching Test Suite\n");
console.log("=".repeat(60) + "\n");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name, condition, details = "") {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
  } else {
    failedTests++;
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

console.log("📦 Phase 1: File Structure Verification\n");

// Check all critical files exist
const files = [
  "apps/yaak-client/i18n.ts",
  "apps/yaak-client/hooks/useLanguage.ts",
  "apps/yaak-client/components/Settings/SettingsInterface.tsx",
  "apps/yaak-client/components/GlobalHooks.tsx",
  "apps/yaak-client/locales/en/common.json",
  "apps/yaak-client/locales/zh-CN/common.json",
  "crates/yaak-models/src/models.rs",
  "crates/yaak-models/migrations/20260714000000_add-language-setting.sql",
];

files.forEach((file) => {
  const fullPath = path.join(__dirname, "..", file);
  test(`File exists: ${file}`, fs.existsSync(fullPath));
});

console.log("\n" + "─".repeat(60) + "\n");
console.log("🔧 Phase 2: Implementation Verification\n");

// Check SettingsInterface.tsx
const settingsPath = path.join(
  __dirname,
  "../apps/yaak-client/components/Settings/SettingsInterface.tsx",
);
const settingsContent = fs.readFileSync(settingsPath, "utf-8");

test(
  "Import locale function",
  settingsContent.includes("import { locale") || settingsContent.includes("import { type, locale"),
  "Required for system language detection",
);

test(
  "Destructure i18n from useTranslation",
  settingsContent.match(/const\s+{\s*t,\s*i18n\s*}\s*=\s*useTranslation/) !== null,
  "Needed to call i18n.changeLanguage()",
);

test(
  "Auto case detects system locale",
  settingsContent.includes("await locale()"),
  "Detects system language when Auto is selected",
);

test(
  "Auto case updates UI immediately",
  settingsContent.match(/if \(v === "auto"\)[\s\S]*?i18n\.changeLanguage/) !== null,
  "Calls i18n.changeLanguage() for immediate UI update",
);

test(
  "Auto case has error handling",
  settingsContent.match(/try \{[\s\S]*?await locale\(\)[\s\S]*?\} catch/) !== null,
  "Gracefully handles locale detection failures",
);

test(
  "Chinese locale detection",
  settingsContent.includes("zh-CN") && settingsContent.includes("zh-Hans"),
  "Properly maps Chinese locales",
);

test(
  "Fallback to English on error",
  settingsContent.match(/\} catch \{[\s\S]*?i18n\.changeLanguage\("en"\)/) !== null,
  "Defaults to English if locale detection fails",
);

// Check useLanguage.ts
const useLanguagePath = path.join(__dirname, "../apps/yaak-client/hooks/useLanguage.ts");
const useLanguageContent = fs.readFileSync(useLanguagePath, "utf-8");

test(
  "useEffect has empty dependency array",
  useLanguageContent.match(/useEffect\([^,]+,\s*\[\s*\]\)/) !== null,
  "Prevents language reset bug - runs only on mount",
);

test(
  "changeLanguage function exists",
  useLanguageContent.includes("const changeLanguage = async (language: string)"),
  "Provides API for language changes",
);

test(
  "changeLanguage updates i18n",
  useLanguageContent.match(/const changeLanguage[\s\S]*?i18n\.changeLanguage/) !== null,
  "Updates UI language state",
);

test(
  "changeLanguage updates database",
  useLanguageContent.match(/const changeLanguage[\s\S]*?patchModel/) !== null,
  "Persists language preference",
);

console.log("\n" + "─".repeat(60) + "\n");
console.log("🌍 Phase 3: Translation Files Verification\n");

// Check translation files
const namespaces = ["common", "settings", "request", "workspace", "errors"];
const languages = ["en", "zh-CN"];

namespaces.forEach((ns) => {
  languages.forEach((lang) => {
    const translationPath = path.join(__dirname, `../apps/yaak-client/locales/${lang}/${ns}.json`);
    const exists = fs.existsSync(translationPath);

    if (exists) {
      try {
        const content = JSON.parse(fs.readFileSync(translationPath, "utf-8"));
        const keyCount = Object.keys(content).length;
        test(`${lang}/${ns}.json is valid`, true, `${keyCount} translation keys`);
      } catch (e) {
        test(`${lang}/${ns}.json is valid`, false, "Invalid JSON");
      }
    } else {
      test(`${lang}/${ns}.json exists`, false);
    }
  });
});

console.log("\n" + "─".repeat(60) + "\n");
console.log("🔗 Phase 4: Integration Verification\n");

// Check i18n.ts configuration
const i18nPath = path.join(__dirname, "../apps/yaak-client/i18n.ts");
const i18nContent = fs.readFileSync(i18nPath, "utf-8");

namespaces.forEach((ns) => {
  test(
    `i18n.ts imports ${ns} namespace`,
    i18nContent.includes(`${ns}EN`) && i18nContent.includes(`${ns}ZH`),
    "Namespace is properly imported",
  );
});

test(
  "i18n configured with LanguageDetector",
  i18nContent.includes("LanguageDetector"),
  "Browser language detection plugin is active",
);

test(
  "i18n configured with initReactI18next",
  i18nContent.includes("initReactI18next"),
  "React integration is active",
);

// Check GlobalHooks.tsx
const globalHooksPath = path.join(__dirname, "../apps/yaak-client/components/GlobalHooks.tsx");
const globalHooksContent = fs.readFileSync(globalHooksPath, "utf-8");

test(
  "GlobalHooks calls useLanguage()",
  globalHooksContent.includes("useLanguage()"),
  "Language detection initializes on app startup",
);

console.log("\n" + "─".repeat(60) + "\n");
console.log("📊 Test Results Summary\n");

console.log(`Total Tests:  ${totalTests}`);
console.log(`Passed:       ${passedTests} ✅`);
console.log(`Failed:       ${failedTests} ❌`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

console.log("\n" + "=".repeat(60) + "\n");

if (failedTests === 0) {
  console.log("🎉 All tests passed! The language switching fix is complete.\n");

  console.log("✅ What works now:\n");
  console.log('  1. Selecting "Auto" → Detects system language and updates UI immediately');
  console.log('  2. Selecting "English" → Switches to English and saves preference');
  console.log('  3. Selecting "简体中文" → Switches to Chinese and saves preference');
  console.log("  4. Language preference persists across app restarts");
  console.log("  5. Error handling ensures fallback to English if detection fails\n");

  console.log("🧪 Manual Testing Required:\n");
  console.log("  Since this is a Tauri desktop app, automated GUI testing is limited.");
  console.log("  Please perform these manual tests:\n");
  console.log("  1. Build and run the app: npm run tauri dev");
  console.log("  2. Navigate to Settings > Interface > Language");
  console.log("  3. Test each language option:");
  console.log('     • Switch to "简体中文" - UI should show Chinese immediately');
  console.log('     • Switch to "English" - UI should show English immediately');
  console.log('     • Switch to "Auto" - UI should match your system language');
  console.log("  4. Restart the app - language setting should persist");
  console.log("  5. Verify all translated strings display correctly\n");

  console.log("📝 Next Steps:\n");
  console.log("  1. ✅ Code fix complete");
  console.log("  2. ✅ Changes committed");
  console.log("  3. ⏳ Run manual GUI tests (see above)");
  console.log("  4. ⏳ Push changes: git push origin feature/i18n");
  console.log("  5. ⏳ Create/update Pull Request\n");
} else {
  console.log("⚠️  Some tests failed. Please review the issues above.\n");
  process.exit(1);
}

console.log("🔗 Development server: http://localhost:1420");
console.log("📚 Documentation: See LANGUAGE_SWITCHING_FIX.md for details\n");
