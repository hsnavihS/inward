import { deriveKey, encrypt, decrypt, deriveVaultId } from "../crypto";

async function testCrypto() {
  const key = await deriveKey("test");
  console.log(key);
  const enc = await encrypt("shivansh", key);
  console.log(enc);
  const dec = await decrypt(enc.ciphertext, enc.iv, key);
  console.log(dec);
  console.assert(dec === "shivansh");
  console.log(await deriveVaultId("test")); // consistent hex string
}

export default function Home() {
  testCrypto();
  return <h1>Home</h1>;
}
