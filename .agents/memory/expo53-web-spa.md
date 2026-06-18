---
name: Expo 53 web SPA mode
description: expo-router v5 requires React.use() which breaks SSR on web; fix with single output mode.
---

## Rule
Set `"output": "single"` (not `"static"`) in `app.json` under `expo.web` when using expo-router v5 + React 19.

**Why:** expo-router v5 calls `React.use()` inside `useExpoRouterStore` via `storeContext.js`. When web output is `"static"`, Metro runs a server-side render (λ routes) using `react-dom-server-legacy` which doesn't expose `React.use`, causing `TypeError: (0, react_1.use) is not a function` and a blank app.

**How to apply:** Any new FoodRush-style Expo project targeting web with expo-router v5+ must use `"output": "single"` to skip SSR and serve a pure client-side bundle.
