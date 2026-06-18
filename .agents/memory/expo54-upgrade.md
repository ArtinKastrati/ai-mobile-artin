---
name: Expo SDK 54 upgrade quirks
description: Breaking changes and missing deps when upgrading from SDK 53 → 54 in a React Native / Expo Router project.
---

## Rule
When upgrading to Expo SDK 54 (expo-router v6, reanimated v4, RN 0.81):

1. **reanimated v4 babel plugin changed** — update `babel.config.js` from `'react-native-reanimated/plugin'` to `'react-native-worklets/plugin'`.
2. **react-native-worklets must be installed** — reanimated v4 lists it as a peerDep (`0.5 - 0.8`). Install `react-native-worklets@0.5.1` (Expo SDK 54's expected version; 0.8.x causes expo-doctor warnings).
3. **expo-linking must be installed** — expo-router v6 requires it explicitly (`expo-linking ^8.0.12`).
4. **@types/react peer conflict** — install with `--legacy-peer-deps`.
5. **Clean reinstall required** — after a major SDK bump, delete `node_modules` and `package-lock.json` before reinstalling to avoid corrupt module state.
6. **Metro cache must be cleared** — restart with `--clear` flag after changing `babel.config.js`.

**Why:** SDK 54 introduces reanimated v4 (worklets split into its own package) and expo-router v6 (expo-linking extracted). These are not listed as direct deps so they silently break bundling if missing.

**How to apply:** Any time the app is being upgraded from SDK 53 or lower to SDK 54+, run through this checklist before restarting Metro.
