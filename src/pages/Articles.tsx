import { useState } from "react";
import { useArticles } from "@/hooks/use-articles";
import { useCompany } from "@/contexts/CompanyContext";
import { useCreations } from "@/hooks/use-gallery";
import {
  Plus, Pencil, Trash2, FileText, Loader2, Calendar,
  Copy, Eye, Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { generateSlug, type CreateArticleParams, type UpdateArticleParams } from "@/lib/api/articles";
import { getCreationLabel } from "@/lib/gallery";

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-800",
  linked: "bg-blue-100 text-blue-800",
  published: "bg-green-100 text-green-800",
};

const STATUS_LABELS = {
  draft: "Rascunho",
  linked: "Vinculado",
  published: "Publicado",
};

interface FormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image_url: string;
  category: string;
  linked_creation_id: string;
}

const emptyForm: FormData = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  cover_image_url: "",
  category: "",
  linked_creation_id: "",
};

export default function Articles() {
  const { activeCompanyId } = useCompany();
  const { articles, loading, error, createArticle, updateArticle, publishArticle, deleteArticle } = useArticles();
  const { creations } = useCreations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [mode, setMode] = useState<"manual" | "from-post">("manual");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCreation, setSelectedCreation] = useState<string>("");

  const filteredArticles = articles.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewArticle = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setMode("manual");
    setSelectedCreation("");
    setDialogOpen(true);
  };

  const handleEditArticle = (article: typeof articles[0]) => {
    setEditingId(article.id);
    setForm({
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt || "",
      cover_image_url: article.cover_image_url || "",
      category: article.category || "",
      linked_creation_id: article.linked_creation_id || "",
    });
    setMode("manual");
    setSelectedCreation(article.linked_creation_id || "");
    setDialogOpen(true);
  };

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    if (!form.content.trim()) {
      toast.error("Conteúdo é obrigatório");
      return;
    }
    if (!activeCompanyId) {
      toast.error("Empresa não encontrada");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const updates: UpdateArticleParams = {
          title: form.title,
          slug: form.slug,
          content: form.content,
          excerpt: form.excerpt || undefined,
          cover_image_url: form.cover_image_url || undefined,
          category: form.category || undefined,
          linked_creation_id: form.linked_creation_id || undefined,
        };
        await updateArticle(editingId, updates);
        toast.success("Artigo atualizado");
      } else {
        const params: CreateArticleParams = {
          company_id: activeCompanyId,
          title: form.title,
          slug: form.slug,
          content: form.content,
          excerpt: form.excerpt || undefined,
          cover_image_url: form.cover_image_url || undefined,
          category: form.category || undefined,
          linked_creation_id: form.linked_creation_id || undefined,
        };
        await createArticle(params);
        toast.success("Artigo criado");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (articleId: string) => {
    try {
      await publishArticle(articleId);
      toast.success("Artigo publicado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao publicar");
    }
  };

  const handleDelete = async (articleId: string) => {
    if (!window.confirm("Tem certeza que deseja deletar este artigo?")) return;
    try {
      await deleteArticle(articleId);
      toast.success("Artigo deletado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao deletar");
    }
  };

  if (!activeCompanyId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Selecione uma empresa para gerenciar artigos
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-violet-500" />
          <div>
            <h1 className="text-2xl font-bold">Artigos</h1>
            <p className="text-sm text-muted-foreground">
              Crie e gerencie artigos do seu site de notícias
            </p>
          </div>
        </div>
        <Button onClick={handleNewArticle} className="bg-gradient-to-r from-violet-600 to-fuchsia-500">
          <Plus className="mr-2 h-4 w-4" /> Novo Artigo
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-800">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar artigos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando artigos…
        </div>
      ) : filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium">Nenhum artigo encontrado</p>
              <p className="text-sm text-muted-foreground">Comece criando seu primeiro artigo</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredArticles.map((article) => (
            <Card key={article.id} className="overflow-hidden">
              <CardContent className="flex items-start gap-4 p-4">
                {article.cover_image_url && (
                  <img
                    src={article.cover_image_url}
                    alt={article.title}
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">{article.title}</h3>
                      <p className="text-sm text-muted-foreground">/{article.slug}</p>
                    </div>
                    <Badge className={STATUS_COLORS[article.status]}>
                      {STATUS_LABELS[article.status]}
                    </Badge>
                  </div>
                  {article.excerpt && (
                    <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {article.category && (
                      <Badge variant="secondary" className="text-xs">
                        {article.category}
                      </Badge>
                    )}
                    {article.linked_creation_id && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Copy className="h-3 w-3" /> Vinculado
                      </Badge>
                    )}
                    {article.published_at && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(article.published_at).toLocaleDateString("pt-BR")}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditArticle(article)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {article.status !== "published" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePublish(article.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(article.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Artigo" : "Novo Artigo"}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={mode} onValueChange={(v) => setMode(v as "manual" | "from-post")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Artigo Manual</TabsTrigger>
              <TabsTrigger value="from-post">Gerar de Post</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Título do artigo"
                />
              </div>

              <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="slug-do-artigo"
                />
              </div>

              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Escreva o conteúdo do artigo aqui..."
                  rows={8}
                />
              </div>

              <div className="space-y-2">
                <Label>Resumo/Excerpt</Label>
                <Textarea
                  value={form.excerpt}
                  onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Resumo do artigo"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="Ex: Direito, Negócios"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL da Capa</Label>
                  <Input
                    value={form.cover_image_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, cover_image_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Vincular a um Post (opcional)</Label>
                <Select
                  value={selectedCreation}
                  onValueChange={(v) => {
                    setSelectedCreation(v);
                    setForm((prev) => ({ ...prev, linked_creation_id: v }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um post da Galeria" />
                  </SelectTrigger>
                  <SelectContent>
                    {creations.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {getCreationLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="from-post" className="space-y-4">
              <div className="space-y-2">
                <Label>Escolha um Post da Galeria</Label>
                <Select value={selectedCreation} onValueChange={setSelectedCreation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um post" />
                  </SelectTrigger>
                  <SelectContent>
                    {creations.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {getCreationLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                Selecione um post e a IA irá expandir em um artigo completo.
                Recurso disponível em breve.
              </p>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-500"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando…
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> {editingId ? "Atualizar" : "Criar"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
