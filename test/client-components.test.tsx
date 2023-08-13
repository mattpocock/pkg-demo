import { render } from "@testing-library/react";
import { ExternalStore, useLocalStorageSafe } from "../src";
import { useEffect } from "react";
import React from "react";

describe("Client side components", () => {
  afterEach(() => {
    localStorage.clear();
    ExternalStore.inMemory.clear();
    ExternalStore.listeners.clear();
    jest.clearAllMocks();
  });

  it(`setState shouldn't change between renders`, () => {
    const PRESERVE_FUNCTION_LINK_KEY = "PRESERVE_FUNCTION_LINK_KEY";
    function Component() {
      const [value, setValue] = useLocalStorageSafe(
        PRESERVE_FUNCTION_LINK_KEY,
        1,
      );

      useEffect(() => {
        setValue((value) => value + 1);
      }, [setValue]);

      return <div>{value}</div>;
    }

    const { queryByText } = render(<Component />);

    expect(queryByText(2)).toBeTruthy();
  });

  it(`setState() during render`, () => {
    function Component() {
      const [value, setValue] = useLocalStorageSafe("number", 0);

      if (value === 0) {
        setValue(1);
      }

      return <div>{value}</div>;
    }

    const { queryByText } = render(<Component />);

    expect(queryByText(0)).not.toBeTruthy();
    expect(queryByText(1)).toBeTruthy();
  });

  it(`should notify other components`, () => {
    const SAME_KEY = "SAME_KEY";
    const OLD_VALUE = "OLD_VALUE";
    const NEW_VALUE = "NEW_VALUE";
    function Component() {
      const [value] = useLocalStorageSafe(SAME_KEY, OLD_VALUE);
      return <div>{value}</div>;
    }

    function Component2() {
      const [value, setValue] = useLocalStorageSafe(SAME_KEY, OLD_VALUE);

      useEffect(() => {
        setValue(NEW_VALUE);
      }, [setValue]);

      return <div>{value}</div>;
    }

    const { queryByText, queryAllByText } = render(
      <>
        <Component /> <Component2 />
      </>,
    );

    expect(queryByText(OLD_VALUE)).not.toBeTruthy();
    expect(queryAllByText(NEW_VALUE)).toHaveLength(2);
  });
});
