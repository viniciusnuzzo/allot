export function LinkJourneyArt() {
  return (
    <svg className="story-art story-link-art" viewBox="0 0 560 400" role="img" aria-label="A payment link traveling from the creator to the payer">
      <path className="story-route" d="M92 202C180 80 356 88 468 198" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <circle className="story-node story-node-start" cx="82" cy="215" r="55" fill="#20211f" />
      <path d="M57 216a25 25 0 0 0 25 25V191a25 25 0 0 0-25 25Z" fill="#fffef8" />
      <path d="M90 191a25 25 0 0 1 0 50v-50Z" fill="#ff7058" />
      <g className="story-ticket">
        <rect x="188" y="112" width="190" height="132" rx="16" fill="#fffef8" />
        <rect x="210" y="140" width="102" height="12" rx="6" fill="#20211f" />
        <rect x="210" y="170" width="142" height="9" rx="4.5" fill="#c8a8ff" />
        <rect x="210" y="194" width="118" height="9" rx="4.5" fill="#579af0" />
        <circle cx="350" cy="220" r="28" fill="#ffd84a" />
        <path d="m338 220 8 8 17-18" fill="none" stroke="#20211f" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g className="story-wallet">
        <rect x="434" y="172" width="102" height="84" rx="18" fill="#579af0" />
        <rect x="460" y="197" width="76" height="34" rx="12" fill="#20211f" />
        <circle cx="477" cy="214" r="6" fill="#ffd84a" />
      </g>
      <circle className="story-orbit story-orbit-coral" cx="146" cy="82" r="24" fill="#ff7058" />
      <path className="story-orbit story-orbit-violet" d="M408 308c27-32 54-32 81 0-27 32-54 32-81 0Z" fill="#c8a8ff" />
    </svg>
  );
}

export function AtomicSplitArt() {
  return (
    <svg className="story-art story-split-art" viewBox="0 0 560 400" role="img" aria-label="One payment split atomically among three recipients">
      <path className="split-route split-route-one" d="M286 200C348 160 386 112 438 82" fill="none" stroke="#20211f" strokeWidth="7" strokeLinecap="round" />
      <path className="split-route split-route-two" d="M286 200C354 200 397 200 462 200" fill="none" stroke="#20211f" strokeWidth="7" strokeLinecap="round" />
      <path className="split-route split-route-three" d="M286 200C348 242 386 288 438 320" fill="none" stroke="#20211f" strokeWidth="7" strokeLinecap="round" />
      <g className="split-core">
        <path d="M258 99a101 101 0 1 0 0 202V99Z" fill="#fffef8" />
        <path d="M272 99a101 101 0 0 1 0 202V99Z" fill="#ff7058" />
        <path d="M284 123a77 77 0 0 1 0 154V123Z" fill="#579af0" />
        <rect x="258" y="94" width="14" height="212" rx="7" fill="#20211f" />
      </g>
      <g className="split-recipient split-recipient-one">
        <circle cx="464" cy="70" r="45" fill="#ffd84a" />
        <circle cx="464" cy="70" r="13" fill="#20211f" />
      </g>
      <g className="split-recipient split-recipient-two">
        <circle cx="496" cy="200" r="45" fill="#579af0" />
        <circle cx="496" cy="200" r="13" fill="#20211f" />
      </g>
      <g className="split-recipient split-recipient-three">
        <circle cx="464" cy="330" r="45" fill="#c8a8ff" />
        <circle cx="464" cy="330" r="13" fill="#20211f" />
      </g>
      <circle className="split-pulse split-pulse-one" cx="336" cy="160" r="14" fill="#ffd84a" />
      <circle className="split-pulse split-pulse-two" cx="365" cy="200" r="14" fill="#579af0" />
      <circle className="split-pulse split-pulse-three" cx="336" cy="242" r="14" fill="#c8a8ff" />
    </svg>
  );
}

export function PublicReceiptArt() {
  return (
    <svg className="story-art story-receipt-art" viewBox="0 0 560 400" role="img" aria-label="A blockchain signature forming a verifiable public receipt">
      <path className="receipt-chain" d="M60 312C148 252 157 112 274 106c106-6 106 128 226 82" fill="none" stroke="#20211f" strokeWidth="8" strokeLinecap="round" />
      <g className="receipt-sheet">
        <path d="M160 58h218l54 54v226H160V58Z" fill="#fffef8" />
        <path d="M378 58v58h54" fill="#ffd84a" />
        <rect x="202" y="118" width="128" height="13" rx="6.5" fill="#20211f" />
        <rect x="202" y="158" width="178" height="10" rx="5" fill="#c8a8ff" />
        <rect x="202" y="187" width="150" height="10" rx="5" fill="#579af0" />
        <path className="receipt-signature" d="M203 257c34-58 47 46 77-10 17-31 30 29 48-4 15-27 29 9 48-18" fill="none" stroke="#20211f" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g className="receipt-seal">
        <circle cx="418" cy="298" r="58" fill="#9bd36a" />
        <path className="receipt-check" d="m390 298 19 19 38-43" fill="none" stroke="#20211f" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <circle className="story-orbit story-orbit-blue" cx="96" cy="82" r="28" fill="#579af0" />
      <path className="story-orbit story-orbit-coral" d="M430 72c24-28 49-28 73 0-24 28-49 28-73 0Z" fill="#ff7058" />
    </svg>
  );
}
