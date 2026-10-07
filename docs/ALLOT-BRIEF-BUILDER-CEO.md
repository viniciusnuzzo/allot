# Allot — documento de produto, negócio e execução

**Atualizado em:** 7 de outubro de 2026  
**Destinatário:** builder, CEO ou parceiro responsável por desenvolver e validar a startup  
**Site:** https://allot-three.vercel.app  
**Repositório local:** `/Users/nuzzo/Documents/FOUNDERbrain`

Este documento reúne o estado conhecido do projeto e as decisões discutidas com o fundador. Diferencia implementação, evidência registrada, recomendações e decisões ainda pendentes. Não substitui auditoria de segurança, validação comercial ou revisão jurídica.

## 1. Resumo executivo

A Allot ajuda equipes de freelancers a negociar e aprovar a divisão de um pagamento antes de liberar o link para o cliente.

O responsável pela equipe propõe os percentuais. Cada destinatário aceita, recusa ou pede uma porcentagem diferente. Qualquer alteração cria uma nova versão, sem aproveitar os aceites anteriores. O link só pode ser publicado quando todos os destinatários daquela versão aceitarem.

A hipótese de valor é reduzir repasses manuais, conflitos sobre porcentagens e cobranças entre colegas. O público inicial recomendado são pequenas equipes de produção de conteúdo: produtor, editor e designer trabalhando para o mesmo cliente.

Existe um MVP web publicado, com contas, equipes, convites, negociação e pagamentos demonstrativos em USDC de teste na Solana Devnet. Pix, cobrança da taxa da Allot e operação com dinheiro real ainda não estão implementados.

**Próximo objetivo:** tornar o cadastro público utilizável, provar o fluxo completo com diferentes usuários e uma carteira Devnet financiada, e validar a necessidade com equipes reais. Em seguida, provar Pix com split em Sandbox.

## 2. Nome, posicionamento e pitch

### Nome

**Allot.** O projeto usa esse nome no produto atual. Arquivos antigos ainda podem mencionar Fatia; essa referência é histórica, não uma segunda marca ativa. Disponibilidade de marca, domínio próprio e proteção jurídica precisam ser verificadas.

### Posicionamento em uma frase

> A Allot dá às equipes de freelancers um link de pagamento que só é liberado quando cada destinatário aprova a mesma divisão.

### Versão em inglês

> Allot gives freelance teams one payment link that unlocks only after every recipient accepts the same split.

### Pitch de 30–45 segundos

> Equipes de freelancers entregam o trabalho juntas, mas receber costuma deixar uma pessoa responsável por cobrar o cliente e repassar a parte dos colegas.
>
> A Allot começa pelo acordo. O responsável propõe a divisão e cada pessoa pode aceitar, recusar ou pedir um reajuste. O link só é liberado quando todos aprovam a mesma versão.
>
> Nossa demonstração atual distribui USDC de teste numa transação Solana. O próximo passo é Pix, para que clientes brasileiros paguem em reais.
>
> Estamos validando se esse fluxo reduz repasses manuais e o desgaste de cobrar colegas, começando por equipes de produção de conteúdo.

### Mensagem comercial

**“Trabalho em equipe. Divisão combinada. Pagamento sem repasses manuais.”**

Essa mensagem descreve o resultado pretendido. A demonstração atual não é uma operação comercial com dinheiro real. Não prometer que a Allot elimina atraso ou inadimplência do cliente.

## 3. Problema e público inicial

### Problema a validar

Em um projeto compartilhado, a equipe precisa decidir quem recebe quanto, registrar o acordo, cobrar o cliente e conferir os repasses. Uma pessoa pode concentrar recebimento e distribuição, criando dependência, trabalho administrativo e dificuldade de conferência.

Uma ferramenta de split resolve a distribuição, mas a equipe ainda precisa chegar a um acordo sobre os valores. A Allot coloca essa negociação dentro do fluxo de cobrança.

### Público recomendado para começar

- Equipes pequenas de produção de vídeo e conteúdo.
- Produtores que contratam editores, designers e profissionais de motion.
- Coletivos de freelancers com projetos recorrentes para clientes compartilhados.

Esse recorte é uma recomendação de foco, ainda sem validação de demanda. “Funcionário” aparece na conversa original, mas o produto não deve ser apresentado como folha de pagamento. Relações de emprego, contratos, notas fiscais e impostos continuam exigindo tratamento próprio.

### Papéis

