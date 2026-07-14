# ADR 0001: Use react-i18next for Internationalization

## Status

Accepted

## Context

Yaak needs internationalization (i18n) support to serve users in multiple languages, starting with English and Simplified Chinese. The application is built with React, TypeScript, and Tauri.

Key requirements:

- Support multiple locales with easy addition of new languages
- Type-safe translation keys to prevent runtime errors
- Namespace-based organization for maintainability
- Lazy loading for optimal bundle size
- System locale detection via Tauri API
- Interpolation for dynamic content

Alternatives considered:

1. **react-i18next** — React bindings for i18next
2. **react-intl** (FormatJS) — Comprehensive internationalization with focus on formatting
3. **lingui** — Compile-time optimization with smaller bundles
4. **typesafe-i18n** — Zero-dependency, strong type safety

## Decision

Use **react-i18next** with i18next core.

## Rationale

**Chosen: react-i18next**

- Most mature and widely adopted solution (14k+ stars, active maintenance)
- Excellent TypeScript support via community types and plugins
- Rich feature set: namespaces, interpolation, pluralization, context
- Lazy loading built-in via `react-i18next` backend plugins
- Large ecosystem with tooling (extraction, validation)
- Well-documented patterns for React hooks (`useTranslation`)
- No vendor lock-in — JSON-based translations are portable

**Why not react-intl:**

- More verbose API requiring `FormattedMessage` components
- Primarily focused on number/date formatting (we're using date-fns for that)
- Less flexible namespace organization

**Why not lingui:**

- Smaller ecosystem and community
- Less mature TypeScript tooling
- Compile step adds build complexity

**Why not typesafe-i18n:**

- Relatively new, smaller community
- Would need custom Tauri integration patterns
- i18next's maturity reduces risk

## Consequences

### Positive

- Leverage battle-tested library with proven Tauri compatibility
- TypeScript type generation via `i18next-typescript` or custom types
- Easy future expansion (more languages, pluralization rules)
- Community solutions for common patterns

### Negative

- Adds ~50KB to bundle (mitigated by tree-shaking and lazy loading)
- Learning curve for contributors unfamiliar with i18next

### Neutral

- Need to configure namespace loading strategy
- Need to integrate with Tauri's locale detection API
