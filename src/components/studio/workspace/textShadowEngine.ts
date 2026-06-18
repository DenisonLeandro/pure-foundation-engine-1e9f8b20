/**
 * Motor de sugestão de drop-shadow para legibilidade de textos.
 *
 * Análisa fundo (cor sólida vs. imagem) e propõe shadow adaptativo
 * em 3 níveis: Discreto (sutil), Médio (padrão), Forte (proteção máxima).
 *
 * Drop-shadow em camadas garante leitura 100% legível sem parecer
 * "efeito antigo" — é invisível em fundos claros, mas protege em qualquer cenário.
 */

import type { StudioDoc, El, Slide } from "./types";
import { getRelativeLuminance, getContrastRatio, parseHex } from "./designReadability";

// ─── Presets de shadow (em camadas) ─────────────────────────────
//
// IMPORTANTE: todas as camadas são OMNIDIRECIONAIS (contorno ao redor de
// toda a letra, não só sombra para baixo). Isso é o que garante leitura
// sobre fundo BRANCO/claro — as bordas superiores e laterais das letras
// brancas ganham um anel escuro que as separa do fundo. Sombras só para
// baixo (offset-y positivo) falham em foto branca.

/**
 * SHADOW_DISCRETE: contorno fino + halo curto, peso visual baixo.
 * Uso: fundos médios, quando contraste já é 4.5-7.
 * Renderização: anel sutil ao redor da letra, quase imperceptível.
 */
export const SHADOW_DISCRETE =
  "0 0 1px rgba(0,0,0,0.65), -1px -1px 1px rgba(0,0,0,0.35), 1px -1px 1px rgba(0,0,0,0.35), -1px 1px 1px rgba(0,0,0,0.35), 1px 1px 1px rgba(0,0,0,0.35), 0 0 3px rgba(0,0,0,0.4)";

/**
 * SHADOW_MEDIUM: contorno definido + halo suave.
 * Uso: padrão editorial, fundos médios/escuros, layout robusto.
 * Renderização: anel escuro nítido em volta da letra + difusão suave.
 */
export const SHADOW_MEDIUM =
  "0 0 2px rgba(0,0,0,0.85), -1px -1px 1px rgba(0,0,0,0.6), 1px -1px 1px rgba(0,0,0,0.6), -1px 1px 1px rgba(0,0,0,0.6), 1px 1px 1px rgba(0,0,0,0.6), 0 0 4px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.4)";

/**
 * SHADOW_STRONG: contorno escuro forte (tipo stroke) + halo amplo.
 * Uso: fotos BRANCAS/claras, fundos complexos, máxima proteção.
 * Renderização: anel escuro denso em todas as direções — garante 100%
 * de leitura de texto branco mesmo sobre fundo totalmente branco.
 */
export const SHADOW_STRONG =
  "-1px -1px 1px rgba(0,0,0,0.9), 1px -1px 1px rgba(0,0,0,0.9), -1px 1px 1px rgba(0,0,0,0.9), 1px 1px 1px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.85), 0 0 8px rgba(0,0,0,0.6), 0 2px 10px rgba(0,0,0,0.45)";

export interface ShadowPreset {
  name: string;
  hint: string;
  value: string;
}

export const SHADOW_PRESETS: ShadowPreset[] = [
  {
    name: "Automático",
    hint: "O Studio escolhe baseado no fundo",
    value: "auto",
  },
  {
    name: "Discreto",
    hint: "Sutil, para fundos médios",
    value: SHADOW_DISCRETE,
  },
  {
    name: "Médio",
    hint: "Padrão editorial, imagens escuras",
    value: SHADOW_MEDIUM,
  },
  {
    name: "Forte",
    hint: "Proteção máxima, fundos complexos",
    value: SHADOW_STRONG,
  },
];

// ─── Utilitários ───────────────────────────────────────────────

type BgTone = "light" | "dark" | "complex";

/**
 * Determina o tom do fundo: claro, escuro ou imagem complexa.
 */
export function determineBgTone(
  bgColor: string | null,
  isImageBg: boolean
): BgTone {
  if (isImageBg) return "complex";
  if (!bgColor) return "complex";

  const lum = getRelativeLuminance(bgColor);
  return lum >= 0.5 ? "light" : "dark";
}

/**
 * Valida se uma string é uma sintaxe text-shadow CSS válida.
 * Exemplos válidos:
 *   "0 1px 0 rgba(0,0,0,0.6)"
 *   "0 1px 0 black, 0 2px 4px rgba(0,0,0,0.3)"
 */
export function validateShadow(shadowString: string): boolean {
  if (!shadowString || typeof shadowString !== "string") return false;
  const s = shadowString.trim();
  if (s.length === 0) return false;

  // Aceita padrão básico: "offset-x offset-y [blur] [spread] color"
  // Podemos ser permissivos aqui — deixar o navegador rejeitar sintaxe inválida
  // Checamos só que não vem com sintaxe obviamente errada
  const hasShadowPart = /^[\d.-]+\s+[\d.-]+/;
  return hasShadowPart.test(s);
}

