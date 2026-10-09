---
name: Allot
description: Um sistema editorial geométrico para pagamentos divididos.
colors:
  lime-field: "#8ed462"
  lime-soft: "#e3f3d2"
  ink: "#2c2e2a"
  ink-soft: "#4d5249"
  paper: "#f5f1e4"
  warm-white: "#fffef7"
  coral-action: "#f37460"
  blue-proof: "#579af0"
  yellow-notice: "#f6e365"
  violet-slice: "#c8a8ff"
  danger: "#b42318"
  success: "#2d5d1d"
typography:
  display:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "clamp(3.2rem, 5.7vw, 4.8rem)"
    fontWeight: 650
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "clamp(2.7rem, 6vw, 4.8rem)"
    fontWeight: 650
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  brand:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  hero-body:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "clamp(1.05rem, 2vw, 1.25rem)"
    lineHeight: 1.5
  feature-body:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "clamp(1.08rem, 2.2vw, 1.5rem)"
    lineHeight: 1.48
  body:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "1.08rem"
    lineHeight: 1.7
  label:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 600
  status:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 750
    lineHeight: 1.2
rounded:
  field: "12px"
  surface: "16px"
  nav: "14px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.warm-white}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
    height: "46px"
  button-coral:
    backgroundColor: "{colors.coral-action}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
    height: "46px"
  field:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "14px 16px"
  surface:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "32px"
---

# Design System: Allot

## Overview

**Creative North Star: "Editorial em Fatias para Allot"**

Allot usa planos geométricos grandes, cor chapada e tipografia direta para transformar uma divisão financeira abstrata em algo visível. O sistema herda da referência MindMarket a coragem cromática, a navegação branca flutuante e a escala editorial, sem copiar ilustração, marca ou composição.

As superfícies de apresentação podem ser exuberantes; os fluxos de criação, pagamento e recibo são mais calmos e verificáveis. O círculo dividido é a assinatura recorrente. A identidade rejeita o painel cripto escuro, o brilho neon e o empilhamento de cartões genéricos.

**Key Characteristics:**

- Planos de cor sólidos e sem contorno.
- Títulos grandes, compactos e de leitura imediata.
- Ações em pílula; superfícies de trabalho com cantos contidos.
- Contraste entre apresentação enérgica e operação serena.
- Dados financeiros sempre textuais e tabulares.

## Colors

A paleta combina um campo lima dominante com tinta carvão e acentos planos que representam partes distintas do mesmo todo.

### Primary

- **Campo Lima:** fundo de alto impacto para entrada e superfícies de demonstração.
- **Tinta Carvão:** texto principal, ação primária e eixo que ancora as fatias.

### Secondary

- **Coral de Ação:** CTA principal de campanha e uma fatia recorrente.
- **Azul de Prova:** foco e uma fatia recorrente; não cobre seções inteiras.

### Tertiary

- **Amarelo de Aviso:** faixa de mensagem, Devnet, valores destacados e pequenas formas.
- **Violeta de Fatia:** quinta parte opcional e detalhe geométrico; não cobre seções inteiras.

### Neutral

- **Papel:** campo operacional da aplicação.
- **Branco Quente:** navegação, formulários e metade clara do símbolo.
- **Tinta Suave:** textos secundários.

### Named Rules

**The Saturated Field Rule.** Grandes campos usam lima, papel, branco ou carvão. Coral, azul, amarelo e violeta ficam em ações, dados e ilustrações, sem disputar o fundo da página.

**The Ink Anchor Rule.** Toda composição colorida mantém carvão suficiente para orientar leitura e ação.

## Typography

**Display Font:** Space Grotesk (com fallback sans-serif)

**Body Font:** Space Grotesk (com fallback sans-serif)

**Label/Mono Font:** SFMono-Regular ou Consolas, somente para endereços e números técnicos.

**Character:** grotesca geométrica, humana e firme. O display usa peso 650, terminais limpos e espaçamento comprimido; o corpo permanece aberto.

### Hierarchy

- **Display:** escala fluida até 6rem, entrelinha 0,88; somente para o principal argumento da página.
- **Headline:** escala fluida até 4,8rem, entrelinha 0,95; cabeçalhos de tarefa e prova.
- **Title:** 1,5–2,25rem, peso 650; títulos dentro das superfícies.
- **Body:** 1–1,08rem, entrelinha 1,5–1,7; textos de orientação.
- **Label:** 0,9rem, peso 600; campos e metadados, sem caixa-alta decorativa.

### Named Rules

**The One Monument Rule.** Cada viewport tem um único título monumental; o restante baixa de volume.

## Layout

### Agreement-led home, 2026-10-07

The homepage leads with a freelance team's actual work: proposal, counterproposal, and agreement. An interactive approval sheet exposes each role, percentage, and decision; a proportional split ring uses the existing share colors and updates with each example stage. The example is explicitly illustrative and performs no account or payment operation. On narrow screens, the headline and primary action precede the sheet; the Devnet limitations remain immediately after it.

