/**
 * Variedade real de geração no Studio ("Criar com IA").
 *
 * Antes, quando a marca tinha `art_style`/`layout_presets` configurado, o
 * template e o preset visual ficavam travados no mesmo valor para sempre —
 * o oposto do esperado (quanto mais a marca configura identidade, mais
 * robótico o resultado ficava). Uma primeira correção trocou isso por um
 * sorteio ponderado (marca com mais chance, nunca trava total), mas em
 * poucas tentativas reais o "favorito" ainda aparecia com frequência alta
 * o bastante pra parecer "sempre igual".
 *
 * Este módulo usa um baralho sem repetição (shuffle bag): todas as opções
 * entram embaralhadas num baralho, e cada geração tira uma sem devolver —
 * só reembaralha quando o baralho esvazia. Isso garante que TODAS as opções
 * aparecem antes de qualquer repetição, com frequência de longo prazo
 * uniforme entre elas. A preferência da marca só influencia a ORDEM (tem
 * mais chance de vir primeiro em cada ciclo novo), nunca a frequência.
 */

import { companyStorage } from "@/lib/companyStorage";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildBag<T>(pool: T[], preferred?: T, avoidFirst?: T): T[] {
  const shuffled = shuffle(pool);
  const useFavorite = preferred !== undefined && pool.includes(preferred) && Math.random() < 0.7;
  if (useFavorite && preferred !== avoidFirst) {
    const idx = shuffled.indexOf(preferred as T);
    shuffled.splice(idx, 1);
    shuffled.unshift(preferred as T);
  } else if (avoidFirst !== undefined && shuffled[0] === avoidFirst && shuffled.length > 1) {
    // Evita que o item que acabou de sair no ciclo anterior vire o primeiro do ciclo novo.
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  return shuffled;
}

/**
 * Tira um item do baralho persistido (`bag`); reembaralha automaticamente
 * quando esvazia. `preferred` (ex.: art_style/layout_presets da marca) só
 * influencia a ordem de um baralho novo, nunca a frequência de longo prazo.
 */
export function drawFromBag<T>(
  pool: T[],
  bag: T[] | undefined,
  lastPicked: T | undefined,
  preferred?: T,
): { picked: T; bag: T[] } {
  const currentBag = bag && bag.length ? bag : buildBag(pool, preferred, lastPicked);
  const [picked, ...rest] = currentBag;
  return { picked, bag: rest };
}

interface LastChoices {
  template?: string;
  templateBag?: string[];
  preset?: string;
  presetBag?: string[];
  accent?: string;
  accentBag?: string[];
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
