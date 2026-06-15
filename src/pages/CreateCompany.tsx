import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Building2, CheckCircle2, Link2, Loader2, LogOut, Plus } from "lucide-react";

type LegacyBrand = {
  id: string;
  name: string;
  industry: string | null;
  logo_url: string | null;
  colors: string[] | null;
  is_default: boolean | null;
};

type OwnedCompany = {
  id: string;
  name: string;
  segment: string | null;
  logo_url: string | null;
  primary_color: string | null;
  created_by: string;
  legacy_brand_profile_id: string | null;
};

const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");

const getInviteToken = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    return url.searchParams.get("token")?.trim() || trimmed;
  } catch {
    const tokenMatch = trimmed.match(/[?&]token=([^&]+)/);
    return tokenMatch?.[1] ? decodeURIComponent(tokenMatch[1]).trim() : trimmed;
  }
};

export default function CreateCompany() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { companies, refreshCompanies, setActiveCompanyId } = useCompany();
  const [name, setName] = useState("");
  const [segment, setSegment] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#7c3aed");
  const [saving, setSaving] = useState(false);
  const [checkingLegacy, setCheckingLegacy] = useState(true);
  const [legacyBrands, setLegacyBrands] = useState<LegacyBrand[]>([]);
  const [ownedCompanies, setOwnedCompanies] = useState<OwnedCompany[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteValue, setInviteValue] = useState("");

  const memberCompanyIds = useMemo(() => new Set(companies.map((item) => item.company.id)), [companies]);

  const findCompanyForBrand = useCallback((brand: LegacyBrand) => {
    const normalizedBrandName = normalizeName(brand.name);
    return ownedCompanies.find((company) =>
      company.legacy_brand_profile_id === brand.id || normalizeName(company.name) === normalizedBrandName
    ) ?? null;
  }, [ownedCompanies]);

  const unlinkedCompanies = useMemo(() => {
    return ownedCompanies.filter((company) => {
      if (memberCompanyIds.has(company.id)) return false;
      return !legacyBrands.some((brand) => findCompanyForBrand(brand)?.id === company.id);
    });
  }, [findCompanyForBrand, legacyBrands, memberCompanyIds, ownedCompanies]);

  const loadLegacyOptions = useCallback(async () => {
    if (!user) return;
    setCheckingLegacy(true);
    const [brandResult, companyResult] = await Promise.all([
      (supabase as any)
        .from("brand_profiles")
        .select("id, name, industry, logo_url, colors, is_default")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false }),
      (supabase as any)
        .from("companies")
        .select("id, name, segment, logo_url, primary_color, created_by, legacy_brand_profile_id")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (brandResult.error) {
      console.warn("[CreateCompany] erro ao buscar marcas antigas:", brandResult.error);
      setLegacyBrands([]);
    } else {
      setLegacyBrands((brandResult.data ?? []) as LegacyBrand[]);
    }

    if (companyResult.error) {
      console.warn("[CreateCompany] erro ao buscar empresas existentes:", companyResult.error);
      setOwnedCompanies([]);
    } else {
      setOwnedCompanies((companyResult.data ?? []) as OwnedCompany[]);
    }
    setCheckingLegacy(false);
  }, [user]);

  useEffect(() => {
    loadLegacyOptions();
  }, [loadLegacyOptions]);

  const goToCompany = async (companyId: string) => {
    await refreshCompanies();
    setActiveCompanyId(companyId);
    navigate("/dashboard", { replace: true });
  };

  const linkLegacyBrandIfNeeded = async (company: OwnedCompany, brandId: string) => {
    if (company.legacy_brand_profile_id === brandId) return;
    const { error } = await (supabase as any)
      .from("companies")
      .update({ legacy_brand_profile_id: brandId })
      .eq("id", company.id)
      .is("legacy_brand_profile_id", null);
    if (error) console.warn("[CreateCompany] não foi possível vincular marca antiga:", error);
  };

  const claimExistingCompany = async (company: OwnedCompany, brandId?: string) => {
    const { error } = await (supabase as any).rpc("claim_owned_company", { _company_id: company.id });
    if (error) throw error;
    if (brandId) await linkLegacyBrandIfNeeded(company, brandId);
  };

  const handleUseBrand = async (brand: LegacyBrand) => {
    if (!user) return;
    const currentAction = `brand:${brand.id}`;
    setActionId(currentAction);
    try {
      const existingCompany = findCompanyForBrand(brand);

      if (existingCompany) {
        if (!memberCompanyIds.has(existingCompany.id)) {
          await claimExistingCompany(existingCompany, brand.id);
        } else {
          await linkLegacyBrandIfNeeded(existingCompany, brand.id);
        }
        toast({ title: "Empresa conectada" });
        await goToCompany(existingCompany.id);
        return;
      }

      const primary = Array.isArray(brand.colors) && brand.colors.length > 0 ? brand.colors[0] : null;
      const { data, error } = await (supabase as any)
        .from("companies")
        .insert({
          name: brand.name,
          segment: brand.industry || null,
          logo_url: brand.logo_url || null,
          primary_color: primary,
          legacy_brand_profile_id: brand.id,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (error || !data) throw error || new Error("Não foi possível conectar a marca.");
      toast({ title: "Empresa conectada" });
      await goToCompany(data.id);
    } catch (error) {
      toast({
        title: "Erro ao conectar empresa",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
      await loadLegacyOptions();
    } finally {
      setActionId((current) => (current === currentAction ? null : current));
    }
  };

  const handleConnectCompany = async (company: OwnedCompany) => {
    const currentAction = `company:${company.id}`;
    setActionId(currentAction);
    try {
      await claimExistingCompany(company);
      toast({ title: "Empresa conectada" });
      await goToCompany(company.id);
    } catch (error) {
      toast({
        title: "Erro ao conectar empresa",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
      await loadLegacyOptions();
    } finally {
      setActionId((current) => (current === currentAction ? null : current));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
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

  const handleInviteSubmit = () => {
    const token = getInviteToken(inviteValue);
    navigate(token ? `/aceitar-convite?token=${encodeURIComponent(token)}` : "/aceitar-convite");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col justify-center gap-6">
        <div className="mx-auto max-w-2xl text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-normal">Configure sua empresa</h1>
          <p className="text-sm text-muted-foreground">
            Para continuar, conecte uma empresa ao seu usuário. Você pode usar uma marca já existente ou criar uma nova empresa.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-4">
            <Card className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Converter minha marca existente</h2>
                  <p className="text-sm text-muted-foreground">
                    Apenas marcas e empresas que pertencem à sua conta aparecem aqui. Empresas de outros usuários nunca são listadas.
                  </p>
                </div>
                {checkingLegacy && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />}
              </div>

              {!checkingLegacy && legacyBrands.length === 0 && unlinkedCompanies.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Você não tem marcas antigas ou empresas sem vínculo nesta conta.
                </div>
              )}


              <div className="space-y-3">
                {legacyBrands.map((brand) => {
                  const existingCompany = findCompanyForBrand(brand);
                  const alreadyMember = !!existingCompany && memberCompanyIds.has(existingCompany.id);
                  const loading = actionId === `brand:${brand.id}`;
                  return (
                    <div key={brand.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          {brand.logo_url ? (
                            <img src={brand.logo_url} alt={brand.name} className="h-11 w-11 rounded-lg object-cover" />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-primary">
                              <Building2 className="h-5 w-5" aria-hidden="true" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="truncate font-semibold">{brand.name}</h3>
                              {brand.is_default && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">padrão</span>}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {brand.industry || existingCompany?.segment || "Marca existente"}
                            </p>
                          </div>
                        </div>
                        <Button type="button" onClick={() => handleUseBrand(brand)} disabled={!!actionId} className="shrink-0">
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                          {alreadyMember ? "Acessar empresa" : "Converter minha marca"}
                        </Button>

                      </div>
                    </div>
                  );
                })}

                {unlinkedCompanies.map((company) => {
                  const loading = actionId === `company:${company.id}`;
                  return (
                    <div key={company.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold">{company.name}</h3>
                          <p className="text-sm text-muted-foreground">Empresa que você criou e ainda não está vinculada</p>
                        </div>
                        <Button type="button" variant="secondary" onClick={() => handleConnectCompany(company)} disabled={!!actionId} className="shrink-0">
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
                          Reivindicar empresa
                        </Button>

                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <button
                type="button"
                onClick={() => setInviteOpen((open) => !open)}
                className="flex w-full items-center justify-between gap-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="inline-flex items-center gap-2"><Link2 className="h-4 w-4" aria-hidden="true" /> Tenho um convite</span>
                <span>{inviteOpen ? "Fechar" : "Abrir"}</span>
              </button>
              {inviteOpen && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={inviteValue}
                    onChange={(e) => setInviteValue(e.target.value)}
                    placeholder="Cole o link ou código do convite"
                    aria-label="Link ou código do convite"
                  />
                  <Button type="button" variant="secondary" onClick={handleInviteSubmit}>Continuar</Button>
                </div>
              )}
            </Card>
          </section>

          <Card className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold">Criar nova empresa</h2>
              <p className="text-sm text-muted-foreground">Conecte uma empresa para continuar. Você poderá convidar sua equipe depois.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da empresa</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Acme Ltda" required />
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
                    className="h-10 w-14 cursor-pointer rounded border border-input bg-background"
                  />
                  <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1" />
                </div>
                <p className="text-xs text-muted-foreground">Você será o Dono desta empresa.</p>
              </div>

              <Button type="submit" className="w-full" disabled={saving || !!actionId}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                Criar nova empresa
              </Button>
              {companies.length > 0 && (
                <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/dashboard", { replace: true })}>
                  Ir para o Dashboard
                </Button>
              )}
            </form>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button type="button" variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sair da conta
          </Button>
        </div>
      </main>
    </div>
  );
}
