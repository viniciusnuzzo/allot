# Allot MVP — Design

Data: 4 de outubro de 2026  
Prazo: 9 dias  
Ambiente: Solana Devnet, sem dinheiro real

## Objetivo

Entregar uma aplicação web na qual uma pessoa cria um link de pagamento, o cliente paga USDC de teste uma vez e 2 a 5 destinatários recebem suas partes na mesma transação. Uma página pública reconstrói o recibo diretamente da blockchain.

## Critério principal de sucesso

O fluxo abaixo funciona em um deploy público e em outro navegador:

1. criar divisão;
2. copiar link;
3. abrir link;
4. conectar carteira;
5. revisar destinatários;
6. pagar;
7. confirmar três recebimentos exatos;
8. abrir recibo público verificável.

## Stack decidido

- Next.js com App Router.
- TypeScript.
- Tailwind CSS.
- `@solana/kit`.
- Wallet Standard via plugin oficial de carteira.
- `@solana/react`.
- Clientes oficiais dos programas Token e Memo compatíveis com Kit.
- Zod para validação do link.
- Vitest para lógica pura.
- Vercel para deploy.

O projeto não usará `@solana/web3.js` v1 nem Wallet Adapter.

## Limites

- Somente Solana Devnet.
- Somente USDC de teste.
- Sem backend próprio.
- Sem banco de dados.
- Sem login.
- Sem programa on-chain próprio.
- Sem mainnet.
- Sem Pix real.
- Sem custódia.
- Sem chaves privadas no aplicativo ou repositório.

## Arquitetura

### Aplicação

Uma aplicação Next.js contém quatro rotas:

- `/`: apresentação curta e acesso à criação.
- `/criar`: formulário e geração do link.
- `/pagar?d=<payload>`: revisão e pagamento.
- `/r/<signature>`: recibo público.

Componentes client-side acessam a carteira. Leituras públicas podem ocorrer no navegador ou em Server Components quando isso reduzir complexidade sem exigir segredo.

### Link sem banco

O link contém um payload JSON versionado e codificado em base64url. Zod valida o conteúdo ao decodificar. O payload não contém segredo nem dado pessoal.

```ts
type Recipient = {
  name: string;
  address: string;
  bps: number;
};

type PaymentLink = {
  v: 1;
  title: string;
  amount: string | null;
  recipients: Recipient[];
};
```

Regras:

- título: 1 a 60 caracteres;
- apelido: até 30 caracteres;
- 2 a 5 destinatários;
- endereços válidos e sem duplicatas;
- cada `bps` é inteiro positivo;
- soma de `bps` igual a 10000;
- valor mínimo de 1 USDC;
- valor com até 6 casas decimais.

### Dinheiro

Valores monetários usam `bigint` em unidades mínimas. USDC usa 6 casas decimais. Nenhum cálculo de dinheiro usa `number` ou ponto flutuante.

A divisão calcula cada parte por divisão inteira. O resto vai para o maior percentual; em empate, para o primeiro. A soma das partes deve ser exatamente igual ao total.

### Transação

A carteira conectada é pagadora e assinante. O aplicativo nunca recebe chave privada.

A transação contém:

1. criação idempotente da ATA de cada destinatário quando necessária;
2. uma transferência verificada de USDC por destinatário;
3. memo `fatia:v1:<título sanitizado>`.

Antes da assinatura, o aplicativo valida payload, saldo de USDC, SOL disponível e valor positivo de cada parte. Quando suportado pelo cliente escolhido, simula a transação antes do envio.

Todas as instruções ficam na mesma transação. Falha de qualquer instrução invalida o conjunto.

### Recibo

O recibo busca a transação pela assinatura. Ele usa as diferenças entre saldos de token anteriores e posteriores para identificar pagador, destinatários e valores.

O memo fornece o título quando presente. A ausência de memo não invalida o recibo. O status vem de `meta.err`. O recibo mostra assinatura, horário, total, destinatários e link do Explorer.

## Fluxo de dados

### Criar

Formulário validado -> `PaymentLink` -> JSON -> base64url -> URL copiável.

### Pagar

URL -> decode -> Zod -> valor em unidades mínimas -> divisão -> revisão -> conexão -> transação -> assinatura -> confirmação -> recibo.

### Recibo

Assinatura -> RPC -> transação confirmada -> diferenças de saldo -> modelo de recibo -> tela pública.

## Estados e erros

A tela de pagamento usa estados explícitos:

- desconectado;
- pronto;
- aguardando assinatura;
- enviando;
- confirmado;
- falhou.

Erros apresentados em português:

- link inválido;
- endereço inválido;
- destinatário duplicado;
- percentuais diferentes de 100%;
- USDC insuficiente;
- SOL insuficiente;
- assinatura cancelada;
- falha de rede;
- transação não encontrada.

Se o envio retornar uma assinatura e a confirmação falhar, a interface preserva a assinatura e orienta a verificar o recibo antes de tentar novamente. O botão fica desabilitado durante o envio para evitar clique duplo.

## Segurança e privacidade

- Mostrar todos os destinatários antes da assinatura.
- Avisar que transações não podem ser desfeitas.
- Avisar que transações são públicas.
- Não incluir e-mail, CPF ou nome real obrigatório.
- Sanitizar e limitar o título usado no memo.
- Não registrar segredos em logs.
- Não aceitar cluster diferente de Devnet no MVP.
- Rotular claramente toda simulação.

## Interface

Primeiro, uma interface mínima funcional. Depois, identidade escura com coral, turquesa e gráfico SVG de fatias.

O gráfico é apresentação, não fonte de verdade. Valores textuais continuam visíveis. O layout precisa funcionar em 375 px e respeitar `prefers-reduced-motion`.

## Testes

### Automáticos

- parse e formatação de USDC;
- divisão 50/50;
- divisão com resto;
- soma exata;
- percentuais inválidos;
- valor menor que 1 USDC;
- encode/decode do link;
- payload adulterado;
- endereços duplicados.

### Devnet

- 2 destinatários;
- 3 destinatários;
- destinatário sem ATA;
- repetição com ATA existente;
- 5 destinatários se couber na transação;
- saldo insuficiente;
- assinatura recusada;
- recibo aberto em outro navegador.

### Evidência

Guardar assinaturas, saldos antes/depois, custo, duração e capturas. Gravar vídeo de reserva do fluxo completo.

## Ordem de implementação

1. Projeto, deploy e carteira.
2. Lógica monetária testada.
3. Transação real para 2 destinatários.
4. Fluxo mínimo para 3 destinatários.
5. Criação e leitura do link.
6. Recibo.
7. Erros, mobile e até 5 destinatários.
8. Visual e apresentação.

## Cortes

Primeiros cortes: Pix simulado, cotação em reais, QR code e animações. Nunca cortar transação real, revisão de destinatários, recibo, avisos de Devnet ou vídeo de reserva.

## Decisões finais

- SDK: Solana Kit atual.
- Valor mínimo: 1 USDC.
- Pagador financia novas ATAs.
- Três destinatários são o caso principal da demo.
- Cinco destinatários entram apenas após medir a transação.
- Cotação em reais e Pix simulado não fazem parte do núcleo.
