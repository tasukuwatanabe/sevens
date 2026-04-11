# Type Safety Guidelines

## Overview

This project enforces strict type safety to prevent runtime errors and improve code quality.

## Linting Rules

- **`@typescript-eslint/no-explicit-any`** — Forbidden
  - Enforced by `vite.config.ts`
  - Run `vp check` to catch violations

## Type Assertions Best Practices

### Problem with Type Assertions

Type assertions (`as TypeName`) bypass TypeScript's type checking and are unsafe:

```ts
// ❌ Unsafe - no type checking
const card = someCard as NormalCard;
```

### Solution: Use Type Guards

Type guards let TypeScript automatically narrow types:

```ts
// ✅ Safe - TypeScript checks this
if (isNormalCard(card)) {
  // card is guaranteed to be NormalCard here
  card.suit; // ✓ type-safe access
}
```

## Creating Type Guards

Use the `is` keyword to create type predicates:

```ts
export function isNormalCard(card: Card): card is NormalCard {
  return !isJokerCard(card);
}
```

After the check, TypeScript automatically narrows the type:

```ts
const card: Card = getCard();

if (isNormalCard(card)) {
  // Inside this block, card is narrowed to NormalCard
  console.log(card.suit); // ✓ TypeScript knows this property exists
}
```

## Function Overloads

When a function handles multiple input types differently:

```ts
// Define overloads for each input type
function processCard(card: JokerCard): void;
function processCard(card: NormalCard): void;

// Implementation handles all cases
function processCard(card: Card): void {
  if (isJokerCard(card)) {
    // handle joker
  } else if (isNormalCard(card)) {
    // handle normal card
  }
}
```

## Available Type Guards

Located in `app/utils/card.ts`:

- `isJokerCard(card: Card): card is JokerCard`
- `isNormalCard(card: Card): card is NormalCard`

## Examples in This Project

### Example 1: app/utils/joker.ts

```ts
export function getCompanionLabel(card?: Card): string {
  if (!card || !isNormalCard(card)) return "";
  // card is now narrowed to NormalCard
  return `${suitSymbol(card.suit)}${rankLabel(card.rank)}`;
}
```

### Example 2: Tests

```ts
// ✅ Good: Check type first, then access properties
expect(deck.filter((c) => isNormalCard(c) && c.suit === suit)).toHaveLength(13);
```

## Summary

| Approach               | Safety    | Readability            |
| ---------------------- | --------- | ---------------------- |
| Type assertions (`as`) | ❌ Unsafe | ❌ Unclear intent      |
| Type guards (`is`)     | ✅ Safe   | ✅ Clear type flow     |
| Function overloads     | ✅ Safe   | ✅ Explicit signatures |

Always prefer type guards over assertions.
