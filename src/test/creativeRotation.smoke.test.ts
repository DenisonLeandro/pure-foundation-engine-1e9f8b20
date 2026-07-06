import { describe, it, expect, beforeEach } from "vitest";
import {
  drawFromBag,
  pickCreativeAngle,
  loadLastChoices,
  saveLastChoices,
  CREATIVE_ANGLES,
} from "@/components/studio/workspace/creativeRotation";
import { pickNextPreset, type StylePreset } from "@/components/studio/workspace/designAesthetics";

describe("drawFromBag (baralho sem repetição)", () => {
  it("nunca repete um item antes de esgotar todo o pool", () => {
    const pool = ["a", "b", "c", "d"];
    let bag: string[] | undefined;
    let last: string | undefined;
    const seenSinceReshuffle = new Set<string>();
    for (let i = 0; i < 400; i++) {
      const { picked, bag: nextBag } = drawFromBag(pool, bag, last);
      // Nunca repete o item imediatamente anterior.
      expect(picked).not.toBe(last);
      seenSinceReshuffle.add(picked);
      last = picked;
      bag = nextBag;
      if (bag.length === 0) {
        // Baralho esgotou: nesse ponto todo o pool já apareceu uma vez desde o último reshuffle.
        expect(seenSinceReshuffle.size).toBe(pool.length);
        seenSinceReshuffle.clear();
      }
    }
  });

  it("depois de N sorteios (N = tamanho do pool), todas as opções apareceram exatamente uma vez", () => {
    const pool = ["top", "kicker", "bottom", "side-bar", "center-card", "quote"];
    let bag: string[] | undefined;
    const picks: string[] = [];
    for (let i = 0; i < pool.length; i++) {
      const { picked, bag: nextBag } = drawFromBag(pool, bag, undefined);
      picks.push(picked);
      bag = nextBag;
    }
    expect(new Set(picks).size).toBe(pool.length);
    expect([...picks].sort()).toEqual([...pool].sort());
  });

  it("com `preferred`, tem mais chance de vir primeiro no ciclo — mas não em todo ciclo, e nunca muda a cobertura total", () => {
    const pool = ["a", "b", "c", "d", "e"];
    let firstIsPreferredCount = 0;
    const CYCLES = 300;
    for (let i = 0; i < CYCLES; i++) {
      const { picked } = drawFromBag(pool, undefined, undefined, "a");
      if (picked === "a") firstIsPreferredCount++;
    }
    const ratio = firstIsPreferredCount / CYCLES;
    // ~70% de chance de vir primeiro em cada ciclo novo, nunca 100%.
    expect(ratio).toBeGreaterThan(0.55);
    expect(ratio).toBeLessThan(0.85);
  });

  it("sem `preferred`, todo item tem chance de aparecer (distribuição não travada)", () => {
    const pool = ["a", "b", "c", "d"];
    let bag: string[] | undefined;
    let last: string | undefined;
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const { picked, bag: nextBag } = drawFromBag(pool, bag, last);
      seen.add(picked);
      last = picked;
      bag = nextBag;
    }
    expect(seen.size).toBe(pool.length);
  });
});

describe("pickNextPreset (bug original: art_style travava 100%)", () => {
  it("quando a marca tem art_style definido, NÃO retorna sempre o mesmo preset", () => {
    const results = new Set<StylePreset>();
    let lastUsed: StylePreset | undefined;
    let bag: StylePreset[] | undefined;
    for (let i = 0; i < 50; i++) {
      const { picked, bag: nextBag } = pickNextPreset("editorial", lastUsed, bag);
      results.add(picked);
      lastUsed = picked;
      bag = nextBag;
    }
    // Antes da correção original, isso seria sempre { "editorial" } (tamanho 1).
    expect(results.size).toBeGreaterThan(1);
  });

  it("nunca repete o preset anterior (anti-repetição consecutiva)", () => {
    let lastUsed: StylePreset | undefined = "editorial";
    let bag: StylePreset[] | undefined;
    for (let i = 0; i < 50; i++) {
      const { picked, bag: nextBag } = pickNextPreset("editorial", lastUsed, bag);
      expect(picked).not.toBe(lastUsed);
      lastUsed = picked;
      bag = nextBag;
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
