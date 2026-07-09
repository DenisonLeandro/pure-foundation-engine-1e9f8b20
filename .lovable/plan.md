## Objetivo
Fazer o botão **Gerar os posts** finalizar a criação do plano rapidamente, sem deixar a tela presa no loading, e garantir que a geração continue em segundo plano.

## Plano de implementação
1. **Evitar espera longa na criação**
   - Ajustar a função `autopilot-plan` para criar plano, posts e jobs e responder imediatamente ao frontend.
   - Não aguardar o processamento do worker de geração dentro da chamada do botão.

2. **Tornar o disparo do worker assíncrono e seguro**
   - Trocar o `await invokeWorker()` por disparo em background/best-effort nas ações que enfileiram jobs.
   - Manter o cron/tick como fallback para processar jobs mesmo se o disparo imediato falhar.

3. **Adicionar timeout e erro visível no frontend**
   - Colocar timeout na chamada `callFunction` para que o botão não fique preso indefinidamente.
   - Mostrar mensagem clara em português se a função demorar ou falhar, preservando o que o usuário preencheu.

4. **Melhorar estado do botão no wizard**
   - Enquanto estiver criando, manter o botão em loading com texto mais específico, como “Criando plano…”.
   - Depois de criado, fechar o wizard e abrir o detalhe do plano criado.

5. **Verificação**
   - Testar a chamada `autopilot-plan`/fluxo de criação e confirmar que a resposta volta rápido.
   - Conferir que o plano aparece como **Gerando** e que os jobs ficam enfileirados para o processamento em segundo plano.

## Arquivos previstos
- `supabase/functions/autopilot-plan/index.ts`
- `src/lib/api/autopilot.ts` ou `src/lib/api/_shared.ts`
- `src/components/autopilot/AutopilotWizard.tsx`

## Fora do escopo
- Não alterar o modelo de imagem: continuará `openai/gpt-image-2`.
- Não mudar regras de cancelamento/pausa/exclusão já implementadas.