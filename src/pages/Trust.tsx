import { Link } from "react-router-dom";
import { Shield, Lock, Database, Users, FileText, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Trust() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-12 space-y-8">
        <header className="space-y-3">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-violet-500" />
            <h1 className="text-3xl font-bold">Central de Confiança</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Esta página é mantida pelos responsáveis deste aplicativo para responder
            às dúvidas mais comuns sobre segurança, privacidade e tratamento de dados.
            Trata-se de conteúdo editorial do próprio aplicativo — não constitui
            certificação ou verificação independente.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline">Conteúdo do aplicativo</Badge>
            <Badge variant="outline">Sem certificação externa</Badge>
          </div>
        </header>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Lock className="h-5 w-5 text-violet-500" />
            <CardTitle>Acesso e autenticação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>O acesso à plataforma exige autenticação por e-mail e senha.</p>
            <p>
              Cada usuário enxerga apenas dados das empresas em que é membro ativo,
              com papéis distintos (owner, admin, membro) controlando o que pode
              ser criado, editado ou removido.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Database className="h-5 w-5 text-violet-500" />
            <CardTitle>Plataforma e hospedagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              O aplicativo é executado sobre infraestrutura gerenciada (Lovable Cloud,
              que utiliza Supabase como backend). O acesso aos dados é controlado por
              políticas de Row-Level Security no banco.
            </p>
            <p>
              Esta menção descreve recursos de plataforma habilitados e não representa
              uma certificação emitida pela Lovable ou por terceiros.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Users className="h-5 w-5 text-violet-500" />
            <CardTitle>Dados e isolamento por empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Conteúdos, marcas, fontes, criações e artigos são vinculados a uma
              empresa. Apenas membros ativos dessa empresa podem ler ou modificar
              esses dados pela API do aplicativo.
            </p>
            <p>
              Artigos marcados como <em>publicados</em> podem ser exibidos publicamente
              caso o app os publique em um site. Tudo o que não está publicado
              permanece restrito aos membros da empresa.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <FileText className="h-5 w-5 text-violet-500" />
            <CardTitle>Integrações de terceiros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              O aplicativo pode usar integrações com provedores externos (por
              exemplo, agendamento de posts, geração de mídia e métricas sociais)
              conforme configurado pelo responsável da empresa.
            </p>
            <p>
              Chaves de API fornecidas pelo usuário são armazenadas em campos
              protegidos do banco e nunca são expostas no cliente.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Mail className="h-5 w-5 text-violet-500" />
            <CardTitle>Contato de segurança</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Para relatar uma vulnerabilidade ou fazer uma solicitação relacionada
              à privacidade dos seus dados, entre em contato com o responsável pela
              empresa que administra sua conta no aplicativo.
            </p>
            <p>
              O dono do aplicativo pode personalizar esta página com um endereço de
              e-mail dedicado de segurança.
            </p>
          </CardContent>
        </Card>

        <div className="pt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground underline">
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
