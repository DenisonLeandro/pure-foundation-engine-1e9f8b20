import { supabase } from "@/integrations/supabase/client";
import { getSupabaseUrl, baseHeaders } from "./_shared";

export interface Article {
  id: string;
  company_id: string;
  created_by: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image_url?: string;
  category?: string;
  linked_creation_id?: string;
  status: "draft" | "linked" | "published";
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateArticleParams {
  company_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image_url?: string;
  category?: string;
  linked_creation_id?: string;
}

export interface UpdateArticleParams {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  cover_image_url?: string;
  category?: string;
  linked_creation_id?: string;
  status?: "draft" | "linked" | "published";
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Get all articles for a company
export async function getArticles(companyId: string): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as Article[];
}

// Get a single article
export async function getArticle(articleId: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", articleId)
    .single();

  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return (data as Article | null) || null;
}

// Get published articles (public access)
export async function getPublishedArticles(limit = 100): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data || []) as Article[];
}

// Create a new article
export async function createArticle(params: CreateArticleParams): Promise<Article> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("articles")
    .insert([
      {
        ...params,
        created_by: user.id,
        status: params.linked_creation_id ? "linked" : "draft",
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Article;
}

// Update an article
export async function updateArticle(
  articleId: string,
  params: UpdateArticleParams
): Promise<Article> {
  const { data, error } = await supabase
    .from("articles")
    .update({
      ...params,
      updated_at: new Date().toISOString(),
    })
    .eq("id", articleId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Article;
}

// Publish an article
export async function publishArticle(articleId: string): Promise<Article> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("articles")
    .update({
      status: "published",
      published_at: now,
      updated_at: now,
    })
    .eq("id", articleId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Article;
}

// Delete an article
export async function deleteArticle(articleId: string): Promise<void> {
  const { error } = await supabase.from("articles").delete().eq("id", articleId);
  if (error) throw new Error(error.message);
}

// Link article to a creation/post
export async function linkArticleToCreation(
  articleId: string,
  creationId: string
): Promise<Article> {
  return updateArticle(articleId, {
    linked_creation_id: creationId,
    status: "linked",
  });
}

export interface GeneratedArticle {
  title: string;
  content: string;
  excerpt?: string;
}

// Generate article content from a creation/post using AI
export async function generateArticleFromCreation(
  creationId: string,
  title?: string
): Promise<GeneratedArticle> {
  const url = `${getSupabaseUrl()}/functions/v1/generate-article-from-post`;
  const headers = await baseHeaders();

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      creation_id: creationId,
      title,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate article");
  }

  const result = await response.json();
  return {
    title: result.title,
    content: result.content,
    excerpt: result.excerpt,
  };
}
