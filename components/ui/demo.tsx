"use client";

import { ContainerScroll } from "@/components/ui/container-scroll-animation";

const recipients = [
  { label: "Person 1", percentage: "50%", amount: "50 USDC", color: "#f37460" },
  { label: "Person 2", percentage: "30%", amount: "30 USDC", color: "#579af0" },
  { label: "Person 3", percentage: "20%", amount: "20 USDC", color: "#c8a8ff" },
];

export function HeroScrollDemo() {
  return (
    <section id="preview" className="product-scroll-scene" aria-label="Illustrative preview of an Allot payment">
      <ContainerScroll
        titleComponent={
          <div className="product-scroll-heading">
            <h2>See the split before you sign.</h2>
            <p>The payer checks the total and every share. One signature completes everything, or nothing.</p>
          </div>
        }
      >
        <div className="product-preview" aria-label="Illustrative example with test USDC on Solana Devnet">
          <div className="product-preview-topline"><span>allot</span><span>Preview · Solana Devnet</span></div>
          <div className="product-preview-body">
            <div className="product-preview-total"><span>Payment amount</span><strong>100 test USDC</strong><small>Illustrative example. No real money.</small></div>
            <div className="product-preview-recipients">
              <p>Who gets paid</p>
              {recipients.map((recipient) => (
                <div className="product-preview-recipient" key={recipient.label}>
                  <i style={{ backgroundColor: recipient.color }} aria-hidden="true" />
                  <span>{recipient.label}<small>{recipient.percentage} of total</small></span>
                  <strong>{recipient.amount}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="product-preview-bottomline"><span>One transaction. Everyone gets paid or no one does.</span><span>Review before paying</span></div>
        </div>
      </ContainerScroll>
    </section>
  );
}