| Papel | Responsabilidade |
| --- | --- |
| Dono da equipe | Convida membros, propõe e revisa a divisão, publica o link após os aceites. |
| Destinatário | Revisa a divisão completa e decide sobre a própria participação. |
| Cliente/pagador | Abre o link público, confere e autoriza o pagamento. |
| Allot | Mantém o fluxo de acordo e a experiência de cobrança e conferência. |

## 4. Proposta e diferencial

**Diferencial proposto: negociação e aprovação individual da mesma versão antes da cobrança.**

Exemplo central:

1. O produtor propõe 50% para si, 40% para o editor e 10% para o designer.
2. O designer pede 20%; o link continua bloqueado.
3. O produtor revisa para 40% / 40% / 20%.
4. Todos precisam aceitar a nova versão.
5. O produtor publica o link aprovado.

O dono não pode aceitar pela conta de outra pessoa. Um pedido de reajuste não altera automaticamente as partes dos demais membros.

Split já existe. Mercado Pago, Asaas e Splits oferecem capacidades de divisão; consentimento e distribuição atômica também não são invenções exclusivas da Allot. Nossa vantagem precisa ser demonstrada na experiência para equipes pequenas e no resultado medido com clientes.

Não existem evidências para alegar menor preço, maior segurança, liderança de mercado ou exclusividade tecnológica.

## 5. Fase atual

**MVP técnico publicado, pré-validação comercial.**

| Área | Estado conhecido |
| --- | --- |
| Site | Publicado na Vercel; interface em inglês. |
| Contas e equipes | Implementadas com Supabase. |
| Negociação e aprovação | Implementadas, com regressões locais e no banco. |
| Cadastro público | Limitado pela ausência de SMTP personalizado. |
| Pagamento cripto | Demonstração em Solana Devnet com USDC de teste. |
| Prova completa com carteira | Ainda precisa ser registrada. |
| Pix | Arquitetura recomendada documentada; integração não implementada. |
| Taxa Allot | Proposta discutida; não cobrada pelo sistema. |
| Clientes, receita e tração | Nenhuma evidência comercial registrada. |
| Segurança | Controles e verificações parciais; auditoria formal não concluída. |

Publicação na Vercel e aprovação de testes não provam operação financeira em produção.

## 6. O que foi feito

### Produto e interface

- Landing page com proposta de valor, explicação do acordo e demonstração interativa de reajuste.
- Entradas separadas de Log in e Sign up.
- Interface pública em inglês, identidade verde-lima, carvão e coral.
- Revisão de elementos repetitivos e de padrões visuais genéricos.
- Seções públicas de privacidade e termos.
- Componente de apoio com animação; não realiza pagamento de doação.
- Verificação da landing em 375 px, sem overflow horizontal, e interação por teclado.

### Autenticação e equipes

- Supabase Auth com e-mail/senha, confirmação e integração de sessão.
- Rotas de login, cadastro, recuperação e redefinição de senha.
- Criação de equipes, dono e membros.
- Entrada por código ou link com conta confirmada.
- Convites aleatórios armazenados como hash, com expiração e rotação.
- Propostas com 2 a 5 destinatários e percentuais que totalizam 100%.
- Aceite, recusa e pedido de reajuste por destinatário.
- Novas versões imutáveis com decisões reiniciadas.
- Publicação condicionada à aprovação de todos os destinatários da versão.
- Separação entre dados privados da equipe e informação pública do pagamento.

### Pagamentos demonstrativos

- Revisão pública da divisão antes da assinatura.
- Integração com carteiras compatíveis com Wallet Standard.
- Cálculos monetários inteiros, sem depender de ponto flutuante para valores.
- Transferências e memo na mesma transação Solana.
- Criação de contas de token ausentes; o pagador financia esse custo.
- Recibo público reconstruído a partir de dados da blockchain.
- Tratamento de confirmação incerta preservando a assinatura conhecida.

O recibo mostra variações líquidas de saldo. Não comprova sozinho aceite da equipe, titularidade das carteiras ou todos os valores brutos transferidos.

### Segurança e documentação

- RLS e permissões restritas no banco.
- Verificação de sessão e autorização nas operações privadas.
- Proteção de origem nas mutações autenticadas e restrição de redirecionamentos.
- Limites e validação de JSON, valores, campos e payloads.
- Cabeçalhos de proteção contra enquadramento e políticas de referência.
- Documentos `security.md`, `Auth.md`, `DataSecurity.md`, `ThreatModel.md` e `Securitychecklist.md`.
- Documentos de pitch, concorrência e plano de integração Pix.

### Evidência registrada em 7/10/2026

