/**
 * Compõe um slide final desenhando texto real (via canvas, sem erros ortográficos)
 * sobre uma imagem de fundo gerada pela IA.
 *
 * Motivação: modelos de imagem renderizam letras como pixels e erram a grafia,
 * principalmente em pt-BR. A IA gera só o cenário; aqui escrevemos o texto.
 */

const W = 1024;
const H = 1536;

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

export interface ComposeOpts {
  bgUrl: string;
  heading: string;
  body?: string;
  brandColor?: string;        // cor de destaque (ex: laranja da marca)
  brandHandle?: string;       // ex: "#NTV05"
  index?: number;             // 0-based
  total?: number;
}

/**
 * Retorna um data URL PNG 1024x1536 com o texto sobreposto.
 * Se a imagem de fundo falhar, retorna a própria bgUrl (fallback gracioso).
 */
export async function composeSlideWithText(opts: ComposeOpts): Promise<string> {
  const { bgUrl, heading, body, brandColor = "#f59e0b", brandHandle, index, total } = opts;

  let bg: HTMLImageElement | null = null;
  try {
    bg = await loadImage(bgUrl);
  } catch {
    return bgUrl;
  }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return bgUrl;

  // 1) fundo (cover)
  const scale = Math.max(W / bg.width, H / bg.height);
  const dw = bg.width * scale;
  const dh = bg.height * scale;
  ctx.drawImage(bg, (W - dw) / 2, (H - dh) / 2, dw, dh);

  // 2) overlay escuro pra garantir contraste do texto (metade inferior + topo sutil)
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "rgba(10,15,30,0.35)");
  grad.addColorStop(0.45, "rgba(10,15,30,0.15)");
  grad.addColorStop(1, "rgba(10,15,30,0.85)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const fontStack = `"Inter", "Helvetica Neue", Arial, system-ui, sans-serif`;
  const margin = 88;
  const maxW = W - margin * 2;

  // 3) indicador idx/total + handle no topo
  ctx.textBaseline = "top";
  if (typeof index === "number" && typeof total === "number" && total > 1) {
    ctx.font = `600 26px ${fontStack}`;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.textAlign = "right";
    ctx.fillText(`${index + 1} / ${total}`, W - margin, margin);
  }
  if (brandHandle) {
    ctx.font = `500 24px ${fontStack}`;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.textAlign = "left";
    ctx.fillText(brandHandle, margin, margin);
  }

  // 4) título — quebra com tamanho adaptativo
  let headingSize = 92;
  ctx.font = `800 ${headingSize}px ${fontStack}`;
  let lines = wrapLines(ctx, heading.trim(), maxW);
  while ((lines.length > 4 || lines.some((l) => ctx.measureText(l).width > maxW)) && headingSize > 48) {
    headingSize -= 6;
    ctx.font = `800 ${headingSize}px ${fontStack}`;
    lines = wrapLines(ctx, heading.trim(), maxW);
  }

  // posicionamento: começa em ~55% pra deixar espaço de respiro acima
  const lineHeight = Math.round(headingSize * 1.08);
  const bodyText = (body || "").trim();
  const bodySize = Math.max(28, Math.round(headingSize * 0.38));
  const bodyLineHeight = Math.round(bodySize * 1.35);

  // Calcula altura total do bloco e ancora no rodapé com margem
  ctx.font = `500 ${bodySize}px ${fontStack}`;
  const bodyLines = bodyText ? wrapLines(ctx, bodyText, maxW) : [];
  const bodyBlockH = bodyLines.length ? bodyLines.length * bodyLineHeight + 32 : 0;
  const headingBlockH = lines.length * lineHeight;
  const totalBlockH = headingBlockH + bodyBlockH;
  let y = H - margin - totalBlockH - 40;
  if (y < H * 0.45) y = H * 0.45;

  // 5) desenha título — primeira palavra em cor de destaque
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = `800 ${headingSize}px ${fontStack}`;
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 2;

  const firstWordOfHeading = heading.trim().split(/\s+/)[0] || "";

  for (const line of lines) {
    let x = margin;
    const words = line.split(" ");
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const isAccent = word === firstWordOfHeading;
      ctx.fillStyle = isAccent ? brandColor : "#ffffff";
      ctx.fillText(word, x, y);
      x += ctx.measureText(word + (i < words.length - 1 ? " " : "")).width;
    }
    y += lineHeight;
  }

  // 6) body
  if (bodyLines.length) {
    y += 32;
    ctx.font = `500 ${bodySize}px ${fontStack}`;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.shadowBlur = 8;
    for (const line of bodyLines) {
      ctx.fillText(line, margin, y);
      y += bodyLineHeight;
    }
  }

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 7) detalhe da marca: linha fininha no rodapé com a cor da marca
  ctx.fillStyle = brandColor;
  ctx.fillRect(margin, H - margin, 120, 4);

  return canvas.toDataURL("image/png");
}
