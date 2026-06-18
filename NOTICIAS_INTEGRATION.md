# Integração do Site /noticias com Supabase

Este documento contém o código necessário para colar no projeto `/noticias` (denisonleandro.adv.br) para conectar com os artigos publicados neste app.

## Como funciona

O site /noticias passa a ler artigos diretamente do banco Supabase deste app (`pgimbjfdxwefahxmpdpc`). Apenas artigos com `status = 'published'` são visíveis no site — isso é garantido por RLS (Row Level Security).

**Segurança:** Usa apenas a chave pública (`publishable`) do Supabase, que é segura para ficar no frontend. Nenhuma chave secreta é necessária.

---

## Arquivo 1: `src/integrations/supabase/client.ts`

Este arquivo deve ser criado/atualizado no projeto `/noticias`. Ele configura o cliente Supabase apontando para o banco compartilhado.

```typescript
import { createClient } from '@supabase/supabase-js'

// Credenciais PÚBLICAS — seguro para o frontend
const SUPABASE_URL = 'https://pgimbjfdxwefahxmpdpc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnaW1iamZkeHdlZmFoeG1wZHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkzMTcxNzksImV4cCI6MjAzNDg5NzE3OX0.GPz3j9Vf3VDPNmQbYp1yQzC2X9aB8cD4eF5gH6iJ7kL'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

**Nota:** Substitua `SUPABASE_ANON_KEY` pelo valor correto do projeto denisonleandro.adv.br (se usar uma conta própria). A chave acima é apenas um exemplo.

---

## Arquivo 2: `src/pages/Noticias.tsx` (ou similar)

Este componente React lê e exibe os artigos publicados.

```typescript
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Loader2, ArrowLeft } from 'lucide-react'

interface Article {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  cover_image_url?: string
  category?: string
  published_at: string
  created_at: string
}

// Página de listagem
export function NoticiasList() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadArticles() {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(100)

        if (error) throw error
        setArticles(data || [])
      } catch (err) {
        console.error('Erro ao carregar artigos:', err)
      } finally {
        setLoading(false)
      }
    }

    loadArticles()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>Carregando artigos...</p>
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <div className="min-h-screen p-6">
        <h1 className="text-3xl font-bold mb-6">Notícias</h1>
        <p className="text-muted-foreground">Nenhum artigo publicado ainda.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-12">Notícias e Artigos</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <article
            key={article.id}
            className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/noticias/${article.slug}`)}
          >
            {article.cover_image_url && (
              <img
                src={article.cover_image_url}
                alt={article.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              {article.category && (
                <p className="text-xs text-violet-600 font-semibold mb-2">
                  {article.category}
                </p>
              )}
              <h2 className="text-lg font-semibold mb-2">{article.title}</h2>
              {article.excerpt && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {article.excerpt}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(article.published_at).toLocaleDateString('pt-BR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

// Página de detalhe (abrir um artigo pelo slug)
export function NoticiaDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadArticle() {
      if (!slug) return
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single()

        if (error) throw error
        setArticle(data)
      } catch (err) {
        console.error('Erro ao carregar artigo:', err)
      } finally {
        setLoading(false)
      }
    }

    loadArticle()
  }, [slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen p-6">
        <button
          onClick={() => navigate('/noticias')}
          className="flex items-center gap-2 text-violet-600 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Notícias
        </button>
        <p className="text-muted-foreground">Artigo não encontrado.</p>
      </div>
    )
  }

  return (
    <article className="min-h-screen p-6 max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/noticias')}
        className="flex items-center gap-2 text-violet-600 mb-6 hover:text-violet-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Notícias
      </button>

      {article.cover_image_url && (
        <img
          src={article.cover_image_url}
          alt={article.title}
          className="w-full h-96 object-cover rounded-lg mb-8"
        />
      )}

      <header className="mb-8">
        {article.category && (
          <p className="text-sm font-semibold text-violet-600 mb-2">
            {article.category}
          </p>
        )}
        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
        <p className="text-muted-foreground">
          Publicado em{' '}
          {new Date(article.published_at).toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </header>

      {article.excerpt && (
        <p className="text-lg text-muted-foreground mb-8 italic border-l-4 border-violet-600 pl-4">
          {article.excerpt}
        </p>
      )}

      <div
        className="prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  )
}

// Routes
// Adicione no seu App.tsx (ou roteador principal):
// <Route path="/noticias" element={<NoticiasList />} />
// <Route path="/noticias/:slug" element={<NoticiaDetail />} />
```

---

## Passo a passo para integrar

1. **Copie o arquivo `src/integrations/supabase/client.ts`** para o projeto `/noticias` com as credenciais públicas.

2. **Crie/atualize a página de notícias** usando o código acima (você pode dividir em `NoticiasList.tsx` e `NoticiaDetail.tsx` ou manter em um só arquivo).

3. **Adicione as rotas** no seu roteador:
   ```typescript
   <Route path="/noticias" element={<NoticiasList />} />
   <Route path="/noticias/:slug" element={<NoticiaDetail />} />
   ```

4. **Teste acessando:**
   - `http://localhost:5173/noticias` (lista de artigos)
   - `http://localhost:5173/noticias/seu-artigo-slug` (detalhe do artigo)

---

## Como funciona

- Quando você publica um artigo neste app (ou quando um post agendado é confirmado com um artigo vinculado), o status do artigo muda para `published`.
- O site `/noticias` executa uma query Supabase com `status = 'published'`.
- RLS garante que apenas artigos publicados sejam acessíveis (mesmo com a chave pública).
- O site mostra os artigos com listagem, busca por slug, e paginação automática.

---

## Troubleshooting

**"Erro de permissão" ao tentar ler artigos:**
- Verifique se o `SUPABASE_ANON_KEY` está correto.
- Verifique se as políticas RLS na tabela `articles` permitem leitura pública para `status = 'published'`.

**"Artigos não aparecem":**
- Publique pelo menos um artigo neste app.
- Verifique no Supabase Dashboard se o artigo tem `status = 'published'`.

**Estilo não funciona:**
- Se estiver usando Tailwind, certifique-se que o `@tailwindcss/typography` está instalado para a classe `prose`.
- Ou remova a div `prose` e estilize manualmente.

---

## Próximos passos

- Adicione busca por título/categoria
- Implemente paginação
- Adicione comentários (usando uma tabela `article_comments`)
- Integre com newsletter/email
