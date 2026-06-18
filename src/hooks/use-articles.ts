import { useState, useEffect, useCallback } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import {
  type Article,
  type CreateArticleParams,
  type UpdateArticleParams,
  getArticles,
  createArticle as createArticleApi,
  updateArticle as updateArticleApi,
  publishArticle as publishArticleApi,
  deleteArticle as deleteArticleApi,
} from "@/lib/api/articles";

export function useArticles() {
  const { activeCompanyId } = useCompany();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!activeCompanyId) {
      setArticles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getArticles(activeCompanyId);
      setArticles(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar artigos";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [activeCompanyId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const createArticle = useCallback(
    async (params: CreateArticleParams) => {
      try {
        setError(null);
        const article = await createArticleApi(params);
        setArticles((prev) => [article, ...prev]);
        return article;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao criar artigo";
        setError(message);
        throw err;
      }
    },
    []
  );

  const updateArticle = useCallback(async (articleId: string, params: UpdateArticleParams) => {
    try {
      setError(null);
      const article = await updateArticleApi(articleId, params);
      setArticles((prev) =>
        prev.map((a) => (a.id === articleId ? article : a))
      );
      return article;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar artigo";
      setError(message);
      throw err;
    }
  }, []);

  const publishArticle = useCallback(async (articleId: string) => {
    try {
      setError(null);
      const article = await publishArticleApi(articleId);
      setArticles((prev) =>
        prev.map((a) => (a.id === articleId ? article : a))
      );
      return article;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao publicar artigo";
      setError(message);
      throw err;
    }
  }, []);

  const deleteArticle = useCallback(async (articleId: string) => {
    try {
      setError(null);
      await deleteArticleApi(articleId);
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao deletar artigo";
      setError(message);
      throw err;
    }
  }, []);

  return {
    articles,
    loading,
    error,
    reload,
    createArticle,
    updateArticle,
    publishArticle,
    deleteArticle,
  };
}
