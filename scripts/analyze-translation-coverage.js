#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const repoRoot = path.resolve(__dirname, "..");
const clientDir = path.join(repoRoot, "apps/yaak-client");
const proxyDir = path.join(repoRoot, "apps/yaak-proxy");
const proxyLocaleDir = path.join(proxyDir, "locales");
const localeDir = path.join(repoRoot, "apps/yaak-client/locales");
const sharedUiDir = path.join(repoRoot, "packages/ui/src");
const pluginDirs = [path.join(repoRoot, "plugins"), path.join(repoRoot, "plugins-external")];
const namespaces = ["common", "errors", "request", "settings", "workspace"];
const userFacingProperties = new Set([
  "aria-label",
  "ariaLabel",
  "actionLabel",
  "alt",
  "body",
  "cancelText",
  "confirmText",
  "content",
  "description",
  "emptyText",
  "help",
  "info",
  "label",
  "loadingChildren",
  "message",
  "noun",
  "noResultsText",
  "placeholder",
  "resetTitle",
  "subtitle",
  "tooltip",
  "title",
]);
const technicalPlaceholders = new Set([
  "127.0.0.1, *.example.com, localhost:3000",
  "443",
  "YK1-XXXXX-XXXXX-XXXXX-XXXXX",
  "example.com",
  "localhost:9090",
  "localhost:50051",
  "myUser",
  "s3cretPassw0rd",
  "https://example.com",
  "wss://example.com",
  "api.example.com",
  "myfile.png",
  "text/plain",
  "YK0000-111111-222222-333333-444444-AAAAAA-BBBBBB-CCCCCC-DDDDDD",
  "https://github.com/user/repo.git",
  "path/to/workspace",
]);
const technicalVisibleText = new Set([
  "/etc/hosts",
  "&bull;",
  "&nbsp;",
  "Content-Type",
  "Content-Length",
  "Accept",
  "Accept-Encoding",
  "Accept-Language",
  "Authorization",
  "DNS",
  "Emacs",
  "GraphQL",
  "HTTP",
  "JSON",
  "JSONPath expression",
  "Lax",
  "Markdown",
  "None",
  "Strict",
  "URL",
  "VSCode",
  "Vim",
  "WebSocket",
  "XML",
  "XPath expression",
  "gRPC",
  "http://",
  "https://",
  "info",
  "true",
  "CUSTOM",
  "OpenAPI 3.0, 3.1",
  "Postman Collection v2, v2.1",
  "Insomnia v4+",
  "Swagger 2.0",
  "&rarr;",
  "ms",
  "*.proto",
  ".proto",
  ":&nbsp;",
  "&nbsp;&nbsp;",
  "settings",
  "Yaak v",
  "Yaak Proxy",
]);
const technicalPluginText = new Set([
  '{ "foo": "bar" }',
  "//foo",
  "/books[0]/id",
  "<foo></foo>",
  "$..foo",
  "$.books[0].id",
  "$.books[0].id or /books[0]/id",
  "24ced880-3bf4-11f0-8329-cd053d577f0e",
  "access_token",
  "ASCII",
  "Base64",
  "Base64 URL-safe",
  "cookie_name",
  'e.g. { "min": 1, "max": 10 } or 10 or ["en","US"]',
  "example.com",
  'Hello "World"',
  "hello $1",
  "Hexadecimal",
  "https://mysite.example.com/oauth/callback",
  "id_token",
  "Latin-1",
  "oauth-authorization-url",
  "SHA-256",
  "sts",
  "us-east-1",
  "UTF-16 LE",
  "UTF-8",
  "yyyy-MM-dd HH:mm:ss",
]);
const pluginUserFacingProperties = new Set([
  "cancelText",
  "confirmText",
  "content",
  "description",
  "label",
  "message",
  "placeholder",
  "title",
]);
const coveredFiles = [
  "commands/createEnvironment.tsx",
  "components/CookieDialog.tsx",
  "components/CookieDropdown.tsx",
  "components/CommandPaletteDialog.tsx",
  "components/CreateEnvironmentDialog.tsx",
  "components/CreateWorkspaceDialog.tsx",
  "components/DnsOverridesEditor.tsx",
  "components/EnvironmentEditor.tsx",
  "components/EnvironmentActionsDropdown.tsx",
  "components/FolderSettingsDialog.tsx",
  "components/GrpcRequestPane.tsx",
  "components/GrpcResponsePane.tsx",
  "components/HttpRequestPane.tsx",
  "components/HttpResponsePane.tsx",
  "components/HttpResponseTimeline.tsx",
  "components/MarkdownEditor.tsx",
  "components/RequestBodyViewer.tsx",
  "components/ResponseCookies.tsx",
  "components/ResponseHeaders.tsx",
  "components/ResponseInfo.tsx",
  "components/SettingsDropdown.tsx",
  "components/SidebarActions.tsx",
  "components/SwitchWorkspaceDialog.tsx",
  "components/SyncToFilesystemSetting.tsx",
  "components/WorkspaceActionsDropdown.tsx",
  "components/WorkspaceEncryptionSetting.tsx",
  "components/WorkspaceHeader.tsx",
  "components/WorkspaceSettingsDialog.tsx",
  "components/WebsocketRequestPane.tsx",
  "components/WebsocketResponsePane.tsx",
  "components/core/AutoScroller.tsx",
  "components/core/Confirm.tsx",
  "components/core/Dialog.tsx",
  "components/core/DismissibleBanner.tsx",
  "components/core/Dropdown.tsx",
  "components/core/Editor/Editor.tsx",
  "components/core/EventViewer.tsx",
  "components/core/Input.tsx",
  "components/core/PairEditor.tsx",
  "components/core/SettingRow.tsx",
  "components/core/Toast.tsx",
  "hooks/useAuthTab.tsx",
  "hooks/useCreateCookieJar.ts",
  "hooks/useCreateDropdownItems.tsx",
  "hooks/useCreateWorkspace.tsx",
  "hooks/useHeadersTab.tsx",
];

