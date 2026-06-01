# tamga

Type-safe nominal branding utilities for TypeScript.

`tamga` is named after a historical ownership mark: a seal, stamp, or brand used to identify property and origin. The library uses that idea for TypeScript values: a value keeps its runtime shape, but gets a distinct nominal type mark.

## Recommended Path

The recommended path is to implement Tamga directly in your own project, language, or package structure from the specification:

> Implement Tamga according to the following spec:
> https://github.com/MrFlashAccount/tamga/blob/main/SPEC.md

## Reference Implementation

This repository is the TypeScript reference implementation of the Tamga specification. Use it to validate expected API shape, runtime behavior, tests, build output, and packaging, but treat `SPEC.md` as the source of truth.

## Install

Publish is not configured yet. For local development:

```sh
pnpm install
```

## Scripts

```sh
pnpm run check
pnpm run test
pnpm run build
```
