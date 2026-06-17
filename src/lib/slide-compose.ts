/**
 * Compõe um slide final desenhando texto real (via canvas, sem erros ortográficos)
 * sobre uma imagem de fundo gerada pela IA.
 *
 * Biblioteca de templates: cada template tem uma composição visual distinta
 * (rodapé, topo, cartão central, barra lateral, kicker, citação). O AutoStudio
 * rotaciona templates entre slides do mesmo carrossel pra evitar que os posts
 * saiam todos com a mesma cara.
 */

const W = 1024;
const H = 1536;

export type SlideTemplate = "bottom" | "top" | "center-card" | "side-bar" | "kicker" | "quote";

export const SLIDE_TEMPLATES: SlideTemplate[] = ["bottom", "side-bar", "kicker", "center-card", "top", "quote"];

/** Posição preferida do "espaço limpo" no fundo, dado o template. Usado pra
 *  orientar o prompt da cena (a IA deixa essa metade mais simples/escura). */
export function preferredCleanArea(t: SlideTemplate): "bottom" | "top" | "center" | "left" | "right" {
  switch (t) {
    case "bottom":
    case "kicker": return "bottom";
    case "top": return "top";
    case "center-card":
    case "quote": return "center";
    case "side-bar": return "left";
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Ajusta o tamanho da fonte até caber em maxLines linhas dentro de maxW. */
function fitHeading(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  maxLines: number,
  startSize: number,
  minSize: number,
  weight = 800,
  fontStack = `"Inter", "Helvetica Neue", Arial, system-ui, sans-serif`,
): { size: number; lines: string[] } {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${fontStack}`;
  let lines = wrapLines(ctx, text.trim(), maxW);
  while ((lines.length > maxLines || lines.some((l) => ctx.measureText(l).width > maxW)) && size > minSize) {
    size -= 4;
    ctx.font = `${weight} ${size}px ${fontStack}`;
    lines = wrapLines(ctx, text.trim(), maxW);
  }
  return { size, lines };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return {
    r: parseInt(v.slice(0, 2), 16) || 0,
    g: parseInt(v.slice(2, 4), 16) || 0,
    b: parseInt(v.slice(4, 6), 16) || 0,
  };
}
const rgba = (hex: string, a: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};

export interface ComposeOpts {
  bgUrl: string;
  heading: string;
  body?: string;
  brandColor?: string;
  brandHandle?: string;
  index?: number;
  total?: number;
  template?: SlideTemplate;
}

const FONT = `"Inter", "Helvetica Neue", Arial, system-ui, sans-serif`;

/** Desenha o contador (idx/total) e o handle da marca no topo. */
function drawChrome(
  ctx: CanvasRenderingContext2D,
  brandHandle: string | undefined,
  index: number | undefined,
  total: number | undefined,
  margin: number,
  color = "rgba(255,255,255,0.85)",
) {
  ctx.textBaseline = "top";
  if (typeof index === "number" && typeof total === "number" && total > 1) {
    ctx.font = `600 26px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = "right";
    ctx.fillText(`${index + 1} / ${total}`, W - margin, margin);
  }
  if (brandHandle) {
    ctx.font = `500 24px ${FONT}`;
    ctx.fillStyle = color === "rgba(255,255,255,0.85)" ? "rgba(255,255,255,0.7)" : color;
    ctx.textAlign = "left";
    ctx.fillText(brandHandle, margin, margin);
  }
}

/** Desenha o fundo (cover) no canvas. */
function drawBackground(ctx: CanvasRenderingContext2D, bg: HTMLImageElement) {
  const scale = Math.max(W / bg.width, H / bg.height);
  const dw = bg.width * scale;
  const dh = bg.height * scale;
  ctx.drawImage(bg, (W - dw) / 2, (H - dh) / 2, dw, dh);
}

/** Render principal — escolhe o template e delega. */
export async function composeSlideWithText(opts: ComposeOpts): Promise<string> {
  const { bgUrl } = opts;
  let bg: HTMLImageElement | null = null;
  try { bg = await loadImage(bgUrl); } catch { return bgUrl; }

  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return bgUrl;

  drawBackground(ctx, bg);

  const template: SlideTemplate = opts.template || "bottom";
  switch (template) {
    case "top": renderTop(ctx, opts); break;
    case "center-card": renderCenterCard(ctx, opts); break;
    case "side-bar": renderSideBar(ctx, opts); break;
    case "kicker": renderKicker(ctx, opts); break;
    case "quote": renderQuote(ctx, opts); break;
    case "bottom":
    default: renderBottom(ctx, opts); break;
  }

  return canvas.toDataURL("image/png");
}

// ============================================================================
// Templates
// ============================================================================

/** Sombra em camadas: densa rente à letra + halo amplo diluído. Quase
 *  invisível como mancha, mas dá leitura forte sobre qualquer foto.
 *  Canvas 2D só aceita uma sombra por draw — então pintamos o texto duas
 *  vezes: uma com halo amplo e outra com a sombra densa por cima. */
function paintTextWithShadow(
  ctx: CanvasRenderingContext2D,
  draw: () => void,
  strong = false,
) {
  ctx.save();
  ctx.shadowColor = strong ? "rgba(0,0,0,0.32)" : "rgba(0,0,0,0.28)";
  ctx.shadowBlur = strong ? 32 : 24;
  ctx.shadowOffsetY = strong ? 12 : 8;
  draw();
  ctx.restore();
  ctx.save();
  ctx.shadowColor = strong ? "rgba(0,0,0,0.38)" : "rgba(0,0,0,0.35)";
  ctx.shadowBlur = strong ? 10 : 6;
  ctx.shadowOffsetY = 2;
  draw();
  ctx.restore();
  ctx.save();
  ctx.shadowColor = strong ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 1;
  ctx.shadowOffsetY = 1;
  draw();
  ctx.restore();
}

function applyTextShadow(ctx: CanvasRenderingContext2D, strong = false) {
  ctx.shadowColor = strong ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.5)";
  ctx.shadowBlur = strong ? 4 : 2;
  ctx.shadowOffsetY = 1;
}
function clearShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
}

