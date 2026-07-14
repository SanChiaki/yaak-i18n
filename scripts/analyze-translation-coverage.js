#!/usr/bin/env node

/**
 * Comprehensive analysis of translation coverage
 */

const fs = require("fs");
const path = require("path");

console.log("🌍 Translation Coverage Report\n");
console.log("=".repeat(70) + "\n");

// Load translation files
const loadTranslations = (lang) => {
  const namespaces = ["common", "settings", "request", "workspace", "errors"];
  const translations = {};

  namespaces.forEach((ns) => {
    const filePath = path.join(__dirname, `../apps/yaak-client/locales/${lang}/${ns}.json`);
    if (fs.existsSync(filePath)) {
      translations[ns] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  });

  return translations;
};

const enTranslations = loadTranslations("en");
const zhTranslations = loadTranslations("zh-CN");

// Count translation keys
let totalKeys = 0;
console.log("📚 Available Translations by Namespace\n");

Object.keys(enTranslations).forEach((ns) => {
  const countKeys = (obj, prefix = "") => {
    let count = 0;
    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        count += countKeys(obj[key], prefix + key + ".");
      } else {
        count++;
      }
    }
    return count;
  };

  const count = countKeys(enTranslations[ns]);
  totalKeys += count;
  console.log(`  ${ns.padEnd(12)} - ${count} keys`);
});

console.log(`\n  Total: ${totalKeys} translation keys available\n`);

console.log("─".repeat(70) + "\n");

// Check which components use translations
console.log("🔍 Component Translation Usage\n");

const checkComponent = (relPath) => {
  const fullPath = path.join(__dirname, "../apps/yaak-client", relPath);
  if (!fs.existsSync(fullPath)) return null;

  const content = fs.readFileSync(fullPath, "utf-8");
  const hasUseTranslation = content.includes("useTranslation");
  const translationCalls = content.match(/\bt\(["']/g);
  const count = translationCalls ? translationCalls.length : 0;

  return { hasUseTranslation, count, content };
};

const componentsToCheck = [
  // Settings components
  { path: "components/Settings/Settings.tsx", area: "Settings Main" },
  { path: "components/Settings/SettingsGeneral.tsx", area: "Settings > General" },
  { path: "components/Settings/SettingsInterface.tsx", area: "Settings > Interface" },
  { path: "components/Settings/SettingsTheme.tsx", area: "Settings > Theme" },
  { path: "components/Settings/SettingsHotkeys.tsx", area: "Settings > Hotkeys" },
  { path: "components/Settings/SettingsPlugins.tsx", area: "Settings > Plugins" },
  { path: "components/Settings/SettingsProxy.tsx", area: "Settings > Proxy" },
  { path: "components/Settings/SettingsCertificates.tsx", area: "Settings > Certificates" },

  // Other potential components
  { path: "components/Workspace.tsx", area: "Workspace" },
  { path: "components/HttpRequest.tsx", area: "HTTP Request" },
  { path: "components/GlobalHooks.tsx", area: "Global Hooks" },
];

let usedCount = 0;
let unusedCount = 0;

componentsToCheck.forEach(({ path: relPath, area }) => {
  const result = checkComponent(relPath);
  if (!result) {
    console.log(`  ⚠️  ${area.padEnd(30)} - File not found`);
    return;
  }

  if (result.hasUseTranslation) {
    console.log(`  ✅ ${area.padEnd(30)} - ${result.count} translation calls`);
    usedCount++;
  } else {
    console.log(`  ❌ ${area.padEnd(30)} - Not internationalized`);
    unusedCount++;
  }
});

console.log(`\n  Summary: ${usedCount} components use i18n, ${unusedCount} don't\n`);

console.log("─".repeat(70) + "\n");

// Extract hardcoded strings from Settings components
console.log("📝 Hardcoded English Strings in Settings (samples)\n");

const settingsComponents = [
  "components/Settings/SettingsGeneral.tsx",
  "components/Settings/SettingsTheme.tsx",
  "components/Settings/SettingsHotkeys.tsx",
];

settingsComponents.forEach((comp) => {
  const result = checkComponent(comp);
  if (!result) return;

  // Find hardcoded strings (simple heuristic)
  const hardcodedMatches = result.content.match(/title="[^"]+"|description="[^"]+"|label="[^"]+"/g);

  if (hardcodedMatches && hardcodedMatches.length > 0) {
    console.log(`  ${comp}:`);
    hardcodedMatches.slice(0, 3).forEach((match) => {
      console.log(`    ${match}`);
    });
    if (hardcodedMatches.length > 3) {
      console.log(`    ... and ${hardcodedMatches.length - 3} more`);
    }
    console.log();
  }
});

console.log("─".repeat(70) + "\n");

console.log("🎯 Summary and Recommendations\n");

console.log("Current State:");
console.log(`  • ${totalKeys} translation keys available (EN + ZH-CN)`);
console.log(`  • Only 1 component fully internationalized (SettingsInterface.tsx)`);
console.log(`  • Settings tabs still show English titles ("General", "Theme", etc.)`);
console.log(`  • Most UI elements are hardcoded in English\n`);

console.log('Why User Only Sees "界面" in Chinese:');
console.log(`  • "界面" is in settings.json and used in SettingsInterface.tsx`);
console.log(`  • Other tabs (General, Theme, etc.) are hardcoded in English`);
console.log(`  • Settings navigation sidebar not internationalized\n`);

console.log("To Expand Chinese Coverage:");
console.log("  1. Add useTranslation to Settings.tsx (main navigation)");
console.log("  2. Add useTranslation to SettingsGeneral.tsx");
console.log("  3. Add useTranslation to SettingsTheme.tsx");
console.log("  4. Add useTranslation to SettingsHotkeys.tsx");
console.log("  5. Replace hardcoded strings with t() calls\n");

console.log("Priority:");
console.log("  🔴 HIGH: Fix language reset issue (dropdown shows Auto after selection)");
console.log("  🟡 MEDIUM: Internationalize Settings navigation tabs");
console.log("  🟢 LOW: Internationalize other app areas (workspace, requests, etc.)\n");
