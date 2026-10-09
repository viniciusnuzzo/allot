# Allot visual system — 2.0

## Source of truth

The founder supplied `allot_v2_preto_no_branco.png` as the Allot logo. Use the exact source image from `public/allot-wordmark-source.png` for every visible wordmark. Do not redraw the cut A, typeset “allot” beside another symbol, recolor the artwork, or replace it with the previous split-circle mark. Its white canvas is part of the supplied asset; the UI crops it only at display time.

## Direction

An agreement should read like a clear, signed document, and a payment should read like a precise transfer sheet. The visual system is black ink on white paper with firm rules, broad margins, and tabular amounts. The landing can use large editorial type; teams, approvals, wallet review, and receipts stay dense and calm.

- **Ink:** `#101010` for text, primary actions, and major rules.
- **Paper:** `#fff` for the main canvas; `#f3f3f1` for alternate sections and the application shell.
- **Secondary text:** `#4d4d4d`; **hairline:** `#cececb`; **strong line:** `#8d8d8a`.
- **Status only:** deep green for confirmed, deep red for errors; neutral gray for pending and Devnet notices. Color never implies a payment is confirmed without receipt proof.
- **Type:** Arial / Helvetica sans-serif. Headlines are heavy and compressed through weight and tracking; body copy stays open and readable. The supplied logo supplies the distinctive letterforms.
- **Shape:** square or 2 px corners on controls. Rules separate steps, versions, recipients, and authority levels. No floating card stacks, ambient gradients, decorative orbits, pill menus, or generic crypto motifs.

## Components

- **Navigation:** a full white bar with the actual wordmark and one black baseline. Links are plain text; the account action is black.
- **Primary action:** black rectangle with white text, at least 44 px tall. Secondary action: white rectangle with black outline. Destructive action: red outline and text.
- **Agreement sheet:** bordered document with tabs, allocation bar, recipient rows, and an explicit lock/open result. The illustrative landing sample must remain labeled as illustrative.
- **Operational surface:** white panel on paper with a black top rule. Inside it, use row dividers, compact labels, and tabular figures. Reserve a panel for an actual task rather than placing every fact in another card.
- **Fields:** strong border, visible keyboard focus, label above. Long wallet addresses wrap; labels and percentages stay readable at 320 px.
- **Receipt and payment:** amount and recipient rows are prominent; proof, wallet authority, Devnet, and test-USDC limits remain textually explicit.

## Responsive and motion

Use two columns above 800 px for the landing and a single reading order below. At narrow widths, the logo, account controls, agreement table, and action buttons must fit without horizontal scrolling. Transitions are limited to hover/focus feedback and stage changes. Respect reduced-motion preferences.
