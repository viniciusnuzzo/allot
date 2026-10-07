# Allot — Roadmap de entrega em 9 dias

Versão inicial: 4 de outubro de 2026  
Objetivo: entregar uma demo real, estável e honesta do Allot na Solana Devnet.

## Resultado que precisa existir no final

Uma pessoa consegue:

1. criar uma divisão para 2 a 5 carteiras;
2. gerar e compartilhar um link;
3. abrir o link em outro navegador;
4. conectar uma carteira com USDC de teste;
5. pagar uma única vez;
6. fazer todos os destinatários receberem na mesma transação;
7. abrir um recibo público verificável na blockchain.

Se esse fluxo funcionar, o projeto está entregável. Todo o resto melhora a nota, mas não pode colocar esse fluxo em risco.

## Estratégia escolhida

Vamos construir uma **fatia vertical real primeiro**.

Isso significa não desenvolver o projeto na ordem das telas. Primeiro provamos a transação com dados fixos. Depois ligamos essa transação a uma interface mínima. Só então adicionamos criação de links, recibo completo, identidade visual e materiais da apresentação.

### Por que não seguir C0 → C7 literalmente

Essa ordem deixa o primeiro fluxo ponta a ponta para o quinto dia. Se houver incompatibilidade entre carteira, USDC, criação de contas e tamanho da transação, descobriremos tarde demais.

### Princípios de execução

- Uma entrega verificável por dia.
- Nada novo começa antes de a entrega do dia estar testada.
- Primeiro fazer funcionar com 2 destinatários; depois 3; só depois validar 5.
- Toda integração com Solana deve ter um teste isolado antes de entrar na interface.
- Nunca usar chaves privadas no aplicativo ou no repositório.
- Nunca usar dinheiro real: somente Solana Devnet e USDC de teste.
- Tudo que for simulação deve estar identificado visualmente.
- Cada noite termina com código executável e registrado no Git.
- A cada marco importante, guardar assinatura da transação, captura de tela e observações para o pitch.

## Escopo protegido

### Obrigatório — sem isso não entregamos

- Aplicação web publicada.
- Conexão com uma carteira Solana.
- USDC da Devnet.
- Divisão exata usando `bigint`.
- Uma transação atômica para todos os destinatários.
- Criação idempotente de conta associada de token quando necessário.
- Link de pagamento sem banco de dados.
- Tela de revisão antes do pagamento.
- Recibo público baseado na assinatura da transação.
- Mensagens claras para saldo insuficiente, assinatura recusada e falha de rede.
- Layout utilizável no computador e em 375 px.
- README, vídeo de reserva e submissão.

### Importante — fazer depois do caminho feliz

- Gráfico de fatias em SVG.
- Interface visual própria.
- Suporte completo de 2 a 5 destinatários.
- Cálculo e exibição do custo medido.
- Três conversas reais com possíveis usuários.
- Testes de adulteração do link e de RPC lento.

### Cortável — remover sem hesitar se houver atraso

- QR code.
- Animação sofisticada do gráfico.
- Modal de Pix simulado.
- Equivalência fictícia em reais.
- Tela `/debug` elaborada.
- Cinco destinatários na demo ao vivo; três são suficientes para demonstrar a tese.
- Logo refinado, fontes externas e microinterações.
- Histórico, login, banco de dados, e-mail e qualquer recurso já marcado como fora do escopo.

## Rotina diária

Cada dia usa quatro blocos:

1. **15 minutos — direção:** escolher uma única entrega do dia e revisar riscos.
2. **Bloco principal — construção:** trabalhar somente no caminho crítico.
3. **60 a 90 minutos — verificação:** testes, navegador limpo, carteira e Devnet.
4. **30 minutos — fechamento:** commit, registro da evidência, bugs e primeira tarefa do dia seguinte.

Limite de investigação: se um problema ficar sem avanço por 90 minutos, reduzir o caso ao menor teste possível e usar uma rota alternativa. Não reescrever a arquitetura no mesmo dia.

---

## Dia 1 — Eliminar riscos externos e colocar o projeto no ar

### Meta

Abrir uma URL publicada, conectar uma carteira na Devnet e consultar os saldos de SOL e USDC de teste.

### Trabalho

- Ler o regulamento, critérios de avaliação, formato da entrega e horário limite.
- Confirmar se há exigência de tecnologia, repositório público, vídeo ou apresentação ao vivo.
- Decidir o SDK Solana antes de gerar código:
  - recomendado: stack oficial atual com Wallet Standard;
  - alternativa: `@solana/web3.js` v1 + Wallet Adapter apenas se o hackathon ou um starter confiável exigir.
