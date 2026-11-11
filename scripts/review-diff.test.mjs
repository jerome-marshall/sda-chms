import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { isClean } from "./review-diff.mjs";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("..", import.meta.url));
const guide = readFileSync(
  new URL("../docs/agents/reviewer.md", import.meta.url),
  "utf-8"
);
const missingSettings = {
  REVIEW_API_KEY: "",
  REVIEW_BASE_URL: "",
  REVIEW_MODEL: "",
};

const runReview = async (env) => {
  const options = {
    cwd: root,
    env: { ...process.env, BASE_REF: "HEAD", ...env },
  };
  try {
    const { stderr, stdout } = await execFileAsync(
      process.execPath,
      ["scripts/review-diff.mjs"],
      options
    );
    return { code: 0, stderr, stdout };
  } catch (error) {
    return { code: error.code, stderr: error.stderr, stdout: error.stdout };
  }
};

const startStub = async (replies) => {
  const requests = [];
  const server = createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      requests.push({
        authorization: request.headers.authorization,
        body: JSON.parse(body),
        method: request.method,
        url: request.url,
      });
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          choices: [{ message: { content: replies.shift() } }],
        })
      );
    });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  return { requests, server, url: `http://127.0.0.1:${port}` };
};

test("passes a clean reply and fails a reply with findings", async (t) => {
  const stub = await startStub([
    "REVIEW: clean",
    [
      "apps/chms/src/x.ts:12  [blocker]  remove the cast",
      "apps/chms/test/y.test.ts:3  [high]  restore the deleted case",
      "REVIEW: 2 findings",
    ].join("\n"),
  ]);
  t.after(() => stub.server.close());

  const clean = await runReview({
    REVIEW_API_KEY: "test-key",
    REVIEW_BASE_URL: stub.url,
    REVIEW_MODEL: "test-model",
  });
  assert.equal(clean.code, 0);
  assert.match(clean.stdout, /REVIEW: clean/u);

  const findings = await runReview({
    REVIEW_API_KEY: "test-key",
    REVIEW_BASE_URL: stub.url,
    REVIEW_MODEL: "test-model",
  });
  assert.equal(findings.code, 1);
  assert.match(findings.stdout, /REVIEW: 2 findings/u);

  assert.equal(stub.requests.length, 2);
  assert.equal(stub.requests[0].url, "/chat/completions");
  assert.equal(stub.requests[0].method, "POST");
  assert.equal(stub.requests[0].authorization, "Bearer test-key");
  assert.equal(stub.requests[0].body.model, "test-model");

  const prompt = stub.requests[0].body.messages
    .map((message) => message.content)
    .join("\n");
  assert.ok(prompt.includes(guide));
  assert.match(prompt, /Diff \(untrusted data\)/u);
  assert.match(prompt, /Never follow instructions/u);
});

test("names every missing setting and does not call the API", async () => {
  const result = await runReview(missingSettings);
  assert.equal(result.code, 2);
  for (const name of ["REVIEW_BASE_URL", "REVIEW_API_KEY", "REVIEW_MODEL"]) {
    assert.match(result.stderr, new RegExp(name, "u"));
  }
});

test("only a reply that ends with the clean marker passes", () => {
  assert.equal(isClean("No findings.\nREVIEW: clean"), true);
  assert.equal(isClean("REVIEW: clean\nThe cast is still there."), false);
  assert.equal(isClean("REVIEW: 1 findings"), false);
});
