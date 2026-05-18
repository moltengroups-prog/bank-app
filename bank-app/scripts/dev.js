#!/usr/bin/env node
/**
 * Bank of Molten — unified dev runner
 *
 * Usage:  npm run dev          (from project root)
 * Runs:   client · server · admin simultaneously via concurrently
 */

import { spawn }          from 'child_process';
import net                from 'net';
import path               from 'path';
import fs                 from 'fs';
import { fileURLToPath }  from 'url';

// ── Paths ─────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const BIN       = path.join(ROOT, 'node_modules', '.bin', 'concurrently');

// ── ANSI colours ──────────────────────────────────────────────────
const R = '\x1b[0m';          // reset
const B = '\x1b[1m';          // bold
const D = '\x1b[2m';          // dim
const RED  = '\x1b[31m';
const GRN  = '\x1b[32m';
const YLW  = '\x1b[33m';
const CYN  = '\x1b[36m';
const MGT  = '\x1b[35m';
const WHT  = '\x1b[97m';
const BCYN = '\x1b[96m';
const BGRN = '\x1b[92m';

// ── Service definitions ───────────────────────────────────────────
const SERVICES = [
  {
    key:   'client',
    label: 'CLIENT',
    port:  3000,
    color: 'cyan.bold',
    url:   'http://localhost:3000',
    cmd:   `cd ${path.join(ROOT, 'client')} && PORT=3000 BROWSER=none npm start`,
  },
  {
    key:   'server',
    label: 'SERVER',
    port:  8000,
    color: 'green.bold',
    url:   'http://localhost:8000',
    cmd:   `cd ${path.join(ROOT, 'server')} && npm run dev`,
  },
  {
    key:   'admin',
    label: 'ADMIN',
    port:  3001,
    color: 'magenta.bold',
    url:   'http://localhost:3001',
    cmd:   `cd ${path.join(ROOT, 'admin')} && npm run dev`,
  },
];

// ── Port availability check ───────────────────────────────────────
function isPortOccupied(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(true));        // error = port in use
    srv.once('listening', () => { srv.close(); resolve(false); });
    srv.listen(port, '127.0.0.1');
  });
}

async function auditPorts() {
  const occupied = [];
  for (const svc of SERVICES) {
    if (await isPortOccupied(svc.port)) occupied.push(svc);
  }
  return occupied;
}

// ── Banner ────────────────────────────────────────────────────────
function printStartingBanner() {
  const line = '━'.repeat(52);
  const ts   = new Date().toLocaleTimeString('en-US', { hour12: false });

  process.stdout.write('\x1bc'); // clear terminal

  console.log(`\n${B}${WHT}  ${line}${R}`);
  console.log(`${B}${WHT}   Bank of Molten — Dev Environment${R}`);
  console.log(`${B}${WHT}  ${line}${R}\n`);

  console.log(`  ${BCYN}${B}Frontend${R}  →  ${WHT}http://localhost:3000${R}`);
  console.log(`  ${BGRN}${B}Backend${R}   →  ${WHT}http://localhost:8000${R}`);
  console.log(`  ${MGT}${B}Admin${R}     →  ${WHT}http://localhost:3001${R}`);
  console.log(`  ${D}Health${R}    →  ${D}http://localhost:8000/api/health${R}`);
  console.log(`  ${D}Socket${R}    →  ${D}ws://localhost:8000${R}`);
  console.log(`  ${D}Mode${R}      →  ${D}Development${R}`);
  console.log(`  ${D}Started${R}   →  ${D}${ts}${R}`);

  console.log(`\n${D}  ${line}${R}`);
  console.log(`${D}  Launching services — logs appear below${R}`);
  console.log(`${D}  ${line}${R}\n`);
}

function printError(msg) {
  console.error(`\n${RED}${B}  ✗ ${msg}${R}`);
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  // ── Pre-flight: concurrently installed? ──────────────────────────
  if (!fs.existsSync(BIN)) {
    printError('concurrently not found. Run:  npm install  in the project root.');
    process.exit(1);
  }

  // ── Pre-flight: port conflicts ───────────────────────────────────
  const occupied = await auditPorts();
  if (occupied.length > 0) {
    console.error(`\n${RED}${B}  ✗ Port conflict — the following ports are already in use:${R}\n`);
    for (const svc of occupied) {
      console.error(`  ${RED}  [${svc.label}]  port ${svc.port} is occupied${R}`);
      console.error(`  ${D}  To free it:  lsof -ti:${svc.port} | xargs kill -9${R}`);
      console.error(`  ${D}  Or use:      npm run dev:${svc.key}  after freeing the port${R}\n`);
    }
    process.exit(1);
  }

  // ── Print startup banner ─────────────────────────────────────────
  printStartingBanner();

  // ── Build concurrently args ──────────────────────────────────────
  const names  = SERVICES.map((s) => s.label).join(',');
  const colors = SERVICES.map((s) => s.color).join(',');
  const cmds   = SERVICES.map((s) => s.cmd);

  const args = [
    '--names',          names,
    '--prefix-colors',  colors,
    '--prefix',         ' [{time}] [{name}]',
    '--timestamp-format', 'HH:mm:ss',
    // Kill all services when ANY exits (crash or otherwise).
    // This prevents orphaned processes on CTRL+C.
    '--kill-others',
    // Exit code mirrors the first non-zero exit seen (0 if all clean)
    '--success', 'all',
    '--',
    ...cmds,
  ];

  // ── Spawn concurrently ───────────────────────────────────────────
  const child = spawn(BIN, args, {
    stdio: 'inherit',  // share terminal I/O — colours + interactivity preserved
    cwd:   ROOT,
    env:   { ...process.env, FORCE_COLOR: '1' },  // force chalk/colour output
  });

  // ── Forward OS signals so CTRL+C cleanly stops all child procs ───
  // With stdio:'inherit' the terminal sends SIGINT to the whole
  // process group — but we also handle it explicitly as a safety net.
  const forward = (sig) => () => child.kill(sig);
  process.on('SIGINT',  forward('SIGINT'));
  process.on('SIGTERM', forward('SIGTERM'));

  // ── Exit handling ────────────────────────────────────────────────
  child.on('exit', (code, signal) => {
    const line = '━'.repeat(52);
    console.log(`\n${D}  ${line}${R}`);

    if (signal === 'SIGINT' || signal === 'SIGTERM' || code === 0) {
      console.log(`  ${D}All services stopped.${R}`);
    } else {
      console.error(`\n${RED}${B}  ✗ A service crashed (exit code ${code}).${R}`);
      console.error(`  ${D}Scroll up to find the ${RED}[SERVICE]${R}${D} label where the error occurred.${R}`);
    }

    console.log(`${D}  ${line}${R}\n`);
    process.exit(code ?? 0);
  });

  child.on('error', (err) => {
    printError(`Failed to start dev runner: ${err.message}`);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error(`\n${RED}  ✗ Startup error: ${err.message}${R}\n`);
  process.exit(1);
});
