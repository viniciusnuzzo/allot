import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";

const recipient = z.object({ name: z.string(), address: z.string(), bps: z.number() });
const payload = z.object({ v: z.literal(1), title: z.string(), amount: z.string().nullable(), recipients: z.array(recipient) });
const proposal = { team: z.uuid(), payload, recipientIds: z.array(z.uuid()) };

async function callAllot(body: Record<string, unknown>) {
  const token = process.env.ALLOT_AGENT_TOKEN;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    return { content: [{ type: "text" as const, text: "Set ALLOT_AGENT_TOKEN from the team owner's credential screen." }], isError: true };
  }
  let endpoint: URL;
  try {
    const base = new URL(process.env.ALLOT_API_BASE_URL ?? "http://localhost:3000");
    if (base.protocol !== "https:" && !(base.protocol === "http:" && ["localhost", "127.0.0.1"].includes(base.hostname))) {
      throw new Error("HTTPS required outside localhost");
    }
    endpoint = new URL("/api/agent", base);
  } catch {
    return { content: [{ type: "text" as const, text: "Set ALLOT_API_BASE_URL to HTTPS or local HTTP." }], isError: true };
  }
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    const result = await response.json();
    return { content: [{ type: "text" as const, text: JSON.stringify(result) }], isError: !response.ok };
  } catch {
    return { content: [{ type: "text" as const, text: "Allot API unavailable." }], isError: true };
  }
}

async function getReceipt(signature: string) {
  let endpoint: URL;
  try {
    const base = new URL(process.env.ALLOT_API_BASE_URL ?? "http://localhost:3000");
    if (base.protocol !== "https:" && !(base.protocol === "http:" && ["localhost", "127.0.0.1"].includes(base.hostname))) {
      throw new Error("HTTPS required outside localhost");
    }
    endpoint = new URL(`/api/receipts/${signature}`, base);
  } catch {
    return { content: [{ type: "text" as const, text: "Set ALLOT_API_BASE_URL to HTTPS or local HTTP." }], isError: true };
  }
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(10_000) });
    return { content: [{ type: "text" as const, text: await response.text() }], isError: !response.ok };
  } catch {
    return { content: [{ type: "text" as const, text: "Allot API unavailable." }], isError: true };
  }
}

function createServer() {
  const server = new McpServer({ name: "allot", version: "0.1.0" });
  server.registerTool("create_project", {
    description: "Suggest a team project or subproject with an optional test-USDC planning budget. The owner must create it; no funds are reserved.",
    inputSchema: z.object({ team: z.uuid(), parent: z.uuid().nullable(), title: z.string().trim().min(1).max(60), budget: z.string().nullable() }),
  }, (args) => callAllot({ action: "create_project", ...args }));
  server.registerTool("get_agreement", {
    description: "Read one team agreement and human decisions. Read-only.",
    inputSchema: z.object({ team: z.uuid(), agreementId: z.uuid() }),
  }, (args) => callAllot({ action: "get_agreement", ...args }));
  server.registerTool("create_agreement", {
    description: "Suggest a new agreement draft. Owner must submit it; recipients must approve. Does not pay.",
    inputSchema: z.object(proposal),
  }, (args) => callAllot({ action: "create_agreement", ...args }));
  server.registerTool("propose_change", {
    description: "Suggest a new version of an agreement. Prior approvals do not carry over. Does not pay.",
    inputSchema: z.object({ ...proposal, agreementId: z.uuid() }),
  }, (args) => callAllot({ action: "propose_change", ...args }));
  server.registerTool("request_approval", {
    description: "Ask the team owner to review an existing agent draft. Does not submit, approve, publish, or pay.",
    inputSchema: z.object({ team: z.uuid(), draftId: z.uuid() }),
  }, (args) => callAllot({ action: "request_approval", ...args }));
  server.registerTool("request_payment", {
    description: "Request payment for an approved fixed-amount agreement. Policy reserves budget. A person still approves when required and signs in a wallet.",
    inputSchema: z.object({ team: z.uuid(), agreementId: z.uuid(), idempotencyKey: z.string().min(1).max(64).regex(/^[A-Za-z0-9._:-]+$/) }),
  }, (args) => callAllot({ action: "request_payment", ...args }));
  server.registerTool("get_payment_request", {
    description: "Read the status of a payment request created with this agent credential.",
    inputSchema: z.object({ team: z.uuid(), requestId: z.uuid() }),
  }, (args) => callAllot({ action: "get_payment_request", ...args }));
  server.registerTool("get_payment_receipt", {
    description: "Read public Devnet transaction status and net test-USDC balance changes. Does not prove agreement approval.",
    inputSchema: z.object({ signature: z.string().min(64).max(88).regex(/^[1-9A-HJ-NP-Za-km-z]+$/) }),
  }, ({ signature }) => getReceipt(signature));
  return server;
}

void serveStdio(createServer);
