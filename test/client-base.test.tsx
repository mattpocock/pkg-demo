import { act, fireEvent, renderHook } from "@testing-library/react";
import { ExternalStore, useLocalStorageSafe } from "../src";

describe("Client side", () => {
  afterEach(() => {
    localStorage.clear();
    ExternalStore.validated = false;
    ExternalStore.inMemory.clear();
    ExternalStore.listeners.clear();
    jest.clearAllMocks();
  });

  describe("default value", () => {
    const DEFAULT_VALUE_KEY = "DEFAULT_VALUE_KEY";
    const DEFAULT_VALUE_DATA = { data: "test_data" };
    const DEFAULT_VALUE_DATA_STRING = JSON.stringify(DEFAULT_VALUE_DATA);

    it("should be written into storage and state", () => {
      const { result } = renderHook(() =>
        useLocalStorageSafe(DEFAULT_VALUE_KEY, DEFAULT_VALUE_DATA),
      );

      const [value] = result.current;

      expect(value).toEqual(DEFAULT_VALUE_DATA);
      expect(localStorage.getItem(DEFAULT_VALUE_KEY)).toBe(
        DEFAULT_VALUE_DATA_STRING,
      );
    });

    it("should write undefined to localStorage if it empty and no default value", () => {
      const { result } = renderHook(() =>
        useLocalStorageSafe(DEFAULT_VALUE_KEY),
      );
      const [value] = result.current;

      expect(value).toBe(undefined);
      expect(localStorage.getItem(DEFAULT_VALUE_KEY)).toBe("undefined");
    });

    it("should not overwrite existing value", () => {
      localStorage.setItem(DEFAULT_VALUE_KEY, DEFAULT_VALUE_DATA_STRING);
      renderHook(() =>
        useLocalStorageSafe(DEFAULT_VALUE_KEY, DEFAULT_VALUE_DATA),
      );

      expect(localStorage.getItem(DEFAULT_VALUE_KEY)).toBe(
        DEFAULT_VALUE_DATA_STRING,
      );
    });
  });

  describe("state action", () => {
    const ACTION_KEY = "ACTION_KEY";
    const STATE_PART_ONE = ["one"];
    const STATE_PART_TWO = ["two"];

    it("should update state", () => {
      const { result } = renderHook(() =>
        useLocalStorageSafe(ACTION_KEY, STATE_PART_ONE),
      );
      const [, setState] = result.current;

      act(() => setState(STATE_PART_TWO));

      const [value] = result.current;
      expect(value).toEqual(STATE_PART_TWO);
      expect(localStorage.getItem(ACTION_KEY)).toStrictEqual(
        JSON.stringify(STATE_PART_TWO),
      );
    });

    it("should merge with prev state", () => {
      const { result } = renderHook(() =>
        useLocalStorageSafe<string[]>(ACTION_KEY, STATE_PART_ONE),
      );
      const [, setState] = result.current;

      act(() =>
        setState((previousState) => [...previousState, ...STATE_PART_TWO]),
      );

      const [value] = result.current;
      expect(value).toEqual([...STATE_PART_ONE, ...STATE_PART_TWO]);
      expect(localStorage.getItem(ACTION_KEY)).toStrictEqual(
        JSON.stringify([...STATE_PART_ONE, ...STATE_PART_TWO]),
      );
    });
  });

  describe("options", () => {
    const OPTIONS_KEY = "OPTIONS_KEY";
    const OPTIONS_DEFAULT_VALUE = "OPTIONS_DEFAULT_VALUE";
    const OPTIONS_EXISTING_STORE_ITEM = "EXISTING_STORE_ITEM";
    const OPTIONS_EXISTING_STORE_ITEM_SERIALIZED = JSON.stringify(
      OPTIONS_EXISTING_STORE_ITEM,
    );

    it("should use supplied parser", () => {
      const parserSpy = jest.fn();
      localStorage.setItem(OPTIONS_KEY, JSON.stringify(OPTIONS_DEFAULT_VALUE));
      renderHook(() =>
        useLocalStorageSafe<string>(OPTIONS_KEY, OPTIONS_DEFAULT_VALUE, {
          parse: parserSpy,
        }),
      );

      expect(parserSpy).toHaveBeenCalledTimes(1);
    });

    it("should use supplied stringify", () => {
      const stringifySpy = jest.fn();
      renderHook(() =>
        useLocalStorageSafe<string>(OPTIONS_KEY, OPTIONS_DEFAULT_VALUE, {
          stringify: stringifySpy,
        }),
      );

      expect(stringifySpy).toHaveBeenCalledTimes(1);
    });

    it("should use supplied log", () => {
      const logSpy = jest.fn();
      const invalidJSON = '{"username":"nam';
      localStorage.setItem(OPTIONS_KEY, invalidJSON);
      renderHook(() =>
        useLocalStorageSafe<string>(OPTIONS_KEY, OPTIONS_DEFAULT_VALUE, {
          log: logSpy,
        }),
      );

      expect(logSpy).toHaveBeenCalledTimes(1);
    });

    describe("sync", function () {
      it("should turn on sync by default", () => {
        const eventSpy = jest.spyOn(window, "addEventListener");

        renderHook(() =>
          useLocalStorageSafe<string>(OPTIONS_KEY, OPTIONS_DEFAULT_VALUE),
        );

        expect(eventSpy).toHaveBeenCalledWith("storage", expect.any(Function));
        expect(eventSpy).toHaveBeenCalledTimes(1);
      });

      it("should turn off sync", () => {
        const eventSpy = jest.spyOn(window, "addEventListener");

        renderHook(() =>
          useLocalStorageSafe<string>(OPTIONS_KEY, OPTIONS_DEFAULT_VALUE, {
            sync: false,
          }),
        );

        expect(eventSpy).not.toHaveBeenCalled();
      });
    });

    describe("validation", function () {
      it("should validate localStorage item on init and keep it", () => {
        localStorage.setItem(
          OPTIONS_KEY,
          OPTIONS_EXISTING_STORE_ITEM_SERIALIZED,
        );
        const validateSpy = jest.fn().mockReturnValue(true);

        const { result } = renderHook(() =>
          useLocalStorageSafe<string>(OPTIONS_KEY, OPTIONS_DEFAULT_VALUE, {
            validateInit: validateSpy,
          }),
        );

        const [value] = result.current;
        expect(value).toBe(OPTIONS_EXISTING_STORE_ITEM);
        expect(validateSpy).toHaveBeenCalledTimes(1);
        expect(validateSpy).toHaveBeenCalledWith(OPTIONS_EXISTING_STORE_ITEM);
        expect(localStorage.getItem(OPTIONS_KEY)).toBe(
          OPTIONS_EXISTING_STORE_ITEM_SERIALIZED,
        );
      });

      it("should not validate empty storageItem on init and replace with default", () => {
        const validateSpy = jest.fn().mockReturnValue(true);

        const { result } = renderHook(() =>
          useLocalStorageSafe<string>(OPTIONS_KEY, OPTIONS_DEFAULT_VALUE, {
            validateInit: validateSpy,
          }),
        );

        const [value] = result.current;
        expect(value).toBe(OPTIONS_DEFAULT_VALUE);
        expect(localStorage.getItem(OPTIONS_KEY)).toBe(
          JSON.stringify(OPTIONS_DEFAULT_VALUE),
        );
        expect(validateSpy).toHaveBeenCalledTimes(0);
      });

      it("should not validate empty storageItem and init default (undefined)", () => {
        const validateSpy = jest.fn().mockReturnValue(true);

        const { result } = renderHook(() =>
          useLocalStorageSafe<string>(OPTIONS_KEY, undefined, {
            validateInit: validateSpy,
          }),
        );

        const [value] = result.current;
        expect(value).toBe(undefined);
        expect(localStorage.getItem(OPTIONS_KEY)).toBe("undefined");
        expect(validateSpy).not.toHaveBeenCalled();
      });

      it("should clear store on invalid item and no default", () => {
        localStorage.setItem(
          OPTIONS_KEY,
          OPTIONS_EXISTING_STORE_ITEM_SERIALIZED,
        );
        const validateSpy = jest.fn().mockReturnValue(false);

        const { result } = renderHook(() =>
          useLocalStorageSafe<string>(OPTIONS_KEY, undefined, {
            validateInit: validateSpy,
          }),
        );

        const [value] = result.current;
        expect(value).toBe(undefined);
        expect(localStorage.getItem(OPTIONS_KEY)).toBe(null);
        expect(validateSpy).toHaveBeenCalledTimes(1);
        expect(validateSpy).toHaveBeenCalledWith(OPTIONS_EXISTING_STORE_ITEM);
      });

      it("should return default value on invalid item", () => {
        localStorage.setItem(
          OPTIONS_KEY,
          OPTIONS_EXISTING_STORE_ITEM_SERIALIZED,
        );
        const validateSpy = jest.fn().mockReturnValue(false);

        const { result } = renderHook(() =>
          useLocalStorageSafe<string>(OPTIONS_KEY, OPTIONS_DEFAULT_VALUE, {
            validateInit: validateSpy,
          }),
        );

        const [value] = result.current;
        expect(value).toBe(OPTIONS_DEFAULT_VALUE);
        expect(localStorage.getItem(OPTIONS_KEY)).toBe(
          JSON.stringify(OPTIONS_DEFAULT_VALUE),
        );
        expect(validateSpy).toHaveBeenCalledTimes(1);
        expect(validateSpy).toHaveBeenCalledWith(OPTIONS_EXISTING_STORE_ITEM);
      });
    });

    describe("silent:false", function () {
      it("should throw and log error if unable to set item", function () {
        const logSpy = jest.fn();
        const { result } = renderHook(() => {
          try {
            useLocalStorageSafe<string>(OPTIONS_KEY, OPTIONS_DEFAULT_VALUE, {
              silent: false,
              log: logSpy,
              stringify: () => {
                throw new Error("unable to set item");
              },
            });
          } catch (error) {
            return error;
          }
        });

        expect(logSpy).toHaveBeenCalledWith(expect.any(Error));
        expect(result.current).toStrictEqual(expect.any(Error));
      });
    });
  });

  describe("falsy primitives parsed correctly", () => {
    for (const test of [
      { value: 0, result: 0, it: "should handle zero as zero" },
      { value: -0, result: 0, it: "should handle negative zero as zero" },
      {
        value: document.all,
        result: undefined,
        it: "should handle document.all as undefined",
      },
      { value: null, result: null, it: "should handle  null as null" },
      { value: Number.NaN, result: null, it: "should handle NaN as null" },
      {
        value: "",
        result: "",
        it: "should handle empty string  as empty string",
      },
      {
        value: undefined,
        result: undefined,
        it: "should handle undefined  as null",
      },
      { value: false, result: false, it: "should handle false  as false" },
    ]) {
      it(test.it + "", () => {
        localStorage.setItem("primitives-test-key", JSON.stringify(test.value));

        const { result } = renderHook(() =>
          useLocalStorageSafe("primitives-test-key"),
        );

        const [value] = result.current;
        expect(value).toBe(test.result);
      });
    }
  });

  describe("localStorage storage events", function () {
    const STORAGE_EVENT_KEY = "STORAGE_EVENT_KEY";
    const STORAGE_EVENT_DEFAULT_VALUE = "STORAGE_EVENT_DEFAULT_VALUE";
    const STORAGE_EVENT_NEW_VALUE = "STORAGE_EVENT_NEW_VALUE";

    it("should update state on storage event with no default", () => {
      const { result } = renderHook(() =>
        useLocalStorageSafe(STORAGE_EVENT_KEY),
      );

      dispatchStorageEvent(STORAGE_EVENT_KEY, STORAGE_EVENT_NEW_VALUE);

      expect(result.current[0]).toStrictEqual(STORAGE_EVENT_NEW_VALUE);
    });

    it("should update state on storage event with default value", () => {
      const { result } = renderHook(() =>
        useLocalStorageSafe(STORAGE_EVENT_KEY, STORAGE_EVENT_DEFAULT_VALUE),
      );

      dispatchStorageEvent(STORAGE_EVENT_KEY, STORAGE_EVENT_NEW_VALUE);

      expect(result.current[0]).toStrictEqual(STORAGE_EVENT_NEW_VALUE);
    });

    it("should not react on unrelated event", () => {
      const { result } = renderHook(() =>
        useLocalStorageSafe(STORAGE_EVENT_KEY, STORAGE_EVENT_DEFAULT_VALUE),
      );

      act(() => {
        dispatchStorageEvent(STORAGE_EVENT_KEY, STORAGE_EVENT_NEW_VALUE);
        dispatchStorageEvent(
          STORAGE_EVENT_KEY + "_UNRELATED",
          STORAGE_EVENT_NEW_VALUE + "_UNRELATED",
        );
      });

      expect(result.current[0]).toStrictEqual(STORAGE_EVENT_NEW_VALUE);
    });

    it("should not react on storage event if {sync:false}", () => {
      const { result } = renderHook(() =>
        useLocalStorageSafe(STORAGE_EVENT_KEY, STORAGE_EVENT_DEFAULT_VALUE, {
          sync: false,
        }),
      );

      act(() =>
        dispatchStorageEvent(STORAGE_EVENT_KEY, STORAGE_EVENT_NEW_VALUE),
      );

      expect(result.current[0]).toStrictEqual(STORAGE_EVENT_DEFAULT_VALUE);
    });
  });

  it("supports dynamic key", () => {
    let key = "dynamic-key-1";
    const key2 = "dynamic-key-2";
    const DYNAMIC_KEY_VALUE = "DYNAMIC_KEY_VALUE";

    const { rerender } = renderHook(() =>
      useLocalStorageSafe(key, DYNAMIC_KEY_VALUE),
    );

    key = key2;

    rerender();

    expect(localStorage.getItem(key)).toStrictEqual(
      JSON.stringify(DYNAMIC_KEY_VALUE),
    );
    expect(localStorage.getItem(key2)).toStrictEqual(
      JSON.stringify(DYNAMIC_KEY_VALUE),
    );
  });

  describe("listeners", function () {
    const LISTENERS_KEY = "LISTENERS_KEY";
    it("should register listener", () => {
      renderHook(() => useLocalStorageSafe(LISTENERS_KEY));

      expect(ExternalStore.listeners.get(LISTENERS_KEY)?.size).toBe(1);
    });

    it("should unregister listener on unmount", () => {
      const { unmount } = renderHook(() => useLocalStorageSafe(LISTENERS_KEY));

      unmount();

      expect(ExternalStore.listeners.get(LISTENERS_KEY)?.size).toBe(0);
    });
  });
});

const dispatchStorageEvent = (key: string, value: unknown) => {
  const newValue = JSON.stringify(value);
  localStorage.setItem(key, newValue);

  fireEvent(
    window,
    new StorageEvent("storage", {
      key,
      storageArea: localStorage,
      newValue,
    }),
  );
};
