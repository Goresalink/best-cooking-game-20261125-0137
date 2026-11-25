// Warung Kilat — the entry program (Node 22, standard library only).
// It hands the game in: it copies this repository's game/ and
// screenshots/ into the output directory and writes dossier.json there
// with the vendored make.fun library, exactly the dossier the sealed
// scorer rebuilds and compares byte for byte.
//
// The grader runs it in a fresh container with /output writable:
//   node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The scorer's own caps, from the kit's RULES.txt: text_max_bytes is
// the only one that shapes the dossier's bytes; the rest refuse an
// entry the scorer would refuse, so the program fails here first.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function handIn(repoDir, outDir) {
  const gameDir = join(repoDir, 'game');
  const shotsDir = join(repoDir, 'screenshots');
  if (!existsSync(gameDir)) throw new Error(`handIn: no game/ beside main.ts (${gameDir})`);
  if (!existsSync(join(gameDir, 'index.html'))) throw new Error('handIn: game/index.html is missing');
  const shots = existsSync(shotsDir)
    ? readdirSync(shotsDir).filter((name) => !name.startsWith('.'))
    : [];
  if (shots.length < 3 || shots.length > 4) {
    throw new Error(`handIn: screenshots/ must hold 3 or 4 images, found ${shots.length}`);
  }

  mkdirSync(outDir, { recursive: true });
  cpSync(gameDir, join(outDir, 'game'), { recursive: true });
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
  const dossier = buildDossier(outDir, DOSSIER_CAPS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  return { shots, dossierBytes: dossier.length };
}

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const result = handIn(repoDir, outDir);
console.log(
  `Warung Kilat handed in: ${result.shots.length} screenshots, dossier.json ${result.dossierBytes} bytes -> ${outDir}`,
);
