#!/usr/bin/env node

/**
 * i18n Integration Test
 *
 * This script validates the i18n implementation by checking:
 * 1. All translation files are valid JSON
 * 2. Translation keys match between en and zh-CN
 * 3. i18n configuration is correct
 * 4. No missing interpolation variables
 */

const fs = require("fs");
const path = require("path");

const LOCALES_DIR = path.join(__dirname, "..", "apps", "yaak-client", "locales");
const NAMESPACES = ["common", "settings", "request", "workspace", "errors"];
const LANGUAGES = ["en", "zh-CN"];

let errors = 0;
let warnings = 0;

function log(type, message) {
  const colors = {
    success: "\x1b[32m✓\x1b[0m",
    error: "\x1b[31m✗\x1b[0m",
    warning: "\x1b[33m⚠\x1b[0m",
    info: "\x1b[36mℹ\x1b[0m",
  };
  console.log(`${colors[type] || ""} ${message}`);
}

function loadTranslations(lang, namespace) {
  const filePath = path.join(LOCALES_DIR, lang, `${namespace}.json`);
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (err) {
    log("error", `Failed to load ${lang}/${namespace}.json: ${err.message}`);
    errors++;
    return null;
  }
}

function getAllKeys(obj, prefix = "") {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getInterpolationVars(text) {
  const matches = text.match(/\{\{(\w+)\}\}/g);
  return matches ? matches.map((m) => m.slice(2, -2)) : [];
}

function testTranslationFiles() {
  log("info", "\n=== Testing Translation Files ===\n");

  for (const namespace of NAMESPACES) {
    log("info", `Testing namespace: ${namespace}`);

    const translations = {};
    for (const lang of LANGUAGES) {
      translations[lang] = loadTranslations(lang, namespace);
      if (translations[lang]) {
        log("success", `  ${lang}/${namespace}.json loaded successfully`);
      }
    }

    // Check if all languages have the same keys
    const enKeys = translations["en"] ? getAllKeys(translations["en"]) : [];
    const zhKeys = translations["zh-CN"] ? getAllKeys(translations["zh-CN"]) : [];

    if (enKeys.length > 0 && zhKeys.length > 0) {
      const enSet = new Set(enKeys);
      const zhSet = new Set(zhKeys);

      // Missing in Chinese
      const missingInZh = enKeys.filter((k) => !zhSet.has(k));
      if (missingInZh.length > 0) {
        log("warning", `  Keys missing in zh-CN: ${missingInZh.join(", ")}`);
        warnings += missingInZh.length;
      }

      // Missing in English
      const missingInEn = zhKeys.filter((k) => !enSet.has(k));
      if (missingInEn.length > 0) {
        log("warning", `  Keys missing in en: ${missingInEn.join(", ")}`);
        warnings += missingInEn.length;
      }

      if (missingInZh.length === 0 && missingInEn.length === 0) {
        log("success", `  All ${enKeys.length} keys match between en and zh-CN`);
      }

      // Check interpolation variables
      for (const key of enKeys) {
        const enValue = enKeys.includes(key) ? getValueByKey(translations["en"], key) : null;
        const zhValue = zhKeys.includes(key) ? getValueByKey(translations["zh-CN"], key) : null;

        if (enValue && zhValue && typeof enValue === "string" && typeof zhValue === "string") {
          const enVars = getInterpolationVars(enValue);
          const zhVars = getInterpolationVars(zhValue);

          if (enVars.length > 0 || zhVars.length > 0) {
            const enVarSet = new Set(enVars);
            const zhVarSet = new Set(zhVars);

            const mismatch =
              enVars.some((v) => !zhVarSet.has(v)) || zhVars.some((v) => !enVarSet.has(v));

            if (mismatch) {
              log("warning", `  Interpolation variable mismatch in key "${key}"`);
              log("info", `    en: ${enVars.join(", ") || "none"}`);
              log("info", `    zh: ${zhVars.join(", ") || "none"}`);
              warnings++;
            }
          }
        }
      }
    }

    console.log("");
  }
}

function getValueByKey(obj, key) {
  const keys = key.split(".");
  let value = obj;
  for (const k of keys) {
    if (value && typeof value === "object") {
      value = value[k];
    } else {
      return undefined;
    }
  }
  return value;
}

function testI18nConfig() {
  log("info", "=== Testing i18n Configuration ===\n");

  const i18nPath = path.join(__dirname, "..", "apps", "yaak-client", "i18n.ts");
  try {
    const content = fs.readFileSync(i18nPath, "utf8");

    // Check if all namespaces are imported
    for (const ns of NAMESPACES) {
      if (content.includes(`${ns}EN`) && content.includes(`${ns}ZH`)) {
        log("success", `Namespace "${ns}" is imported in i18n.ts`);
      } else {
        log("error", `Namespace "${ns}" is NOT properly imported in i18n.ts`);
        errors++;
      }
    }

    // Check if resources are configured
    if (content.includes("resources") && content.includes("fallbackLng")) {
      log("success", "i18n configuration looks correct");
    } else {
      log("error", "i18n configuration is incomplete");
      errors++;
    }
  } catch (err) {
    log("error", `Failed to read i18n.ts: ${err.message}`);
    errors++;
  }

  console.log("");
}

function testMainEntry() {
  log("info", "=== Testing Main Entry Point ===\n");

  const mainPath = path.join(__dirname, "..", "apps", "yaak-client", "main.tsx");
  try {
    const content = fs.readFileSync(mainPath, "utf8");

    if (content.includes('import "./i18n"')) {
      log("success", "i18n is imported in main.tsx");
    } else {
      log("error", "i18n is NOT imported in main.tsx");
      errors++;
    }
  } catch (err) {
    log("error", `Failed to read main.tsx: ${err.message}`);
    errors++;
  }

  console.log("");
}

function generateReport() {
  log("info", "=== Test Summary ===\n");

  console.log(`Total Namespaces: ${NAMESPACES.length}`);
  console.log(`Total Languages: ${LANGUAGES.length}`);
  console.log(`Total Translation Files: ${NAMESPACES.length * LANGUAGES.length}`);
  console.log("");

  if (errors === 0 && warnings === 0) {
    log("success", "All tests passed! i18n implementation is complete and correct.");
    return 0;
  } else {
    if (errors > 0) {
      log("error", `Found ${errors} error(s)`);
    }
    if (warnings > 0) {
      log("warning", `Found ${warnings} warning(s)`);
    }
    return errors > 0 ? 1 : 0;
  }
}

// Run tests
console.log("\n🌍 i18n Integration Test\n");
testTranslationFiles();
testI18nConfig();
testMainEntry();
const exitCode = generateReport();

process.exit(exitCode);
