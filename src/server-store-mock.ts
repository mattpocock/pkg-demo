const voidFunction = () => void 0;
export const getStoreMock = () => ({
  subscribe: () => voidFunction,
  getSnapshot: voidFunction,
  setItem: voidFunction,
});
