import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./components/account-navigation", () => ({ AccountNavigation: () => createElement("a", { href: "/login" }, "Log in") }));

import Home from "./page";

describe("Allot landing", () => {
  it("explains an illustrative atomic split without suggesting real money", () => {
    const html = renderToStaticMarkup(createElement(Home));

    expect(html).toContain("Example: 100 test USDC");
    expect(html).toContain("100 test USDC");
    expect(html).toContain("50 USDC");
    expect(html).toContain("30 USDC");
    expect(html).toContain("20 USDC");
    expect(html).toContain('href="/criar"');
    expect(html).toContain("No real money");
  });

  it("provides the complete landing sections with honest Devnet claims", () => {
    const html = renderToStaticMarkup(createElement(Home));

    for (const id of ["hero", "como-funciona", "recursos", "numeros", "sobre", "pix", "precos", "faq", "rodape"]) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).toContain("No subscription");
    expect(html).toContain("US$0.80 per completed transaction");
    expect(html).toContain("Do I need a subscription?");
    expect(html).toContain("Does Allot move real money?");
  });

  it("shows approval gating and labels the interactive example as illustrative", () => {
    const html = renderToStaticMarkup(createElement(Home));

    expect(html).toContain("Payment link stays locked.");
    expect(html).toContain("Two approvals are not enough.");
    expect(html).toContain("No account, approval, or payment is created here.");
    expect(html).toContain("Pix is not available in Allot yet.");
    expect(html).toContain("For freelance teams");
  });

  it("makes existing product features easy to find without claiming future capabilities", () => {
    const html = renderToStaticMarkup(createElement(Home));

    expect(html).toContain('id="recursos"');
    expect(html).toContain("Agreed shares");
    expect(html).toContain("Addresses in view");
    expect(html).toContain("Non-custodial demo");
    expect(html).toContain("Verifiable receipt");
    expect(html).toContain("Solana Devnet");
  });
});
