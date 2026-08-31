// utilities
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { encrypt, decrypt } from "./crypto";
import { db, isFirebaseConfigured } from "./firebase";

// -- Vault existence check --

/** Check if a vault exists in Firestore */
export async function vaultExists(vaultId: string): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;

  const snap = await getDocs(collection(db, "vaults", vaultId, "entries"));
  return !snap.empty;
}

// -- Entries --

/** Push a single encrypted entry to Firestore */
export async function pushEntry(
  vaultId: string,
  entry: { id: string; updatedAt: number },
  key: CryptoKey
): Promise<void> {
  if (!isFirebaseConfigured || !db) return;

  const json = JSON.stringify(entry);
  const { ciphertext, iv } = await encrypt(json, key);

  await setDoc(doc(db, "vaults", vaultId, "entries", entry.id), {
    ciphertext,
    iv,
    updatedAt: entry.updatedAt,
  });
}

/** Pull all entries from Firestore, decrypt them */
export async function pullEntries<T>(
  vaultId: string,
  key: CryptoKey
): Promise<T[]> {
  if (!isFirebaseConfigured || !db) return [];

  const snap = await getDocs(collection(db, "vaults", vaultId, "entries"));
  const results: T[] = [];

  for (const d of snap.docs) {
    const { ciphertext, iv } = d.data() as { ciphertext: string; iv: string };
    const json = await decrypt(ciphertext, iv, key);
    results.push(JSON.parse(json) as T);
  }

  return results;
}

/** Delete an entry from Firestore */
export async function deleteRemoteEntry(
  vaultId: string,
  entryId: string
): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  await deleteDoc(doc(db, "vaults", vaultId, "entries", entryId));
}

/** Push a single entry only if it doesn't already exist in Firestore */
export async function pushEntryIfMissing(
  vaultId: string,
  entry: { id: string; updatedAt: number },
  key: CryptoKey
): Promise<void> {
  if (!isFirebaseConfigured || !db) return;

  const snap = await getDoc(doc(db, "vaults", vaultId, "entries", entry.id));
  if (snap.exists()) return;

  await pushEntry(vaultId, entry, key);
}

/** Push all entries to Firestore, skipping ones that already exist */
export async function pushAllEntries(
  vaultId: string,
  entries: { id: string; updatedAt: number }[],
  key: CryptoKey
): Promise<void> {
  if (!isFirebaseConfigured || !db) return;

  for (const entry of entries) {
    await pushEntryIfMissing(vaultId, entry, key);
  }
}

// -- Tags --

/** Push encrypted tags to Firestore */
export async function pushTags<T>(
  vaultId: string,
  tags: T,
  key: CryptoKey
): Promise<void> {
  if (!isFirebaseConfigured || !db) return;

  const json = JSON.stringify(tags);
  const { ciphertext, iv } = await encrypt(json, key);

  await setDoc(doc(db, "vaults", vaultId, "meta", "tags"), {
    ciphertext,
    iv,
  });
}

/** Pull encrypted tags from Firestore */
export async function pullTags<T>(
  vaultId: string,
  key: CryptoKey
): Promise<T | null> {
  if (!isFirebaseConfigured || !db) return null;

  const snap = await getDoc(doc(db, "vaults", vaultId, "meta", "tags"));
  if (!snap.exists()) return null;

  const { ciphertext, iv } = snap.data() as { ciphertext: string; iv: string };
  const json = await decrypt(ciphertext, iv, key);
  return JSON.parse(json) as T;
}

// -- Merge utility --

/** Merge local and remote entries. Newer updatedAt wins, union of both sets */
export function mergeEntries<T extends { id: string; updatedAt: number }>(
  local: T[],
  remote: T[]
): T[] {
  const map = new Map<string, T>();

  for (const e of local) {
    map.set(e.id, e);
  }

  for (const e of remote) {
    const existing = map.get(e.id);
    if (!existing || e.updatedAt > existing.updatedAt) {
      map.set(e.id, e);
    }
  }

  return Array.from(map.values());
}
