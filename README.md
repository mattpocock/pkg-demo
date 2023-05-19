# use-local-storage-safe

> React hook for using LocalStorage safe

![License](https://img.shields.io/npm/l/use-local-storage-safe)
![Downloads](https://img.shields.io/npm/dm/use-local-storage-safe)
![size](https://img.shields.io/bundlephobia/minzip/use-local-storage-safe)
![build](https://img.shields.io/github/actions/workflow/status/hoqua/use-local-storate-safe/main.yml?branch=main)
![badge-branches](https://raw.githubusercontent.com/hoqua/use-local-storate-safe/main/coverage/badge-branches.svg)
![badge-functions](https://raw.githubusercontent.com/hoqua/use-local-storate-safe/main/coverage/badge-functions.svg)
![badge-lines](https://raw.githubusercontent.com/hoqua/use-local-storate-safe/main/coverage/badge-lines.svg)
![badge-statements](https://raw.githubusercontent.com/hoqua/use-local-storate-safe/main/coverage/badge-statements.svg)

# Installation

Installing with `npm`, `yarn`, `pnpm` :

```bash
npm i use-local-storage-safe
```
```bash
yarn add use-local-storage-safe
```
```bash
pnpm i use-local-storage-safe
```

## Why
- Easy to use
- Persist data to local storage using a React `useState`-like interface.
- Fit any hooks-compatible version of React `>=16.8.0`
- ✅ ESM - [ECMAScript modules](https://nodejs.org/api/esm.html) and  ✅ CJS - [CommonJS](https://nodejs.org/api/modules.html#modules-commonjs-modules) support
- Cross-Browser State [Synchronization](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event) `tabSync?: boolean` 
- SSR support (NextJS, Astro, Remix)
- Validates storage content to prevent collisions and legacy formats
- Customizable `silentMode`, `tabSync`, `validation`, `logging`, `parser`, `serializer`

## Usage

Basic example:

```typescript
import { useLocalStorageSafe } from 'use-local-storage-safe'

export default function NameComponent() {
    const [userName, setUserName] = useLocalStorageSafe('name-storage-key', 'default-name')
}
```