- 68 testes locais passaram; lint e build passaram.
- Regressões no banco configurado cobriram permissões, isolamento, negociação e publicação.
- Verificações HTTP locais cobriram rejeição de operação sem sessão, origem incorreta e JSON excessivo.
- Advisors de segurança do Supabase não retornaram apontamentos naquela execução.
- Auditoria de dependências de produção não retornou advisories naquela execução.

Esses resultados são registros da sessão anterior. O builder deve executar novamente os comandos antes de declarar uma nova entrega validada.

## 7. Limitações e decisões que precisam de atenção

- SMTP da Resend não foi concluído. O fundador possui uma API key, mas adiou domínio e configuração. Não solicitar segredos em documentos ou chat.
- Confirmação e recuperação por e-mail real ainda precisam de prova; o SMTP padrão restringe destinatários autorizados.
- Login Allot não prova titularidade de carteira ou conta recebedora.
- Links publicados mantêm os termos originais e são reutilizáveis. Não existe garantia de cobrança única ou revogação pelo fluxo atual.
- Remoção ou revisão não deve ser anunciada como revogação de links já publicados.
- Fluxos com vários navegadores e testes de corrida ainda precisam de evidência adicional.
- Retenção, exclusão de conta, exportação, restauração de backup e responsável por incidentes precisam de definição e verificação.
- A finalização do relatório formal de segurança falhou; não apresentar o projeto como auditado ou certificado.
- Foram registrados cinco advisories altos no encadeamento de dependências de desenvolvimento ESLint/glob/braces. Reavaliar e corrigir quando houver caminho compatível; não confundir com resultado de dependências de produção.
- Há referências históricas em documentos; usar este briefing como orientação e conferir código/configuração antes de agir.

## 8. Monetização proposta

O fundador sugeriu **US$ 0,80 por transação**. A recomendação discutida é testar uma taxa por pagamento confirmado, sem mensalidade inicial.

**Status:** proposta de preço, ainda não implementada nem validada. A política final precisa ser fechada com o fundador.

### Política recomendada para o teste

- Criar equipe, negociar e publicar link gratuitamente.
- Cobrar uma vez por pagamento concluído, não por destinatário.
- Para USDC, considerar 0,80 USDC; não tratar USDC como dólar bancário sem ressalva.
- Descontar a taxa do montante distribuído, com conhecimento de todos os destinatários.
- Exibir separadamente custos de provedor, rede e criação de contas quando aplicáveis.
- Vincular a taxa e a política de custos à versão aceita.
- Para Pix, definir um preço em reais após conhecer custos e contrato; nenhum valor BRL foi aprovado.

Exemplo sem custos externos: pagamento de 100 USDC, taxa de 0,80 USDC, líquido de 99,20 USDC. Uma divisão 40% / 40% / 20% recebe 39,68 / 39,68 / 19,84 USDC.

Mil pagamentos gerariam 800 USDC de receita bruta de taxa. Isso não é lucro: infraestrutura, suporte, processamento, impostos e eventuais reembolsos precisam entrar na conta.

### Antes de implementar

Definir quem suporta a taxa, mínimo de pagamento, tratamento de estornos, cobrança repetida, política de rede e endereço/conta da Allot. A cobrança deve integrar o pagamento e ter evidência verificável; um cálculo no navegador ou um registro sem transferência não comprova receita.

No demo Solana, investigar a transferência da taxa na mesma transação e o impacto no tamanho/custo. Para uma operação pública com taxa obrigatória, definir como verificar e impor a cobrança: uma transação montada pelo cliente não impede que alguém construa outra omitindo a taxa.

## 9. Pix: caminho recomendado

**Recomendação:** Asaas, com checkout hospedado e split, entrada e liquidação em reais. Não adicionar conversão Pix → USDC no primeiro lançamento.

A Allot mantém o acordo; o provedor processa o pagamento e a distribuição conforme suas regras. Não estender automaticamente ao Pix a promessa de atomicidade ou ausência de custódia da demonstração Solana.

Pré-requisitos:

1. Conta e contrato elegíveis no provedor, custos reais e credenciais de Sandbox.
2. Destinatários elegíveis e verificação da associação entre membro e conta recebedora.
3. Propostas BRL independentes das propostas USDC, com centavos inteiros.
4. Aprovação de valor, moeda, destinatários, percentuais e política de taxas.
5. Criação de checkout pelo servidor a partir da versão salva.
6. Controle de concorrência, duplicidade e reconciliação de timeouts.
7. Webhooks autenticados, idempotentes e resistentes a eventos fora de ordem.
8. Estados separados para recebimento do cliente e liquidação de cada destinatário.
9. Evidência de expiração, falha, estorno e split bloqueado.

