## Objetivo
Permitir que o usuário escolha uma ou mais **Fontes** salvas (de `/sources`) dentro do fluxo **"Criar com IA"** no Studio, para que o conteúdo gerado (legenda, slides, arte) seja baseado nelas.

## O que muda na UI

Em `src/components/studio/workspace/AutoStudio.tsx`, abaixo do textarea de prompt e antes do botão "Gerar tudo com IA", adicionar:

- Um botão/chip **"+ Usar uma fonte"** (ícone `BookOpen` ou `Link2`).
- Ao clicar, abre um `Popover` com a lista das fontes do usuário (`saved_sources`), mostrando título, tipo (artigo/youtube/pdf/tweet) e um checkbox.
- Fontes selecionadas aparecem como chips abaixo, com `x` para remover.
- Estado vazio: "Você ainda não salvou nenhuma fonte. Vá em Fontes para adicionar."

## O que muda na lógica

Em `handleGenerate` (mesmo arquivo):

1. Concatenar o conteúdo das fontes selecionadas num bloco de contexto:
   ```
   CONTEXTO DE REFERÊNCIA (use como base factual, não copie literalmente):
   [Fonte 1 - título]
   <content resumido, máx ~1500 chars cada>
   ---
   [Fonte 2 - título]
   ...
   ```
2. Passar esse bloco para:
   - `parseBrief(prompt + contexto)` — para o briefing entender o tema.
   - `generateContent({ prompt: ..., sources: contexto })` — adicionar campo `sources` no payload (ou anexar ao prompt se a edge function não aceitar).
   - `slideArt(...)` e o `aiAssist` do headline — incluir uma linha resumida do contexto.

3. Truncar cada fonte (ex.: 1500 chars) para não estourar o limite de tokens. Se a soma passar de ~6000 chars, avisar via toast.

## Dados

Buscar fontes via:
```ts
supabase.from("saved_sources").select("id,title,source_type,content").eq("user_id", uid).order("created_at",{ascending:false})
```
Cachear no estado local do componente (carregado uma vez ao montar).

## Arquivos a alterar
- `src/components/studio/workspace/AutoStudio.tsx` — UI + lógica (único arquivo de código).

Nenhuma mudança de banco ou edge function é necessária — o conteúdo das fontes vai dentro do prompt existente.

## Validação
- Abrir `/studio` → "Criar com IA" → ver botão "+ Usar uma fonte".
- Selecionar 1-2 fontes → gerar → legenda/slides devem refletir o conteúdo da fonte.
- Sem fontes selecionadas → comportamento atual permanece idêntico.