- Criar o projeto Next.js com TypeScript e Tailwind.
- Fixar as versões das dependências.
- Configurar apenas Devnet e variáveis de ambiente.
- Implementar conexão e desconexão da carteira.
- Obter SOL e USDC de teste para a carteira pagadora.
- Preparar pelo menos três endereços destinatários.
- Publicar a primeira versão.
- Convidar de 5 a 8 freelancers ou pequenas equipes para conversas curtas durante os próximos dias.

### Critério de aceite

- A URL publicada abre em uma janela anônima.
- A carteira conecta na Devnet.
- A aplicação mostra endereço, saldo de SOL e saldo de USDC de teste.
- Nenhuma chave privada está no código, ambiente público ou Git.

### Plano de contingência

Se a conexão da carteira não funcionar até a metade do dia, partir do template oficial do SDK escolhido e remover tudo que não pertence ao Allot.

---

## Dia 2 — Provar a divisão e a transação fora da interface

### Meta

Enviar USDC de teste para duas carteiras em uma única transação e provar que a soma recebida é exata.

### Trabalho

- Implementar e testar conversão entre texto decimal e unidades mínimas.
- Implementar e testar o algoritmo de divisão usando `bigint`.
- Cobrir divisão igual, percentuais quebrados, resto, soma inválida e valor inválido.
- Construir uma transação mínima com dois destinatários fixos.
- Criar as contas associadas de token de forma idempotente quando necessário.
- Simular a transação antes de solicitar assinatura.
- Assinar com a carteira do navegador e confirmar na Devnet.
- Registrar saldo anterior, saldo posterior, assinatura e taxa.

### Critério de aceite

- Testes do núcleo passam.
- Uma assinatura real da Devnet contém as duas transferências.
- O total debitado em USDC é igual à soma creditada aos destinatários.
- Repetir a operação não falha porque uma conta de token já existe.

### Regra de corte

Não começar formulários, identidade visual ou recibo. Se a transação não funcionar, todo o Dia 3 continua dedicado a ela.

---

## Dia 3 — Caminho feliz completo com três destinatários

### Meta

Demonstrar, em uma interface mínima, o pagamento real para três carteiras e chegar a uma página de sucesso com a assinatura.

### Trabalho

- Evoluir a transação de 2 para 3 destinatários.
- Usar uma configuração fixa e conhecida na tela de pagamento.
- Mostrar título, total, destinatários, percentuais e valores.
- Implementar os estados: conectar, aguardando assinatura, enviando, confirmado.
- Após a confirmação, navegar para uma página simples contendo a assinatura e o link do Explorer.
- Testar em janela anônima e gravar o primeiro vídeo bruto do fluxo.

### Critério de aceite — Marco principal

- Uma pessoa que não está com o ambiente de desenvolvimento aberto consegue acessar o deploy.
- Ela conecta a carteira, assina e conclui o pagamento.
- Três destinatários recebem os valores exatos.
- A página final mostra a assinatura verificável.

### Decisão no fim do dia

Se este marco não estiver pronto, o projeto entra em **modo de recuperação**:

- manter três destinatários no máximo;
- cancelar QR, Pix simulado, cotação em reais e animações;
- adiar qualquer pesquisa de concorrente que não afete a submissão;
- trabalhar somente em caminho feliz, recibo e vídeo.

---

## Dia 4 — Criar e compartilhar o link

### Meta

Substituir os dados fixos por um link criado pelo usuário, sem banco de dados.

### Trabalho

- Definir o contrato versionado do payload.
- Implementar encode e decode em base64url.
- Validar o payload inteiro ao abrir o link.
- Criar o formulário com título, valor, destinatários, endereços e percentuais.
- Implementar “Dividir igualmente”.
- Validar soma igual a 100%, endereços, duplicatas e limites.
- Gerar e copiar o link.
- Abrir o link em outro navegador e executar o pagamento.

### Critério de aceite

- Um link com três destinatários é criado, copiado e aberto em uma janela anônima.
- Link inválido ou adulterado produz mensagem segura em português.
- O pagamento usa exatamente os dados revisados na tela.
- O link não depende de banco, login ou servidor próprio.

### Segurança obrigatória

Acima do botão de pagamento, mostrar que os endereços devem ser conferidos e que transações em blockchain não podem ser desfeitas.

---

## Dia 5 — Recibo público confiável

### Meta

