import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import dotenv from 'dotenv';

// Load env files safely
try { dotenv.config({ path: path.resolve('.env.local') }); } catch {}
try { dotenv.config({ path: path.resolve('.env') }); } catch {}
try { dotenv.config(); } catch {}

const PROJECT_ROOT = process.cwd();

const ENV_ADDRESS_KEYS = [
  'NEXT_PUBLIC_CORE_PROXY',
  'NEXT_PUBLIC_GAME_PROXY',
  'NEXT_PUBLIC_READER_ADDRESS',
  'NEXT_PUBLIC_NFT_ADDRESS',
  'NEXT_PUBLIC_OCTA_ADDRESS',
  'NEXT_PUBLIC_CRAA_ADDRESS',
  'NEXT_PUBLIC_LP_MANAGER',
  'NEXT_PUBLIC_LP_HELPER',
  'NEXT_PUBLIC_CORE_IMPL',
  'NEXT_PUBLIC_ROUTER',
  'NEXT_PUBLIC_SPONSOR_TREASURY',
  'NEXT_PUBLIC_PAIR_TOKEN',
];

const isHexAddress = (v?: string): v is `0x${string}` =>
  typeof v === 'string' && /^0x[0-9a-fA-F]{40}$/.test(v);

const envAddresses: Record<string, string> = {};
for (const key of ENV_ADDRESS_KEYS) {
  const val = process.env[key];
  if (isHexAddress(val)) {
    envAddresses[key] = val;
  }
}

const allowedAddressSet = new Set(Object.values(envAddresses));

const includePatterns = [
  'app/**/*.{ts,tsx,js,jsx,mjs,md,sol,json}',
  'components/**/*.{ts,tsx,js,jsx,md,json}',
  'config/**/*.{ts,tsx,js,json}',
  'hooks/**/*.{ts,tsx,js}',
  'lib/**/*.{ts,tsx,js,json,mjs}',
  'scripts/**/*.{ts,tsx,js}',
  'контрамонад2в1/**/*.{ts,tsx,js,md,json,sol}',
];

const ignorePatterns = [
  '**/node_modules/**',
  '**/.next/**',
  '**/.history/**',
  '**/.git/**',
  '**/.artifacts/**',
  '**/dist/**',
  '**/build/**',
];

const ADDRESS_REGEX = /\b0x[a-fA-F0-9]{40}\b/g;
const APECHAIN_REGEX = /apechain/gi;

type AddressHit = {
  file: string;
  line: number;
  address: string;
};

type TextHit = {
  file: string;
  line: number;
  text: string;
};

async function scanFiles() {
  const files = new Set<string>();
  for (const pattern of includePatterns) {
    const matches = await glob(pattern, { cwd: PROJECT_ROOT, ignore: ignorePatterns, nodir: true });
    for (const m of matches) files.add(path.resolve(PROJECT_ROOT, m));
  }

  const addressHits: AddressHit[] = [];
  const apechainHits: TextHit[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split(/\r?\n/);

      // Addresses
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const addrMatches = line.match(ADDRESS_REGEX) || [];
        for (const addr of addrMatches) {
          addressHits.push({ file, line: i + 1, address: addr });
        }
        // ApeChain mentions
        if (APECHAIN_REGEX.test(line)) {
          apechainHits.push({ file, line: i + 1, text: line.trim().slice(0, 300) });
        }
      }
    } catch (e) {
      // ignore read errors
    }
  }

  // Unique addresses
  const uniqueFoundAddrs = Array.from(new Set(addressHits.map(h => h.address)));
  const suspiciousAddrs = uniqueFoundAddrs.filter(a => !allowedAddressSet.has(a));

  // Group hits by address
  const hitsByAddress: Record<string, AddressHit[]> = {};
  for (const hit of addressHits) {
    if (!hitsByAddress[hit.address]) hitsByAddress[hit.address] = [];
    hitsByAddress[hit.address].push(hit);
  }

  // Prepare report
  const report = {
    summary: {
      totalFilesScanned: files.size,
      totalAddressOccurrences: addressHits.length,
      uniqueAddressesFound: uniqueFoundAddrs.length,
      envAddressesCount: Object.keys(envAddresses).length,
      suspiciousAddressesCount: suspiciousAddrs.length,
      apechainMentionsCount: apechainHits.length,
    },
    envAddresses,
    suspiciousAddresses: suspiciousAddrs.map(addr => ({
      address: addr,
      occurrences: (hitsByAddress[addr] || []).map(h => ({ file: path.relative(PROJECT_ROOT, h.file), line: h.line })),
    })),
    apechainMentions: apechainHits.map(h => ({ file: path.relative(PROJECT_ROOT, h.file), line: h.line, text: h.text })),
  };

  // Ensure artifacts dir
  const artifactsDir = path.resolve(PROJECT_ROOT, '.artifacts', 'reports');
  fs.mkdirSync(artifactsDir, { recursive: true });

  // Write JSON report
  const jsonPath = path.join(artifactsDir, 'scan-addresses.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  // Write text report
  const textLines: string[] = [];
  textLines.push('=== ENV ADDRESSES ===');
  for (const [k, v] of Object.entries(envAddresses)) {
    textLines.push(`${k} = ${v}`);
  }
  textLines.push('');
  textLines.push('=== SUSPICIOUS ADDRESSES (NOT IN ENV) ===');
  for (const s of report.suspiciousAddresses) {
    textLines.push(`- ${s.address}`);
    for (const occ of s.occurrences.slice(0, 50)) {
      textLines.push(`   ${occ.file}:${occ.line}`);
    }
  }
  textLines.push('');
  textLines.push('=== APECHAIN MENTIONS ===');
  for (const h of report.apechainMentions.slice(0, 200)) {
    textLines.push(`- ${h.file}:${h.line} :: ${h.text}`);
  }
  const txtPath = path.join(artifactsDir, 'scan-addresses.txt');
  fs.writeFileSync(txtPath, textLines.join('\n'));

  console.log('Scan completed. Report files:');
  console.log(' - ' + path.relative(PROJECT_ROOT, jsonPath));
  console.log(' - ' + path.relative(PROJECT_ROOT, txtPath));
  console.log('Summary:', report.summary);

  // Exit with code 0
}

scanFiles().catch(err => {
  console.error('Scan failed:', err);
  process.exitCode = 1;
});