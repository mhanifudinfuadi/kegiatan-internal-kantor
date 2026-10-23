// Keep font loading out of the Next build pipeline. next/font/google generates
// an internal Turbopack module; loading the same families from the document
// head avoids a build-time dependency on that generated module.
export const fontDisplay = '"Shippori Mincho", "Noto Serif JP", Georgia, serif';
export const fontBody = '"Zen Kaku Gothic New", "Noto Sans JP", system-ui, sans-serif';
