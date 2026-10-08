# Allot — submissão de 12/10/2026

Prazo anunciado pela [Colosseum](https://colosseum.com/worldsfair): 12 de outubro de 2026. A [página do hackathon](https://colosseum.com/hackathon?year=fall2026) pede GitHub, pitch de 2–3 minutos, demo de até 3 minutos, estratégia de distribuição e evidência de demanda. Código anterior deve ser declarado.

## Estado que pode ser demonstrado hoje

- Equipe cria versões de divisão; uma revisão invalida aprovações da versão anterior.
- Destinatários aceitam, rejeitam ou pedem ajuste; publicação exige aceite unânime da versão vigente.
- Link publicado prepara pagamento atômico em USDC de teste na Solana Devnet.
- Recibo lê transação e saldos líquidos pela RPC da Solana.
- Novos pagamentos de links publicados gravam o ID público do acordo no memo (`allot:v2`). O recibo agora compara as instruções USDC analisadas pelo RPC com o link publicado quando há metadados suficientes. Isso ainda não prova autoria do memo, propriedade das carteiras ou que uma transação real da Allot já foi executada.
- `GET /api/agreements/:id` retorna a versão e as decisões para um membro autenticado.
- `checkAgentPaymentPolicy` avalia orçamento, teto por transação, destinatários, expiração e pedido repetido. É uma checagem local; não há bloqueio de gasto no servidor ou assinatura automática. A migração de credenciais foi aplicada ao banco, mas falta testar o fluxo com contas reais e publicar o código do app.

**Ainda sem prova:** pagamento Allot assinado na Devnet, uso por clientes, receita, Pix, integração MCP com credencial real e policy aplicada ao envio. O banco foi migrado e o adaptador MCP responde localmente, mas não há teste operacional autenticado. Nenhum destes deve aparecer como funcional em produção no vídeo.

## Estado do to-do estratégico

- **Implementado localmente e esquema instalado:** versões e aprovações por destinatário; publicação unânime; divisão atômica Devnet preparada; leitura pública do recibo; comparação condicional das instruções com o link publicado; API de leitura; trilha append-only de novas decisões; propostas de agente; projetos hierárquicos de planejamento e API pública de recibos. Quatro migrações novas foram aplicadas ao banco Allot, mas a operação autenticada ainda não foi demonstrada.
- **Parcial:** MCP stdio e API local, cinco exemplos de equipes e prévia de policy. O agente não aprova ou paga. A policy não persiste orçamento ou IDs usados e não autoriza transação. O memo é uma referência, não uma verificação criptográfica do acordo. Ver [matriz completa](../FEATURE-MATRIX.md) e [contrato e limites](../AGENT-LAYER.md).
- **Pendente de execução externa:** carteira financiada, três endereços controlados, assinatura e reconciliação Devnet; vídeo gravado; 20 entrevistas, cinco pagamentos pequenos e métricas de retorno. Nunca preencher estes resultados por suposição.
- **Adiado por decisão de escopo:** x402, Pix real, cobrança US$0,80, reputação, marketplace, escrow, recorrência e agente autônomo. A [documentação atual da Solana](https://solana.com/docs/payments/agentic-payments/x402) trata x402 como pagamento por recurso HTTP, não como substituto da aprovação de divisão entre pessoas.

Para afirmar "agente impedido de gastar sem autoridade", ainda faltam credenciais com escopos, policy aplicada em estado confiável com reserva/consumo atômico e prevenção de replay, autorização humana e verificação do pagamento. Até lá, o agente é tese/demonstração local, não capacidade operacional.

## Primeiro: prova Devnet

Usar uma carteira de navegador financiada com SOL e USDC de teste e três endereços públicos controlados. Registrar o link aprovado, saldos antes, assinatura, memo, saldos depois e recibo aberto em janela privada. Repetir o pagamento só depois de verificar a assinatura anterior. Seguir [checklist de QA](../qa/2026-10-04-demo-checklist.md).

## Vídeo 1 — pitch, 2–3 minutos

Roteiro em inglês. Substituir apenas dados comprovados antes de gravar.

1. **0:00–0:25, problema:** “Small teams often agree on a project before they agree on who gets paid. One person then collects the money and manually forwards shares. We are testing whether a shared, explicit agreement removes that coordination burden.”
2. **0:25–0:55, produto:** “Allot records a versioned split. Each recipient accepts that exact version. A change starts a new version and requires fresh approvals. Once everyone accepts, the team can publish one payment link.”
3. **0:55–1:30, demonstração:** Mostrar proposta, contraproposta, invalidação das aprovações antigas e link aprovado. Mostrar pagamento e recibo apenas depois da prova Devnet.
4. **1:30–1:55, por que Solana:** “Our current demo uses test USDC on Solana Devnet. One wallet signature sends the split atomically, and the public transaction can be checked independently.”
5. **1:55–2:20, oportunidade:** “We start with small creative teams. We are testing demand directly with teams who have recently split project payments. The same agreement and approval model could later serve software agents with constrained budgets.”
6. **2:20–2:40, estágio e pedido:** “This is an early demo. We have not yet shown commercial usage or revenue. We are looking for teams willing to test a real agreement and tell us where the workflow fails.”

## Vídeo 2 — demo técnica, até 3 minutos

1. Mostrar uma proposta de teste com três membros e USDC Devnet; não usar nomes de clientes reais sem permissão.
2. Um membro pede outro percentual. Mostrar o novo ID de versão e aprovações zeradas.
3. Mostrar aceite de cada membro e publicação do link. Abrir `GET /api/agreements/:id` com sessão autenticada; não mostrar cookies nem tokens.
4. Mostrar a policy local: pedido acima do teto bloqueado; acima do limiar exige pessoa; dentro do teto ainda exige assinatura da carteira. Explicar que ela ainda não está ligada ao pagamento.
5. Somente se houver assinatura Allot real: mostrar transação Devnet, memo, saldos e recibo privado. Caso contrário, encerrar com o fluxo até o link e dizer que o envio ainda não foi comprovado.

## Validação de demanda

Falar com 20 equipes que dividiram um projeto recente. Perguntar: “Conte o último projeto feito em conjunto”; “Quem cobrou o cliente?”; “Como combinaram a divisão?”; “Quantos repasses foram necessários?”; “O que gerou desacordo?”; “Pagariam para resolver isso?”. Registrar palavras reais, data e perfil; não converter interesse declarado em cliente ou receita. Só contar pagamento depois de comprovante e consentimento do participante.

## Declaração de desenvolvimento anterior

Preparar a lista de funcionalidades e commits anteriores ao início oficial da competição e separar o que foi feito dentro do período. Conferir com o histórico do Git e declarar no formulário. Não usar esta página como prova de elegibilidade.
