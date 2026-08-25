#!/usr/bin/env node
/**
 * Tiny authenticated API client for QA cycles.
 *
 *   node scripts/qa-api.mjs <who> <METHOD> <path> [jsonBody]
 *
 * `who` is one of the preflight probe accounts (individual|owner|admin|student1)
 * or an explicit `email:password` pair. Prints status + body.
 */
const ACCOUNTS = {
  individual: ['qa-individual@talim.local', 'Individual-12345'],
  owner: ['qa-owner@talim.local', 'QaOwner-12345'],
  admin: ['qa-admin@talim.local', 'QaAdmin-12345'],
  student1: ['teststudent1', 'Student-12345'],
};

const API = process.env.QA_API ?? 'http://localhost:4000';

export async function login(who) {
  const [email, password] = ACCOUNTS[who] ?? who.split(/:(.*)/s);
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  const token = json.token ?? json.accessToken ?? json.data?.token;
  if (!token) throw new Error(`login failed for ${email}: ${JSON.stringify(json).slice(0, 300)}`);
  return token;
}

export async function call(token, method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [who, method = 'GET', path = '/health', raw] = process.argv.slice(2);
  const token = await login(who);
  const { status, body } = await call(token, method.toUpperCase(), path, raw ? JSON.parse(raw) : undefined);
  console.log(status);
  console.log(typeof body === 'string' ? body : JSON.stringify(body, null, 1));
}
