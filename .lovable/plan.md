# Por que está falhando

Encontrei a causa raiz do "Não foi possível preparar a mídia".

A política de upload do bucket `media` exige que o **primeiro segmento** do caminho seja o ID do usuário:

```
foldername(name)[1] = auth.uid()
```

Mas o código salva em caminhos como:
- `studio/{user_id}/gal_xxx.png` ← OutputScreen (Salvar na galeria)
- `gallery/{user_id}/xxx.png` ← `src/lib/gallery.ts` (auto-save)
- `studio/{user_id}/...` ← upload para PFM e fluxo de publicação

Nesses caminhos o primeiro segmento é `studio` / `gallery`, não o uid. O Supabase bloqueia silenciosamente o upload com erro de RLS, a função devolve `urls.length === 0` e o toast vermelho aparece.

(Já existe a política antiga "Users can upload to their own folder" que aceita `carousel/{uid}/...`, mas nada cobre `studio/` nem `gallery/`.)

# O que vou fazer

**1. Migração no banco — uma política única e robusta no `storage.objects`**

Criar políticas que permitam ao usuário autenticado ler, inserir, atualizar e deletar qualquer objeto no bucket `media` desde que o **uid dele apareça em qualquer segmento do caminho**. Isso cobre todos os padrões existentes sem precisar reescrever cada upload:

- `{uid}/...`
- `studio/{uid}/...`
- `gallery/{uid}/...`
- `carousel/{uid}/...`
- qualquer novo padrão futuro que siga a convenção de incluir o uid no caminho

Em SQL (resumido):

```sql
create policy "media_authenticated_rw"
on storage.objects for all to authenticated
using  (bucket_id = 'media' and (auth.uid())::text = any(storage.foldername(name)))
with check (bucket_id = 'media' and (auth.uid())::text = any(storage.foldername(name)));
```

E removo as políticas antigas redundantes/quebradas do bucket `media` ("Users can upload media", "Users can upload to their own folder", "Users can delete own media", "Users can delete their own media files", "Users can update their own media files", "Users can read own media") para deixar só:
- `media_public_read` (leitura pública — já existe, mantenho)
- `media_authenticated_rw` (a nova, escrita do dono)

**2. Sem mudança nos paths do app**

Não toco nos caminhos de upload nos componentes — eles continuam funcionando como já estão escritos (`studio/{uid}/...`, `gallery/{uid}/...`, etc.). A correção é só de permissão.

# Como validar

Depois de aplicar:
1. Em `/studio`, gerar uma criação no modo automático.
2. Clicar em **Salvar na galeria** → deve aparecer "Salvo na galeria" (toast verde).
3. Ir em `/gallery` → a criação deve aparecer na grade.
4. Verificar console — nenhum erro `new row violates row-level security policy` no upload.

# Fora de escopo

- Não vou reescrever os caminhos no código.
- Não vou mexer em outras tabelas/policies.
- Não vou alterar o fluxo de auto-save nem o `composeSlideWithText`.
