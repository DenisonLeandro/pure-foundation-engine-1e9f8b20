import { useState, useRef } from "react";
import { Loader2, Save, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { AppConfig } from "@/types";

export function ManageBrandView({
  currentConfig,
  onSave,
}: {
  currentConfig: AppConfig;
  onSave: (partial: Partial<AppConfig>) => Promise<void>;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [name, setName] = useState(currentConfig.brandName || "");
  const [logo, setLogo] = useState<string | undefined>(currentConfig.brandLogo);
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
    } finally {
      setSaving(false);
    }
  };

  return (
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

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            Salvar marca
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
