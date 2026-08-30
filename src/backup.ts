// types
import type { Entry } from "./types/Entry";
import type { Tag } from "./types/Tag";

// utilities
import { encrypt, decrypt } from "./crypto";
import { loadAndDecrypt, encryptAndSave } from "./storage";
import { mergeEntries, pushAllEntries, pushTags } from "./sync";

interface BackupPayload {
  entries: Entry[];
  tags: Tag[];
  exportedAt: EpochTimeStamp;
  vaultId: string;
}

const ENTRIES_KEY = "entries";
const TAGS_KEY = "tags";

/** Build encrypted backup and trigger browser download as .inw file */
export async function exportBackup(key: CryptoKey, vaultId: string): Promise<void> {
  const entries = (await loadAndDecrypt<Entry[]>(ENTRIES_KEY, key)) ?? [];
  const tags = (await loadAndDecrypt<Tag[]>(TAGS_KEY, key)) ?? [];

  const payload: BackupPayload = {
    entries,
    tags,
    exportedAt: Date.now(),
    vaultId,
  };

  const json = JSON.stringify(payload);
  const { ciphertext, iv } = await encrypt(json, key);
  const blob = new Blob([JSON.stringify({ ciphertext, iv })], { type: "application/json" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inward-backup-${new Date().toISOString().slice(0, 10)}.inw`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Read .inw file, decrypt, validate, and merge into existing data */
export async function importBackup(
  file: File,
  key: CryptoKey,
  vaultId: string
): Promise<{ entries: Entry[]; tags: Tag[] }> {
  const text = await file.text();

  let envelope: { ciphertext: string; iv: string };
  try {
    envelope = JSON.parse(text);
  } catch {
    throw new Error("Invalid backup file: not valid JSON");
  }

  if (!envelope.ciphertext || !envelope.iv) {
    throw new Error("Invalid backup file: missing encrypted data");
  }

  let payload: BackupPayload;
  try {
    const json = await decrypt(envelope.ciphertext, envelope.iv, key);
    payload = JSON.parse(json);
  } catch {
    throw new Error("Failed to decrypt backup. Wrong passphrase or corrupted file.");
  }

  if (!Array.isArray(payload.entries) || !Array.isArray(payload.tags)) {
    throw new Error("Invalid backup file: unexpected data shape");
  }

  // Merge with existing local data
  const localEntries = (await loadAndDecrypt<Entry[]>(ENTRIES_KEY, key)) ?? [];
  const localTags = (await loadAndDecrypt<Tag[]>(TAGS_KEY, key)) ?? [];

  const mergedEntries = mergeEntries(localEntries, payload.entries);

  const tagNames = new Set(localTags.map((t) => t.name));
  const mergedTags = [
    ...localTags,
    ...payload.tags.filter((t) => !tagNames.has(t.name)),
  ];

  // Persist merged data
  await encryptAndSave(ENTRIES_KEY, mergedEntries, key);
  await encryptAndSave(TAGS_KEY, mergedTags, key);

  // Sync to Firestore (fire-and-forget)
  pushAllEntries(vaultId, mergedEntries, key).catch((err) => {
    throw new Error(`Failed to sync imported entries: ${err}`);
  });
  pushTags(vaultId, mergedTags, key).catch((err) => {
    throw new Error(`Failed to sync imported tags: ${err}`);
  });

  return { entries: mergedEntries, tags: mergedTags };
}