function drawCounter(
  ctx: CanvasRenderingContext2D, index: number | undefined, total: number | undefined,
  position: "top-right" | "bottom-right", margin: number,
) {
  if (typeof index !== "number" || typeof total !== "number" || total <= 1) return;
  applyTextShadow(ctx);
  ctx.textBaseline = position === "top-right" ? "top" : "alphabetic";
  ctx.font = `600 26px ${FONT}`;
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.textAlign = "right";
  const y = position === "top-right" ? margin : H - margin;
  ctx.fillText(`${index + 1} / ${total}`, W - margin, y);
  clearShadow(ctx);
}

function drawHandle(ctx: CanvasRenderingContext2D, brandHandle: string | undefined, margin: number) {
  if (!brandHandle) return;
  applyTextShadow(ctx);
  ctx.font = `500 22px ${FONT}`;
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.fillText(brandHandle, margin, H - margin);
  clearShadow(ctx);
}

function renderBottom(ctx: CanvasRenderingContext2D, opts: ComposeOpts) {
  const { heading, body, brandHandle, index, total } = opts;
  const margin = 88;
  const maxW = W - margin * 2;

  // SEM gradiente sobre a foto. Legibilidade vem só da sombra do texto.
  drawCounter(ctx, index, total, "top-right", margin);

  const { size: headingSize, lines } = fitHeading(ctx, heading, maxW, 4, 124, 64);
  const lineHeight = Math.round(headingSize * 1.02);
  const bodyText = (body || "").trim();
  const bodySize = Math.max(30, Math.round(headingSize * 0.32));
  const bodyLineHeight = Math.round(bodySize * 1.4);

  ctx.font = `400 ${bodySize}px ${FONT}`;
  const bodyLines = bodyText ? wrapLines(ctx, bodyText, maxW) : [];
  const gap = 32;
  const totalBlockH = lines.length * lineHeight + (bodyLines.length ? gap + bodyLines.length * bodyLineHeight : 0);
  let y = H - margin - totalBlockH;
  if (brandHandle) y -= 48;

  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.font = `800 ${headingSize}px ${FONT}`;
  ctx.fillStyle = "#ffffff";
  let yTitle = y;
  for (const line of lines) {
    const lineY = yTitle;
    paintTextWithShadow(ctx, () => ctx.fillText(line, margin, lineY), true);
    yTitle += lineHeight;
  }
  y = yTitle;

  if (bodyLines.length) {
    y += gap;
    ctx.font = `400 ${bodySize}px ${FONT}`;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    applyTextShadow(ctx);
    for (const line of bodyLines) { ctx.fillText(line, margin, y); y += bodyLineHeight; }
  }
  clearShadow(ctx);
  drawHandle(ctx, brandHandle, margin);
}


