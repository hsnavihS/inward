import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";

// utilities
import { deriveKey, encrypt } from "../../src/crypto";
import { encryptAndSave, loadAndDecrypt } from "../../src/storage";
import { importBackup } from "../../src/backup";

// types
import type { Entry } from "../../src/types/Entry";
import type { Tag } from "../../src/types/Tag";

/** Helper: build an encrypted .inw file blob */
async function buildBackupFile(
  payload: { entries: Entry[]; tags: Tag[]; exportedAt: number; vaultId: string },
  key: CryptoKey
): Promise<File> {
  const json = JSON.stringify(payload);
  const { ciphertext, iv } = await encrypt(json, key);
  const blob = new Blob([JSON.stringify({ ciphertext, iv })], { type: "application/json" });
  return new File([blob], "test.inw");
}

function makeEntry(overrides: Partial<Entry> & { id: string }): Entry {
  return {
    title: "Test",
    body: "body",
    tags: [],
    imageIds: [],
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

describe("backup", () => {
  let key: CryptoKey;
  let wrongKey: CryptoKey;
  const vaultId = "test-vault";

  beforeEach(async () => {
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (db.name) indexedDB.deleteDatabase(db.name);
    }
    key = await deriveKey("testpass");
    wrongKey = await deriveKey("wrongpass");
  });

  it("imports entries and tags into empty store", async () => {
    const entries = [makeEntry({ id: "a", updatedAt: 100 })];
    const tags: Tag[] = [{ name: "journal", createdAt: 100 }];
    const file = await buildBackupFile({ entries, tags, exportedAt: Date.now(), vaultId }, key);

    const result = await importBackup(file, key, vaultId);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].id).toBe("a");
    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].name).toBe("journal");
  });

  it("merges with existing local entries (newer wins)", async () => {
    const localEntries = [makeEntry({ id: "a", title: "local-new", updatedAt: 300 })];
    await encryptAndSave("entries", localEntries, key);
    await encryptAndSave("tags", [], key);

    const backupEntries = [makeEntry({ id: "a", title: "backup-old", updatedAt: 100 })];
    const file = await buildBackupFile({ entries: backupEntries, tags: [], exportedAt: Date.now(), vaultId }, key);

    const result = await importBackup(file, key, vaultId);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].title).toBe("local-new");
  });

  it("unions entries from both sides", async () => {
    const localEntries = [makeEntry({ id: "a", updatedAt: 100 })];
    await encryptAndSave("entries", localEntries, key);
    await encryptAndSave("tags", [], key);

    const backupEntries = [makeEntry({ id: "b", updatedAt: 200 })];
    const file = await buildBackupFile({ entries: backupEntries, tags: [], exportedAt: Date.now(), vaultId }, key);

    const result = await importBackup(file, key, vaultId);
    expect(result.entries).toHaveLength(2);
  });

  it("unions tags without duplicates", async () => {
    const localTags: Tag[] = [{ name: "work", createdAt: 100 }];
    await encryptAndSave("entries", [], key);
    await encryptAndSave("tags", localTags, key);

    const backupTags: Tag[] = [
      { name: "work", createdAt: 200 },
      { name: "personal", createdAt: 200 },
    ];
    const file = await buildBackupFile({ entries: [], tags: backupTags, exportedAt: Date.now(), vaultId }, key);

    const result = await importBackup(file, key, vaultId);
    expect(result.tags).toHaveLength(2);
    expect(result.tags.map((t) => t.name).sort()).toEqual(["personal", "work"]);
  });

  it("rejects file encrypted with wrong key", async () => {
    const file = await buildBackupFile(
      { entries: [], tags: [], exportedAt: Date.now(), vaultId },
      wrongKey
    );
    await expect(importBackup(file, key, vaultId)).rejects.toThrow("Failed to decrypt");
  });

  it("rejects invalid JSON file", async () => {
    const file = new File(["not json at all"], "bad.inw");
    await expect(importBackup(file, key, vaultId)).rejects.toThrow("not valid JSON");
  });

  it("rejects file missing ciphertext/iv", async () => {
    const file = new File([JSON.stringify({ foo: "bar" })], "bad.inw");
    await expect(importBackup(file, key, vaultId)).rejects.toThrow("missing encrypted data");
  });

  it("persists merged data to IDB", async () => {
    const entries = [makeEntry({ id: "a", updatedAt: 100 })];
    const tags: Tag[] = [{ name: "test", createdAt: 100 }];
    const file = await buildBackupFile({ entries, tags, exportedAt: Date.now(), vaultId }, key);

    await importBackup(file, key, vaultId);

    const storedEntries = await loadAndDecrypt<Entry[]>("entries", key);
    const storedTags = await loadAndDecrypt<Tag[]>("tags", key);
    expect(storedEntries).toHaveLength(1);
    expect(storedTags).toHaveLength(1);
  });
});