Abrir `/r/<assinatura>` em qualquer navegador e reconstruir o pagamento diretamente da blockchain.

### Trabalho

- Buscar a transação confirmada com tentativas limitadas.
- Verificar se a transação foi bem-sucedida.
- Calcular variações de saldo de USDC por proprietário.
- Identificar pagador, destinatários, total e horário.
- Ler o memo somente se ele tiver o prefixo esperado.
- Exibir status, valores e link do Explorer.
- Tratar assinatura inválida, transação inexistente, RPC lento e transação sem memo.

### Critério de aceite

- O recibo da transação do Dia 4 abre em outro navegador.
- Os valores exibidos correspondem às mudanças de saldo registradas na rede.
- O recibo continua útil mesmo sem memo.
- Uma assinatura inexistente não causa tela branca.

### Regra de corte

Não implementar Pix simulado antes de o recibo básico estar estável.

---

## Dia 6 — Robustez, cinco destinatários e mobile

### Meta

Transformar o protótipo funcional em uma demo que não quebra facilmente.

### Trabalho

- Testar 2, 3 e 5 destinatários.
- Medir o tamanho e simular a transação antes do envio.
- Tratar saldo insuficiente de USDC.
- Tratar SOL insuficiente para taxa e criação de contas.
- Tratar assinatura cancelada.
- Preservar a assinatura quando o envio ocorreu mas a confirmação falhou.
- Impedir clique duplo enquanto a transação estiver em andamento.
- Verificar o fluxo em 375 px.
- Testar ao menos uma carteira ou navegador semelhante ao usado na apresentação.
- Medir custo e tempo para três e cinco destinatários.

### Critério de aceite

- Nenhum cenário crítico termina em tela branca ou pagamento silenciosamente duplicado.
- Os erros principais aparecem em português e dizem o que a pessoa deve fazer.
- O fluxo principal cabe e funciona em 375 px.
- Custos e tempos observados ficam registrados para o pitch.

### Decisão no fim do dia

O produto entra em congelamento funcional. A partir daqui, nenhuma funcionalidade nova entra sem substituir outra de esforço equivalente.

---

## Dia 7 — Identidade visual e ensaio de QA

### Meta

Dar ao produto uma aparência própria sem alterar o fluxo já validado.

### Trabalho

- Aplicar cores, tipografia e espaçamento consistentes.
- Criar o componente SVG de fatias e reutilizá-lo nas telas principais.
- Criar landing curta: proposta, três passos, CTA e aviso de Devnet.
- Adicionar estados simples de carregamento e erro.
- Respeitar `prefers-reduced-motion`.
- Rodar o roteiro manual completo.
- Classificar bugs em:
  - bloqueia a demo;
  - prejudica compreensão;
  - detalhe visual.
- Corrigir somente nessa ordem.

### Critério de aceite

- O fluxo do Dia 6 continua funcionando depois das mudanças visuais.
- Nenhum elemento estoura a largura de 375 px.
- Uma pessoa entende o produto e o próximo passo sem explicação verbal.
- Não resta bug classificado como “bloqueia a demo”.

### Extras permitidos somente se tudo estiver verde

- QR code.
- Animação do gráfico.
- Cotação fictícia em reais.
- Pix simulado, sempre rotulado como simulação.

---

## Dia 8 — Evidências, história e pacote de apresentação

### Meta

Transformar o software funcional em uma submissão convincente e verificável.

### Trabalho

- Concluir pelo menos três conversas reais com o público-alvo.
- Registrar somente frases autorizadas e aprendizados verdadeiros.
- Escrever o README com instalação, arquitetura, limitações e o que é simulado.
- Produzir o deck de sete slides.
- Gravar o vídeo de 90 segundos com uma transação já ensaiada.
- Gravar um vídeo de reserva mostrando o fluxo inteiro sem depender da rede ao vivo.
- Preparar respostas para carteira, diferenciação, Pix, regulação e modelo de negócio.
- Criar uma conta ou carteira exclusiva para a apresentação e abastecê-la.
- Revisar se algum segredo, chave privada ou dado pessoal foi exposto.

### Critério de aceite

- README permite que outra pessoa entenda e rode o projeto.
- Deck não contém números inventados.
- Vídeo mostra criação, pagamento, três recebimentos e recibo.
- Limitações aparecem claramente, sem diminuir o valor da prova técnica.
- Todos os links da submissão foram testados em janela anônima.

---

## Dia 9 — Congelamento, ensaio e submissão

### Meta

Enviar cedo uma versão já testada. O Dia 9 não é dia de construir funcionalidades.

