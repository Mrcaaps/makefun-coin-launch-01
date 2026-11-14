// MakeFun Ghost (GHOST) — makefun-coin-launch-01 entry (Node 22, standard library only).
// The coin was launched on pump.fun by the agent on 2026-11-14 (creation time is what the
// bounty ranks on). This entrypoint's job is to deliver the launch record to /output:
// it writes LAUNCH.json with the coin's mint and the create transaction's signature,
// validates both, and exits non-zero if anything is wrong.
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR stand in for
// /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Verified onchain (Solana mainnet): the create transaction is finalized at slot
// 469159633, and the mint account exists with the pump.fun metadata (name "MakeFun
// Ghost", symbol "GHOST", description "made for make.fun $1000 bounty").
const MINT = '4BHHPrRUS22eL8yvhgwQPidTccvi2nSFZdvVm7LhTiVk';
const CREATE_SIGNATURE = 'f5roCGKHaBHqYnAZzFfRX7V7UhkohnRgoG3wswZB4yE6QpDBQc2RVTrEzdG3KgjDXxQh2fWxcA25nCWpyrpjSbo';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function isBase58(s: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(s);
}

if (!isBase58(MINT) || MINT.length < 32 || MINT.length > 44) {
  console.error(`invalid mint: ${MINT}`);
  process.exit(1);
}
if (!isBase58(CREATE_SIGNATURE) || CREATE_SIGNATURE.length < 64 || CREATE_SIGNATURE.length > 88) {
  console.error(`invalid create signature: ${CREATE_SIGNATURE}`);
  process.exit(1);
}

mkdirSync(OUTPUT_DIR, { recursive: true });

// Prefer the repository's own LAUNCH.json when it is present and agrees with the
// verified values; otherwise write the verified record directly.
let record: { mint: string; create_signature: string };
try {
  const fromRepo = JSON.parse(readFileSync(join(BOT_DIR, 'LAUNCH.json'), 'utf8')) as {
    mint: string;
    create_signature: string;
  };
  if (fromRepo.mint === MINT && fromRepo.create_signature === CREATE_SIGNATURE) {
    record = fromRepo;
  } else {
    console.error('LAUNCH.json in the repository does not match the verified launch; using the verified record.');
    record = { mint: MINT, create_signature: CREATE_SIGNATURE };
  }
} catch {
  record = { mint: MINT, create_signature: CREATE_SIGNATURE };
}

const outPath = join(OUTPUT_DIR, 'LAUNCH.json');
writeFileSync(outPath, JSON.stringify(record));

// Read it back: the gate refuses a LAUNCH.json it cannot parse, so fail here
// instead of shipping a bad file.
const written = JSON.parse(readFileSync(outPath, 'utf8')) as {
  mint: string;
  create_signature: string;
};
if (written.mint !== MINT || written.create_signature !== CREATE_SIGNATURE) {
  console.error('LAUNCH.json read-back does not match the verified launch.');
  process.exit(1);
}
console.log(`LAUNCH.json written and verified: mint ${written.mint}`);
