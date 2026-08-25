# Gradely — Interactive Proposal

The post-lecture learning loop that closes the gap from **lecture → placement**.

`Session → Summary → Quiz → Assignment → Micro-revision bytes → Progress tracking → Placement eligibility gate`

This repo is a single self-contained `index.html` — an interactive product proposal with three live demos:

1. **Auto-generated quiz** — answer a real scenario question, get instant scoring + feedback.
2. **Placement eligibility engine** — move sliders to set hiring criteria and watch the eligible student pool recompute live.
3. **Instructor dashboard** — cohort KPIs, quiz trends, and at-risk signals.

Plus a clickable learning-loop diagram, module deep-dives, a strategic analysis, and the six key product decisions.

## Host it on GitHub Pages

1. Create a repo and push these files (`index.html` must be at the repo root):
   ```bash
   git init
   git add .
   git commit -m "Gradely interactive proposal"
   git branch -M main
   git remote add origin https://github.com/<you>/gradely.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, pick `main` / `/root`, **Save**.
3. Your page goes live at `https://<you>.github.io/gradely/` in ~1 minute.

No build step, no dependencies — it's pure HTML/CSS/JS and works offline (just open `index.html`).

## Editing

Everything lives in `index.html`. Content is driven by small JS arrays near the bottom you can edit without touching layout:

- `loopData` — the 6 loop stages
- `modules` — the module tab content
- `quiz` — the demo quiz questions
- `students` — the cohort used by the eligibility simulator
- `decisions` — the six "forks in the road"

Light/dark theme toggles from the 🌙 button in the nav.
