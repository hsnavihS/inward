import { createContext, useContext, useState } from "react";
import { deriveKey, deriveVaultId, verifyPassphrase } from "../crypto";
import type { ReactNode } from "react";

interface VaultContext {
  key: CryptoKey;
  vaultId: string;
  lock: () => void;
}

const Ctx = createContext<VaultContext | null>(null);

export function useVault(): VaultContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVault must be used within VaultProvider");
  return ctx;
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [vault, setVault] = useState<{ key: CryptoKey; vaultId: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const unlock = async (passphrase: string) => {
    setLoading(true);
    setError("");
    try {
      const valid = await verifyPassphrase(passphrase);
      if (!valid) {
        setError("Wrong passphrase");
        return;
      }
      const [key, vaultId] = await Promise.all([
        deriveKey(passphrase),
        deriveVaultId(passphrase),
      ]);
      setVault({ key, vaultId });
    } catch {
      setError("Failed to derive key");
    } finally {
      setLoading(false);
    }
  };

  const lock = () => setVault(null);

  if (!vault) {
    return <UnlockScreen onUnlock={unlock} error={error} loading={loading} />;
  }

  return <Ctx.Provider value={{ ...vault, lock }}>{children}</Ctx.Provider>;
}

function UnlockScreen({
  onUnlock,
  error,
  loading,
}: {
  onUnlock: (passphrase: string) => void;
  error: string;
  loading: boolean;
}) {
  const [passphrase, setPassphrase] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passphrase.trim()) onUnlock(passphrase);
  };

  return (
    <div className="unlock-screen">
      <h1>Inward</h1>
      <p className="dim">Enter passphrase to unlock</p>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="passphrase"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          disabled={loading}
          autoFocus
        />
        <button type="submit" disabled={loading || !passphrase.trim()}>
          {loading ? "decrypting..." : "[ unlock ]"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
