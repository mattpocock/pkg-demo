import { Dispatch, SetStateAction, useCallback, useMemo } from "react";
import useSyncExternalStoreExports from "use-sync-external-store/shim";
import { getStoreMock } from "./server-store-mock";
const { useSyncExternalStore } = useSyncExternalStoreExports;

interface Options<T> {
  stringify?: (value: unknown) => string;
  parse?: (string: string) => string;
  log?: (message: unknown) => void;
  validate?: (value: T) => boolean;
  tabSync?: boolean;
  silent?: boolean;
}

export function useLocalStorageSafe<T>(
  key: string,
  defaultValue?: T,
  options?: Options<T>
): [T, Dispatch<SetStateAction<T>>];

export function useLocalStorageSafe<T>(
  key: string,
  defaultValue?: T,
  options?: Options<T>
): [T | undefined, Dispatch<SetStateAction<T>>] {
  const store = useMemo(
    () =>
      typeof window === "undefined"
        ? getStoreMock()
        : new ExternalStore<T>(key, defaultValue, options),
    [key, defaultValue, options]
  );

  const storageValue = useSyncExternalStore(
    useCallback((listener) => store.subscribe(listener, key), [store, key]),
    () => store.getSnapshot(key),
    () => defaultValue
  );

  return [
    storageValue,
    useCallback(
      (value: SetStateAction<T>) => store.setItem(key, value),
      [key, store]
    ),
  ];
}

export class ExternalStore<T> {
  public static readonly listeners: Map<string, Set<VoidFunction>> = new Map();
  public static readonly inMemory: Map<string, unknown> = new Map();

  private readonly stringify: (value: unknown) => string = JSON.stringify;
  private readonly parse: (string: string) => string = JSON.parse;
  private readonly log: (message: unknown) => void = console.log;
  private readonly tabSync: boolean = true;
  private readonly silent: boolean = true;

  public constructor(key: string, defaultValue?: T, options?: Options<T>) {
    if (options?.log) this.log = options.log;
    if (options?.parse) this.parse = options.parse;
    if (options?.stringify) this.stringify = options.stringify;
    if (options?.tabSync === false) this.tabSync = options.tabSync;
    if (options?.silent === false) this.silent = options.silent;

    if (!this.canGetStoreValue(key)) {
      this.setItem(key, defaultValue as T);
      return; // here we exit if no value was in store or store not functioning
    }

    if (typeof options?.validate === "function") {
      const storageValue = this.getParseableStorageItem<T>(key);
      const isValid = options.validate(storageValue as T);

      if (!isValid && defaultValue) {
        this.setStorageItem<T>(key, defaultValue);
      } else if (!isValid && !defaultValue) {
        localStorage.removeItem(key);
      }
    }
  }

  public setItem(key: string, valueOrFunction: SetStateAction<T>) {
    const value = isFunction<T>(valueOrFunction)
      ? valueOrFunction(this.getSnapshot(key))
      : valueOrFunction;

    this.setStorageItem(key, value);
    ExternalStore.inMemory.set(key, value);
    this.notifyListeners(key);
  }

  public getSnapshot(key: string) {
    if (!ExternalStore.inMemory.has(key)) {
      const storageValue = this.getParseableStorageItem<T>(key);
      ExternalStore.inMemory.set(key, storageValue);
    }

    return ExternalStore.inMemory.get(key) as T;
  }

  public subscribe(listener: () => void, key: string) {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea === localStorage && event.key === key) {
        ExternalStore.inMemory.set(key, this.getParseableStorageItem(key));

        this.notifyListeners(key);
      }
    };

    if (ExternalStore.listeners.has(key)) {
      ExternalStore.listeners.get(key)?.add(listener);
    } else {
      ExternalStore.listeners.set(key, new Set([listener]));
    }

    if (this.tabSync) {
      window.addEventListener("storage", handleStorageChange);
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);

      if (ExternalStore.listeners.has(key)) {
        ExternalStore.listeners.get(key)?.delete(listener);
      }
    };
  }

  public notifyListeners(key: string) {
    const listeners = ExternalStore.listeners.get(key);
    if (listeners) {
      for (const listener of listeners) {
        listener();
      }
    }
  }

  private setStorageItem<T>(key: string, value: T | undefined) {
    try {
      return localStorage.setItem(key, this.stringify(value));
    } catch (error) {
      this.log(error);
      if (!this.silent) throw error;
    }
  }

  private getParseableStorageItem<T>(key: string): T | null | undefined {
    let value = null;

    console.log('getParseableStorageItem')

    try {
      value = localStorage.getItem(key);
    } catch (error) {
      this.log(error);
      if (!this.silent) throw error;
    }

    if (value === null || value === "undefined") return undefined;

    try {
      return this.parse(value) as T;
    } catch (error) {
      this.log(error);
      localStorage.removeItem(key);
      return null;
    }
  }

  public canGetStoreValue(key: string): boolean {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      this.log(error);
      if (!this.silent) throw error;
      return false;
    }
  }
}

function isFunction<T>(
  valueOrFunction: unknown
): valueOrFunction is (value: T) => boolean {
  return typeof valueOrFunction === "function";
}
