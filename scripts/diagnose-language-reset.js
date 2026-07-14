#!/usr/bin/env node

/**
 * Diagnose the language reset issue
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Language Reset Issue Diagnosis\n");

// Check useLanguage hook
const useLanguagePath = path.join(__dirname, "../apps/yaak-client/hooks/useLanguage.ts");
const useLanguageContent = fs.readFileSync(useLanguagePath, "utf-8");

console.log("1. Checking useLanguage hook\n");

// Check if changeLanguage updates both i18n and database
console.log("changeLanguage function:");
const changeLangMatch = useLanguageContent.match(
  /const changeLanguage = async \(language: string\) => \{[\s\S]*?\n  \};/,
);
if (changeLangMatch) {
  console.log(changeLangMatch[0]);
  console.log();
}

// Check the value binding
console.log("2. Checking SettingsInterface.tsx value binding\n");
const settingsPath = path.join(
  __dirname,
  "../apps/yaak-client/components/Settings/SettingsInterface.tsx",
);
const settingsContent = fs.readFileSync(settingsPath, "utf-8");

const valueMatch = settingsContent.match(/value={settings\.language[^}]*}/);
if (valueMatch) {
  console.log("Value binding:", valueMatch[0]);
  console.log();
}

// Check translation coverage
console.log("3. Translation Coverage Analysis\n");

const components = [
  "Settings/Settings.tsx",
  "Settings/SettingsGeneral.tsx",
  "Settings/SettingsInterface.tsx",
  "Settings/SettingsTheme.tsx",
  "Settings/SettingsHotkeys.tsx",
  "Settings/SettingsPlugins.tsx",
  "Settings/SettingsProxy.tsx",
  "Settings/SettingsCertificates.tsx",
];

components.forEach((comp) => {
  const compPath = path.join(__dirname, "../apps/yaak-client/components", comp);
  if (fs.existsSync(compPath)) {
    const content = fs.readFileSync(compPath, "utf-8");
    const hasUseTranslation = content.includes("useTranslation");
    const hasTranslationCalls = content.match(/t\("/g);
    const count = hasTranslationCalls ? hasTranslationCalls.length : 0;

    console.log(
      `${hasUseTranslation ? "✅" : "❌"} ${comp.padEnd(35)} - ${count} translation calls`,
    );
  } else {
    console.log(`⚠️  ${comp.padEnd(35)} - File not found`);
  }
});

console.log("\n4. Potential Issues\n");

console.log("Issue A: Value Binding");
console.log('  The value is bound to: settings.language || "auto"');
console.log('  Problem: When settings.language is null, shows "auto"');
console.log('  When user selects "zh-CN", it should save "zh-CN" to settings.language');
console.log('  But the dropdown might be showing "auto" because settings atom not updating\n');

console.log("Issue B: Settings Atom Update");
console.log("  changeLanguage calls: await patchModel(settings, { language })");
console.log("  This updates the database, but does the settingsAtom get updated?");
console.log("  The component uses: const settings = useAtomValue(settingsAtom)");
console.log("  Need to verify patchModel triggers atom update\n");

console.log("Issue C: Translation Coverage");
console.log("  Currently only SettingsInterface.tsx uses translations");
console.log("  Other Settings components are not internationalized");
console.log("  User won't see Chinese text in General, Theme, Hotkeys, etc.\n");

console.log("🔧 Recommended Fixes\n");

console.log("Fix 1: Debug the value binding");
console.log("  Add console.log to see actual settings.language value");
console.log("  Check if patchModel updates the atom correctly\n");

console.log("Fix 2: Verify patchModel behavior");
console.log("  Ensure patchModel triggers settingsAtom update");
console.log("  May need to add explicit atom update\n");

console.log("Fix 3: Expand translation coverage");
console.log("  Add useTranslation to other Settings components");
console.log("  Translate hardcoded English strings\n");
