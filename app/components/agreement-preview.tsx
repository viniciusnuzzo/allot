"use client";

import { useState } from "react";

const stages = ["Proposal", "Adjustment", "Agreement"] as const;

export function AgreementPreview() {
  const [stage, setStage] = useState(0);
  const shares = stage === 2 ? [40, 40, 20] : [50, 40, 10];
  const people = ["Producer", "Editor", "Designer"];
  return (
    <figure className="agreement-preview" aria-label="Illustrative split negotiation">
      <figcaption><span>Launch campaign</span><span>Example / {stage === 2 ? "Version 2" : "Version 1"}</span></figcaption>
      <div className="agreement-stage-controls" aria-label="Explore the agreement example">
        {stages.map((label, index) => <button key={label} type="button" aria-pressed={stage === index} onClick={() => setStage(index)}>{label}</button>)}
      </div>
      <div className="agreement-visual" aria-hidden="true">
        <div className="agreement-disc" style={{ background: `conic-gradient(var(--coral) 0 ${shares[0]}%, var(--blue) ${shares[0]}% ${shares[0] + shares[1]}%, var(--violet) ${shares[0] + shares[1]}% 100%)` }}>
          <span>100<small>%</small></span>
        </div>
        <p><strong>{stage === 2 ? "All agreed." : stage === 1 ? "One change requested." : "One decision pending."}</strong><span>One agreement. Three shares.</span></p>
      </div>
      <table>
        <caption className="sr-only">Example shares and approvals. No payment is created.</caption>
        <thead><tr><th scope="col">Teammate</th><th scope="col">Share</th><th scope="col">Decision</th></tr></thead>
        <tbody>{people.map((person, index) => <tr key={person}><th scope="row">{person}</th><td>{shares[index]}%</td><td>{stage === 2 || index < 2 ? "Accepted" : stage === 1 ? "Requests 20%" : "Pending"}</td></tr>)}</tbody>
      </table>
      <div className="agreement-outcome" aria-live="polite">
        <strong>{stage === 2 ? "Everyone agreed. Link can open." : "Payment link stays locked."}</strong>
        <p>{stage === 2 ? "The owner revised the split. Every recipient accepted the new version." : stage === 1 ? "The designer asks for 20%. The owner must revise the split and collect fresh approvals." : "The designer has not accepted. Two approvals are not enough."}</p>
      </div>
      <p className="agreement-caption">Illustrative workflow. No account, approval, or payment is created here.</p>
    </figure>
  );
}
