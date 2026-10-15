import assert from "node:assert/strict";
import test from "node:test";
import { safeNext } from "../src/lib/safe-next.ts";

test("auth redirects preserve local destinations and encoded search", () => {
  assert.equal(safeNext("/save?url=https%3A%2F%2Fexample.com#notes"), "/save?url=https%3A%2F%2Fexample.com#notes");
  assert.equal(safeNext("/?tag=design"), "/?tag=design");
});

test("auth redirects reject external origins and URL normalization tricks", () => {
  for (const value of ["https://example.com", "//example.com", "/\\example.com", "/\t/example.com", "/\n/example.com", "/\r/example.com", "javascript:alert(1)", "", null]) {
    assert.equal(safeNext(value), "/");
  }
});
