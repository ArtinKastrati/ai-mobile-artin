---
name: Haptics web guard
description: expo-haptics crashes on web without a Platform.OS guard; use lib/haptics.ts wrapper.
---

## Rule
Never call expo-haptics APIs directly in components. Import from `@/lib/haptics` which guards all calls with `if (Platform.OS === 'web') return;`.

**Why:** On web, `Haptics.selectionAsync()` and `Haptics.impactAsync()` are not no-ops in older expo-haptics versions — they throw runtime errors. Even after upgrading to ~14.1.4, the guard provides a safe fallback for any edge case.

**How to apply:** Components should `import { haptics } from '@/lib/haptics'` and call `haptics.light()`, `haptics.medium()`, `haptics.heavy()`, or `haptics.selection()`.
