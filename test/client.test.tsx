import "node:util";
import { act, renderHook } from "@testing-library/react";
import { ExternalStore, useLocalStorageSafe } from "../src";

describe("Client side", () => {
  afterEach(() => {
    localStorage.clear();
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
        useLocalStorageSafe(DEFAULT_VALUE_KEY, DEFAULT_VALUE_DATA)
      );

      const [value] = result.current;

      expect(value).toEqual(DEFAULT_VALUE_DATA);
      expect(localStorage.getItem(DEFAULT_VALUE_KEY)).toBe(
        DEFAULT_VALUE_DATA_STRING
      );
    });

    it("should not write to state or localStorage when undefined", () => {
      const { result } = renderHook(() =>
        useLocalStorageSafe(DEFAULT_VALUE_KEY)
      );
      const [value] = result.current;

      expect(value).toBe(null);
      expect(localStorage.getItem(DEFAULT_VALUE_KEY)).toBe(null);
    });

    it("should not overwrite existing value", () => {
      localStorage.setItem(DEFAULT_VALUE_KEY, DEFAULT_VALUE_DATA_STRING);
      renderHook(() =>
        useLocalStorageSafe(DEFAULT_VALUE_KEY, DEFAULT_VALUE_DATA)
      );

      expect(localStorage.getItem(DEFAULT_VALUE_KEY)).toBe(
        DEFAULT_VALUE_DATA_STRING
      );
    });
  });

  describe("state action", () => {
    const ACTION_KEY = "ACTION_KEY";
    const STATE_PART_ONE = ["one"];
    const STATE_PART_TWO = ["two"];

    it("should update state", () => {
      const { result } = renderHook(() =>
        useLocalStorageSafe(ACTION_KEY, STATE_PART_ONE)
      );
      const [, setState] = result.current;

      act(() => setState(STATE_PART_TWO));

      const [value] = result.current;
      expect(value).toEqual(STATE_PART_TWO);
      expect(localStorage.getItem(ACTION_KEY)).toStrictEqual(
        JSON.stringify(STATE_PART_TWO)
      );
    });

    it("should merge with prev state", () => {
      const { result } = renderHook(() =>
        useLocalStorageSafe<string[]>(ACTION_KEY, STATE_PART_ONE)
      );
      const [, setState] = result.current;

      act(() =>
        setState((previousState) => [...previousState, ...STATE_PART_TWO])
      );

      const [value] = result.current;
      expect(value).toEqual([...STATE_PART_ONE, ...STATE_PART_TWO]);
      expect(localStorage.getItem(ACTION_KEY)).toStrictEqual(
        JSON.stringify([...STATE_PART_ONE, ...STATE_PART_TWO])
      );
    });
  });

  describe("options", () => {
    const OPTIONS_KEY = "OPTIONS_KEY";
    const OPTIONS_DEFAULT_VALUE = "OPTIONS_DEFAULT_VALUE";
    const OPTIONS_EXISTING_STORE_ITEM = "EXISTING_STORE_ITEM";
    const OPTIONS_EXISTING_STORE_ITEM_SERIALIZED = JSON.stringify(
      OPTIONS_EXISTING_STORE_ITEM
    );

    it("should use supplied parser", () => {
      const parserSpy = jest.fn();
      renderHook(() =>
        useLocalStorageSafe<string>(OPTIONS_KEY, "", { parse: parserSpy })
      );

      expect(parserSpy).toHaveBeenCalledTimes(1);
    });

    it("should use supplied stringify", () => {
      const stringifySpy = jest.fn();
      renderHook(() =>
        useLocalStorageSafe<string>(OPTIONS_KEY, OPTIONS_DEFAULT_VALUE, {
          stringify: stringifySpy,
        })
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
        })
      );

      expect(logSpy).toHaveBeenCalledTimes(1);
    });

    describe("sync", function () {
      it("should turn on sync by default", () => {
        const eventSpy = jest.spyOn(window, "addEventListener");

        renderHook(() =>
          useLocalStorageSafe<string>(OPTIONS_KEY, OPTIONS_DEFAULT_VALUE)
        );

        expect(eventSpy).toHaveBeenCalledWith("storage", expect.any(Function));
        expect(eventSpy).toHaveBeenCalledTimes(1);
      });

      it("should turn off sync", () => {
        const eventSpy = jest.spyOn(window, "addEventListener");

        renderHook(() =>
          useLocalStorageSafe<string>(OPTIONS_KEY, OPTIONS_DEFAULT_VALUE, {
            tabSync: false,
          })
        );

        expect(eventSpy).not.toHaveBeenCalled();
      });
    });

    describe("validation", function () {
      it("should validate localStorage item on init and keep it", () => {
        localStorage.setItem(
          OPTIONS_KEY,
          OPTIONS_EXISTING_STORE_ITEM_SERIALIZED
        );
        const validateSpy = jest.fn().mockReturnValue(true);

        const { result } = renderHook(() =>
          useLocalStorageSafe<string>(OPTIONS_KEY, OPTIONS_DEFAULT_VALUE, {
            validate: validateSpy,
          })
        );

        const [value] = result.current;
        expect(value).toBe(OPTIONS_EXISTING_STORE_ITEM);
        expect(validateSpy).toHaveBeenCalledTimes(1);
        expect(validateSpy).toHaveBeenCalledWith(OPTIONS_EXISTING_STORE_ITEM);
        expect(localStorage.getItem(OPTIONS_KEY)).toBe(
          OPTIONS_EXISTING_STORE_ITEM_SERIALIZED
        );
      });

      it("should validate empty storageItem on init and replace with default", () => {
        const validateSpy = jest.fn().mockReturnValue(true);

        const { result } = renderHook(() =>
          useLocalStorageSafe<string>(OPTIONS_KEY, OPTIONS_DEFAULT_VALUE, {
            validate: validateSpy,
          })
        );

        const [value] = result.current;
        expect(value).toBe(OPTIONS_DEFAULT_VALUE);
        expect(localStorage.getItem(OPTIONS_KEY)).toBe(
          JSON.stringify(OPTIONS_DEFAULT_VALUE)
        );
        expect(validateSpy).toHaveBeenCalledTimes(1);
        expect(validateSpy).toHaveBeenCalledWith(null);
      });

      it("should validate empty storageItem on init with no default", () => {
        const validateSpy = jest.fn().mockReturnValue(true);

        const { result } = renderHook(() =>
          useLocalStorageSafe<string>(OPTIONS_KEY, undefined, {
            validate: validateSpy,
          })
        );

        const [value] = result.current;
        expect(value).toBe(null);
        expect(localStorage.getItem(OPTIONS_KEY)).toBe(null);
        expect(validateSpy).toHaveBeenCalledTimes(1);
        expect(validateSpy).toHaveBeenCalledWith(null);
      });

      it("should clear store on invalid item and no default", () => {
        localStorage.setItem(
          OPTIONS_KEY,
          OPTIONS_EXISTING_STORE_ITEM_SERIALIZED
        );
        const validateSpy = jest.fn().mockReturnValue(false);

        const { result } = renderHook(() =>
          useLocalStorageSafe<string>(OPTIONS_KEY, undefined, {
            validate: validateSpy,
          })
        );

        const [value] = result.current;
        expect(value).toBe(null);
        expect(localStorage.getItem(OPTIONS_KEY)).toBe(null);
        expect(validateSpy).toHaveBeenCalledTimes(1);
        expect(validateSpy).toHaveBeenCalledWith(OPTIONS_EXISTING_STORE_ITEM);
      });

      it("should return default value on invalid item", () => {
        localStorage.setItem(
          OPTIONS_KEY,
          OPTIONS_EXISTING_STORE_ITEM_SERIALIZED
        );
        const validateSpy = jest.fn().mockReturnValue(false);

        const { result } = renderHook(() =>
          useLocalStorageSafe<string>(OPTIONS_KEY, OPTIONS_DEFAULT_VALUE, {
            validate: validateSpy,
          })
        );

        const [value] = result.current;
        expect(value).toBe(OPTIONS_DEFAULT_VALUE);
        expect(localStorage.getItem(OPTIONS_KEY)).toBe(
          JSON.stringify(OPTIONS_DEFAULT_VALUE)
        );
        expect(validateSpy).toHaveBeenCalledTimes(1);
        expect(validateSpy).toHaveBeenCalledWith(OPTIONS_EXISTING_STORE_ITEM);
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
          useLocalStorageSafe("primitives-test-key")
        );

        const [value] = result.current;
        expect(value).toBe(test.result);
      });
    }
  });
});
