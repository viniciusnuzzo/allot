# Checklist de QA — demo Allot

Data-base: 4 de outubro de 2026

Rede: Solana Devnet
Legenda: ✅ comprovado · 🟡 automatizado/parcial · ⬜ pendente com carteira real

## Gate automático

- ✅ `npm test`: 81 testes em 07/10/2026, incluindo API de rascunhos do agente.
- ✅ `npm run lint`.
- ✅ `npm run build`.
- ✅ 5 destinatários + 5 ATAs ausentes + título multibyte máximo: 964 / 4.096 bytes (transação v1).
- ✅ Nenhuma rota `/debug` no build final.
- ✅ Nenhum segredo ou arquivo `.env` rastreado; somente `.env.example`.

## Cenários obrigatórios

| # | Cenário | Estado | Evidência / próximo passo |
|---|---|---|---|
| 1 | 2 pessoas, 50/50 | ✅ | Testes de dinheiro e criação do link. |
| 2 | 5 pessoas, percentuais fracionados e soma exata | ✅ | Conservação por `bigint`; transação v1 com 5 ATAs ausentes e título multibyte máximo: 964 bytes. |
| 3 | Destinatário sem conta USDC | 🟡 | Instrução idempotente de criação da ATA testada; confirmar em Devnet real. |
| 4 | Endereço duplicado | ✅ | Bloqueado pelo schema e pelo builder. |
| 5 | Endereço inválido com mensagem em PT-BR | ✅ | Validado no formulário. |
| 6 | Payload `d` adulterado | ✅ | Tela segura de link corrompido/incompleto. |
| 7 | USDC insuficiente | 🟡 | Preflight e mensagem testados; confirmar visualmente com carteira. |
| 8 | SOL insuficiente | 🟡 | Preflight inclui taxa + aluguel de ATAs; confirmar visualmente com carteira. |
| 9 | Assinatura recusada | 🟡 | Erro normalizado para “Pagamento cancelado na carteira”; confirmar em carteira real. |
| 10 | Pagar o mesmo link duas vezes | ⬜ | Deve gerar duas transações e dois recibos; executar com carteira financiada. |
| 11 | Recibo inexistente | ✅ | Tela “Transação não encontrada” comprovada. |
| 12 | Mobile + carteira | ⬜ | Layout sem overflow em 375 px; assinatura via carteira mobile pendente. |
| 13 | RPC lento ou indisponível | 🟡 | Estado de erro e recuperação existem; simular degradação antes da apresentação. |

## Evidência Devnet já coletada

- Assinatura pública não-Allot: `2i6LQAgDVDdVRTsLiFSHd1MEFm1Zyhqw6ZeHrJ3qJJ4DcLDMbMfigQyDUys2cjFRFReBVRGwmSUJfhnWFugHCoGM`.
- Leitura confirmou diferença de 0,001 USDC sem inventar título Allot.
- Recibo falho e assinatura inexistente também renderizaram estados corretos.
- O recibo funciona em 375 px sem overflow horizontal.

## Preparação de 07/10/2026

- Histórico de versões substituídas agora mostra decisões antigas como históricas.
- `GET /api/agreements/:id` exige conta confirmada e RLS; pedido sem sessão retornou HTTP 401 localmente.
- Checagem local de policy cobre orçamento, teto, destinatários, expiração e ID repetido. Ainda não está conectada à assinatura nem persiste gasto.
- Roteiro de pitch e demo: [plano de submissão](../demo/2026-10-07-submission-plan.md).
- Nenhum pagamento Allot Devnet foi assinado nesta rodada; prova real continua pendente.
- Novos links aprovados incluem `share_id` no memo `allot:v2`; o recibo trata a referência como alegação e compara as instruções USDC com o link publicado somente quando há dados RPC suficientes. Pendente validar em uma transação Allot assinada.
- A camada de leitura/propostas do agente compilou e as rotas negaram pedido sem credencial (401) e criação de token com origem externa (403). A migração `db/agent-drafts.sql` foi aplicada e suas tabelas/permissões foram verificadas no banco Allot; nenhum fluxo autenticado de agente foi comprovado contra Supabase.

## Verificação de 05/10/2026

- `npm test` (63 testes), `npm run lint` e `npm run build`: passaram localmente.
- Corrigida a preservação da assinatura no formato de erro real do executor Solana; teste de regressão incluído. O envio do cliente aguarda confirmação `confirmed` antes de retornar, conforme código da dependência instalada.
- Produção `https://allot-three.vercel.app`: HTTP 200; deploy `dpl_GAhJc1oY7Xh9ftGLu1WvtvLzPe6Y` aparece como Ready. A correção local acima **não** está comprovada nesse deploy.
- Recibo público não-Allot da assinatura acima: HTTP 200, 0,001 USDC e título genérico, sem inventar memo Allot.
- **Bloqueio da prova ponta a ponta:** falta uma carteira de navegador financiada com SOL/USDC de teste, três endereços destinatários controlados e a assinatura humana da transação. Nenhum pagamento Allot foi enviado nesta verificação.
- Controle de versão iniciado com `git init`; nenhum arquivo foi removido, adicionado ao índice ou commitado. Ainda faltam primeiro commit e remoto definidos pelo proprietário.

## Registro obrigatório da prova final

Preencher antes do pitch:

- Carteira / navegador:
- Link da cobrança:
- Assinatura Allot:
- Horário:
- Confirmação em:
- Taxa:
- ATAs criadas:
- Saldo do pagador antes / depois:
- Saldo dos 3 destinatários antes / depois:
- Recibo aberto em janela privada: sim / não
- Captura desktop:
- Captura mobile:
- Vídeo-reserva:

Não marcar o MVP como comprovado ponta a ponta sem esses campos.
