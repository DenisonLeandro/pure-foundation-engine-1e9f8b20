/**
 * Regenera miniaturas antigas da galeria em background.
 *
 * Motivo: `creations.urls[]` e `thumbnail_url` são PNGs congelados no momento
 * em que o post foi criado. Se as regras de renderização (ex.: tamanho/layout
 * da logo) mudam depois, os thumbnails antigos ficam desatualizados. Aqui, ao
 * abrir a Galeria, detectamos posts com layer `brand_logo` fora do padrão
 * atual, re-renderizamos com o mesmo pipeline do editor e persistimos.
 *
 * - Serial (1 por vez) para não travar a UI.
 * - Limite máx. por sessão para não consumir banda demais.
 * - `Set` em memória evita reprocessar o mesmo id na mesma sessão.
 * - Pula posts publicados/agendados (arte já divulgada) e sem `design_doc`.
 */

import { getCreation, updateCreation, type Creation } from "@/lib/gallery";
import { renderDocOffscreen, type RenderBrand } from "@/components/studio/workspace/renderDocOffscreen";
import { applyBrandLogo, docHasCurrentBrandLogo, BRAND_LOGO_ROLE } from "@/components/studio/workspace/brandLogo";
import type { StudioDoc } from "@/components/studio/workspace/types";

const processed = new Set<string>();
let running = false;

const MAX_PER_SESSION = 12;

function docHasAnyBrandLogo(doc: StudioDoc): boolean {
  return doc.slides?.some((s) => (s.els || []).some((e) => e.role === BRAND_LOGO_ROLE)) ?? false;
}

export interface RefreshOptions {
  brand: RenderBrand & { logo_url?: string | null };
  onUpdated?: (id: string, updated: Creation) => void;
}

/**
 * Enfileira posts elegíveis para regenerar em background.
 * Chamar sempre que a lista de criações carregar; é seguro chamar múltiplas vezes
 * (posts já processados nesta sessão são ignorados).
 */
export function scheduleThumbnailRefresh(creations: Creation[], opts: RefreshOptions): void {
  const logoUrl = opts.brand?.logo_url || "";
  if (!logoUrl) return; // sem logo cadastrada, nada a atualizar

  const candidates = creations.filter((c) => {
    if (processed.has(c.id)) return false;
    if (c.published) return false; // arte já divulgada, não mexer
    if (c.type === "video") return false;
    return true;
  });

  if (!candidates.length) return;

  // fila serial em background
  void runQueue(candidates, opts);
}

async function runQueue(candidates: Creation[], opts: RefreshOptions): Promise<void> {
  if (running) return;
  running = true;
  let done = 0;

  try {
    for (const c of candidates) {
      if (done >= MAX_PER_SESSION) break;
      if (processed.has(c.id)) continue;
      processed.add(c.id);

      try {
        const updated = await refreshOne(c.id, opts);
        if (updated) {
          done++;
          opts.onUpdated?.(c.id, updated);
        }
      } catch (err) {
        console.warn("[gallery-refresh] falhou:", c.id, err);
      }

      // pequena pausa para ceder a thread
      await new Promise((r) => setTimeout(r, 150));
    }
  } finally {
    running = false;
  }
}

async function refreshOne(id: string, opts: RefreshOptions): Promise<Creation | null> {
  const full = await getCreation(id);
  if (!full || !full.designDoc) return null;

  const doc = full.designDoc as unknown as StudioDoc;
  const logoUrl = opts.brand.logo_url || "";

  // Só regenera se:
  //  - o doc já tinha camada brand_logo (não criamos do zero em posts antigos), e
  //  - o layout atual está fora do padrão vigente.
  if (!docHasAnyBrandLogo(doc)) return null;
  if (docHasCurrentBrandLogo(doc, logoUrl)) return null;

  const nextDoc = applyBrandLogo(doc, logoUrl);
  const urls = await renderDocOffscreen(nextDoc, opts.brand);
  if (!urls.length) return null;

  return updateCreation(id, {
    urls,
    thumbnailUrl: urls[0],
    designDoc: nextDoc as unknown as Creation["designDoc"],
  });
}
