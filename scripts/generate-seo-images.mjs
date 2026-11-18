// Generates the favicon set from the brand logo. Share images are rendered by the
// app/**/opengraph-image.tsx routes (@ogimagecn blocks in components/og).
// Run after changing the logo:  node scripts/generate-seo-images.mjs
//
// Outputs
//   app/icon.svg               browser tab icon (vector, all modern browsers)
//   app/favicon.ico            16/32/48 px fallback for old browsers and Google's favicon fetcher
//   app/apple-icon.png         180 px, iOS home screen
//   public/icon-192.png        PWA manifest icons
//   public/icon-512.png
import { createRequire } from "node:module";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// sharp ships with Next.js; resolve it from there so it needn't be a direct dependency.
const nextPkg = createRequire(import.meta.url).resolve("next/package.json");
const sharp = createRequire(nextPkg)("sharp");

const logoPath = path.join(root, "public/ezhupira-logo-dark-2.svg");
const logo = await readFile(logoPath);

const png = (size) => sharp(logo, { density: 72 * (size / 112) * 2 }).resize(size, size).png().toBuffer();

// --- Favicons -------------------------------------------------------------
await copyFile(logoPath, path.join(root, "app/icon.svg"));
await writeFile(path.join(root, "app/apple-icon.png"), await png(180));
await writeFile(path.join(root, "public/icon-192.png"), await png(192));
await writeFile(path.join(root, "public/icon-512.png"), await png(512));

// favicon.ico: an ICO container holding PNG frames (supported everywhere since Vista).
const icoSizes = [16, 32, 48];
const frames = await Promise.all(icoSizes.map(png));
const header = Buffer.alloc(6 + 16 * frames.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(frames.length, 4);
let offset = header.length;
frames.forEach((buf, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(icoSizes[i], e);
  header.writeUInt8(icoSizes[i], e + 1);
  header.writeUInt16LE(1, e + 4); // colour planes
  header.writeUInt16LE(32, e + 6); // bits per pixel
  header.writeUInt32LE(buf.length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += buf.length;
});
await writeFile(path.join(root, "app/favicon.ico"), Buffer.concat([header, ...frames]));

console.log("Icons written.");
