// Temporary init script for Playwright MCP to override browser locale
// This runs before any page scripts, so i18next will detect 'ja' from navigator
Object.defineProperty(navigator, "language", { get: () => "ja" });
Object.defineProperty(navigator, "languages", { get: () => ["ja", "ja-JP"] });