function flattenKeys(value, prefix = "", result = []) {
  for (const [key, child] of Object.entries(value)) {
    const childPath = prefix ? `${prefix}.${key}` : key;
    if (child != null && typeof child === "object" && !Array.isArray(child)) {
      flattenKeys(child, childPath, result);
    } else {
      result.push(childPath);
    }
  }
  return result;
}

function readTranslations(locale, namespace) {
  const filePath = path.join(localeDir, locale, `${namespace}.json`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function collectSourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(entryPath);
    if (!entry.name.endsWith(".tsx") && !entry.name.endsWith(".ts")) return [];
    return [path.relative(clientDir, entryPath)];
  });
}

function collectAbsoluteSourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectAbsoluteSourceFiles(entryPath);
    if (!entry.name.endsWith(".tsx") && !entry.name.endsWith(".ts")) return [];
    return [entryPath];
  });
}

function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function isHardcodedUserText(value, propertyName = null) {
  const text = normalizeText(value);
  if (!/[A-Za-z]{2}/.test(text)) return false;
  if (technicalVisibleText.has(text)) return false;
  if (propertyName === "placeholder" && technicalPlaceholders.has(text)) return false;
  return true;
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
  return null;
}

function findHardcodedStrings(filePath) {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const source = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const findings = [];

  function add(node, value, context) {
    if (!isHardcodedUserText(value, context)) return;
    const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
    findings.push({ line: line + 1, text: normalizeText(value) });
  }

  function addStaticExpression(node, context) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      add(node, node.text, context);
    } else if (ts.isConditionalExpression(node)) {
      addStaticExpression(node.whenTrue, context);
      addStaticExpression(node.whenFalse, context);
    } else if (
      ts.isBinaryExpression(node) &&
      [
        ts.SyntaxKind.AmpersandAmpersandToken,
        ts.SyntaxKind.BarBarToken,
        ts.SyntaxKind.PlusToken,
        ts.SyntaxKind.QuestionQuestionToken,
      ].includes(node.operatorToken.kind)
    ) {
      addStaticExpression(node.left, context);
      addStaticExpression(node.right, context);
    } else if (ts.isParenthesizedExpression(node)) {
      addStaticExpression(node.expression, context);
    } else if (ts.isTemplateExpression(node)) {
      add(node.head, node.head.text, context);
      for (const span of node.templateSpans) {
        add(span.literal, span.literal.text, context);
      }
    }
  }

  function visit(node) {
    if (ts.isJsxText(node)) {
      add(node, node.text, "jsx-text");
    } else if (ts.isJsxAttribute(node) && userFacingProperties.has(node.name.text)) {
      if (node.initializer && ts.isStringLiteral(node.initializer)) {
        add(node, node.initializer.text, node.name.text);
      } else if (
        node.initializer &&
        ts.isJsxExpression(node.initializer) &&
        node.initializer.expression
      ) {
        addStaticExpression(node.initializer.expression, node.name.text);
      }
    } else if (ts.isJsxExpression(node) && !ts.isJsxAttribute(node.parent) && node.expression) {
      addStaticExpression(node.expression, "jsx-expression");
    } else if (ts.isPropertyAssignment(node)) {
      const name = propertyName(node.name);
      if (name && userFacingProperties.has(name)) {
        addStaticExpression(node.initializer, name);
      }
    } else if (
      ts.isParameter(node) &&
      ts.isIdentifier(node.name) &&
      userFacingProperties.has(node.name.text) &&
      node.initializer
    ) {
      addStaticExpression(node.initializer, node.name.text);
    } else if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(node.left) &&
      (["innerText", "textContent"].includes(node.left.name.text) ||
        userFacingProperties.has(node.left.name.text))
    ) {
      addStaticExpression(node.right, node.left.name.text);
    } else if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "showSimpleAlert"
    ) {
      for (const argument of node.arguments) addStaticExpression(argument, "alert");
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  return findings;
}

