import Script from "next/script";

export function CrispWidget() {
  return <Script id="crisp-chat" strategy="lazyOnload">
    {`window.$crisp=[];window.CRISP_WEBSITE_ID="fc080341-1fb0-4e43-99d4-4d9e010b2162";(function(){var d=document,s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.head.appendChild(s);})();`}
  </Script>;
}
