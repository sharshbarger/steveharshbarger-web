import { spawn } from 'node:child_process';
import { readdir, writeFile, mkdir } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';

const SAMPLES = 800;
const SR = 8000;
const AUDIO_DIR = 'audio';
const OUT_DIR = 'peaks';

function decodePCM(file) {
  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', [
      '-i', file,
      '-f', 's16le',
      '-ac', '1',
      '-ar', String(SR),
      '-'
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks = [];
    let err = '';
    ff.stdout.on('data', c => chunks.push(c));
    ff.stderr.on('data', c => err += c);
    ff.on('error', reject);
    ff.on('close', code => code === 0
      ? resolve(Buffer.concat(chunks))
      : reject(new Error(`ffmpeg exited ${code}: ${err}`)));
  });
}

function bucketsFromPCM(buf) {
  const N = (buf.length / 2) | 0;
  const bucketSize = Math.max(1, Math.floor(N / SAMPLES));
  const out = new Array(SAMPLES).fill(0);
  for (let i = 0; i < SAMPLES; i++) {
    let max = 0;
    const start = i * bucketSize;
    const end = Math.min(start + bucketSize, N);
    for (let j = start; j < end; j++) {
      const s = Math.abs(buf.readInt16LE(j * 2));
      if (s > max) max = s;
    }
    out[i] = max;
  }
  const peak = Math.max(...out, 1);
  return out.map(v => Math.round((v / peak) * 255));
}

const SUPPORTED_EXTS = new Set(['.m4a', '.mp3', '.aac', '.wav', '.flac', '.ogg', '.opus']);

await mkdir(OUT_DIR, { recursive: true });

let count = 0;
for (const f of await readdir(AUDIO_DIR)) {
  if (!SUPPORTED_EXTS.has(extname(f).toLowerCase())) continue;
  const stem = basename(f, extname(f));
  process.stdout.write(`  ${stem} ... `);
  try {
    const buf = await decodePCM(join(AUDIO_DIR, f));
    const data = bucketsFromPCM(buf);
    const duration = +(buf.length / 2 / SR).toFixed(2);
    await writeFile(
      join(OUT_DIR, `${stem}.json`),
      JSON.stringify({ version: 1, samples: SAMPLES, duration, bits: 8, data })
    );
    console.log(`ok (${duration}s)`);
    count++;
  } catch (e) {
    console.log(`FAILED: ${e.message}`);
  }
}

console.log(`\n${count} peak file${count === 1 ? '' : 's'} written to ${OUT_DIR}/`);