function findTranslationKeys(filePath) {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const source = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const keys = [];

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const isTranslationCall =
        (ts.isIdentifier(callee) && callee.text === "t") ||
        (ts.isPropertyAccessExpression(callee) && callee.name.text === "t");
      const firstArg = node.arguments[0];
      if (
        isTranslationCall &&
        firstArg &&
        (ts.isStringLiteral(firstArg) || ts.isNoSubstitutionTemplateLiteral(firstArg)) &&
        firstArg.text.includes(":")
      ) {
        const { line } = source.getLineAndCharacterOfPosition(firstArg.getStart(source));
        keys.push({ key: firstArg.text, line: line + 1 });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  return keys;
}

function findProxyTranslationKeys(filePath) {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const source = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const keys = [];

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const isTranslationCall =
        (ts.isIdentifier(callee) && callee.text === "t") ||
        (ts.isPropertyAccessExpression(callee) && callee.name.text === "t");
      const firstArg = node.arguments[0];
      if (
        isTranslationCall &&
        firstArg &&
        (ts.isStringLiteral(firstArg) || ts.isNoSubstitutionTemplateLiteral(firstArg))
      ) {
        const { line } = source.getLineAndCharacterOfPosition(firstArg.getStart(source));
        keys.push({ key: firstArg.text, line: line + 1 });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  return keys;
}

function readBuiltInPluginText() {
  const filePath = path.join(clientDir, "lib/localizePluginText.ts");
  const sourceText = fs.readFileSync(filePath, "utf8");
  const source = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);
  const texts = new Set();

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(source) === "builtInPluginTextKeys" &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      for (const property of node.initializer.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const name = propertyName(property.name);
        if (name) texts.add(name);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  return texts;
}

function findUnmappedPluginText(filePath, mappedText) {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const source = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);
  const findings = [];

  function staticText(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isParenthesizedExpression(node)) return staticText(node.expression);
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const left = staticText(node.left);
      const right = staticText(node.right);
      return left == null || right == null ? null : left + right;
    }
    return null;
  }

  function visit(node) {
    if (ts.isPropertyAssignment(node)) {
      const name = propertyName(node.name);
      const value = staticText(node.initializer);
      if (name && pluginUserFacingProperties.has(name) && value != null) {
        const text = normalizeText(value);
        if (/[A-Za-z]{2}/.test(text) && !technicalPluginText.has(text) && !mappedText.has(value)) {
          const { line } = source.getLineAndCharacterOfPosition(node.initializer.getStart(source));
          findings.push({ line: line + 1, text });
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  return findings;
}

const enKeys = namespaces
  .flatMap((namespace) =>
    flattenKeys(readTranslations("en", namespace)).map((key) => `${namespace}:${key}`),
  )
  .sort();
const zhKeys = namespaces
  .flatMap((namespace) =>
    flattenKeys(readTranslations("zh-CN", namespace)).map((key) => `${namespace}:${key}`),
  )
  .sort();
const missingFromChinese = enKeys.filter((key) => !zhKeys.includes(key));
const missingFromEnglish = zhKeys.filter((key) => !enKeys.includes(key));
const sourceFiles = collectSourceFiles(clientDir).filter(
  (name) => !name.endsWith(".test.ts") && !name.endsWith(".test.tsx"),
);
const files = [...new Set([...sourceFiles, ...coveredFiles])].sort();
const hardcoded = files.flatMap((name) =>
  findHardcodedStrings(path.join(clientDir, name)).map((finding) => ({ file: name, ...finding })),
);
const definedKeys = new Set(enKeys);
function hasDefinedTranslation(key) {
  return definedKeys.has(key) || (definedKeys.has(`${key}_one`) && definedKeys.has(`${key}_other`));
}
const missingUsedKeys = files.flatMap((name) =>
  findTranslationKeys(path.join(clientDir, name))
    .filter(({ key }) => !hasDefinedTranslation(key))
    .map((finding) => ({ file: name, ...finding })),
);
const sharedUiFiles = collectAbsoluteSourceFiles(sharedUiDir);
const hardcodedSharedUi = sharedUiFiles.flatMap((filePath) =>
  findHardcodedStrings(filePath).map((finding) => ({
    file: path.relative(repoRoot, filePath),
    ...finding,
  })),
);
const proxySourceFiles = collectAbsoluteSourceFiles(proxyDir).filter(
  (filePath) => !filePath.endsWith(".test.ts") && !filePath.endsWith(".test.tsx"),
);
const proxyEnKeys = flattenKeys(
  JSON.parse(fs.readFileSync(path.join(proxyLocaleDir, "en.json"), "utf8")),
).sort();
const proxyZhKeys = flattenKeys(
  JSON.parse(fs.readFileSync(path.join(proxyLocaleDir, "zh-CN.json"), "utf8")),
).sort();
const proxyMissingFromChinese = proxyEnKeys.filter((key) => !proxyZhKeys.includes(key));
const proxyMissingFromEnglish = proxyZhKeys.filter((key) => !proxyEnKeys.includes(key));
const proxyDefinedKeys = new Set(proxyEnKeys);
const missingProxyUsedKeys = proxySourceFiles.flatMap((filePath) =>
  findProxyTranslationKeys(filePath)
    .filter(({ key }) => !proxyDefinedKeys.has(key))
    .map((finding) => ({ file: path.relative(repoRoot, filePath), ...finding })),
);
const hardcodedProxy = proxySourceFiles.flatMap((filePath) =>
  findHardcodedStrings(filePath).map((finding) => ({
    file: path.relative(repoRoot, filePath),
    ...finding,
  })),
);
const builtInPluginText = readBuiltInPluginText();
const pluginSourceFiles = pluginDirs
  .flatMap(collectAbsoluteSourceFiles)
  .filter(
    (filePath) =>
      !filePath.includes(`${path.sep}tests${path.sep}`) &&
      !filePath.includes(`${path.sep}themes${path.sep}`) &&
      !filePath.includes(
        `${path.sep}plugins-external${path.sep}mcp-server${path.sep}src${path.sep}tools${path.sep}`,
      ),
  );
const unmappedPluginText = pluginSourceFiles.flatMap((filePath) =>
  findUnmappedPluginText(filePath, builtInPluginText).map((finding) => ({
    file: path.relative(repoRoot, filePath),
    ...finding,
  })),
);

console.log("Client translation coverage");
console.log(`  English keys: ${enKeys.length}`);
console.log(`  Chinese keys: ${zhKeys.length}`);
console.log(`  Client files scanned: ${files.length}`);
console.log(`  Proxy English keys: ${proxyEnKeys.length}`);
console.log(`  Proxy Chinese keys: ${proxyZhKeys.length}`);

if (missingFromChinese.length > 0) {
  console.error(`\nMissing from zh-CN/settings.json:\n  ${missingFromChinese.join("\n  ")}`);
}
if (missingFromEnglish.length > 0) {
  console.error(`\nMissing from en/settings.json:\n  ${missingFromEnglish.join("\n  ")}`);
}
if (hardcoded.length > 0) {
  console.error("\nHardcoded user-facing English in covered client files:");
  for (const finding of hardcoded) {
    console.error(`  ${finding.file}:${finding.line} ${JSON.stringify(finding.text)}`);
  }
}
if (missingUsedKeys.length > 0) {
  console.error("\nTranslation keys used by code but missing from locale resources:");
  for (const finding of missingUsedKeys) {
    console.error(`  ${finding.file}:${finding.line} ${finding.key}`);
  }
}
if (hardcodedSharedUi.length > 0) {
  console.error("\nHardcoded user-facing English in shared UI files:");
  for (const finding of hardcodedSharedUi) {
    console.error(`  ${finding.file}:${finding.line} ${JSON.stringify(finding.text)}`);
  }
}
if (hardcodedProxy.length > 0) {
  console.error("\nHardcoded user-facing English in proxy UI files:");
  for (const finding of hardcodedProxy) {
    console.error(`  ${finding.file}:${finding.line} ${JSON.stringify(finding.text)}`);
  }
}
if (proxyMissingFromChinese.length > 0) {
  console.error(`\nProxy keys missing from zh-CN.json:\n  ${proxyMissingFromChinese.join("\n  ")}`);
}
if (proxyMissingFromEnglish.length > 0) {
  console.error(`\nProxy keys missing from en.json:\n  ${proxyMissingFromEnglish.join("\n  ")}`);
}
if (missingProxyUsedKeys.length > 0) {
  console.error("\nTranslation keys used by proxy code but missing from locale resources:");
  for (const finding of missingProxyUsedKeys) {
    console.error(`  ${finding.file}:${finding.line} ${finding.key}`);
  }
}
if (unmappedPluginText.length > 0) {
  console.error("\nBuilt-in plugin text missing from the client localization boundary:");
  for (const finding of unmappedPluginText) {
    console.error(`  ${finding.file}:${finding.line} ${JSON.stringify(finding.text)}`);
  }
}

if (
  missingFromChinese.length ||
  missingFromEnglish.length ||
  hardcoded.length ||
  missingUsedKeys.length ||
  hardcodedSharedUi.length ||
  hardcodedProxy.length ||
  proxyMissingFromChinese.length ||
  proxyMissingFromEnglish.length ||
  missingProxyUsedKeys.length ||
  unmappedPluginText.length
) {
  process.exitCode = 1;
} else {
  console.log("  Hardcoded user-facing English: 0");
  console.log("  Hardcoded shared UI English: 0");
  console.log("  Hardcoded proxy UI English: 0");
  console.log("  Unmapped built-in plugin text: 0");
}
