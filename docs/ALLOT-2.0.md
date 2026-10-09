# Allot 2.0 — direção de produto

**Resultado da primeira versão:** agentes coordenam acordos e pagamentos com controles humanos. O agente propõe ou altera o acordo; Allot aplica permissões e aprovações; uma pessoa assina; o pagamento é comprovado na Solana Devnet. Equipes e freelancers são o contexto inicial. A experiência visual deve explicar este fluxo.

O recorte inicial usa USDC de teste na Solana Devnet. Pix, dinheiro real, cobrança da Allot e assinatura automática ficam fora deste incremento.

## Estado em 8 de outubro de 2026

- Código local: acordos versionados, decisões de destinatários, propostas de agentes, política de pagamentos, pedidos idempotentes e recibos. Submissões de rascunhos agora vinculam proposta e versão. O painel mostra credenciais ativas, rascunhos, aprovações pendentes e orçamento comprometido. `npm test`: 99 testes; lint e build passaram.
- Banco: migrações de agentes e as duas migrações 2.0 (`agent-draft-submission.sql` e `agent-dashboard-state.sql`) foram aplicadas ao projeto Allot. A função de submissão e a leitura do painel aceitam `authenticated` e recusam `anon`.
- Site oficial: deploy `dpl_CJqvjZwqEEaUDd9eLv6h6gfz3czp` está `READY` em `https://allot-three.vercel.app`. `/` e `/pagar` responderam 200; API sem credencial respondeu 401; mutação de outra origem respondeu 403. A landing coube em 375 px sem overflow horizontal. O painel autenticado ainda precisa de teste com conta real.
- Uso real: o fundador tem duas contas Allot e ainda não tem carteira Devnet. Faltam contas para três destinatários e carteira financiada para assinar, verificar saldos e abrir o recibo.

## Primeiro incremento

Provar um ciclo completo: agente propõe ou altera um acordo para três destinatários; dono revisa e submete; um destinatário pede mudança; dono publica nova versão; todos aceitam essa versão; agente solicita pagamento dentro da política; dono aprova quando exigido; pagador assina; recibo confirma destinatários, valores, memo e assinatura.

**Aceite:** registrar IDs da versão, pedido e transação; decisões das três contas; saldos antes/depois dos três destinatários; memo `allot:v3`; recibo aberto em sessão privada. Registrar falhas observadas e corrigir apenas o que bloquear esse ciclo. Não registrar tokens ou chaves privadas.

## Sequência

1. Preparar três contas de destinatários, uma conta dona e carteiras Devnet controladas.
2. Executar o ciclo acima no site oficial e guardar evidências privadas.
3. Corrigir bloqueios encontrados, com teste de regressão para lógica alterada.
4. Testar o fluxo com três equipes e entrevistar 30 pessoas; registrar dados com consentimento.
5. Gravar pitch e demo com evidência real, organizar GitHub e preparar a submissão.