Keep one explanation of the workflow and one payment diagram. Avoid repeating the same payment preview in several oversized sections, invented traction counters, an endlessly moving slogan rail, all-caps labels, and ornamental CTA arrows. Keep the lime field, Space Grotesk, split mark, operational tokens, keyboard focus, and coffee animation.

Pix must be labeled as planned, not offered as a working checkout. Marketing promises must match the test-only product. This is a surgical edit within the existing brand, not a new palette or design system.

O contêiner principal usa largura máxima de 76rem e margens laterais responsivas. A landing abre em duas colunas a partir de 800px; em telas menores, texto e figura empilham sem reduzir a legibilidade da marca.

Fluxos operacionais usam uma superfície principal e um painel lateral lima de prévia. Abaixo do breakpoint desktop, a prévia desce para o fluxo natural. Grupos próximos usam 8–16px; mudanças de assunto usam 24–32px ou mais.

## Elevation & Depth

O sistema é plano por padrão. Cor e sobreposição criam hierarquia; a única elevação ambiente recorrente pertence à navegação flutuante. O símbolo de abertura usa uma sombra projetada suave apenas para separar as fatias do campo lima.

### Shadow Vocabulary

- **Navegação ambiente:** sombra ampla e baixa para a barra branca suspensa.
- **Figura editorial:** drop-shadow suave aplicado ao conjunto, nunca a cada fatia.

### Named Rules

**The Flat-by-Default Rule.** Painéis internos usam borda ou mudança tonal; não combinam borda e sombra larga.

## Motion

A animação principal mostra as fatias chegando de direções diferentes e formando um único pagamento. A sequência acontece uma vez na entrada da landing; depois, hover e foco apenas separam levemente as partes para reforçar a relação entre elas.

- **Entrada:** 600–800ms, `cubic-bezier(.16,1,.3,1)`, com título revelado por recorte e fatias compondo o círculo.
- **Continuidade:** a faixa “uma cobrança / uma assinatura / várias partes / um recibo” rola continuamente na horizontal, com alternativa estática em movimento reduzido.
- **Explicação:** três diagramas geométricos ligados ao scroll mostram o link viajando, a divisão atômica e o recibo sendo desenhado.
- **Feedback:** botões e linhas respondem em 180–300ms; setas avançam na direção da ação.
- **Acessibilidade:** `prefers-reduced-motion` remove deslocamentos, recortes e movimento ligado ao scroll.

**The One Assembly Rule.** A landing tem uma única coreografia de entrada; o restante usa movimento apenas para relação, continuidade ou feedback.

## Shapes

Superfícies operacionais usam cantos de 12–16px. Pílulas ficam reservadas a botões, status e pequenos controles. A geometria de marca usa círculos cortados, semicírculos, planos deslocados e pequenos discos; essas formas nunca substituem texto ou dado.

## Components

### Buttons

- **Shape:** pílula completa, altura mínima de 46px.
- **Primary:** carvão sobre branco quente; peso 700.
- **Coral:** ação de conversão na landing.
- **Secondary:** transparente com borda carvão.
- **Hover / Focus:** sobe 2px; foco azul de 3px; estado desabilitado reduz opacidade sem movimento.

### Chips

- **Style:** fundo tonal, texto escuro e raio completo.
- **State:** lima suave para confirmado; rosa claro para falha.

### Cards / Containers

- **Corner Style:** canto contido de 16px.
- **Background:** branco quente para tarefa; lima suave para prévia.
- **Shadow Strategy:** nenhuma sombra em painéis internos.
- **Border:** linha carvão translúcida apenas na superfície principal.
- **Internal Padding:** 20–32px responsivos.

### Inputs / Fields

- **Style:** branco quente, borda carvão translúcida e raio de 12px.
- **Focus:** borda azul e anel azul translúcido.
- **Error / Disabled:** mensagem textual em vermelho; nunca depender só da cor.

### Navigation

Barra branca suspensa, raio de 14px e marca à esquerda. A ação principal fecha a barra à direita; links secundários desaparecem quando a largura não comporta ambos.

### Split Figure

O círculo em fatias usa SVG geométrico e cores da paleta. Na landing, os planos se afastam no hover; com movimento reduzido, permanecem estáticos. Em fluxos, o gráfico serve apenas de prévia e sempre acompanha valores escritos.

## Do's and Don'ts

### Do:

- **Do** usar uma cor de campo por região e deixar a composição respirar.
- **Do** manter o círculo dividido reconhecível em qualquer breakpoint.
- **Do** reservar monoespaçada a endereços, assinaturas e números tabulares.
- **Do** mostrar percentuais, valores e estados também em texto.

### Don't:

- **Don't** copiar ilustrações, textos ou layouts da MindMarket.
- **Don't** voltar ao painel escuro com neon, glassmorphism ou gradiente.
- **Don't** criar grades de cartões iguais como estrutura principal.
- **Don't** usar emoji ou glifo Unicode como sistema de ícones.
- **Don't** usar o gráfico como única fonte de informação.
