# Yaak i18n Domain Model

## Glossary

### Locale

A language and optional region identifier (e.g., `en`, `zh-CN`). The canonical format is BCP 47 (language-region). Locale determines which translation resources are loaded.

- `en` — English (default fallback)
- `zh-CN` — Simplified Chinese

### Translation Namespace

A logical grouping of related translation keys, corresponding to a functional area of the application. Each namespace maps to a single JSON file per locale.

Namespaces:

- `common` — Shared UI elements (buttons, labels, actions)
- `settings` — Settings pages and configuration
- `request` — HTTP request editor and related features
- `response` — Response viewer and related features
- `workspace` — Workspace and folder management
- `errors` — Error messages and warnings

### Translation Key

A dot-notation path identifying a specific translatable string within a namespace. Format: `namespace:key.path`.

Examples:

- `common:save` → "Save" / "保存"
- `settings:language.title` → "Language" / "语言"
- `workspace:delete.confirm` → "Delete workspace '{{name}}'?" / "删除工作区 '{{name}}'？"

### Language Preference

The user's explicitly selected locale, stored in the Settings model. If not set, the system locale is detected and used.

### System Locale

The operating system's configured language, detected via Tauri API. Used as the default when no explicit Language Preference exists.

### Fallback Locale

The locale used when a translation key is missing in the user's selected locale. Always `en` (English).

### Translation Interpolation

Dynamic values inserted into translated strings using `{{variable}}` syntax. Supported by i18next.

Example: `"Delete workspace '{{name}}'?"` with `{ name: "My API" }` → `"Delete workspace 'My API'?"`

## Domain Rules

1. **Locale Detection Priority**: Language Preference (if set) → System Locale (if supported) → Fallback Locale (`en`)

2. **Missing Translation Behavior**: If a translation key doesn't exist in the selected locale, display the English version. Never show the raw key path.

3. **Namespace Lazy Loading**: Translation namespaces are loaded on-demand to optimize initial bundle size.

4. **Technical Term Policy**: API protocols (REST, GraphQL, gRPC), authentication methods (OAuth, JWT), and brand names remain in English across all locales. Action verbs and UI elements are translated.

5. **Settings Persistence**: Language Preference is stored in the Settings model and persists across sessions.

6. **Type Safety**: All translation keys are type-checked at compile time. Invalid keys produce TypeScript errors.