function renderTop(ctx: CanvasRenderingContext2D, opts: ComposeOpts) {
  const { heading, body, brandHandle, index, total } = opts;
  const margin = 88;
  const maxW = W - margin * 2;

  // Sem overlay, sem régua branca. Só texto sobre a foto.
  const { size: headingSize, lines } = fitHeading(ctx, heading, maxW, 4, 108, 56);
  const lineHeight = Math.round(headingSize * 1.04);
  let y = margin + 40;

  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.font = `800 ${headingSize}px ${FONT}`;
  ctx.fillStyle = "#ffffff";
  for (const line of lines) {
    const lineY = y;
    paintTextWithShadow(ctx, () => ctx.fillText(line, margin, lineY), true);
    y += lineHeight;
  }

  const bodyText = (body || "").trim();
  if (bodyText) {
    const bodySize = Math.max(28, Math.round(headingSize * 0.34));
    ctx.font = `400 ${bodySize}px ${FONT}`;
    const bodyLines = wrapLines(ctx, bodyText, maxW);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    applyTextShadow(ctx);
    y += 28;
    for (const line of bodyLines) { ctx.fillText(line, margin, y); y += Math.round(bodySize * 1.4); }
  }
  clearShadow(ctx);

  drawCounter(ctx, index, total, "bottom-right", margin);
  drawHandle(ctx, brandHandle, margin);
}

function renderCenterCard(ctx: CanvasRenderingContext2D, opts: ComposeOpts) {
  const { heading, body, brandHandle, index, total } = opts;
  const margin = 88;
  const maxW = W - margin * 2;

  // Sem card escuro. Texto centralizado, legibilidade só pela sombra.
  drawCounter(ctx, index, total, "top-right", margin);

  const { size: headingSize, lines } = fitHeading(ctx, heading, maxW, 4, 96, 52);
  const lineHeight = Math.round(headingSize * 1.06);
  const bodyText = (body || "").trim();
  const bodySize = Math.max(28, Math.round(headingSize * 0.34));
  ctx.font = `400 ${bodySize}px ${FONT}`;
  const bodyLines = bodyText ? wrapLines(ctx, bodyText, maxW) : [];

  const gap = 28;
  const totalBlockH = lines.length * lineHeight + (bodyLines.length ? gap + bodyLines.length * Math.round(bodySize * 1.4) : 0);
  let y = Math.round((H - totalBlockH) / 2);

  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.font = `800 ${headingSize}px ${FONT}`;
  ctx.fillStyle = "#ffffff";
  for (const line of lines) {
    const lineY = y;
    paintTextWithShadow(ctx, () => ctx.fillText(line, W / 2, lineY), true);
    y += lineHeight;
  }

  if (bodyLines.length) {
    y += gap;
    ctx.font = `400 ${bodySize}px ${FONT}`;
    ctx.fillStyle = "rgba(255,255,255,0.94)";
    applyTextShadow(ctx);
    for (const line of bodyLines) { ctx.fillText(line, W / 2, y); y += Math.round(bodySize * 1.4); }
  }
  clearShadow(ctx);

  drawHandle(ctx, brandHandle, margin);
}


function renderSideBar(ctx: CanvasRenderingContext2D, opts: ComposeOpts) {
  const { heading, body, brandColor = "#f59e0b", brandHandle, index, total } = opts;
  const barW = Math.round(W * 0.42);
  const pad = 64;

  // Sombreia suavemente o resto
  ctx.fillStyle = "rgba(10,15,30,0.35)"; ctx.fillRect(barW, 0, W - barW, H);

  // Barra vertical da cor da marca (com leve gradiente)
  const g = ctx.createLinearGradient(0, 0, barW, 0);
  g.addColorStop(0, rgba(brandColor, 0.96));
  g.addColorStop(1, rgba(brandColor, 0.82));
  ctx.fillStyle = g; ctx.fillRect(0, 0, barW, H);

  // Chrome (sobre a barra à esquerda, sobre a foto à direita)
  ctx.textBaseline = "top";
  if (brandHandle) {
    ctx.font = `500 24px ${FONT}`; ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.textAlign = "left"; ctx.fillText(brandHandle, pad, pad);
  }
  if (typeof index === "number" && typeof total === "number" && total > 1) {
    ctx.font = `600 26px ${FONT}`; ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.textAlign = "right"; ctx.fillText(`${index + 1} / ${total}`, W - pad, pad);
  }

  const maxW = barW - pad * 2;
  const { size: headingSize, lines } = fitHeading(ctx, heading, maxW, 6, 72, 38);
  const lineHeight = Math.round(headingSize * 1.08);
  const bodyText = (body || "").trim();
  const bodySize = Math.max(24, Math.round(headingSize * 0.4));
  ctx.font = `500 ${bodySize}px ${FONT}`;
  const bodyLines = bodyText ? wrapLines(ctx, bodyText, maxW) : [];

  const totalBlockH = lines.length * lineHeight + (bodyLines.length ? 24 + bodyLines.length * Math.round(bodySize * 1.35) : 0);
  let y = Math.max(pad + 80, Math.round((H - totalBlockH) / 2));

  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.font = `800 ${headingSize}px ${FONT}`;
  ctx.fillStyle = "#ffffff";
  for (const line of lines) { ctx.fillText(line, pad, y); y += lineHeight; }

  if (bodyLines.length) {
    y += 24;
    ctx.font = `500 ${bodySize}px ${FONT}`;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    for (const line of bodyLines) { ctx.fillText(line, pad, y); y += Math.round(bodySize * 1.35); }
  }

  // Detalhe: traço branco no rodapé da barra
  ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fillRect(pad, H - pad, 64, 4);
}

