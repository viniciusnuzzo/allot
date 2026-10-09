# Allot — itens dos dois textos estratégicos

Esta matriz cobre as propostas dos textos de 07/10/2026 e o primeiro incremento Allot 2.0. As migrações de agentes foram aplicadas ao banco Allot; o app está publicado. **Código, esquema e deploy não comprovam fluxo autenticado, pagamento assinado ou cliente real.**

| Capacidade pedida | Estado verificável neste repositório | Falta para funcionar de ponta a ponta |
| --- | --- | --- |
| Equipes, convites, participantes humanos | Fluxo existente de contas e membros | SMTP público e teste com equipe real |
| Acordo com divisão, negociação e aprovação de cada destinatário | Fluxo existente; uma revisão gera outra versão | Teste com equipe real e prova do aceite fora do ambiente local |
| Histórico de versões e decisões | UI compara percentuais, endereços e valor com a versão anterior; tabela append-only instalada | Criar decisões reais para verificar histórico autenticado |
| Projetos, subprojetos e orçamento | Tabela/RPC instaladas; `/api/projects` e UI local; orçamento dos filhos limitado ao pai; acordo pode ser ligado antes de qualquer decisão | Testar com dono autenticado; orçamento ainda não bloqueia pagamentos |
| Agente cria projeto | Tabela/RPC instaladas; MCP/API criam **proposta**; dono aceita ou rejeita em `/api/projects/draft` | Testar com credencial real e dono autenticado |
| Agente cria acordo e contraproposta | Tabela/RPC instaladas; MCP/API criam rascunho para revisão do dono. A submissão do dono vincula rascunho e nova versão e registra atividade | Testar submissão, novo aceite e revogação com contas reais |
| `get_agreement_status` e API de acordos | `/api/agreements/:id` exige sessão; MCP `get_agreement` usa credencial de equipe | Teste integrado contra o banco Allot |
| `request_approval` | MCP/API registram pedido de revisão na atividade; o dono ainda submete o rascunho e cada destinatário decide | Testar com credencial real; não há notificação externa |
| `get_payment_receipt` | `/api/receipts/:signature` e ferramenta MCP leem status e mudanças líquidas da Devnet; a página compara instruções USDC com o link publicado quando o RPC fornece detalhes | Provar uma assinatura Allot real; comparação não prova autoria, carteira ou aprovação fora do registro |
| `execute_payment` | O agente pode criar pedido idempotente para acordo aprovado. Policy reserva orçamento; dono aprova acima do limite; humano assina na carteira | Não existe assinatura automática ou custódia. Falta provar o fluxo com contas reais e carteira Devnet financiada |
| Budget, máximo por transação, fornecedores aprovados e limiar humano | Policy persistente instalada; reserva atômica, allowlist, expiração e anti-replay por idempotency key passaram em teste transacional | A policy cobre pedidos do agente, não impede alguém de reutilizar o link público fora do fluxo; falta uso autenticado real |
| Agent activity | Migração instalada; registra credenciais, leituras, propostas, policy, pedidos, aprovações, rejeições e confirmações | Provar eventos com contas reais; tentativas rejeitadas antes do banco dependem dos logs da plataforma |
| USDC multi-destinatário | Instruções atômicas de teste na Solana Devnet e leitura de recibo | Carteira financiada, 3 destinatários controlados, assinatura e conferência privada do recibo |
| Pix/Asaas e pagamentos em reais | Documentação de arquitetura e copy de roadmap | Conta/provedor, taxas contratuais, recebedores verificados, testes de sandbox e decisões comerciais; não é a mesma garantia atômica |
| Cobrança US$0,80 sem assinatura | Copy diz explicitamente **preço planejado, não cobrado** | Definir pagador, destino público da taxa, custos reais e cobrança autorizada/testada |
| x402 para pagamentos entre softwares | Hipótese de monetização documentada | Escolher recurso pago, preço, liquidação e autorização; não substituir aceite humano |
| Árvore econômica com agências, agentes e subcontratados | Hierarquia de **planejamento** de projetos é local | Acordos filhos, responsabilidade, limites de orçamento e liquidação hierárquica não existem |
| Histórico de preços, reputação e confiabilidade | Nenhuma pontuação inventada | Identidade/consentimento, eventos de entrega e pagamento verificáveis, prevenção de manipulação |
| Marketplace e descoberta de fornecedores | Não implementado | Oferta/demanda reais, moderação, privacidade e validação de problema |
| Retenção, receita e demanda | Roteiro de entrevista e métricas documentados | 30 entrevistas e três equipes testando; uso, clientes e receita não podem ser simulados por código |
| Posicionamento global/Brasil, UX e demo de 30 segundos | Landing agora explica acordo antes do pagamento e separa protótipo de agente; pitch e demo em texto | Teste com usuários, gravação dos dois vídeos e revisão do fluxo publicado |
| App mobile, compliance, token, DAO e arquitetura enterprise | Não implementados | Requisitos, autoridade, avaliação legal e evidência de demanda; não há decisão segura de produto para inventar estas capacidades |

## Dependências imediatas

1. As seis migrações de agentes foram aplicadas **somente** ao projeto Supabase do Allot, terminando em `db/agent-payment-requests.sql`.
2. Testar projeto humano, projeto proposto por agente, aprovação pelo dono, acordo proposto, contraproposta, aceite humano e revogação da credencial. Nenhum token deve aparecer em logs, chat ou vídeo. O banco ainda não tinha equipes ou projetos no momento da verificação.
3. Fazer uma transação real **de teste na Devnet**, comparar instruções, saldos e recibo; somente depois afirmar que o pagamento funciona de ponta a ponta.
4. Fazer entrevistas e observar uso real. Isso não pode ser implementado nem declarado como concluído sem participantes.

## Decisões que precisam do fundador

Ativar dinheiro real/Pix, definir cobrança e destinatário de taxas, permitir gasto automático ou custódia, contatar clientes e gravar/submeter vídeos são ações externas. Nenhuma é implícita na existência de protótipos locais.
