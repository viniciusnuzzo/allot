# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Coletivos pequenos de freelancers que entregam um projeto ao mesmo cliente; caso inicial: produtor, editor e designer.
- Pagadores que recebem um link, revisam a divisão completa e assinam uma única transação.

## Product Purpose

Allot cria links de pagamento em USDC de teste na Solana Devnet. Uma única transação distribui o total entre todos os destinatários e gera um recibo público verificável na blockchain.

Sucesso no MVP significa concluir, em outro navegador: criar divisão, copiar link, abrir link, conectar carteira, revisar destinatários, pagar, confirmar créditos exatos e abrir o recibo público.

## Positioning

Allot dá às equipes de freelancers um único link de pagamento, liberado somente quando cada destinatário aceita a mesma divisão.

O resultado a validar é reduzir cobranças e repasses manuais entre colegas. A negociação de cada versão é o foco; split, consentimento e atomicidade já existem em outras soluções.

## Operating Context

- Criação rápida de uma cobrança compartilhável.
- Pagamento por carteira compatível com Wallet Standard.
- Conferência de valores e endereços antes da assinatura.
- Verificação pública do resultado pela assinatura e pelo Solana Explorer.
- Demonstração de hackathon em desktop e mobile web.

## Capabilities and Constraints

- Next.js App Router, TypeScript, Tailwind CSS e Solana Kit.
- Somente Solana Devnet e USDC de teste no MVP.
- Valores calculados em unidades inteiras de 6 casas decimais; mínimo de 1 USDC.
- De 2 a 5 endereços únicos; o caso principal da demo usa 3 destinatários.
- O pagador financia ATAs ausentes.
- Supabase Auth/Postgres: contas, equipes e convites por código/link. Divisões publicadas exigem aceite de cada destinatário na mesma versão.
- Uma transação atômica com transferências verificadas e memo `allot:v1`; recibos antigos `fatia:v1` continuam compatíveis.
- Recibo público mostra status e variações líquidas de saldo; não prova aceite da equipe nem titularidade das carteiras.
- Login e cadastro por e-mail; sem custódia, programa on-chain próprio, mainnet, Pix real ou chave privada no aplicativo.
- Cinco destinatários só permanecem no MVP se a transação medida couber no limite da rede.

## Brand Commitments

- Nome: Allot.
- Voz: direta, clara e humana; interface em inglês.
- A identidade deve tornar divisão e atomicidade imediatamente compreensíveis.
- `mindmarket.com` é referência vinculante de energia visual: tipografia grande, alto contraste, cor comprometida, formas orgânicas e CTAs claros. Não copiar marca, ilustrações, textos ou composição literal.
- A marca usa verde-lima, carvão, coral e um símbolo circular dividido em fatias; azul e violeta ficam como acentos da divisão.

## Evidence on Hand

- Especificação aprovada em `docs/superpowers/specs/2026-10-04-fatia-mvp-design.md`.
- Implementação funcional das rotas `/`, `/criar`, `/pagar` e `/r/[signature]`.
- Testes automatizados de dinheiro, links, transação, erros e recibos.
- Leitura real de transações Devnet comprovada; a prova ponta a ponta de uma transação Allot assinada ainda depende de carteira financiada.
- Site publicado na Vercel em `https://allot-three.vercel.app`. Não existem métricas comerciais, clientes ou depoimentos comprovados.
- Em 2026-10-07, 68 testes locais passaram; regressão do banco confirmou pedido de 10% para 20%, nova aprovação, isolamento e publicação idempotente.

## Next Payment Rail

- Pix recomendado via checkout e split do Asaas, com entrada e liquidação em reais.
- Pix não está implementado. Contas verificadas dos destinatários, contrato, credenciais, taxas e prova Sandbox são pré-requisitos.
- Uma proposta BRL deve vincular moeda, contas recebedoras e taxas antes dos aceites; propostas USDC existentes não autorizam Pix.
- Liquidação Pix não recebe promessa de atomicidade da transação Solana.
- Detalhes em `docs/PIX.md`, pitch em `docs/PITCH.md` e comparação em `docs/COMPETITORS.md`.

## Product Principles

- Mostrar toda a divisão antes de pedir assinatura.
- Uma ação, uma transação, todos os destinatários.
- Tornar Devnet e USDC de teste impossíveis de confundir com dinheiro real.
- Usar a blockchain como fonte verificável, sem esconder endereços ou status.
- Cortar escopo antes de cortar segurança, atomicidade ou clareza.

## Accessibility & Inclusion

- Fluxo principal utilizável a partir de 375 px.
- Controles acessíveis por teclado, foco visível e contraste suficiente.
- Respeitar `prefers-reduced-motion`.
- Valores e percentuais sempre disponíveis em texto; gráficos são apenas apoio.
- Endereços completos disponíveis para conferência antes da assinatura.
