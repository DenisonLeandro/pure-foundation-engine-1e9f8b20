import { useNavigate } from "react-router-dom";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { roleLabel } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export function CompanySwitcher() {
  const navigate = useNavigate();
  const { companies, activeCompany, activeCompanyId, role, setActiveCompanyId } = useCompany();
  const { accountType } = useAuth();
  const canCreateCompany = accountType !== "employee";

  if (!activeCompany) {
    if (!canCreateCompany) {
      return (
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" disabled>
          <Building2 className="h-4 w-4" /> Aguardando convite
        </Button>
      );
    }
    return (
      <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => navigate("/criar-empresa")}>
        <Plus className="h-4 w-4" /> Criar empresa
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-accent transition-colors",
          )}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white font-bold text-sm shadow"
            style={{ background: activeCompany.primary_color || "linear-gradient(to bottom right, #7c3aed, #d946ef)" }}
          >
            {activeCompany.logo_url ? (
              <img src={activeCompany.logo_url} alt="" className="h-9 w-9 rounded-lg object-cover" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{activeCompany.name}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{roleLabel(role)}</p>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Trocar empresa</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.map(({ company, role: r }) => (
          <DropdownMenuItem key={company.id} onClick={() => setActiveCompanyId(company.id)} className="gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{company.name}</p>
              <p className="text-[10px] text-muted-foreground">{roleLabel(r)}</p>
            </div>
            {company.id === activeCompanyId && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/criar-empresa")} className="gap-2">
          <Plus className="h-4 w-4" /> Criar nova empresa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
