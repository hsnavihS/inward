import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { deriveKey } from "../../src/crypto";
import { encryptAndSave, loadAndDecrypt, removeEncrypted } from "../../src/storage";

describe("storage", () => {
  let key: CryptoKey;

  beforeEach(async () => {
    // Clear all indexedDb databases between tests
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (db.name) indexedDB.deleteDatabase(db.name);
    }
    key = await deriveKey("testpass");
  });

  it("round-trips a simple object", async () => {
    const data = { title: "Hello", count: 42 };
    await encryptAndSave("test-key", data, key);
    const loaded = await loadAndDecrypt<typeof data>("test-key", key);
    expect(loaded).toEqual(data);
  });

  it("round-trips an array of entries", async () => {
    const entries = [
      { id: "1", title: "First", body: "content", tags: [], createdAt: 1000, updatedAt: 1000 },
      { id: "2", title: "Second", body: "more", tags: [{ name: "test", createdAt: 1000 }], createdAt: 2000, updatedAt: 2000 },
    ];
    await encryptAndSave("entries", entries, key);
    const loaded = await loadAndDecrypt<typeof entries>("entries", key);
    expect(loaded).toEqual(entries);
  });

  it("returns null for non-existent key", async () => {
    const loaded = await loadAndDecrypt("missing", key);
    expect(loaded).toBeNull();
  });

  it("overwrites existing data", async () => {
    await encryptAndSave("key", { v: 1 }, key);
    const initial = await loadAndDecrypt<{ v: number }>("key", key);
    expect(initial).toEqual({ v: 1 });
    await encryptAndSave("key", { v: 2 }, key);
    const loaded = await loadAndDecrypt<{ v: number }>("key", key);
    expect(loaded).toEqual({ v: 2 });
  });

  it("removes a key", async () => {
    await encryptAndSave("key", "data", key);
    await removeEncrypted("key");
    const loaded = await loadAndDecrypt("key", key);
    expect(loaded).toBeNull();
  });

  it("different crypto key cannot decrypt data", async () => {
    const otherKey = await deriveKey("wrongpass");
    await encryptAndSave("secret", { msg: "hello" }, key);
    await expect(loadAndDecrypt("secret", otherKey)).rejects.toThrow();
  });
});
