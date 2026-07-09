import { useState, type MouseEvent } from "react";
import { MoreVertical, Pause, Play, XCircle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  usePausePlan,
  useResumePlan,
  useCancelPlan,
  useDeletePlan,
} from "@/hooks/use-autopilot";
import type { AutopilotPlan } from "@/types";

type ConfirmKind = "cancel" | "delete" | null;

/** Menu de ações do plano exibido no card da lista (para em propagação do clique do card). */
export function PlanActionsMenu({ plan }: { plan: AutopilotPlan }) {
  const { toast } = useToast();
  const pause = usePausePlan();
  const resume = useResumePlan();
  const cancel = useCancelPlan();
  const del = useDeletePlan();
  const [confirm, setConfirm] = useState<ConfirmKind>(null);

  const canPause = ["active", "approved", "generating"].includes(plan.status);
  const canResume = plan.status === "paused";
  const canCancel = !["completed", "canceled"].includes(plan.status);
  const canDelete = ["draft", "review", "completed", "canceled", "failed"].includes(plan.status);
  const pauseLabel = plan.status === "generating" ? "Parar geração" : "Pausar";

  const busy = pause.isPending || resume.isPending || cancel.isPending || del.isPending;

  const stop = (e: MouseEvent) => e.stopPropagation();

  async function run(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      toast({ title: ok });
    } catch (e) {
      toast({
        title: "Ação falhou",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    }
  }

  const dialogTitle = confirm === "cancel" ? "Cancelar este plano?" : "Excluir este plano permanentemente?";
  const dialogDesc =
    confirm === "cancel"
      ? "Interrompe o plano de vez. Posts não publicados são desagendados e jobs em fila são cancelados. O que já publicou é preservado. Não dá para retomar depois."
      : "Remove o plano e todos os posts dele do histórico. Ação irreversível.";
  const dialogAction = confirm === "cancel" ? "Cancelar plano" : "Excluir plano";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={stop}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={busy}
            aria-label="Ações do plano"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={stop}>
          {canPause && (
            <DropdownMenuItem onClick={() => run(() => pause.mutateAsync(plan.id), "Plano pausado")}>
              <Pause className="mr-2 h-4 w-4" /> {pauseLabel}
            </DropdownMenuItem>
          )}
          {canResume && (
            <DropdownMenuItem onClick={() => run(() => resume.mutateAsync(plan.id), "Plano retomado")}>
              <Play className="mr-2 h-4 w-4" /> Retomar
            </DropdownMenuItem>
          )}
          {canCancel && (
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => setConfirm("cancel")}
            >
              <XCircle className="mr-2 h-4 w-4" /> Cancelar
            </DropdownMenuItem>
          )}
          {(canPause || canResume || canCancel) && canDelete && <DropdownMenuSeparator />}
          <DropdownMenuItem
            disabled={!canDelete}
            className="text-red-600 focus:text-red-600"
            onClick={() => canDelete && setConfirm("delete")}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent onClick={stop}>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{dialogDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                const kind = confirm;
                setConfirm(null);
                if (kind === "cancel") {
                  await run(() => cancel.mutateAsync(plan.id), "Plano cancelado");
                } else if (kind === "delete") {
                  await run(() => del.mutateAsync(plan.id), "Plano excluído");
                }
              }}
            >
              {dialogAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
