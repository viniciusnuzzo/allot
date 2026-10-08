export type PaymentFailure = {
  message: string;
  canRetry: boolean;
  signature?: string;
};

export type PaymentErrorCode = "INSUFFICIENT_USDC" | "INSUFFICIENT_SOL";

export class PaymentPreflightError extends Error {
  readonly code: PaymentErrorCode;

  constructor(code: PaymentErrorCode) {
    super(code);
    this.name = "PaymentPreflightError";
    this.code = code;
  }
}

function property(error: unknown, key: string): unknown {
  if (!error || typeof error !== "object" || !(key in error)) return undefined;
  return error[key as keyof typeof error];
}

function knownSignature(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const direct = property(error, "signature");
  if (typeof direct === "string") return direct;

  const context = property(error, "context");
  const fromContext = property(context, "signature");
  if (typeof fromContext === "string") return fromContext;

  const cause = property(error, "cause");
  return cause === error ? undefined : knownSignature(cause);
}

export function normalizePaymentError(error: unknown): PaymentFailure {
  const signature = knownSignature(error);
  if (signature) {
    return {
      message:
        "Confirmation failed. Check the receipt before trying again.",
      canRetry: false,
      signature,
    };
  }

  const code = property(error, "code");
  const message = String(property(error, "message") ?? error ?? "");

  if (code === "INSUFFICIENT_USDC" || /insufficient.*(token|usdc)/iu.test(message)) {
    return { message: "Insufficient USDC balance.", canRetry: true };
  }
  if (code === "INSUFFICIENT_SOL" || /insufficient.*(lamport|sol|fee)/iu.test(message)) {
    return {
      message: "Insufficient SOL for network fees and any missing recipient token accounts.",
      canRetry: true,
    };
  }
  if (
    code === 4001 ||
    property(error, "name") === "AbortError" ||
    /cancel|declin|denied|reject|recus/iu.test(message)
  ) {
    return {
      message: "Signature canceled. Nothing was charged.",
      canRetry: true,
    };
  }
  return {
    message:
      "Could not confirm whether payment went through. Check your wallet history before trying again.",
    canRetry: false,
  };
}
