# Allot 2.0 — pacote de submissão

A [Colosseum](https://colosseum.com/hackathon?year=fall2026) informa prazo de 12/10/2026. O formulário pede descrição, ferramentas, equipe, GitHub, pitch de 2–3 minutos, demo de até 3 minutos e estratégia de distribuição com validação de demanda. Código anterior ao hackathon deve ser declarado.

## Evidência disponível em 8/10/2026

- **Código:** acordos versionados, aceite individual, propostas de agentes, policy persistente, pedidos idempotentes, revisão humana, assinatura na carteira e verificação de recibo estão implementados. O MCP stdio adapta a API; ainda não foi testado com credencial e equipe reais.
- **Banco:** migrações de agentes e Allot 2.0 aplicadas ao projeto Allot. A migração do painel expõe contagens exatas de credenciais, reservas, confirmações e aprovações pendentes.
- **Site:** deploy `dpl_CJqvjZwqEEaUDd9eLv6h6gfz3czp` está `READY` em `https://allot-three.vercel.app`. `/` e `/pagar` responderam 200; API sem credencial respondeu 401; mutação de outra origem respondeu 403. A landing não teve overflow horizontal em 375 px.
- **Prova real:** ainda não há assinatura Allot conciliada na Devnet, vídeo gravado, três equipes testadas, 30 entrevistas ou receita. O fundador informou duas contas Allot e nenhuma carteira Devnet.

## Roteiro do pitch, 2–3 minutos

1. **Problema:** “Small freelance teams agree to do the work before they agree on how payment is divided. One person often collects and forwards everyone’s share. AI agents add a new coordination problem: who gave them authority to change terms or request payment?”
2. **Produto:** “Allot starts with a versioned agreement. Each recipient approves the exact split. An agent can propose changes and request a payment within a team policy; it cannot approve terms or sign a transaction.”
3. **Demonstração:** mostrar proposta do agente, revisão do dono, contraproposta de um destinatário, nova versão sem aceites herdados, aprovação unânime e pedido de pagamento sujeito a limite humano.
4. **Liquidação:** “The payer reviews and signs in their own wallet. Our current rail uses test USDC on Solana Devnet. A confirmed receipt can be checked against the agreement and the transfer instructions.” Mostrar transação somente após prova real.
5. **Mercado e distribuição:** começar com equipes pequenas de produção, agência e freelancers. Entrevistar 30 pessoas e observar três equipes completando um acordo. Agentes entram onde essas equipes já delegam trabalho.
6. **Estágio e pedido:** declarar o que foi publicado e o que foi comprovado com contas, carteira e usuários. Pedir equipes dispostas a testar um acordo real; não declarar clientes, receita ou pagamentos inexistentes.

## Roteiro da demo, até 3 minutos

1. Entrar com conta dona. Mostrar credencial de agente **sem exibir o token** e policy com orçamento, teto, destinatários e limiar humano.
2. Usar API/MCP com segredo fora da gravação para propor um acordo. Mostrar rascunho e evento de atividade; dono revisa e submete.
3. Destinatário pede mudança. Dono cria nova versão. Mostrar que os aceites anteriores não aprovam a nova versão; cada destinatário aceita.
4. Publicar acordo. Agente cria `request_payment`; mostrar recusa acima do teto e revisão humana quando exigida. Nunca expor token, cookie ou chave.
5. Abrir o link com carteira Devnet financiada, revisar destinatários e assinar **apenas com a pessoa no controle**. Mostrar assinatura, memo `allot:v3`, saldo antes/depois e recibo em janela privada. Sem carteira ou assinatura, encerrar no pedido aprovado e dizer que o pagamento ainda não foi comprovado.

## Testes com três equipes e 30 entrevistas

Convite individual sugerido: “Estou testando o Allot com equipes que dividem o valor de um projeto. Você poderia me contar como decidiu os percentuais no último trabalho em conjunto? A conversa dura 15 minutos. O teste atual usa apenas fundos de demonstração.”

Perguntar pelo último projeto concreto: quem contratou, quem cobrou, como decidiram porcentagens, quantas revisões ocorreram, quem fez repasses e o que gerou atrito. Depois mostrar o fluxo e observar onde a pessoa trava. Perguntar sobre preço só depois de entender o problema.

Para cada entrevista, registrar data, perfil, canal, relato literal, problema observado, interesse em teste e consentimento para citar. Para cada equipe piloto, registrar participantes, versões, tempo até aceite, pedidos do agente, bloqueios da policy, assinatura e recibo se houver. Guardar dados pessoais e links privados fora do repositório. **Meta não é resultado.**

## Antes de enviar

- Reconciliar uma transação Allot real com três endereços controlados e recibo, ou declarar a etapa pendente.
- Gravar os dois vídeos com o fluxo efetivamente demonstrado.
- Revisar GitHub, licença, README, instruções de execução e distinção entre código anterior e trabalho do hackathon.
- Conferir respostas do formulário com evidências existentes. O envio à Colosseum é uma ação do fundador.
