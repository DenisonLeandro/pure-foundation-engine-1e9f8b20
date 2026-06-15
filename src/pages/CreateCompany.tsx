import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Building2 } from "lucide-react";

export default function CreateCompany() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { companies, refreshCompanies, setActiveCompanyId } = useCompany();
  const [name, setName] = useState("");
  const [segment, setSegment] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#7c3aed");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      toast({ title: "Informe o nome da empresa", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("companies")
      .insert({
        name: name.trim(),
        segment: segment.trim() || null,
        primary_color: primaryColor || null,
        created_by: user.id,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error || !data) {
      toast({ title: "Erro ao criar empresa", description: error?.message, variant: "destructive" });
      return;
    }
    await refreshCompanies();
    setActiveCompanyId(data.id);
    toast({ title: "Empresa criada!" });
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center text-white">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Crie sua empresa</h1>
          <p className="text-sm text-muted-foreground">
            Você será o Dono e poderá convidar sua equipe depois.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da empresa</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Acme Ltda" autoFocus required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="segment">Segmento / área de atuação</Label>
            <Input id="segment" value={segment} onChange={(e) => setSegment(e.target.value)} placeholder="Ex.: Moda, Tecnologia, Educação" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Cor principal (opcional)</Label>
            <div className="flex items-center gap-2">
              <input
                id="color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-14 rounded border border-input bg-background cursor-pointer"
              />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1" />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar empresa"}
          </Button>
          {companies.length > 0 && (
            <Button type="button" variant="ghost" className="w-full" onClick={() => navigate(-1)}>
              Voltar
            </Button>
          )}
        </form>
      </Card>
    </div>
  );
}
