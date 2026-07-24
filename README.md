# rohandhruv.com

Personal site for Rohan Dhruv — finance & applied AI. Single-page React app whose
centerpiece is a live DCF valuation model.

## Run it

```bash
npm install
npm run dev
```

Then open the printed URL (default http://localhost:5173).

## Build

```bash
npm run build     # type-checks, then bundles to /dist
npm run preview   # serves the production build locally
```

## Where things are

- `DESIGN.md` — the source of truth for every design decision. Read it first.
- `src/lib/dcf.ts` — the valuation engine (pure functions).
- `src/components/hero/` — the signature live model + chart.
- `src/components/background/ContourField.tsx` — the WebGL ambient layer.
- `src/components/sections/` — experience, work, contact.
- `src/pages/DcfPage.tsx` — the full `/dcf` instrument.
