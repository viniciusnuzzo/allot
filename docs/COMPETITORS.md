# Allot and existing payment splits

Research checked against primary documentation on 2026-10-07. This is a product positioning comparison, not a security or price ranking.

## Recommended positioning

Allot gives freelance teams one payment link that unlocks only after every recipient accepts the same split.

Focus on a producer, editor, and designer negotiating one client project. The benefit to test is fewer manual forwarding and payment-follow-up tasks among teammates.

## Comparison

| Product | Established capability | Implication for Allot |
| --- | --- | --- |
| Mercado Pago | The 1:N product supports multiple receivers, fixed/percentage splits, Pix, and formal consent between the main and secondary sellers. Its documentation requires commercial access. | Never claim Allot alone asks receivers for consent. Position the app around negotiation and unanimous approval of each immutable project-payment version. |
| Asaas | Pix checkout can distribute funds to other Asaas accounts using wallet IDs and percentage/fixed split rules. Percentage rules apply to the net amount after applicable fees. | Recommended provider for a first Brazilian Pix integration. Allot supplies the team agreement workflow; Asaas supplies the payment rail. This makes Asaas a possible partner as well as an alternative. |
| Splits / 0xSplits | SplitV2 smart-contract wallets distribute ETH/ERC20 allocations. Push/Pull splitters, mutable/immutable settings, and token-specific behavior already exist. | Atomic distributions and transparent crypto allocations are not unique to Allot. Our present difference is a team-facing project agreement workflow and the intended Brazilian Pix entry path. |
| Allot today | Confirmed accounts, reusable invitations, owner proposals, individual accept/reject/counter decisions, fresh approvals on revision, and publication blocked until every included recipient accepts. Test-USDC payments only. | Useful for demonstrating a small team's approval workflow. Public signup email delivery, a full funded-wallet demo, and Pix settlement still require proof. |

The documentation supports the stated competitor features. It does not prove that a competitor lacks an equivalent user interface, custom integration, or approval workflow.

## Where Allot may fit better

- A small freelance team that needs to negotiate percentages before sending a client link.
- A team that wants each person's decision visible against one version.
- A producer who currently receives the full payment and forwards shares.

These are target-use hypotheses, not measured superiority.

## Where alternatives are ahead today

Mercado Pago and Asaas have real-money payment infrastructure. Splits has deployed protocol functionality. Allot is still a Devnet demo with limited registration. A business that needs to collect money today should evaluate an established provider; we should not hide that gap.

## Primary sources

- [Mercado Pago 1:N splits and formal seller consent](https://www.mercadopago.com.br/developers/en/docs/checkout-api-orders/resources/split-payments-1-n).
- [Mercado Pago split prerequisites and commercial access](https://www.mercadopago.com.br/developers/pt/docs/split-payments/split-1-1/prerequisites).
- [Asaas Pix checkout with split](https://docs.asaas.com/docs/checkout-com-split-de-pagamento).
- [Asaas split rules and net value](https://docs.asaas.com/docs/split-de-pagamentos).
- [Splits SplitV2](https://splits.org/protocol/docs/core/split-v2/).
