import "node:util";
import { render } from "@testing-library/react";
import Server from "react-dom/server";
import React from "react";
import { useLocalStorageSafe } from "../src";
import "@testing-library/jest-dom/extend-expect";

const SSR_TEST_KEY = "server-side-test-key";
function Component(properties: {
  storageKey: string;
  storageDefaultValue?: string;
  interactive?: boolean;
}) {
  const { storageKey, storageDefaultValue, interactive } = properties;
  const [value, setValue] = useLocalStorageSafe<string>(
    storageKey,
    storageDefaultValue
  );

  if (interactive) {
    setValue("test");
  }
  return <>{value}</>;
}

describe("Server side render", () => {
  it("should hydrate", () => {
    const defaultValue = "successfully hydrated";

    const component = (
      <Component storageKey={SSR_TEST_KEY} storageDefaultValue={defaultValue} />
    );

    const container = document.createElement("div");
    document.body.append(container);
    container.innerHTML = Server.renderToString(component);
    const { baseElement } = render(component, { hydrate: true, container });

    expect(baseElement.textContent).toBe(defaultValue);
  });

  it("should return default value", () => {
    const defaultValue = "server default";

    const result = Server.renderToString(
      <Component storageKey={SSR_TEST_KEY} storageDefaultValue={defaultValue} />
    );

    expect(result).toEqual(defaultValue);
  });

  it("should return empty on serve if no default value", () => {
    const result = Server.renderToString(
      <Component storageKey={SSR_TEST_KEY} />
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
      />
    );

    expect(result).toEqual(defaultValue);
  });
});
