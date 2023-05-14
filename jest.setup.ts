import "@testing-library/jest-dom";
import "@testing-library/jest-dom/extend-expect";
import { TextEncoder, TextDecoder } from "node:util";

Object.assign(global, { TextDecoder, TextEncoder });
