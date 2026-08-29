import { describe, it, expect } from "vitest";
import { deriveKey, deriveVaultId, encrypt, decrypt } from "../../src/crypto";

describe("deriveKey", () => {
  it("produces a valid AES-GCM CryptoKey", async () => {
    const key = await deriveKey("testpass");
    expect(key.algorithm).toMatchObject({ name: "AES-GCM", length: 256 });
    expect(key.usages).toContain("encrypt");
    expect(key.usages).toContain("decrypt");
  });

  it("same passphrase produces same key", async () => {
    const key1 = await deriveKey("same");
    const key2 = await deriveKey("same");
    const enc = await encrypt("hello", key1);
    const dec = await decrypt(enc.ciphertext, enc.iv, key2);
    expect(dec).toBe("hello");
  });

  it("different passphrase produces different key", async () => {
    const key1 = await deriveKey("pass1");
    const key2 = await deriveKey("pass2");
    const enc = await encrypt("hello", key1);
    await expect(decrypt(enc.ciphertext, enc.iv, key2)).rejects.toThrow();
  });
});

describe("deriveVaultId", () => {
  it("returns a 32-char hex string", async () => {
    const id = await deriveVaultId("test");
    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });

  it("same passphrase produces same vault ID", async () => {
    const id1 = await deriveVaultId("same");
    const id2 = await deriveVaultId("same");
    expect(id1).toBe(id2);
  });

  it("different passphrase produces different vault ID", async () => {
    const id1 = await deriveVaultId("pass1");
    const id2 = await deriveVaultId("pass2");
    expect(id1).not.toBe(id2);
  });
});

describe("encrypt / decrypt", () => {
  it("round-trips plaintext", async () => {
    const key = await deriveKey("test");
    const enc = await encrypt("hello world", key);
    const dec = await decrypt(enc.ciphertext, enc.iv, key);
    expect(dec).toBe("hello world");
  });

  it("handles empty string", async () => {
    const key = await deriveKey("test");
    const enc = await encrypt("", key);
    const dec = await decrypt(enc.ciphertext, enc.iv, key);
    expect(dec).toBe("");
  });

  it("handles unicode and emoji", async () => {
    const key = await deriveKey("test");
    const text = "日記 📝 entrée";
    const enc = await encrypt(text, key);
    const dec = await decrypt(enc.ciphertext, enc.iv, key);
    expect(dec).toBe(text);
  });

  it("produces different ciphertext each time (unique IV)", async () => {
    const key = await deriveKey("test");
    const enc1 = await encrypt("same", key);
    const enc2 = await encrypt("same", key);
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
    expect(enc1.iv).not.toBe(enc2.iv);
  });

  it("handles large text", async () => {
    const key = await deriveKey("test");
    const text = "x".repeat(100_000);
    const enc = await encrypt(text, key);
    const dec = await decrypt(enc.ciphertext, enc.iv, key);
    expect(dec).toBe(text);
  });
});
