// utilities
import { encrypt, decrypt } from "./crypto";

const DB_NAME = "inward";
const DB_VERSION = 1;
const STORE_NAME = "vault";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function indexedDbGet(db: IDBDatabase, key: string): Promise<unknown | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function indexedDbPut(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Encrypt a JS value and store it in IndexedDB
export async function encryptAndSave<T>(key: string, data: T, cryptoKey: CryptoKey): Promise<void> {
  const json = JSON.stringify(data);
  const encrypted = await encrypt(json, cryptoKey);
  const db = await openDB();
  await indexedDbPut(db, key, encrypted);
  db.close();
}

// Load and decrypt a value from IndexedDB. Returns null if key doesn't exist.
export async function loadAndDecrypt<T>(key: string, cryptoKey: CryptoKey): Promise<T | null> {
  const db = await openDB();
  const record = await indexedDbGet(db, key) as { ciphertext: string; iv: string } | undefined;
  db.close();
  if (!record) return null;
  const json = await decrypt(record.ciphertext, record.iv, cryptoKey);
  return JSON.parse(json) as T;
}

// Remove a key from IndexedDB
export async function removeEncrypted(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
