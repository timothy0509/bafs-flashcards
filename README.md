# BAFS Flashcards

Flashcards for memorising the 16 HKDSE BAFS accounting ratios: profitability, liquidity, efficiency, solvency and return on investment.

Stack: Vite + React + Tailwind CSS v4 + KaTeX for formula rendering. No backend, progress saved in `localStorage`.

## Run it

```bash
bun install
bun run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## What is inside

- `src/data.js` — all 16 ratios with LaTeX formulas, plain-text versions, meanings and memory hooks
- `src/App.jsx` — three modes: Flashcards (flip, shuffle, filter, keyboard: Space / arrows), Quiz (multiple choice with explanations), All formulas (searchable reference)
- Formulas render with KaTeX; cards track known vs learning state in `localStorage`