O Asaas calcula percentuais sobre o valor líquido após suas taxas. Confirmar valores contratuais antes de prometer quanto cada pessoa recebe.

**Aceite:** pagamento Sandbox conciliado com os registros do provedor, sem duplicidade nem redirecionamento de destinatários. Ativação de dinheiro real exige configuração operacional completa e aprovação do fundador.

## 10. Plano de execução recomendado

| Prioridade | Entrega | Critério de conclusão |
| --- | --- | --- |
| P0 | Cadastro público | Confirmação e recuperação reais funcionam na Vercel com SMTP configurado. |
| P0 | Prova da negociação | Dono e dois membros, em sessões independentes, completam recusa, reajuste, novos aceites e publicação. |
| P0 | Prova Devnet | Carteira financiada assina pagamento; saldos, transação e recibo são conciliados. |
| P0 | Revalidar segurança | Testes atuais executados; isolamento, remoção, decisões obsoletas e concorrência verificados. |
| P1 | Validar demanda | Entrevistas e testes observados com equipes reais, com evidência e consentimento. |
| P1 | Fechar taxas | Política aprovada pelo fundador e custos externos conhecidos. |
| P1 | Pix Sandbox | Fluxo completo com destinatários elegíveis, taxas, webhook e reconciliação. |
| P2 | Preparar produção financeira | Contrato, operação, suporte, dados, estornos e autorização para fundos reais. |

Não existe prazo de lançamento financeiro validado. Planejar datas depois de provar dependências externas.

### Fora do primeiro incremento recomendado

Folha de pagamento, token próprio, câmbio automático, múltiplas redes, grande painel administrativo, aplicativo nativo e contabilidade completa. Só acrescentar após necessidade demonstrada.

## 11. Marketing e validação

### Aquisição inicial

Começar com contato direto com produtores e líderes de pequenos coletivos, via Instagram, LinkedIn e comunidades de edição/design. Buscar parceiros que organizem essas comunidades. Não enviar mensagens em nome do fundador sem autorização.

### Plano inicial de 30 dias — metas, não resultados

1. Entrevistar dez líderes sobre o último projeto compartilhado: divisão, recebimento, repasses e conflitos.
2. Mostrar uma demo de 60 segundos com o exemplo 10% → 20%.
3. Conseguir três equipes para testar o fluxo de acordo, acompanhando o uso.
4. Medir dificuldades, tempo até aprovação, revisões, abandono e interesse em pagar.
5. Publicar aprendizados e relatos somente com autorização e sem expor dados privados.

Mensagem sugerida:

> Quando vocês fazem um projeto em equipe, quem recebe do cliente e repassa para os outros? Estou criando a Allot para combinar a divisão antes da cobrança. Posso mostrar o fluxo e entender como vocês fazem hoje?

Anúncios pagos ficam para depois de onboarding funcional e evidência de interesse. Não anunciar Pix ou recebimento real como disponíveis enquanto não estiverem.

## 12. Aceleração e incubação

Preferência do fundador: programas internacionais, com uma ou duas opções brasileiras.

| Programa | Tese de candidatura |
| --- | --- |
| Colosseum | Prioridade se Solana continuar essencial. Seleção de aceleração ligada aos hackathons; mostrar produto e utilidade real. |
| Y Combinator | Problema recorrente, mercado, capacidade de execução e evidência de demanda. |
| Techstars | Escolher turma com aderência financeira e acesso a clientes/parceiros. |
| Outlier Ventures | Opção se a proposta depender de Web3 e combinar com a tese da turma. |
| Darwin Startups | Opção brasileira com alinhamento a fintechs e estágio inicial. |
| InovAtiva Brasil | Acompanhar a próxima chamada e requisitos. |

São sugestões de candidatura, não confirmação de inscrições abertas ou elegibilidade. A pesquisa de 7/10/2026 encontrou aviso de suspensão temporária do site InovAtiva até 25/10/2026. Conferir editais, investimento, participação societária, localização e dedicação exigida antes de aplicar.

## 13. Arquitetura e orientação técnica

- Next.js 16.3.8, React 19.3.0, TypeScript e Tailwind CSS.
- Supabase Auth e Postgres para contas, equipes, convites, propostas e decisões.
- Solana Kit e integração Wallet Standard para o demo de pagamentos.
- Vercel para hospedagem.
- Resend selecionada para SMTP, ainda sem configuração concluída.
- Asaas recomendado para Pix, ainda sem conexão.

