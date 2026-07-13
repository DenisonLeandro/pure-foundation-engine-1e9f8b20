import { useState, useRef } from "react";
import { Loader2, Save, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { STYLE_PRESETS } from "@/components/studio/workspace/designAesthetics";
import { SLIDE_TEMPLATES } from "@/lib/slide-compose";
import type { AppConfig } from "@/types";

const LAYOUT_OPTIONS = SLIDE_TEMPLATES.map((t) => ({ value: t, label: t }));

export function ManageBrandView({
  currentConfig,
  onSave,
  brandId,
  brand,
  onBrandUpdate,
}: {
  currentConfig: AppConfig;
  onSave: (partial: Partial<AppConfig>) => Promise<void>;
  brandId?: string;
  brand?: { art_style?: string; layout_presets?: string[]; font_title?: string; font_body?: string; color_roles?: Record<string, string>; reference_image_url?: string };
  onBrandUpdate?: () => void;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeCompanyId } = useCompany();
  const [name, setName] = useState(currentConfig.brandName || "");
  const [logo, setLogo] = useState<string | undefined>(currentConfig.brandLogo);
  const [artStyle, setArtStyle] = useState(brand?.art_style || "");
  const [layoutPresets, setLayoutPresets] = useState<string>(brand?.layout_presets?.[0] || "");
  const [fontTitle, setFontTitle] = useState(brand?.font_title || "");
  const [fontBody, setFontBody] = useState(brand?.font_body || "");
  const [refImageUrl, setRefImageUrl] = useState(brand?.reference_image_url || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `brand-logos/${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setLogo(data.publicUrl);
      toast({ title: "Logo enviada!" });
    } catch (err) {
      toast({ title: "Erro no upload", description: err instanceof Error ? err.message : "", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ brandName: name.trim() || "Minha Empresa", brandLogo: logo });
      if (brandId && activeCompanyId) {
        const payload: Record<string, string | string[]> = {};
        if (artStyle) payload.art_style = artStyle;
        if (layoutPresets) payload.layout_presets = [layoutPresets];
        if (fontTitle) payload.font_title = fontTitle;
        if (fontBody) payload.font_body = fontBody;
        if (refImageUrl) payload.reference_image_url = refImageUrl;
        if (Object.keys(payload).length > 0) {
          const { error } = await supabase.from("brand_profiles").update(payload as never).eq("id", brandId);
          if (error) throw error;
        }
        onBrandUpdate?.();
      }
      toast({ title: "Marca salva com sucesso!" });
    } catch (err) {
      toast({ title: "Erro ao salvar", description: err instanceof Error ? err.message : "", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base">Identidade da marca</CardTitle>
          <CardDescription className="text-xs">Nome e logo usados nos posts e visuais gerados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="brand-name">Nome da marca</Label>
            <Input id="brand-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Minha Empresa" />
          </div>

          <div className="space-y-2">
            <Label>Logo da marca</Label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-xl border border-dashed border-border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                {logo ? (
                  <img src={logo} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-[10px] text-muted-foreground">sem logo</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                  {logo ? "Trocar logo" : "Enviar logo"}
                </Button>
                {logo && (
                  <Button variant="ghost" size="sm" onClick={() => setLogo(undefined)} className="text-destructive">
                    <X className="h-3.5 w-3.5 mr-1" /> Remover
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {brandId && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base">Kit visual</CardTitle>
            <CardDescription className="text-xs">Configure o estilo padrão para geração de posts com IA.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="art-style">Estilo de arte</Label>
                <Select value={artStyle} onValueChange={setArtStyle}>
                  <SelectTrigger id="art-style" className="h-9 text-sm">
                    <SelectValue placeholder="Automático" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Automático</SelectItem>
                    {STYLE_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="layout-preset">Layout padrão</Label>
                <Select value={layoutPresets} onValueChange={setLayoutPresets}>
                  <SelectTrigger id="layout-preset" className="h-9 text-sm">
                    <SelectValue placeholder="Variado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Variado</SelectItem>
                    {LAYOUT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-title">Fonte para títulos</Label>
                <Input
                  id="font-title"
                  value={fontTitle}
                  onChange={(e) => setFontTitle(e.target.value)}
                  placeholder="Ex: Playfair Display"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-body">Fonte para corpo</Label>
                <Input
                  id="font-body"
                  value={fontBody}
                  onChange={(e) => setFontBody(e.target.value)}
                  placeholder="Ex: Poppins"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ref-image">URL de imagem de referência</Label>
              <Input
                id="ref-image"
                type="url"
                value={refImageUrl}
                onChange={(e) => setRefImageUrl(e.target.value)}
                placeholder="https://..."
                className="h-9 text-sm"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
          Salvar marca
        </Button>
      </div>
    </div>
  );
}