/**
 * Estima o "peso visual" de uma sombra (0 = nenhuma, 1 = máxima).
 * Heurística simples: conta camadas (virgulas) e check opacidade.
 */
export function shadowIntensity(shadowString: string): number {
  if (!shadowString) return 0;

  const layers = shadowString.split(",").length;
  // 1 camada = 0.3, 2 = 0.5, 3 = 0.7, 4+ = 1.0
  const baseIntensity = Math.min(1, layers * 0.25);

  // Check se há opacidade alta (>0.7) em qualquer camada
  const hasHighOpacity = /rgba?\([^)]*,\s*[0.8-1]/i.test(shadowString);
  return hasHighOpacity ? Math.min(1, baseIntensity + 0.2) : baseIntensity;
}

// ─── Motor de sugestão ──────────────────────────────────────────

interface BgInfo {
  color: string | null;
  fromImage: boolean;
}

/**
 * Retorna uma sugestão de shadow CSS para um texto.
 *
 * Lógica:
 *   1. Se texto já tem shadow forte → retorna null (respeitar)
 *   2. Fundo é imagem → retorna SHADOW_STRONG (máxima proteção)
 *   3. Fundo é cor sólida:
 *      - Contraste < 4.5 → SHADOW_STRONG
 *      - Contraste 4.5-7 → SHADOW_DISCRETE
 *      - Contraste >= 7 → null (não precisa)
 */
export function suggestShadow(
  textColor: string,
  bgInfo: BgInfo,
  existingShadow?: string
): string | null {
  // Respeitar shadow existente e forte
  if (existingShadow && validateShadow(existingShadow)) {
    const intensity = shadowIntensity(existingShadow);
    if (intensity >= 0.4) return null; // já tem proteção, não sobrescrever
  }

  // Fundo é imagem: máxima proteção
  if (bgInfo.fromImage) {
    return SHADOW_STRONG;
  }

  // Fundo é cor sólida: analisar contraste
  if (bgInfo.color) {
    const contrast = getContrastRatio(textColor, bgInfo.color);
    if (contrast < 4.5) {
      return SHADOW_STRONG;
    } else if (contrast < 7) {
      return SHADOW_DISCRETE;
    }
    // contraste >= 7: já legível, sem necessidade
    return null;
  }

  // Fundo desconhecido: ser conservador
  return SHADOW_STRONG;
}

/**
 * Sugere um shadow compatível com a cor do texto.
 * Wrapper simples de `suggestShadow()` que extrai BgInfo do slide/elemento.
 */
export function suggestShadowForEl(
  el: El,
  slide: Slide,
  previousEls: El[]
): string | null {
  if (el.type !== "text") return null;

  const textColor = el.color || "#ffffff";

  // Procura overlay opaco atrás do elemento
  for (const other of previousEls) {
    if (other.type !== "shape" || !other.bg) continue;
    const c = parseHex(other.bg);
    const opacity = other.opacity ?? 1;
    if (!c) continue;
    const effAlpha = (c.a ?? 1) * opacity;
    if (effAlpha < 0.55) continue;

    // Verifica overlap (simplificado)
    const overlaps =
      !(
        other.x + other.w < el.x ||
        el.x + el.w < other.x ||
        other.y + other.h < el.y ||
        el.y + el.h < other.y
      );
    if (overlaps) {
      return suggestShadow(
        textColor,
        { color: other.bg, fromImage: false },
        el.shadow
      );
    }
  }

  // Fundo direto do slide
  const bgInfo: BgInfo = slide.bgImage
    ? { color: null, fromImage: true }
    : { color: extractSlideSolidBg(slide.bg), fromImage: false };

  return suggestShadow(textColor, bgInfo, el.shadow);
}

/**
 * Extrai uma cor sólida aproximada do `slide.bg` (gradiente ou cor).
 */
function extractSlideSolidBg(bg?: string): string | null {
  if (!bg) return null;
  const s = bg.trim();
  if (parseHex(s)) return s;
  // gradiente: pega o primeiro hex/rgb que encontrar
  const hex = /#([0-9a-f]{3,8})/i.exec(s);
  if (hex) return `#${hex[1]}`;
  const rgb = /rgba?\([^)]+\)/i.exec(s);
  if (rgb) return rgb[0];
  return null;
}

// ─── Aplicação em lote ao documento ────────────────────────────

/**
 * Aplica shadows automáticos a todos os textos de um documento.
 * Respeita shadows existentes; só preenche onde há gap de proteção.
 */
export function applyAutoShadowsToDoc(doc: StudioDoc): StudioDoc {
  const slides = doc.slides.map((slide) => {
    const els = slide.els.map((el, idx) => {
      if (el.type !== "text") return el;

      const previousEls = slide.els.slice(0, idx);
      const suggested = suggestShadowForEl(el, slide, previousEls);

      // Só aplicar se não há shadow existente
      if (suggested && !el.shadow) {
        return { ...el, shadow: suggested };
      }
      return el;
    });

    return { ...slide, els };
  });

  return { ...doc, slides };
}
