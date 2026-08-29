import { describe, it, expect, vi, beforeEach } from "vitest";

describe("firebase config", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("marks Firebase as unconfigured when env vars are missing", async () => {
    vi.stubEnv("VITE_FB_API_KEY", "");
    vi.stubEnv("VITE_FB_PROJECT_ID", "");

    const { isFirebaseConfigured, app, db } = await import("../../src/firebase");

    expect(isFirebaseConfigured).toBe(false);
    expect(app).toBeNull();
    expect(db).toBeNull();
  });

  it("marks Firebase as configured when env vars are set", async () => {
    vi.stubEnv("VITE_FB_API_KEY", "test-key");
    vi.stubEnv("VITE_FB_AUTH_DOMAIN", "test.firebaseapp.com");
    vi.stubEnv("VITE_FB_PROJECT_ID", "test-project");
    vi.stubEnv("VITE_FB_STORAGE_BUCKET", "test.appspot.com");
    vi.stubEnv("VITE_FB_MESSAGING_SENDER_ID", "123456");
    vi.stubEnv("VITE_FB_APP_ID", "1:123:web:abc");

    const { isFirebaseConfigured, app, db } = await import("../../src/firebase");

    expect(isFirebaseConfigured).toBe(true);
    expect(app).not.toBeNull();
    expect(db).not.toBeNull();
  });
});
