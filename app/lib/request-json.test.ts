import { expect, it } from "vitest";
import { requestJson } from "./request-json";

it("bounds streamed input even without Content-Length, and rejects malformed JSON", async () => {
  const request = (body: BodyInit) => new Request("https://allot.example/api/teams", { method: "POST", body });
  expect(await requestJson(request('{"name":"Team"}'))).toEqual({ name: "Team" });
  expect(await requestJson(request("{"))).toBeNull();
  let canceled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new Uint8Array(16_385)); },
    cancel() { canceled = true; },
  });
  const oversized = new Request("https://allot.example/api/teams", { method: "POST", body: stream, duplex: "half" } as RequestInit);
  expect(await requestJson(oversized)).toBeNull();
  expect(canceled).toBe(true);
});
