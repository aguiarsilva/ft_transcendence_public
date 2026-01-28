// security-test.js
// MODE B — run-all
// Console-only report
// Author: ChatGPT

import fetch from "node-fetch";
import https from "https";

// =============================
// CONFIG
// =============================
const API = "https://localhost:3001/api/v1";

const agent = new https.Agent({
  rejectUnauthorized: false,
});

// =============================
// SMALL HELPERS
// =============================
function green(s) { return `\x1b[32m${s}\x1b[0m`; }
function red(s) { return `\x1b[31m${s}\x1b[0m`; }
function yellow(s) { return `\x1b[33m${s}\x1b[0m`; }
function cyan(s) { return `\x1b[36m${s}\x1b[0m`; }

async function test(title, fn) {
  try {
    await fn();
    console.log(green(`✔ PASS:`), title);
  } catch (err) {
    console.log(red(`✘ FAIL:`), title);
    console.log("   →", err.message);
  }
}

async function post(path, body) {
  const res = await fetch(API + path, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    agent,
  });

  const txt = await res.text();
  return { status: res.status, txt };
}

// =============================
// PAYLOADS
// =============================
const XSS = [
  "<script>alert(1)</script>",
  "<img src=x onerror=alert(1)>",
  "<b onmouseover=alert(1)>hack</b>",
  "`<svg/onload=confirm(1)>`",
  "</script><script>alert(99)</script>",
  "<iframe src=javascript:alert(1)>"
];

const SQLI = [
  "' OR 1=1 --",
  '" OR 1=1 --',
  "1'; DROP TABLE users; --",
  "abc')); DELETE FROM users; --",
  "'; SELECT sqlite_version(); --",
  "' UNION SELECT * FROM users --",
  "' OR 'x'='x",
  "'; ATTACH DATABASE 'hack.db' AS h; --"
];

const WEAK_PASSWORDS = [
  "aaaaaa",
  "123456",
  "password",
  "Qwerty123",
  "aaaaaaaaaaaaaaaaa",
  "000000",
];

const SPECIAL = [
  " ",
  "\n\n\n",
  "__proto__",
  "constructor",
  "\t\t",
];

const UNICODE = [
  "🐱🐱🐱",
  "‎‏‎‏‎‏‎", // RTL markers
  "H̵͕͝a̶͉̕c̷̨̑k̴̞̓", // Zalgo
  "\u200B\u200B\u200B", // zero-width space
];

// =============================
// TEST SUITE
// =============================
async function run() {
  console.log(cyan("\n=== XSS TESTS (registration.username) ===\n"));

  for (const payload of XSS) {
    await test(`XSS username: ${payload}`, async () => {
      const res = await post("/users", {
        email: `xss_${Math.random()}@mail.com`,
        password: "12345678",
        username: payload,
      });

      if (res.status < 400) throw new Error("Accepted XSS payload!");
    });
  }

  console.log(cyan("\n=== SQL INJECTION TESTS (login & tournaments) ===\n"));

  for (const p of SQLI) {
    await test(`SQLi login: ${p}`, async () => {
      const res = await post("/auth/login", {
        email: p,
        password: "x",
      });
      if (res.status < 400) throw new Error("SQLi passed unexpectedly!");
    });
  }

  for (const p of SQLI) {
    await test(`SQLi tournament name: ${p}`, async () => {
      const res = await post("/tournaments", {
        name: p,
        maxPlayers: 4,
      });
      if (res.status < 400) throw new Error("SQLi passed on tournaments!");
    });
  }

  console.log(cyan("\n=== EDGE CASE TESTS (email==password, weak passwords) ===\n"));

  await test("email == password should fail", async () => {
    const s = "aaa@aaa.com";
    const res = await post("/users", {
      email: s,
      password: s,
      username: "testSame",
    });

    if (res.status < 400) throw new Error("email==password accepted!");
  });

  for (const p of WEAK_PASSWORDS) {
    await test(`Weak password: ${p}`, async () => {
      const res = await post("/users", {
        email: `weak${Math.random()}@mail.com`,
        password: p,
        username: `weakUser${Math.random()}`,
      });
      if (res.status < 400) throw new Error("Weak password accepted!");
    });
  }

  console.log(cyan("\n=== SPECIAL CHAR TESTS ===\n"));

  for (const p of SPECIAL) {
    await test(`Special username: "${p.replace(/\n/g, "\\n")}"`, async () => {
      const res = await post("/users", {
        email: `spec${Math.random()}@mail.com`,
        password: "StrongPass12#",
        username: p,
      });
      if (res.status < 400) throw new Error("Special username accepted!");
    });
  }

  console.log(cyan("\n=== UNICODE EDGE TESTS ===\n"));

  for (const p of UNICODE) {
    await test(`Unicode username: "${p}"`, async () => {
      const res = await post("/users", {
        email: `uni${Math.random()}@mail.com`,
        password: "StrongPass12#",
        username: p,
      });
      if (res.status < 400) throw new Error("Unicode attack accepted!");
    });
  }

  console.log(cyan("\n=== LOGIC TESTS (case sensitivity, spaces) ===\n"));

  await test("username with spaces should fail", async () => {
    const res = await post("/users", {
      email: `space${Math.random()}@mail.com`,
      password: "StrongPass12#",
      username: "john doe",
    });
    if (res.status < 400) throw new Error("Username with spaces accepted!");
  });

  await test("username with trailing spaces should fail", async () => {
    const res = await post("/users", {
      email: `trail${Math.random()}@mail.com`,
      password: "StrongPass12#",
      username: "User123   ",
    });
    if (res.status < 400) throw new Error("Trailing spaces accepted!");
  });

  await test("case-insensitive duplicate should fail", async () => {
    const email = `dup${Math.random()}@mail.com`;
    const username = "CaseTest";

    // First register
    await post("/users", {
      email,
      password: "StrongPass12#",
      username,
    });

    // Second with different case
    const res2 = await post("/users", {
      email: `dup2${Math.random()}@mail.com`,
      password: "StrongPass12#",
      username: "casetest",
    });

    if (res2.status < 400) throw new Error("Case-insensitive duplicate accepted!");
  });

  console.log(cyan("\n=== HEADERS INJECTION TESTS ===\n"));

  await test("CRLF injection in email", async () => {
    const payload = "evil@mail.com\r\nInjected: yes";
    const res = await post("/users", {
      email: payload,
      password: "StrongPass12#",
      username: "TestCRLF",
    });

    if (res.status < 400) throw new Error("CRLF allowed!");
  });

  console.log(cyan("\n=== SOFT FUZZER (random garbage) ===\n"));

  for (let i = 0; i < 10; i++) {
    const garbage = Math.random().toString(36) + "<hack>" + Math.random();

    await test(`Fuzzer username #${i}`, async () => {
      const res = await post("/users", {
        email: `fuzz${Math.random()}@mail.com`,
        password: "StrongPass12#",
        username: garbage,
      });
      if (res.status < 400) throw new Error("Fuzzer username accepted!");
    });
  }

  console.log(cyan("\n=== ALL TESTS COMPLETE ===\n"));
}

// Run
run();
