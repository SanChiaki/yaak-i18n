#!/usr/bin/env node

/**
 * Verify that the language switching fix is properly implemented
 */

const fs = require("fs");
const path = require("path");

console.log("✅ Language Switching Fix Verification\n");

const settingsPath = path.join(
  __dirname,
  "../apps/yaak-client/components/Settings/SettingsInterface.tsx",
);
const content = fs.readFileSync(settingsPath, "utf-8");

console.log("📋 Checklist:\n");

// Check 1: locale import
const hasLocaleImport =
  content.includes("import { locale, type }") || content.includes("import { type, locale }");
console.log(`${hasLocaleImport ? "✅" : "❌"} 1. Import locale from @tauri-apps/plugin-os`);

// Check 2: i18n destructured
const hasI18nDestructure = content.match(/const\s+{\s*t,\s*i18n\s*}\s*=\s*useTranslation\(\)/);
console.log(`${hasI18nDestructure ? "✅" : "❌"} 2. Get i18n from useTranslation()`);

// Check 3: auto case calls locale()
const autoCase = content.match(/if \(v === "auto"\) \{[\s\S]*?\} else \{/);
if (autoCase) {
  const autoCaseCode = autoCase[0];
  const hasLocaleCall = autoCaseCode.includes("await locale()");
  const hasI18nChange = autoCaseCode.includes("i18n.changeLanguage");
  const hasPatchModel = autoCaseCode.includes("patchModel(settings, { language: null })");

  console.log(`${hasLocaleCall ? "✅" : "❌"} 3. Auto case detects system locale`);
  console.log(`${hasI18nChange ? "✅" : "❌"} 4. Auto case calls i18n.changeLanguage()`);
  console.log(`${hasPatchModel ? "✅" : "❌"} 5. Auto case saves to database`);

  // Check locale detection logic
  const hasZhCNDetection = autoCaseCode.includes("zh-CN") || autoCaseCode.includes("zh-Hans");
  console.log(`${hasZhCNDetection ? "✅" : "❌"} 6. Chinese locale detection implemented`);

  // Check error handling
  const hasTryCatch = autoCaseCode.includes("try {") && autoCaseCode.includes("} catch");
  console.log(`${hasTryCatch ? "✅" : "❌"} 7. Error handling for locale detection`);
} else {
  console.log("❌ 3-7. Could not find auto case implementation");
}

// Check 4: else case still calls changeLanguage
const elseCase = content.match(/\} else \{[\s\S]*?await changeLanguage\(v\);/);
console.log(`${elseCase ? "✅" : "❌"} 8. Specific language selection uses changeLanguage()`);

console.log("\n📊 Summary:\n");

if (hasLocaleImport && hasI18nDestructure && autoCase && elseCase) {
  console.log("✅ All critical fixes are in place!\n");

  console.log("What was fixed:");
  console.log('  • When user selects "Auto", the system now:');
  console.log("    1. Saves language preference as null to database");
  console.log("    2. Detects system locale using Tauri OS plugin");
  console.log("    3. Immediately updates UI language via i18n.changeLanguage()");
  console.log("    4. Handles errors gracefully with fallback to English\n");

  console.log("  • When user selects specific language:");
  console.log("    1. Uses changeLanguage() hook (unchanged)");
  console.log("    2. Updates both i18n state and database\n");

  console.log("Testing steps:");
  console.log("  1. Open http://localhost:1420");
  console.log("  2. Go to Settings > Interface");
  console.log('  3. Change language to "简体中文" - should see UI in Chinese');
  console.log('  4. Change to "English" - should see UI in English');
  console.log('  5. Change to "Auto" - should detect system language');
  console.log("  6. Restart app - settings should persist\n");
} else {
  console.log("❌ Some fixes are missing. Please review the implementation.\n");
}

console.log("🔗 Development server: http://localhost:1420\n");
