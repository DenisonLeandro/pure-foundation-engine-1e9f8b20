import { describe, it, expect, beforeEach } from "vitest";
import {
  pickWeighted,
  pickCreativeAngle,
  loadLastChoices,
  saveLastChoices,
  CREATIVE_ANGLES,
} from "@/components/studio/workspace/creativeRotation";
import { pickNextPreset, type StylePreset } from "@/components/studio/workspace/designAesthetics";

describe("pickWeighted", () => {
  it("nunca repete `avoid` mesmo com preferredWeight alto", () => {
    const pool = ["a", "b", "c"];
    for (let i = 0; i < 200; i++) {
      const picked = pickWeighted(pool, { preferred: "a", avoid: "a", preferredWeight: 0.9 });
      expect(picked).not.toBe("a");
    }
  });

  it("com preferredWeight alto, escolhe o preferido na maioria das vezes (mas não sempre)", () => {
    const pool = ["top", "kicker", "bottom", "side-bar", "center-card", "quote"];
    let preferredCount = 0;
    const N = 500;
    for (let i = 0; i < N; i++) {
      const picked = pickWeighted(pool, { preferred: "kicker", preferredWeight: 0.6 });
      if (picked === "kicker") preferredCount++;
    }
    const ratio = preferredCount / N;
    // deve estar perto de 0.6, com folga estatística
    expect(ratio).toBeGreaterThan(0.45);
    expect(ratio).toBeLessThan(0.75);
    // e nunca 100% travado
    expect(preferredCount).toBeLessThan(N);
  });

  it("sem preferred, distribui entre todo o pool (não trava num único valor)", () => {
    const pool = ["editorial", "minimal", "modern", "energetic"];
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(pickWeighted(pool));
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe("pickNextPreset (bug original: art_style travava 100%)", () => {
  it("quando a marca tem art_style definido, NÃO retorna sempre o mesmo preset", () => {
    const results = new Set<StylePreset>();
    let lastUsed: StylePreset | undefined;
    for (let i = 0; i < 100; i++) {
      const picked = pickNextPreset("editorial", lastUsed);
      results.add(picked);
      lastUsed = picked;
    }
    // Antes da correção, isso seria sempre { "editorial" } (tamanho 1).
    expect(results.size).toBeGreaterThan(1);
  });

  it("nunca repete o preset anterior (anti-repetição consecutiva)", () => {
    let lastUsed: StylePreset | undefined = "editorial";
    for (let i = 0; i < 100; i++) {
      const picked = pickNextPreset("editorial", lastUsed);
      expect(picked).not.toBe(lastUsed);
      lastUsed = picked;
    }
  });
});

describe("pickCreativeAngle", () => {
  beforeEach(() => localStorage.clear());

  it("nunca repete o ângulo anterior da mesma marca", () => {
    const companyId = "company-1";
    const brandId = "brand-1";
    let lastId: string | undefined;
    for (let i = 0; i < 50; i++) {
      const angle = pickCreativeAngle(companyId, brandId);
      if (lastId) expect(angle.id).not.toBe(lastId);
      lastId = angle.id;
    }
  });

  it("persiste a escolha via companyStorage, isolada por marca", () => {
    pickCreativeAngle("company-1", "brand-A");
    pickCreativeAngle("company-1", "brand-B");
    const a = loadLastChoices("company-1", "brand-A");
    const b = loadLastChoices("company-1", "brand-B");
    expect(a?.angle).toBeTruthy();
    expect(b?.angle).toBeTruthy();
    // marcas diferentes não compartilham estado
    saveLastChoices("company-1", "brand-A", { template: "kicker" });
    expect(loadLastChoices("company-1", "brand-B")?.template).toBeUndefined();
  });

  it("todos os ângulos têm id e instruction não vazios", () => {
    expect(CREATIVE_ANGLES.length).toBeGreaterThanOrEqual(5);
    for (const a of CREATIVE_ANGLES) {
      expect(a.id).toBeTruthy();
      expect(a.instruction.length).toBeGreaterThan(10);
    }
  });
});
