import "@testing-library/jest-dom";
import { vi, beforeEach } from "vitest";

// Provide a reliable in-memory localStorage (jsdom's shim may not expose .clear())
const store: Record<string, string> = {};

const localStorageMock: Storage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
  get length() {
    return Object.keys(store).length;
  },
  key: (i: number) => Object.keys(store)[i] ?? null,
};

vi.stubGlobal("localStorage", localStorageMock);

beforeEach(() => {
  localStorageMock.clear();
});