Supabase: projeto `gjixddthtgibbkceraya`. URL pública: https://gjixddthtgibbkceraya.supabase.co. O identificador não é segredo; credenciais administrativas continuam privadas.

### Rotas principais

`/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`, `/teams`, `/teams/[id]`, `/join`, `/pagar`, `/r/[signature]`, `/privacy`, `/terms`. A rota `/criar` exige conta confirmada e encaminha ao fluxo de equipes.

### Regras para o builder

- Ler `AGENTS.md` e os guias relevantes em `node_modules/next/dist/docs/` antes de alterar APIs Next.
- Inspecionar o estado Git e preservar mudanças existentes. Não fazer reset, commit ou push sem autorização correspondente.
- Reutilizar o fluxo existente; não criar outro sistema de autenticação ou outro banco sem justificativa.
- Nunca expor API keys, tokens de sessão, senhas ou chaves privadas.
- Manter a interface em inglês; documentos de coordenação podem ser em português.
- Preservar aprovação por versão, aritmética inteira, validação e acessibilidade.
- Diferenciar evidência local, banco, navegador, deployment e pagamento real em cada entrega.

Comandos de verificação:

```bash
npm test
npm run lint
npm run build
```

Consultar os scripts de verificação e o SQL existente antes de executá-los. Usar ambientes e contas de teste; não realizar alterações destrutivas em dados existentes.

## 14. Decisões do fundador e decisões abertas

### Confirmadas na conversa

- Marca Allot e interface em inglês.
- Login, cadastro e equipes.
- Entrada na equipe por código/link.
- Dono propõe; destinatário aceita, recusa ou pede reajuste.
- Link só é gerado após aceite de todos os destinatários da versão.
- Preferência por programas internacionais de aceleração.

### Propostas ainda abertas

- Política completa da taxa de US$ 0,80 e preço Pix em reais.
- Provedor Pix final e autorização para operação com dinheiro real.
- Papel definitivo de Solana na proposta comercial.
- Revogação, expiração e cobrança única de links publicados.
- Titularidade de contas recebedoras, retenção, exclusão e suporte operacional.
- Estrutura jurídica, contratos, preço definitivo e termos comerciais.

## 15. Pedido concreto ao builder/CEO

> Assuma este briefing como ponto de partida. Confira o código e o estado dos serviços antes de propor mudanças. Priorize cadastro público, prova de negociação com múltiplos usuários, pagamento Devnet conciliado e validação com equipes reais. Planeje Pix em Sandbox preservando aprovação por versão e transparência de taxas. Traga decisões comerciais ao fundador com opções concretas e evidência. Não anuncie dinheiro real, Pix, receita, clientes ou auditoria completa sem comprovação. Entregue cada etapa com mudanças, comandos executados, resultados e pendências.

## 16. Referências

### Arquivos internos

- `PRODUCT.md`: princípios e escopo do produto.
- `README.md`: instalação, demo e limites.
- `Auth.md`: modelo de acesso e aprovação.
- `Securitychecklist.md`: evidência e verificações pendentes.
- `docs/PITCH.md`: discurso e limites das alegações.
- `docs/COMPETITORS.md`: comparação sem alegações de exclusividade.
- `docs/PIX.md`: desenho de integração e requisitos operacionais.
- `db/teams.sql`, `db/teams-hardening.sql`, `db/teams-input-limits.sql`, `db/teams-check.sql`: banco e regressões.

### Fontes externas consultadas na discussão

- [Asaas — split e valor líquido](https://docs.asaas.com/docs/split-de-pagamentos).
- [Asaas — checkout com split](https://docs.asaas.com/docs/checkout-com-split-de-pagamento).
- [Solana — taxas](https://solana.com/docs/core/fees).
- [Mercado Pago — split 1:N](https://www.mercadopago.com.br/developers/en/docs/checkout-api-orders/resources/split-payments-1-n).
- [Splits — protocolo Split V2](https://splits.org/protocol/docs/core/split-v2/).
- [Colosseum](https://www.colosseum.org/accelerator).
- [Y Combinator](https://www.ycombinator.com/apply).
- [Techstars](https://www.techstars.com/accelerators).
- [Outlier Ventures](https://outlierventures.io/base-camp/).
- [Darwin](https://www.darwinstartups.com/batch15).
- [InovAtiva](https://inovativa.online/aceleracao/).

Revalidar fontes, preços e requisitos antes de contratar serviços ou enviar candidaturas.
