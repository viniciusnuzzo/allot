# Checklist de QA — demo Allot

Data-base: 4 de outubro de 2026

Rede: Solana Devnet
Legenda: ✅ comprovado · 🟡 automatizado/parcial · ⬜ pendente com carteira real

## Gate automático

- ✅ `npm test`: 63 testes em 05/10/2026.
- ✅ `npm run lint`.
- ✅ `npm run build`.
- ✅ 5 destinatários + 5 ATAs ausentes: 778 / 1.232 bytes.
- ✅ Nenhuma rota `/debug` no build final.
- ✅ Nenhum segredo ou arquivo `.env` rastreado; somente `.env.example`.

## Cenários obrigatórios

| # | Cenário | Estado | Evidência / próximo passo |
|---|---|---|---|
| 1 | 2 pessoas, 50/50 | ✅ | Testes de dinheiro e criação do link. |
| 2 | 5 pessoas, percentuais fracionados e soma exata | ✅ | Conservação por `bigint`; tamanho 778 bytes no pior caso. |
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
