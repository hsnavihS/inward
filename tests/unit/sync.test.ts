import { describe, it, expect } from "vitest";

// utilities
import { mergeEntries } from "../../src/sync";

interface TestEntry {
  id: string;
  updatedAt: number;
  title: string;
}

describe("mergeEntries", () => {
  it("returns local entries when remote is empty", () => {
    const local: TestEntry[] = [
      { id: "a", updatedAt: 100, title: "local" },
    ];
    const result = mergeEntries(local, []);
    expect(result).toEqual(local);
  });

  it("returns remote entries when local is empty", () => {
    const remote: TestEntry[] = [
      { id: "a", updatedAt: 100, title: "remote" },
    ];
    const result = mergeEntries([], remote);
    expect(result).toEqual(remote);
  });

  it("keeps newer remote entry over older local", () => {
    const local: TestEntry[] = [{ id: "a", updatedAt: 100, title: "old" }];
    const remote: TestEntry[] = [{ id: "a", updatedAt: 200, title: "new" }];
    const result = mergeEntries(local, remote);
    expect(result).toEqual([{ id: "a", updatedAt: 200, title: "new" }]);
  });

  it("keeps newer local entry over older remote", () => {
    const local: TestEntry[] = [{ id: "a", updatedAt: 300, title: "local-new" }];
    const remote: TestEntry[] = [{ id: "a", updatedAt: 100, title: "remote-old" }];
    const result = mergeEntries(local, remote);
    expect(result).toEqual([{ id: "a", updatedAt: 300, title: "local-new" }]);
  });

  it("unions entries that exist only on one side", () => {
    const local: TestEntry[] = [{ id: "a", updatedAt: 100, title: "only-local" }];
    const remote: TestEntry[] = [{ id: "b", updatedAt: 200, title: "only-remote" }];
    const result = mergeEntries(local, remote);
    expect(result).toHaveLength(2);
    expect(result.find((e) => e.id === "a")?.title).toBe("only-local");
    expect(result.find((e) => e.id === "b")?.title).toBe("only-remote");
  });

  it("handles mixed scenario correctly", () => {
    const local: TestEntry[] = [
      { id: "a", updatedAt: 100, title: "a-local" },
      { id: "b", updatedAt: 300, title: "b-local" },
      { id: "c", updatedAt: 100, title: "c-local-only" },
    ];
    const remote: TestEntry[] = [
      { id: "a", updatedAt: 200, title: "a-remote" },
      { id: "b", updatedAt: 100, title: "b-remote" },
      { id: "d", updatedAt: 400, title: "d-remote-only" },
    ];
    const result = mergeEntries(local, remote);
    expect(result).toHaveLength(4);
    expect(result.find((e) => e.id === "a")?.title).toBe("a-remote");
    expect(result.find((e) => e.id === "b")?.title).toBe("b-local");
    expect(result.find((e) => e.id === "c")?.title).toBe("c-local-only");
    expect(result.find((e) => e.id === "d")?.title).toBe("d-remote-only");
  });
});