function renderKicker(ctx: CanvasRenderingContext2D, opts: ComposeOpts) {
  const { heading, body, brandHandle, index, total } = opts;
  const margin = 88;
  const maxW = W - margin * 2;

  // Sem gradiente sobre a foto.
  drawCounter(ctx, index, total, "top-right", margin);

  const kickerText = typeof index === "number" && typeof total === "number" && total > 1
    ? `PARTE ${String(index + 1).padStart(2, "0")}`
    : "DESTAQUE";

  const { size: headingSize, lines } = fitHeading(ctx, heading, maxW, 4, 104, 52);
  const lineHeight = Math.round(headingSize * 1.04);
  const bodyText = (body || "").trim();
  const bodySize = Math.max(28, Math.round(headingSize * 0.34));
  ctx.font = `400 ${bodySize}px ${FONT}`;
  const bodyLines = bodyText ? wrapLines(ctx, bodyText, maxW) : [];

  const kickerH = 56;
  const totalBlockH = kickerH + lines.length * lineHeight + (bodyLines.length ? 28 + bodyLines.length * Math.round(bodySize * 1.4) : 0);
  let y = Math.max(Math.round(H * 0.46), H - margin - totalBlockH - 40);
  if (brandHandle) y -= 32;

  // Traço fino + rótulo caps
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillRect(margin, y + 6, 36, 3);
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.font = `700 22px ${FONT}`;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  applyTextShadow(ctx);
  ctx.fillText(kickerText, margin + 48, y);
  y += kickerH;

  ctx.font = `800 ${headingSize}px ${FONT}`;
  ctx.fillStyle = "#ffffff";
  applyTextShadow(ctx, true);
  for (const line of lines) { ctx.fillText(line, margin, y); y += lineHeight; }

  if (bodyLines.length) {
    y += 28;
    ctx.font = `400 ${bodySize}px ${FONT}`;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    applyTextShadow(ctx);
    for (const line of bodyLines) { ctx.fillText(line, margin, y); y += Math.round(bodySize * 1.4); }
  }
  clearShadow(ctx);

  drawHandle(ctx, brandHandle, margin);
}


function renderQuote(ctx: CanvasRenderingContext2D, opts: ComposeOpts) {
  const { heading, brandColor = "#f59e0b", brandHandle, index, total } = opts;
  const margin = 88;
  const maxW = W - margin * 2 - 60;

  // Vinheta central
  const rg = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, W);
  rg.addColorStop(0, "rgba(10,15,30,0.25)");
  rg.addColorStop(1, "rgba(10,15,30,0.85)");
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);

  drawChrome(ctx, brandHandle, index, total, margin);

  // Aspas gigantes
  ctx.fillStyle = rgba(brandColor, 0.95);
  ctx.font = `900 280px Georgia, "Times New Roman", serif`;
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText("“", margin, H * 0.22);

  const { size: headingSize, lines } = fitHeading(ctx, heading, maxW, 6, 68, 38, 600);
  const lineHeight = Math.round(headingSize * 1.22);
  const totalBlockH = lines.length * lineHeight;
  let y = Math.round((H - totalBlockH) / 2);

  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.font = `600 ${headingSize}px Georgia, "Times New Roman", serif`;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 16;
  for (const line of lines) { ctx.fillText(line, W / 2, y); y += lineHeight; }
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;

  // Traço de marca centralizado abaixo
  ctx.fillStyle = brandColor;
  ctx.fillRect(W / 2 - 40, y + 24, 80, 4);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
