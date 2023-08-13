/**
 * @jest-environment node
 */

// ^ Must be at top of file

import Server from "react-dom/server";
import React, { useEffect } from "react";
import { useLocalStorageSafe } from "../src";
import "@testing-library/jest-dom/extend-expect";
import * as mock from "../src/server-store-mock";
import { getStoreMock } from "../src/server-store-mock";

const SSR_TEST_KEY = "server-side-test-key";
function Component(properties: {
  storageKey: string;
  storageDefaultValue?: string;
  interactive?: boolean;
}) {
  const { storageKey, storageDefaultValue, interactive } = properties;
  const [value, setValue] = useLocalStorageSafe<string>(
    storageKey,
    storageDefaultValue,
  );

  if (interactive) {
    setValue("test");
  }
  return <>{value}</>;
}

describe("Server side render", () => {
  it("should return default value", () => {
    const defaultValue = "server default";

    const result = Server.renderToString(
      <Component
        storageKey={SSR_TEST_KEY}
        storageDefaultValue={defaultValue}
      />,
    );

    expect(result).toEqual(defaultValue);
  });

  it("should return empty on serve if no default value", () => {
    const result = Server.renderToString(
      <Component storageKey={SSR_TEST_KEY} />,
    );

    expect(result).toEqual("");
  });

  it("should return defaultValue on server even after action execution attempt", () => {
    const defaultValue = "defaultValue";

    const result = Server.renderToString(
      <Component
        storageKey={SSR_TEST_KEY}
        storageDefaultValue={defaultValue}
        interactive
      />,
    );

    expect(result).toEqual(defaultValue);
  });

  it(`should call not useEffect`, () => {
    let calls = 0;

    function Component() {
      useLocalStorageSafe("test-key");

      useEffect(() => {
        calls++;
      });

      return null;
    }

    Server.renderToString(<Component />);

    expect(calls).toBe(0);
  });

  describe("server store mock", function () {
    it("should use serverStoreMock", () => {
      const spy = jest.spyOn(mock, "getStoreMock");

      Server.renderToString(<Component storageKey={SSR_TEST_KEY} />);

      expect(spy).toHaveBeenCalled();
    });

    it("serverStoreMock should return subscription function", () => {
      expect(getStoreMock().subscribe()).toStrictEqual(expect.any(Function));
    });
  });
});
