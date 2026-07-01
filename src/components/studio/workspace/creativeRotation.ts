/**
 * Variedade real de geração no Studio ("Criar com IA").
 *
 * Antes, quando a marca tinha `art_style`/`layout_presets` configurado, o
 * template e o preset visual ficavam travados no mesmo valor para sempre —
 * o oposto do esperado (quanto mais a marca configura identidade, mais
 * robótico o resultado ficava). Este módulo centraliza o sorteio ponderado
 * (marca como preferência, nunca como trava total) e a persistência da
 * última escolha por marca, para não repetir a mesma opção entre gerações
 * consecutivas.
 */

import { companyStorage } from "@/lib/companyStorage";

/** Sorteia um item do pool dando mais chance ao `preferred`, sem nunca travar nele, e evita repetir `avoid`. */
export function pickWeighted<T>(
  pool: T[],
  opts: { preferred?: T; avoid?: T; preferredWeight?: number } = {},
): T {
  const { preferred, avoid, preferredWeight = 0.45 } = opts;
  const withoutAvoid = avoid !== undefined ? pool.filter((x) => x !== avoid) : pool;
  const candidates = withoutAvoid.length ? withoutAvoid : pool;

  if (preferred !== undefined && candidates.includes(preferred) && Math.random() < preferredWeight) {
    return preferred;
  }

  const rest = candidates.filter((x) => x !== preferred);
  const finalPool = rest.length ? rest : candidates;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

interface LastChoices {
  template?: string;
  preset?: string;
  angle?: string;
  updatedAt: number;
}

function storageKey(brandId: string | null | undefined): string {
  return `studio:last-choice:v1:${brandId || "default"}`;
}

export function loadLastChoices(
  companyId: string | null | undefined,
  brandId: string | null | undefined,
): LastChoices | null {
  try {
    const raw = companyStorage.get(companyId, storageKey(brandId));
    return raw ? (JSON.parse(raw) as LastChoices) : null;
  } catch {
    return null;
  }
}

export function saveLastChoices(
  companyId: string | null | undefined,
  brandId: string | null | undefined,
  patch: Partial<Omit<LastChoices, "updatedAt">>,
): void {
  try {
    const prev = loadLastChoices(companyId, brandId) || { updatedAt: 0 };
    const next: LastChoices = { ...prev, ...patch, updatedAt: Date.now() };
    companyStorage.set(companyId, storageKey(brandId), JSON.stringify(next));
  } catch {
    // nunca quebra a geração por causa de persistência de preferência
  }
}

export interface CreativeAngle {
  id: string;
  label: string;
  instruction: string;
}

/** Arquétipos de abertura/enfoque narrativo para variar a legenda entre gerações. */
export const CREATIVE_ANGLES: CreativeAngle[] = [
  {
    id: "pergunta-retorica",
    label: "Pergunta retórica",
    instruction:
      "Abra com uma pergunta genuína e específica sobre o tema (não genérica tipo \"você sabia?\") que faça o leitor pensar antes de continuar.",
  },
  {
    id: "dado-concreto",
    label: "Dado concreto",
    instruction:
      "Abra citando um número, prazo ou fato concreto e específico relacionado ao tema — sem inventar dado, use só o que está no contexto/tema fornecido.",
  },
  {
    id: "micro-historia",
    label: "Micro-história",
    instruction:
      "Abra com uma cena breve e concreta (situação, personagem implícito, momento do dia a dia) que ilustre o tema antes de explicá-lo.",
  },
  {
    id: "contraste",
    label: "Contraste / comparação",
    instruction:
      "Abra contrastando duas ideias, dois cenários ou \"antes vs depois\" relacionados ao tema, para criar tensão logo na primeira frase.",
  },
  {
    id: "bastidores",
    label: "Bastidores",
    instruction:
      "Abra com uma observação de bastidor/processo interno (como se contasse algo que normalmente não se vê publicamente) relacionado ao tema.",
  },
  {
    id: "afirmacao-direta",
    label: "Afirmação direta / opinião",
    instruction:
      "Abra com uma afirmação direta e assertiva (uma opinião clara, sem rodeio) sobre o tema, sem pedir permissão ao leitor com perguntas.",
  },
];

/** Escolhe um ângulo criativo evitando repetir o último usado por esta marca, e já persiste a escolha. */
export function pickCreativeAngle(
  companyId: string | null | undefined,
  brandId: string | null | undefined,
): CreativeAngle {
  const lastAngleId = loadLastChoices(companyId, brandId)?.angle;
  const candidates = lastAngleId
    ? CREATIVE_ANGLES.filter((a) => a.id !== lastAngleId)
    : CREATIVE_ANGLES;
  const picked = candidates[Math.floor(Math.random() * candidates.length)] || CREATIVE_ANGLES[0];
  saveLastChoices(companyId, brandId, { angle: picked.id });
  return picked;
}
