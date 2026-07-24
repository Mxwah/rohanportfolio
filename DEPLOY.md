# Deploying rohandhruv.com

This is a static Vite single-page app plus one serverless function (`api/fred.js`
for the macro act's live data). Recommended host: **Vercel** (zero-config for
Vite + serverless, generous free tier). The build command is `npm run build`,
the output is `dist/`, both already configured.

The site works fully without the serverless function and without the domain.
Every step below is additive: nothing here can break the current live site
until the very last step (the domain cutover), which is called out clearly.

---

## Step 1 — Get a free FRED API key (2 minutes)

The macro act shows live US CPI and unemployment. Without a key it silently
shows the built-in June 2026 snapshot, so this is optional but nice.

1. Go to https://fredaccount.stlouisfed.org/apikeys and sign up (free).
2. Create an API key. Copy it. You'll paste it into Vercel in Step 3.

## Step 2 — Deploy a PREVIEW (does not touch rohandhruv.com)

You have two ways. The CLI is fastest for a first look.

**Option A — Vercel CLI (no GitHub needed):**
```bash
npm i -g vercel
cd C:\Users\rohan.dhruv\dev\rohandhruv-com
vercel
```
Answer the prompts (accept defaults; framework auto-detects as Vite). It prints
a preview URL like `https://rohandhruv-com-xxxx.vercel.app`. Open it and check
everything.

**Option B — GitHub + Vercel dashboard (best for ongoing updates):**
```bash
cd C:\Users\rohan.dhruv\dev\rohandhruv-com
git init && git add . && git commit -m "Initial commit"
```
Push to a new GitHub repo, then on vercel.com: New Project -> import the repo ->
Deploy. Every future `git push` auto-deploys.

## Step 3 — Add the FRED key

Vercel dashboard -> your project -> Settings -> Environment Variables:
- Name: `FRED_API_KEY`
- Value: the key from Step 1
- Environments: Production + Preview

Then redeploy (CLI: `vercel --prod`, or push again). The macro strip will read
"Live from FRED"; before this it reads "Monthly snapshot."

## Step 4 — Verify the preview

On the preview URL, confirm:
- The river hero loads and drags re-route it.
- `/dcf` loads on a hard refresh (this is what `vercel.json` handles; if it
  404s, the rewrite didn't apply).
- The Resume button downloads the PDF.
- The macro strip shows live numbers (if you did Step 3).
- Open it on your phone.

## Step 5 — Domain cutover (LAST; this replaces the current live site)

The old TanStack/Lovable site currently serves rohandhruv.com. Only do this once
the preview above is right, because this is the step that flips the public site.

1. `vercel --prod` (or merge to your main branch) to promote the preview to the
   project's production deployment.
2. Vercel dashboard -> project -> Settings -> Domains -> add `rohandhruv.com`
   and `www.rohandhruv.com`.
3. Vercel shows the exact DNS records to set. Update them at whoever manages the
   domain's DNS today (the old site's host / registrar). This is the only
   irreversible-ish step; DNS can take up to a few hours to propagate.
4. Keep the old deployment reachable somewhere until DNS fully propagates, in
   case you need to point back.

---

## Notes

- **SPA routing**: `vercel.json` rewrites everything except `/api/*` to
  `index.html` so client routes like `/dcf` work on direct load. Real files in
  `public/` (the resume PDF, favicon) are served before the rewrite.
- **Switching to Netlify instead**: move `api/fred.js` to
  `netlify/functions/fred.js` (rename `handler` export style to Netlify's), add
  a `netlify.toml` with `[[redirects]] from="/*" to="/index.html" status=200`
  (and one for `/api/fred` -> the function), set `FRED_API_KEY` in Netlify env.
  Vercel is simpler; only switch if you already live on Netlify.
- **No secrets in the repo**: the FRED key lives only in the host's env vars.
  `.gitignore` already excludes `node_modules` and `dist`.
