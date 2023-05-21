# use-local-storage-safe

> React hook for using LocalStorage safely

![License](https://img.shields.io/npm/l/use-local-storage-safe)
![Downloads](https://img.shields.io/npm/dm/use-local-storage-safe)
![size](https://img.shields.io/bundlephobia/minzip/use-local-storage-safe)
![build](https://img.shields.io/github/actions/workflow/status/hoqua/use-local-storage-safe/main.yml?branch=main)
![badge-branches](https://raw.githubusercontent.com/hoqua/use-local-storage-safe/main/coverage/badge-branches.svg)
![badge-functions](https://raw.githubusercontent.com/hoqua/use-local-storage-safe/main/coverage/badge-functions.svg)
![badge-lines](https://raw.githubusercontent.com/hoqua/use-local-storage-safe/main/coverage/badge-lines.svg)
![badge-statements](https://raw.githubusercontent.com/hoqua/use-local-storage-safe/main/coverage/badge-statements.svg)

# Installation

```bash
npm i use-local-storage-safe        # npm
```
```bash
yarn add use-local-storage-safe     # yarn
```
```bash
pnpm i use-local-storage-safe       # pnpm
```

## Why
- Persist data to local storage using a React `useState`-like interface.
- Validates stored content on hook initialization to prevent collisions and handle legacy data
- Fit any hooks-compatible version of React `>=16.8.0`
- ESM - [ECMAScript modules](https://nodejs.org/api/esm.html); CJS - [CommonJS](https://nodejs.org/api/modules.html#modules-commonjs-modules) support
- Cross-Browser State [Synchronization](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event) `options.sync?: boolean` 
- SSR support (NextJS, Astro, Remix)

## Usage

#### Basic

```tsx
import { useLocalStorageSafe } from 'use-local-storage-safe'

export default function NameComponent() {
    const [userName, setUserName] = useLocalStorageSafe('name-storage-key', 'default-name')
}
```

#### Advanced

```tsx
import { useLocalStorageSafe } from 'use-local-storage-safe'
// data could be validated with plain JS or any other library
import { z } from "zod";

const User = z.object({
    firstName: z.string().min(1).max(18),
    lastName: z.string().min(1).max(18),
    email: z.string().email(),
});

type User = z.infer<typeof User>

export default function UserComponent() {
    const [user, setUser] = useLocalStorageSafe<User>(
        "user-storage-key",
        {
            firstName: "example name",
            lastName: "example last name",
            email: "example@email.com",
        },
        // validate stored data on hook initialization
        { validateInit: (user) => User.safeParse(user).success }
    );

    return (
        <div>
            <p>First Name: {user.firstName}</p>
            <p>Last Name: {user.lastName}</p>
            <p>Email: {user.email}</p>

            <button
                onClick={() =>
                    setUser({ firstName: "U", lastName: "Nu", email: "u@mail.com" })
                }
            >
                Set User
            </button>
        </div>
    );
}
```

## API

```typescript
function useLocalStorageSafe<T>(key: string, defaultValue?: T, options?: Options<T>): [T, Dispatch<SetStateAction<T>>];

interface Options<T> {
    stringify?: (value: unknown) => string;
    parse?: (string: string) => string;
    log?: (message: unknown) => void;
    validateInit?: (value: T) => boolean;
    sync?: boolean;
    silent?: boolean;
}
```

- `key` -  The key under which the state value will be stored in the local storage.
- `defaultValue` -  The initial value for the state. If the key does not exist in the local storage, this value will be used as the default.
- `options` - An object containing additional customization options for the hook.
  - `options?.stringify` - A function that converts the state value to a string before storing it in the local storage. `JSON.stringify` by default.
  - `options?.parse` - A function that converts the string value from the local storage back into its original form. `JSON.parse` by default.
  - `options?.log` - A function that receives a message as an argument and logs it. This can be used for debugging or logging purposes. `console.log` by default.
  - `options?.validateInit` - A function that validates stored value during hook initialization. If the validation returns false, invalid value will be removed and replaced by default if provided.
  - `options?.sync` - A boolean indicating whether the state should be synchronized across multiple tabs, windows and iframes. `true` by default.
  - `options?.silent` - A boolean indicating whether the hook should suppress an error occurs while accessing the local storage. `true` by default.