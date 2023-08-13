import { act, renderHook } from "@testing-library/react";
import { ExternalStore, useLocalStorageSafe } from "../src";

describe("Client faulty store", function () {
  const FAULTY_STORE_KEY = "FAULTY_STORE_KEY";
  const FAULTY_STORE_DEFAULT_VALUE = "FAULTY_STORE_DEFAULT_VALUE";
  const errorSetItem = new Error("Error while trying to setItem");
  const errorGetItem = new Error("Error while trying to getItem");

  const logSpy = jest.fn();
  const validateSpy = jest.fn();

  beforeEach(() => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw errorSetItem;
    });
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw errorGetItem;
    });
  });

  afterEach(() => {
    localStorage.clear();
    ExternalStore.inMemory.clear();
    ExternalStore.listeners.clear();
    jest.clearAllMocks();
  });

  describe("silent:false", function () {
    it("should throw and log error if unable to get item", function () {
      const { result } = renderHook(() => {
        try {
          useLocalStorageSafe<string>(
            FAULTY_STORE_KEY,
            FAULTY_STORE_DEFAULT_VALUE,
            {
              silent: false,
              log: logSpy,
            },
          );
        } catch (error) {
          return error;
        }
      });

      expect(logSpy).toHaveBeenCalledWith(errorGetItem);
      expect(result.current).toBe(errorGetItem);
    });

    it("should throw and log error if unable to set item", function () {
      Storage.prototype.getItem = () => null; // move to setItem path
      const { result } = renderHook(() => {
        try {
          useLocalStorageSafe<string>(
            FAULTY_STORE_KEY,
            FAULTY_STORE_DEFAULT_VALUE,
            {
              silent: false,
              log: logSpy,
            },
          );
        } catch (error) {
          return error;
        }
      });
      expect(logSpy).toHaveBeenCalledWith(errorSetItem);
      expect(result.current).toBe(errorSetItem);
    });

    it("should throw and log error if unable to get item via getParseableStorageItem", function () {
      Storage.prototype.getItem = () => null;
      Storage.prototype.setItem = () => null;
      const { result } = renderHook(() => {
        return useLocalStorageSafe<string>(
          FAULTY_STORE_KEY,
          FAULTY_STORE_DEFAULT_VALUE,
          {
            silent: false,
            log: logSpy,
          },
        );
      });

      jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw errorGetItem;
      });

      ExternalStore.inMemory.clear();
      const [, setValue] = result.current;

      expect(() => setValue(() => "should throw")).toThrow(errorGetItem);
      expect(true).toBeTruthy();
    });
  });

  describe("silent:true", function () {
    it("should put default value inMemory", function () {
      const { result } = renderHook(() =>
        useLocalStorageSafe<string>(
          FAULTY_STORE_KEY,
          FAULTY_STORE_DEFAULT_VALUE,
          {
            log: logSpy,
          },
        ),
      );

      const [value] = result.current;

      expect(value).toBe(FAULTY_STORE_DEFAULT_VALUE);
      expect(logSpy).toHaveBeenCalledWith(errorGetItem);
      expect(logSpy).toHaveBeenCalledWith(errorSetItem);
    });

    it("should put undefined default value inMemory", function () {
      const { result } = renderHook(() =>
        useLocalStorageSafe<string>(FAULTY_STORE_KEY, undefined, {
          log: logSpy,
        }),
      );

      const [value] = result.current;

      expect(value).toBe(undefined);
      expect(logSpy).toHaveBeenCalledWith(errorGetItem);
      expect(logSpy).toHaveBeenCalledWith(errorSetItem);
    });

    it("should skip validation and just set default", function () {
      const { result } = renderHook(() =>
        useLocalStorageSafe<string>(
          FAULTY_STORE_KEY,
          FAULTY_STORE_DEFAULT_VALUE,
          {
            log: logSpy,
            validateInit: validateSpy,
          },
        ),
      );

      const [value] = result.current;

      expect(value).toBe(FAULTY_STORE_DEFAULT_VALUE);
      expect(validateSpy).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(errorGetItem);
      expect(logSpy).toHaveBeenCalledWith(errorSetItem);
    });

    it("should setItem inMemory", function () {
      const NEW_STORE_VALUE = "NEW_STORE_VALUE";
      const { result } = renderHook(() =>
        useLocalStorageSafe<string>(
          FAULTY_STORE_KEY,
          FAULTY_STORE_DEFAULT_VALUE,
        ),
      );

      const [, setState] = result.current;

      act(() => setState(NEW_STORE_VALUE));

      const [value] = result.current;

      expect(value).toBe(NEW_STORE_VALUE);
    });
  });
});
