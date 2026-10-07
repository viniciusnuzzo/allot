import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const fixture = JSON.parse(await readFile(process.argv[2], "utf8"));
const origin = process.env.ALLOT_TEST_ORIGIN ?? "http://localhost:3000";
const cookies = new Map();
async function request(path, body) {
  const response = await fetch(new URL(path, origin), {
    method: body ? "POST" : "GET",
    headers: { Origin: origin, "Content-Type": "application/json", Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; ") },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  for (const cookie of response.headers.getSetCookie()) {
    const entry = cookie.split(";")[0];
    const index = entry.indexOf("=");
    cookies.set(entry.slice(0, index), entry.slice(index + 1));
  }
  return response;
}

const signedOut = await request("/teams");
assert.equal(signedOut.status, 307);
assert.match(signedOut.headers.get("location"), /\/login/);
const login = await request("/api/auth", { action: "login", email: fixture.email, password: fixture.password, next: "https://evil.example" });
assert.equal(login.status, 200, "Fixture account must log in.");
assert.equal((await login.json()).next, "/teams");
assert([...cookies.keys()].some((name) => name.includes("auth-token")), "Login must set session cookies.");
const teams = await request("/teams");
assert.equal(teams.status, 200);
assert.match(await teams.text(), /Your teams/);
const create = await request("/api/teams", { action: "create", name: "Temporary HTTP verification" });
assert.equal(create.status, 200);
assert.match((await create.json()).id, /^[a-f0-9-]{36}$/);
const forgedOrigin = await fetch(`${origin}/api/teams`, { method: "POST", headers: { Origin: "https://evil.example", "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", name: "Forbidden" }) });
assert.equal(forgedOrigin.status, 403);
const logout = await request("/api/auth", { action: "logout" });
assert.equal(logout.status, 200);
const afterLogout = await request("/teams");
assert.equal(afterLogout.status, 307);
console.log("HTTP login, cookies, protected pages, team creation, origin check, safe redirects, and logout passed.");
