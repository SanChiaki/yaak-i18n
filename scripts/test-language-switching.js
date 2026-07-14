#!/usr/bin/env node

/**
 * Test language switching functionality
 * This script checks the implementation of language switching in the UI
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Language Switching Analysis\n");

// Read the key files
const settingsInterfacePath = path.join(
  __dirname,
  "../apps/yaak-client/components/Settings/SettingsInterface.tsx",
);
const useLanguagePath = path.join(__dirname, "../apps/yaak-client/hooks/useLanguage.ts");
const globalHooksPath = path.join(__dirname, "../apps/yaak-client/components/GlobalHooks.tsx");

console.log("📄 Analyzing key files...\n");

// Check SettingsInterface.tsx
console.log("1️⃣  SettingsInterface.tsx - Language selector onChange handler");
const settingsContent = fs.readFileSync(settingsInterfacePath, "utf-8");

// Extract the onChange handler
const onChangeMatch = settingsContent.match(/onChange={async \(v\) => {[\s\S]*?}}/);
if (onChangeMatch) {
  console.log("   Found onChange handler:");
  console.log("   " + onChangeMatch[0].split("\n").join("\n   "));

  // Check for the bug
  if (
    onChangeMatch[0].includes('if (v === "auto")') &&
    onChangeMatch[0].includes("await patchModel(settings, { language: null })") &&
    !onChangeMatch[0].includes("i18n.changeLanguage")
  ) {
    console.log('   ⚠️  ISSUE FOUND: When switching to "auto", only patchModel is called');
    console.log('   ⚠️  The i18n.changeLanguage() is NOT called for "auto" selection');
    console.log("   ⚠️  This causes the UI language to not update immediately\n");
  }
} else {
  console.log("   ❌ Could not find onChange handler\n");
}

// Check useLanguage hook
console.log("2️⃣  useLanguage.ts - Hook implementation");
const useLanguageContent = fs.readFileSync(useLanguagePath, "utf-8");

// Check useEffect dependencies
const useEffectMatch = useLanguageContent.match(/useEffect\([^,]+,\s*\[([^\]]*)\]/);
if (useEffectMatch) {
  const deps = useEffectMatch[1].trim();
  console.log(`   useEffect dependencies: [${deps}]`);

  if (deps === "") {
    console.log("   ✅ Empty dependency array - runs only on mount");
    console.log("   ✅ This prevents the language reset bug\n");
  } else {
    console.log("   ⚠️  Non-empty dependencies - may cause re-initialization\n");
  }
}

// Check changeLanguage function
if (useLanguageContent.includes("const changeLanguage = async (language: string)")) {
  console.log("   ✅ changeLanguage function exists");

  // Check if it calls both i18n.changeLanguage and patchModel
  const changeLangFnMatch = useLanguageContent.match(
    /const changeLanguage = async \(language: string\) => {[\s\S]*?};/,
  );
  if (changeLangFnMatch) {
    const funcBody = changeLangFnMatch[0];
    const hasI18nChange = funcBody.includes("i18n.changeLanguage");
    const hasPatchModel = funcBody.includes("patchModel");

    console.log(`   ${hasI18nChange ? "✅" : "❌"} Calls i18n.changeLanguage()`);
    console.log(`   ${hasPatchModel ? "✅" : "❌"} Calls patchModel()\n`);
  }
}

// Summary
console.log("📊 Summary of Issues:\n");
console.log("Issue 1: Auto language selection");
console.log("  Location: SettingsInterface.tsx line ~66-71");
console.log('  Problem: When user selects "Auto", only patchModel is called');
console.log("  Impact: UI language does not update to system language immediately");
console.log('  Solution: Need to detect and apply system language when "auto" is selected\n');

console.log("Issue 2: Language state synchronization");
console.log("  Problem: The onChange handler has different code paths:");
console.log('    - "auto" → only updates DB (patchModel)');
console.log("    - specific language → updates both i18n and DB (changeLanguage)");
console.log('  Impact: Inconsistent behavior between "auto" and specific languages');
console.log("  Solution: Both paths should update i18n state\n");

console.log("🔧 Recommended Fix:\n");
console.log("Modify the onChange handler in SettingsInterface.tsx to:");
console.log(`
  onChange={async (v) => {
    if (v === "auto") {
      await patchModel(settings, { language: null });
      // Detect and apply system language
      const systemLocale = await locale();
      let targetLanguage = "en";
      if (systemLocale?.startsWith("zh-CN") ||
          systemLocale?.startsWith("zh-Hans") ||
          systemLocale?.startsWith("zh-SG")) {
        targetLanguage = "zh-CN";
      }
      await i18n.changeLanguage(targetLanguage);
    } else {
      await changeLanguage(v);
    }
  }}
`);

console.log("\n✅ Analysis complete!");