### Trabalho

- Criar uma versão candidata final.
- Executar duas vezes o roteiro completo em ambiente limpo.
- Conferir deploy, variáveis, Explorer, README, vídeo e formulário da plataforma.
- Remover rota de diagnóstico e qualquer log sensível.
- Conferir se toda simulação está rotulada.
- Preparar abas, carteiras e endereços usados na apresentação.
- Submeter com várias horas de antecedência.
- Após o envio, não alterar o deploy sem um motivo que bloqueie a avaliação.

### Critério de aceite

- Submissão confirmada pela plataforma.
- URL pública e vídeo continuam acessíveis.
- Existe um plano B gravado.
- Existe pelo menos uma transação conhecida cujo recibo pode ser aberto durante a apresentação.

---

## Trilha paralela de validação

Ela não deve ocupar o bloco principal de desenvolvimento.

### Dias 1 e 2

- Convidar 5 a 8 pessoas para conversas de 15 minutos.
- Não apresentar a solução primeiro.
- Perguntar como recebem, como dividem, quanto demora e o que dá errado.

### Dias 3 a 6

- Realizar ao menos três conversas.
- Identificar padrões sem transformar três entrevistas em “dados de mercado”.
- Se possível, mostrar o fluxo funcional e observar onde a pessoa trava.

### Dias 7 e 8

- Selecionar um ou dois aprendizados honestos.
- Pedir autorização antes de usar uma frase identificável.
- Atualizar problema, limitações e próximos passos do pitch.

## Portões de decisão

| Momento | Pergunta | Se a resposta for não |
|---|---|---|
| Fim do Dia 1 | Carteira conecta no deploy? | Usar o template oficial mínimo e cortar customização |
| Fim do Dia 2 | Duas transferências reais funcionam na mesma transação? | Suspender todo frontend e isolar a transação |
| Fim do Dia 3 | Três pessoas recebem pelo deploy? | Entrar em modo de recuperação |
| Fim do Dia 4 | O link abre em outro navegador e paga? | Manter link pré-configurado para a demo e corrigir payload depois |
| Fim do Dia 5 | O recibo reconstrói valores da rede? | Mostrar recibo mínimo + Explorer, sem enriquecimento |
| Fim do Dia 6 | Erros críticos e mobile estão seguros? | Congelar visual e corrigir somente bloqueadores |
| Fim do Dia 7 | Demo está estável e compreensível? | Cortar todos os extras |
| Metade do Dia 9 | Submissão foi enviada? | Parar qualquer mudança e enviar imediatamente |

## Hierarquia de cortes

Ao atrasar, cortar nesta ordem:

1. Pix simulado.
2. Cotação em reais.
3. QR code.
4. Animações.
5. Fontes e acabamento visual avançado.
6. Suporte visual refinado para cinco pessoas.
7. Landing completa; manter somente proposta e CTA.

Nunca cortar:

- transação real;
- verificação dos destinatários antes da assinatura;
- recibo verificável;
- mensagens de erro que evitem pagamento duplicado;
- aviso de Devnet e de simulações;
- vídeo de reserva;
- tempo de submissão.

## Painel diário de controle

Atualizar ao final de cada dia:

| Dia | Entrega do dia | Estado | Evidência | Bloqueador principal | Corte ativado |
|---|---|---|---|---|---|
| 1 | Deploy + carteira + saldos | Pendente | — | — | Não |
| 2 | Transação real para 2 pessoas | Pendente | — | — | Não |
| 3 | Fluxo mínimo para 3 pessoas | Pendente | — | — | Não |
| 4 | Criar e abrir link | Pendente | — | — | Não |
| 5 | Recibo público | Pendente | — | — | Não |
| 6 | Robustez + mobile | Pendente | — | — | Não |
| 7 | Visual + QA | Pendente | — | — | Não |
| 8 | README + deck + vídeos | Pendente | — | — | Não |
| 9 | Submissão | Pendente | — | — | Não |

## Definição final de sucesso

O projeto é considerado entregue quando:

- o deploy público funciona;
- uma transação de USDC na Devnet divide o pagamento entre três destinatários;
- o recibo público reflete a blockchain;
- o avaliador entende claramente o que é real e o que é simulado;
- a apresentação tem evidência técnica, custo medido e aprendizado de usuários;
- a submissão foi confirmada antes do prazo.

Não precisamos provar uma empresa pronta em nove dias. Precisamos provar que a tese central funciona, que conhecemos as limitações e que sabemos qual é o próximo passo.
