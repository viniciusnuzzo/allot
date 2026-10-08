# Allot

Allot gives freelance teams one payment link that unlocks only after every recipient accepts the same split.

Current scope: Supabase teams and test-USDC payments on Solana Devnet. Pix is planned, not live. See [Pix implementation decision](docs/PIX.md), [pitch](docs/PITCH.md), and [competitor comparison](docs/COMPETITORS.md).

Link de pagamento que divide USDC de teste entre 2 a 5 carteiras em uma única transação na Solana Devnet.

> Hackathon MVP. Devnet somente. Nenhum dinheiro real.

## Fluxo

1. Cadastre-se em `/signup`, confirme o e-mail e entre em `/login`.
2. Crie uma equipe em `/teams`; compartilhe o código ou link de convite com os funcionários.
3. Proponha destinatários e percentuais. Cada destinatário aceita, recusa ou pede reajuste. Só o dono gera o link após aceite de todos na mesma versão.
4. O pagador revisa tudo em `/pagar` e assina uma vez.
5. A Allot cria ATAs ausentes, transfere cada parte e grava o memo na mesma transação.
6. O recibo público em `/r/<assinatura>` reconstrói o resultado diretamente da blockchain.

## Rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

O SMTP personalizado ainda não está configurado: confirmação e recuperação de senha ficam limitadas aos e-mails autorizados da organização Supabase. Configure SMTP em Authentication → Emails antes de abrir cadastros públicos. Callbacks local e de produção já estão autorizados; senha mínima de 12 caracteres e confirmação de e-mail estão ativas.

Variáveis públicas (use a chave publishable, nunca uma chave administrativa):

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

## Preparar a carteira da demo

1. Use uma carteira compatível com Wallet Standard e selecione **Solana Devnet**.
2. Obtenha SOL de teste no [faucet oficial da Solana](https://faucet.solana.com/).
3. Obtenha USDC de teste no [faucet público da Circle](https://faucet.circle.com/?allow=true), escolhendo **Solana Devnet**.
4. Nunca cole seed phrase ou chave privada no projeto, navegador ou terminal.

O mint aceito é o USDC oficial de teste na Devnet:

```text
4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

## Verificação

```bash
npm test
npm run lint
npm run build
```

Cobertura atual: dinheiro com `bigint`, links versionados, validação, erros, montagem da transação atômica, recibos e limite de tamanho. O caso automatizado com 5 destinatários, 5 ATAs ausentes e título de 60 caracteres multibyte mede **964 bytes** no formato v1 usado pelo app, abaixo do limite de **4.096 bytes**.

Checklist manual: [docs/qa/2026-10-04-demo-checklist.md](docs/qa/2026-10-04-demo-checklist.md).
Roteiro da demo: [docs/demo/2026-10-04-demo-script.md](docs/demo/2026-10-04-demo-script.md)
Plano da submissão e limites da demo de agentes: [docs/demo/2026-10-07-submission-plan.md](docs/demo/2026-10-07-submission-plan.md).

Camada de propostas por agente (migrações aplicadas no banco Allot; fluxo autenticado ainda sem teste integrado): [docs/AGENT-LAYER.md](docs/AGENT-LAYER.md).
Mapa completo dos itens dos dois textos estratégicos, com implementado, pendente e dependências: [docs/FEATURE-MATRIX.md](docs/FEATURE-MATRIX.md).

## Limites do MVP

- Supabase Auth/Postgres fornece contas, equipes e aprovação de divisões. Sem custódia ou programa on-chain próprio.
- Sem mainnet e sem Pix real.
- O payload do link é público e não contém segredo.
- O pagador financia ATAs ausentes.
- Uma assinatura retornada é preservada quando a confirmação fica incerta.
- A prova ponta a ponta com uma carteira real financiada ainda deve ser registrada antes da apresentação.
