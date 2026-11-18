"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Download, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";

type GardenGlyph = {
  id: number;
  text: string;
  word: number;
  seed: number;
  bornAt: number;
  cutAt?: number;
  deadAt?: number;
  x: number;
  y: number;
  width: number;
  ascent: number;
  descent: number;
  size: number;
  line: number;
};

type Stem = {
  angle: number;
  length: number;
  bend: number;
  downward: boolean;
  flower: number;
  flowerScale: number;
  stemLayer: 0 | 1;
  flowerLayer: 0 | 1;
  anchorX: number;
  anchorDepth: number;
  side: number;
  phase: number;
  waves: number;
  turns: number;
  ph1: number;
  ph2: number;
  leafScale: number;
  bloomDelay: number;
};

const FLOWER_MODES = [
  { id: "rose", label: "Rose" },
  { id: "gloriosa", label: "செங்காந்தள் (Flame Lily)" },
] as const;

type FlowerMode = (typeof FLOWER_MODES)[number]["id"];
const EXPORT_FORMATS = ["png", "jpg", "gif"] as const;
type ExportFormat = (typeof EXPORT_FORMATS)[number];
const EXPORT_LABELS: Record<ExportFormat, string> = {
  png: "PNG",
  jpg: "JPG",
  gif: "GIF",
};
type CaretState = {
  x: number;
  y: number;
  size: number;
};

const STORAGE_KEYS = {
  palette: "ezhupira:type-garden:palette",
  flower: "ezhupira:type-garden:flower",
  export: "ezhupira:type-garden:export",
} as const;

const MALLIKAI_KEY_SECTIONS = [
  {
    label: "CAPS",
    rows: [
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L", ":"],
      ["Z", "X", "C", "V", "B", "N", "M", "<", ">", "?"],
    ],
  },
  {
    label: "lower",
    rows: [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
      ["z", "x", "c", "v", "b", "n", "m"],
    ],
  },
  {
    label: "marks",
    rows: [
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
      ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"],
      ["`", "-", "=", "[", "]", "\\", "'", "\"", ",", "."],
      ["/", "_", "+", "{", "}", "|"],
    ],
  },
] as const;

type MallikaiKeySectionLabel = (typeof MALLIKAI_KEY_SECTIONS)[number]["label"];

const MALLIKAI_JOINING_KEYS = new Set(["p", "P", ">", ";"]);

const GARDEN_PALETTES = [
  {
    id: "ezhupira",
    name: "Ezhupira",
    bg: "#000000",
    text: "#FFFFFF",
    stem: "#456CFF",
    leaf: "#456CFF",
    vein: "#FFFFFF",
    line: "#FFFFFF",
    flowers: ["#FF2A18", "#D51C39", "#FF7468", "#FFF1E0"],
  },
  {
    id: "mullai",
    name: "Mullai",
    bg: "#F2FFE9",
    text: "#064E2A",
    stem: "#126A3A",
    leaf: "#1F8A4C",
    vein: "#F2FFE9",
    line: "#0B6B3A",
    flowers: ["#FF6B6B", "#D51C39", "#F4B942", "#FFFFFF"],
  },
  {
    id: "neelam",
    name: "Neelam",
    bg: "#EAF1FF",
    text: "#102A7A",
    stem: "#1F55D8",
    leaf: "#2C6AF2",
    vein: "#EAF1FF",
    line: "#163E9E",
    flowers: ["#2C6AF2", "#D51C39", "#7A3CFF", "#FFFFFF"],
  },
  {
    id: "manjal",
    name: "Manjal",
    bg: "#FFF4CF",
    text: "#7C3600",
    stem: "#8A5A00",
    leaf: "#A66F00",
    vein: "#FFF4CF",
    line: "#8A3F00",
    flowers: ["#FF9F1C", "#D51C39", "#7F4E00", "#FFFFFF"],
  },
] as const;

type GardenPalette = (typeof GARDEN_PALETTES)[number];

const FLOWER_COLORS = GARDEN_PALETTES[0].flowers;

function seeded(seed: number) {
  let value = seed || 1;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function easeOutCubic(value: number) {
  const t = Math.max(0, Math.min(1, value));
  return 1 - Math.pow(1 - t, 3);
}

function spring(value: number, tension = 8, wobble = 14) {
  if (value <= 0) return 0;
  return 1 - Math.exp(-value * tension) * Math.cos(value * wobble);
}

function segmentTamil(input: string) {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("ta", { granularity: "grapheme" });
    return Array.from(segmenter.segment(input), (part) => part.segment);
  }

  return Array.from(input);
}

function stopMotionTime(now: number) {
  return Math.floor(now / 130) * 130;
}

function makeStems(glyph: GardenGlyph): Stem[] {
  const random = seeded(glyph.seed);
  const count = 2 + Math.floor(random() * 3);

  return Array.from({ length: count }, (_, index) => {
    const downward = index > 0 && random() < 0.34;

    return {
      angle: downward
        ? Math.PI / 2 + (random() - 0.5) * 0.85
        : -Math.PI / 2 + (random() - 0.5) * 1.1,
      length: glyph.size * (downward ? 0.28 + random() * 0.34 : 0.34 + random() * 0.46),
      bend: (random() - 0.5) * glyph.size * (downward ? 0.22 : 0.16),
      downward,
      flower: Math.floor(random() * FLOWER_COLORS.length),
      flowerScale: 0.065 + Math.pow(random(), 1.55) * 0.13,
      stemLayer: random() < 0.72 ? 0 : 1,
      flowerLayer: random() < 0.38 ? 1 : 0,
      anchorX: (random() - 0.5) * 0.68,
      anchorDepth: downward ? 0.02 + random() * 0.18 : 0.06 + random() * 0.24,
      side: random() > 0.5 ? 1 : -1,
      phase: random() * Math.PI * 2,
      waves: 1 + random() * 1.6,
      turns: 1.8 + random() * 0.9,
      ph1: random() * Math.PI * 2,
      ph2: random() * Math.PI * 2,
      leafScale: 0.72 + random() * 0.72,
      bloomDelay: 180 + index * 70 + random() * 260,
    };
  });
}

function midpoint(a: [number, number], b: [number, number]): [number, number] {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

function drawSmoothPath(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  closed: boolean
) {
  if (points.length < 2) return;

  ctx.beginPath();

  if (closed) {
    const start = midpoint(points[points.length - 1], points[0]);
    ctx.moveTo(start[0], start[1]);

    for (let index = 0; index < points.length; index++) {
      const next = midpoint(points[index], points[(index + 1) % points.length]);
      ctx.quadraticCurveTo(points[index][0], points[index][1], next[0], next[1]);
    }

    ctx.closePath();
    return;
  }

  ctx.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length - 1; index++) {
    const next = midpoint(points[index], points[index + 1]);
    ctx.quadraticCurveTo(points[index][0], points[index][1], next[0], next[1]);
  }
  ctx.lineTo(points[points.length - 1][0], points[points.length - 1][1]);
}

function strokeRange(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  start: number,
  end: number,
  color: string,
  width: number
) {
  if (points.length < 2 || end <= start) return;

  const max = points.length - 1;
  const from = Math.max(0, Math.min(max, start * max));
  const to = Math.max(0, Math.min(max, end * max));
  const lerp = (value: number): [number, number] => {
    const index = Math.min(max - 1, Math.floor(value));
    const t = value - index;
    return [
      points[index][0] + (points[index + 1][0] - points[index][0]) * t,
      points[index][1] + (points[index + 1][1] - points[index][1]) * t,
    ];
  };

  const slice: [number, number][] = [lerp(from)];
  for (let index = Math.floor(from) + 1; index < to; index++) {
    slice.push(points[index]);
  }
  slice.push(lerp(to));

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  drawSmoothPath(ctx, slice, false);
  ctx.stroke();
  ctx.restore();
}

function makeVinePath(
  startX: number,
  startY: number,
  angle: number,
  length: number,
  amp: number,
  waves: number,
  phase: number,
  bend: number,
  points = 40
) {
  const path: [number, number][] = [[startX, startY]];
  const step = length / points;
  let x = startX;
  let y = startY;

  for (let index = 1; index <= points; index++) {
    const u = index / points;
    const a =
      angle +
      bend * u +
      amp * Math.sin(u * Math.PI * waves + phase) * Math.min(1, u * 3);
    x += Math.cos(a) * step;
    y += Math.sin(a) * step;
    path.push([x, y]);
  }

  return path;
}

function pointAtPath(points: [number, number][], progress: number) {
  const max = points.length - 1;
  const index = Math.min(max - 1, Math.max(1, Math.round(progress * max)));

  return {
    point: points[index],
    angle: Math.atan2(
      points[index + 1][1] - points[index - 1][1],
      points[index + 1][0] - points[index - 1][0]
    ),
  };
}

function drawLeaf(
  ctx: CanvasRenderingContext2D,
  palette: GardenPalette,
  x: number,
  y: number,
  size: number,
  angle: number,
  alpha: number
) {
  if (size < 0.5 || alpha <= 0) return;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const px = -sin;
  const py = cos;
  const axis = (u: number): [number, number] => {
    const b = Math.sin(Math.PI * u) * size * 0.15;
    return [x + cos * u * size + px * b, y + sin * u * size + py * b];
  };
  const halfWidth = (u: number) => size * 0.18 * Math.sin(Math.PI * Math.pow(u, 0.8));
  const left: [number, number][] = [];
  const right: [number, number][] = [];

  for (let index = 0; index <= 12; index++) {
    const u = index / 12;
    const center = axis(u);
    const width = halfWidth(u);
    left.push([center[0] + px * width, center[1] + py * width]);
    right.push([center[0] - px * width, center[1] - py * width]);
  }

  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = palette.leaf;
  drawSmoothPath(ctx, [axis(0), ...left.slice(1, 12), axis(1), ...right.slice(1, 12).reverse(), axis(0)], true);
  ctx.fill();

  if (size > 6) {
    const vein = Array.from({ length: 9 }, (_, index) => axis(0.08 + 0.72 * (index / 8)));
    strokeRange(ctx, vein, 0, 1, palette.vein, Math.max(0.8, size * 0.03));
  }

  ctx.restore();
}

function drawTypeGardenRose(
  ctx: CanvasRenderingContext2D,
  palette: GardenPalette,
  cx: number,
  cy: number,
  radius: number,
  rotation: number,
  stem: Stem,
  age: number,
  bloom: number
) {
  if (radius <= 0 || bloom <= 0) return;

  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const transform = (x: number, y: number): [number, number] => [
    cx + x * cos - y * sin,
    cy + x * sin + y * cos,
  ];

  const petals = [
    [0, -0.36, 0.56, 0.54, 0, 0],
    [-0.5, -0.06, 0.6, 0.6, -0.35, 0],
    [0.52, -0.06, 0.6, 0.6, 0.35, 0],
    [-0.42, 0.3, 0.62, 0.48, 0.2, 1],
    [0.47, 0.3, 0.62, 0.48, -0.2, 1],
    [0.05, 0.42, 0.56, 0.38, 0, 0],
  ];
  const strokeWidth = Math.max(0.8, radius * 0.045);

  ctx.save();
  ctx.globalAlpha *= Math.min(1, bloom);

  petals.forEach((petal, index) => {
    const petalOpen = spring((age - index * 85) / 1000, 8, 14);
    if (petalOpen <= 0.001) return;

    const side = petal[0] < 0 ? 0.5 : -0.5;
    const angle = petal[4] + (1 - Math.min(1, petalOpen)) * side;
    const petalCos = Math.cos(angle);
    const petalSin = Math.sin(angle);
    const scale = Math.min(1.08, petalOpen) * bloom;
    const points: [number, number][] = [];

    for (let k = 0; k < 26; k++) {
      const theta = (k / 26) * Math.PI * 2;
      const rough =
        1 +
        0.08 * Math.sin(3 * theta + stem.ph1 + index) +
        0.04 * Math.sin(5 * theta + stem.ph2);
      const localX = Math.cos(theta) * petal[2] * rough;
      const localY = Math.sin(theta) * petal[3] * rough;
      const px = petal[0] + localX * petalCos - localY * petalSin;
      const py = petal[1] + localX * petalSin + localY * petalCos;
      points.push(
        transform(px * radius * scale, (0.5 + (py - 0.5) * scale) * radius)
      );
    }

    ctx.fillStyle = palette.flowers[stem.flower % palette.flowers.length];
    drawSmoothPath(ctx, points, true);
    ctx.fill();

    if (petal[5] && radius >= 12 && scale > 0.4) {
      const arc: [number, number][] = [];
      for (let k = 0; k <= 14; k++) {
        const theta = Math.PI * (1.18 + 0.64 * (k / 14));
        const rough =
          1 +
          0.08 * Math.sin(3 * theta + stem.ph1 + index) +
          0.04 * Math.sin(5 * theta + stem.ph2);
        const localX = Math.cos(theta) * petal[2] * rough;
        const localY = Math.sin(theta) * petal[3] * rough;
        const px = petal[0] + localX * petalCos - localY * petalSin;
        const py = petal[1] + localX * petalSin + localY * petalCos;
        arc.push(transform(px * radius * scale, (0.5 + (py - 0.5) * scale) * radius));
      }
      strokeRange(ctx, arc, 0, Math.min(1, (scale - 0.4) / 0.5), palette.line, strokeWidth * 0.8);
    }
  });

  const spiralGrow = easeOutCubic((age - petals.length * 85 - 80) / 520) * bloom;
  if (spiralGrow > 0 && radius > 3) {
    const spiral: [number, number][] = [];
    const turns = radius < 20 ? Math.min(stem.turns, 1.3) : radius < 32 ? stem.turns * 0.8 : stem.turns;

    for (let index = 0; index <= 70; index++) {
      const u = index / 70;
      const theta = stem.ph1 + u * turns * Math.PI * 2;
      const rr = radius * (0.08 + 0.57 * u);
      spiral.push(transform(Math.cos(theta) * rr * 1.05, Math.sin(theta) * rr * 0.72 - radius * 0.12));
    }
    strokeRange(ctx, spiral, 0, spiralGrow, palette.line, strokeWidth);

    if (radius >= 14) {
      const scallop: [number, number][] = [];
      for (let index = 0; index <= 36; index++) {
        const u = index / 36;
        scallop.push(
          transform(
            (-0.72 + 1.5 * u) * radius,
            0.36 * radius + 0.16 * radius * Math.abs(Math.sin(u * Math.PI * 3))
          )
        );
      }
      strokeRange(ctx, scallop, 0, spiralGrow, palette.line, strokeWidth);
    }
  }

  ctx.restore();
}

function drawGloriosaLily(
  ctx: CanvasRenderingContext2D,
  palette: GardenPalette,
  cx: number,
  cy: number,
  radius: number,
  rotation: number,
  stem: Stem,
  age: number,
  bloom: number
) {
  if (radius <= 0 || bloom <= 0) return;

  const open = Math.min(1, spring(age / 900, 7, 12)) * bloom;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const transform = (x: number, y: number): [number, number] => [
    cx + x * cos - y * sin,
    cy + x * sin + y * cos,
  ];
  const petals = [
    { angle: -2.2, length: 1.82, width: 0.3, curl: -0.62 },
    { angle: -1.58, length: 2.05, width: 0.32, curl: 0.1 },
    { angle: -0.92, length: 1.82, width: 0.3, curl: 0.62 },
  ];
  const petalRed = "#E60E0E";
  const petalDeep = "#B90000";
  const petalOrange = "#FF7A1A";
  const petalGold = "#FFC928";
  const highlight = "rgba(255,255,255,0.28)";
  const green = "#67B414";
  const lightGreen = "#94D82D";
  const stamen = "#FFE39A";
  const strokeWidth = Math.max(0.9, radius * 0.05);

  ctx.save();
  ctx.globalAlpha *= open;

  petals.forEach((petal, petalIndex) => {
    const petalOpen = Math.min(1.06, spring((age - petalIndex * 70) / 820, 7, 12));
    if (petalOpen <= 0.001) return;

    const dir = -Math.PI / 2 + (petal.angle + Math.PI / 2) * petalOpen;
    const nx = -Math.sin(dir);
    const ny = Math.cos(dir);
    const length = radius * petal.length;
    const left: [number, number][] = [];
    const right: [number, number][] = [];
    const vein: [number, number][] = [];
    const midLeft: [number, number][] = [];
    const midRight: [number, number][] = [];

    for (let index = 0; index <= 20; index++) {
      const u = index / 20;
      const liftedTip = -radius * 0.5 * Math.pow(u, 2.2);
      const curl = Math.sin(u * Math.PI) * radius * petal.curl * 0.34;
      const tipHook = Math.max(0, u - 0.76) * radius * petal.curl * 1.9;
      const wave = Math.sin(u * Math.PI * 5 + stem.ph1 + petalIndex) * radius * 0.035;
      const centerX = Math.cos(dir) * length * u + nx * (curl + tipHook + wave);
      const centerY = Math.sin(dir) * length * u + ny * (curl + tipHook + wave) + liftedTip;
      const body = Math.sin(Math.PI * Math.pow(u, 0.72));
      const width = radius * (0.045 + petal.width * body) * (1 - 0.32 * u) * petalOpen;
      const point = transform(centerX, centerY);

      vein.push(point);
      left.push(transform(centerX + nx * width, centerY + ny * width));
      right.push(transform(centerX - nx * width, centerY - ny * width));
      midLeft.push(transform(centerX + nx * width * 0.48, centerY + ny * width * 0.48));
      midRight.push(transform(centerX - nx * width * 0.48, centerY - ny * width * 0.48));
    }

    const petalPath = [...left, ...right.reverse()];
    const innerPath = [...midLeft.slice(1), ...midRight.slice(1).reverse()];

    ctx.fillStyle = petalGold;
    drawSmoothPath(ctx, petalPath, true);
    ctx.fill();

    ctx.fillStyle = petalOrange;
    drawSmoothPath(ctx, [...left.slice(1, -1), ...right.slice(1, -1).reverse()], true);
    ctx.fill();

    ctx.fillStyle = petalRed;
    drawSmoothPath(ctx, innerPath, true);
    ctx.fill();

    strokeRange(ctx, vein, 0.08, 0.92, petalGold, strokeWidth * 0.85);
    strokeRange(ctx, midLeft, 0.18, 0.82, highlight, strokeWidth * 0.55);
    strokeRange(ctx, midRight, 0.22, 0.78, petalDeep, strokeWidth * 0.45);
  });

  const calyx: [number, number][] = [];
  for (let index = 0; index <= 18; index++) {
    const theta = (index / 18) * Math.PI * 2;
    const rx = Math.cos(theta) * radius * (0.34 + 0.06 * Math.sin(theta * 3));
    const ry = Math.sin(theta) * radius * 0.24 + radius * 0.1;
    calyx.push(transform(rx, ry));
  }
  ctx.fillStyle = green;
  drawSmoothPath(ctx, calyx, true);
  ctx.fill();
  strokeRange(ctx, [transform(-radius * 0.18, radius * 0.05), transform(radius * 0.18, radius * 0.12)], 0, 1, lightGreen, strokeWidth);

  const base = transform(0, 0);
  ctx.fillStyle = green;
  ctx.beginPath();
  ctx.arc(base[0], base[1], Math.max(1.6, radius * 0.12), 0, Math.PI * 2);
  ctx.fill();

  const center = transform(0, radius * 0.02);
  ctx.fillStyle = lightGreen;
  ctx.beginPath();
  ctx.arc(center[0], center[1], Math.max(1.8, radius * 0.16), 0, Math.PI * 2);
  ctx.fill();

  const stamenAngles = [-2.82, -2.55, -2.22, -0.92, -0.62, -0.34];
  for (const angle of stamenAngles) {
    const path: [number, number][] = [];
    for (let index = 0; index <= 16; index++) {
      const u = index / 16;
      const bend = Math.sin(u * Math.PI) * radius * 0.28 * (angle < -1.5 ? -1 : 1);
      path.push(
        transform(
          Math.cos(angle) * radius * 1.0 * u + bend,
          radius * 0.16 + Math.sin(angle) * radius * 0.82 * u + radius * 0.42 * u
        )
      );
    }
    strokeRange(ctx, path, 0, 1, stamen, strokeWidth * 0.58);
    const outer = path[path.length - 1];
    ctx.fillStyle = stamen;
    ctx.beginPath();
    ctx.ellipse(
      outer[0],
      outer[1],
      Math.max(1.1, radius * 0.07),
      Math.max(0.8, radius * 0.045),
      angle,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.restore();
}

type ExportCrop = {
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
};

function gifPalette() {
  const palette = new Uint8Array(256 * 3);

  for (let index = 0; index < 256; index++) {
    const red = (index >> 5) & 7;
    const green = (index >> 2) & 7;
    const blue = index & 3;
    palette[index * 3] = Math.round((red / 7) * 255);
    palette[index * 3 + 1] = Math.round((green / 7) * 255);
    palette[index * 3 + 2] = Math.round((blue / 3) * 255);
  }

  palette[255 * 3] = 0;
  palette[255 * 3 + 1] = 0;
  palette[255 * 3 + 2] = 0;

  return palette;
}

function imageDataToGifIndices(image: ImageData, transparentIndex?: number) {
  const indices = new Uint8Array(image.width * image.height);

  for (let inputIndex = 0, outputIndex = 0; inputIndex < image.data.length; inputIndex += 4) {
    if (transparentIndex !== undefined && image.data[inputIndex + 3] < 18) {
      indices[outputIndex++] = transparentIndex;
      continue;
    }

    const red = image.data[inputIndex] >> 5;
    const green = image.data[inputIndex + 1] >> 5;
    const blue = image.data[inputIndex + 2] >> 6;
    indices[outputIndex++] = (red << 5) | (green << 2) | blue;
  }

  return indices;
}

function lzwEncodeGif(indices: Uint8Array) {
  const minCodeSize = 8;
  const clearCode = 1 << minCodeSize;
  const endCode = clearCode + 1;
  const codeSize = minCodeSize + 1;
  const output: number[] = [];
  let buffer = 0;
  let bitCount = 0;

  const writeCode = (code: number) => {
    buffer |= code << bitCount;
    bitCount += codeSize;

    while (bitCount >= 8) {
      output.push(buffer & 255);
      buffer >>= 8;
      bitCount -= 8;
    }
  };

  for (let index = 0; index < indices.length; index += 240) {
    writeCode(clearCode);
    const end = Math.min(indices.length, index + 240);

    for (let pixelIndex = index; pixelIndex < end; pixelIndex++) {
      writeCode(indices[pixelIndex]);
    }
  }

  writeCode(endCode);

  if (bitCount > 0) {
    output.push(buffer & 255);
  }

  return new Uint8Array(output);
}

function gifSubBlocks(data: Uint8Array) {
  const blocks: number[] = [];

  for (let index = 0; index < data.length; index += 255) {
    const block = data.slice(index, index + 255);
    blocks.push(block.length, ...block);
  }

  blocks.push(0);
  return blocks;
}

function encodeGif(
  frames: Uint8Array[],
  width: number,
  height: number,
  delayMs: number,
  transparentIndex?: number
) {
  const bytes: number[] = [];
  const text = (value: string) => value.split("").map((char) => char.charCodeAt(0));
  const word = (value: number) => [value & 255, (value >> 8) & 255];
  const append = (values: ArrayLike<number>) => {
    for (let index = 0; index < values.length; index++) {
      bytes.push(values[index]);
    }
  };
  const delay = Math.max(2, Math.round(delayMs / 10));

  append(text("GIF89a"));
  append([...word(width), ...word(height), 0xf7, 0, 0]);
  append(gifPalette());
  append([0x21, 0xff, 0x0b, ...text("NETSCAPE2.0"), 0x03, 0x01, 0, 0, 0]);

  for (const frame of frames) {
    append([
      0x21,
      0xf9,
      0x04,
      transparentIndex === undefined ? 0 : 1,
      ...word(delay),
      transparentIndex ?? 0,
      0,
    ]);
    append([0x2c, 0, 0, 0, 0, ...word(width), ...word(height), 0]);
    bytes.push(8);
    append(gifSubBlocks(lzwEncodeGif(frame)));
  }

  bytes.push(0x3b);
  return new Blob([new Uint8Array(bytes)], { type: "image/gif" });
}

export function TamilTypeGarden() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const glyphsRef = useRef<GardenGlyph[]>([]);
  const wordRef = useRef(0);
  const idRef = useRef(1);
  const rafRef = useRef<number>(0);
  const clockRef = useRef(0);
  const forcePaintRef = useRef(true);
  const virtualKeyboardOnlyRef = useRef(false);
  const [, setGlyphCount] = useState(0);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const paletteRef = useRef<GardenPalette>(GARDEN_PALETTES[0]);
  const activePalette = GARDEN_PALETTES[paletteIndex];
  const [flowerMode, setFlowerMode] = useState<FlowerMode>("rose");
  const flowerModeRef = useRef<FlowerMode>("rose");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [isSavingExport, setIsSavingExport] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isVirtualKeyboardOnly, setIsVirtualKeyboardOnly] = useState(false);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [activeMobileKeySection, setActiveMobileKeySection] =
    useState<MallikaiKeySectionLabel>("lower");
  const [caretState, setCaretState] = useState<CaretState>({
    x: 0,
    y: 0,
    size: 96,
  });
  const caretStateRef = useRef(caretState);

  const focusInput = () => {
    if (virtualKeyboardOnlyRef.current) return;
    inputRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");

    const syncKeyboardMode = () => {
      const shouldUseVirtualKeyboard = mediaQuery.matches;
      virtualKeyboardOnlyRef.current = shouldUseVirtualKeyboard;
      setIsVirtualKeyboardOnly(shouldUseVirtualKeyboard);

      if (shouldUseVirtualKeyboard) {
        inputRef.current?.blur();
        setIsGuideOpen(true);
      }
    };

    syncKeyboardMode();
    mediaQuery.addEventListener("change", syncKeyboardMode);

    return () => mediaQuery.removeEventListener("change", syncKeyboardMode);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const savedPalette = window.localStorage.getItem(STORAGE_KEYS.palette);
        const savedPaletteIndex = GARDEN_PALETTES.findIndex(
          (palette) => palette.id === savedPalette
        );
        if (savedPaletteIndex >= 0) {
          paletteRef.current = GARDEN_PALETTES[savedPaletteIndex];
          setPaletteIndex(savedPaletteIndex);
        }

        const savedFlower = window.localStorage.getItem(STORAGE_KEYS.flower);
        if (FLOWER_MODES.some((mode) => mode.id === savedFlower)) {
          flowerModeRef.current = savedFlower as FlowerMode;
          setFlowerMode(savedFlower as FlowerMode);
        }

        const savedExport = window.localStorage.getItem(STORAGE_KEYS.export);
        if (EXPORT_FORMATS.some((format) => format === savedExport)) {
          setExportFormat(savedExport as ExportFormat);
        }
      } catch {
        // Ignore unavailable storage, e.g. private browsing restrictions.
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const syncCount = () => {
    setGlyphCount(glyphsRef.current.filter((glyph) => !glyph.deadAt).length);
  };

  const selectPalette = (index: number) => {
    paletteRef.current = GARDEN_PALETTES[index];
    setPaletteIndex(index);
    window.localStorage.setItem(STORAGE_KEYS.palette, GARDEN_PALETTES[index].id);
    focusInput();
  };

  const selectFlowerMode = (mode: FlowerMode) => {
    flowerModeRef.current = mode;
    setFlowerMode(mode);
    window.localStorage.setItem(STORAGE_KEYS.flower, mode);
    focusInput();
  };

  const selectExportFormat = (format: ExportFormat) => {
    setExportFormat(format);
    window.localStorage.setItem(STORAGE_KEYS.export, format);
    focusInput();
  };

  const clearGarden = () => {
    glyphsRef.current = [];
    wordRef.current = 0;
    idRef.current = 1;
    if (inputRef.current) inputRef.current.value = "";
    forcePaintRef.current = true;
    syncCount();
    focusInput();
  };

  const addGlyph = (text: string, sync = true) => {
    const previousGlyph = [...glyphsRef.current]
      .reverse()
      .find((glyph) => !glyph.deadAt);

    if (MALLIKAI_JOINING_KEYS.has(text) && previousGlyph) {
      previousGlyph.text += text;
      forcePaintRef.current = true;
      if (sync) syncCount();
      return previousGlyph.id;
    }

    const now = clockRef.current;
    const id = idRef.current++;
    glyphsRef.current.push({
      id,
      text,
      word: wordRef.current,
      seed: id * 9187 + text.codePointAt(0)!,
      bornAt: now,
      x: 0,
      y: 0,
      width: 0,
      ascent: 0,
      descent: 0,
      size: 0,
      line: 0,
    });
    forcePaintRef.current = true;
    if (sync) syncCount();
    return id;
  };

  const cutWord = () => {
    const now = clockRef.current;
    for (const glyph of glyphsRef.current) {
      if (glyph.word === wordRef.current && !glyph.cutAt && !glyph.deadAt) {
        glyph.cutAt = now;
      }
    }
    wordRef.current += 1;
    forcePaintRef.current = true;
    syncCount();
  };

  const witherLast = () => {
    for (let index = glyphsRef.current.length - 1; index >= 0; index--) {
      const glyph = glyphsRef.current[index];
      if (!glyph.deadAt && glyph.text.length > 1) {
        glyph.text = glyph.text.slice(0, -1);
        forcePaintRef.current = true;
        break;
      }

      if (!glyph.deadAt) {
        glyphsRef.current.splice(index, 1);
        forcePaintRef.current = true;
        break;
      }
    }
    syncCount();
  };

  const handleInput = () => {
    const input = inputRef.current;
    if (!input) return;

    const value = input.value;
    input.value = "";

    for (const unit of segmentTamil(value)) {
      if (unit === "\n") {
        clearGarden();
      } else if (/\s/.test(unit)) {
        cutWord();
      } else {
        addGlyph(unit);
      }
    }
  };

  const makeBackgroundTransparent = (
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    background: string
  ) => {
    const red = Number.parseInt(background.slice(1, 3), 16);
    const green = Number.parseInt(background.slice(3, 5), 16);
    const blue = Number.parseInt(background.slice(5, 7), 16);
    const image = context.getImageData(0, 0, width, height);
    const tolerance = 14;

    for (let index = 0; index < image.data.length; index += 4) {
      const dr = Math.abs(image.data[index] - red);
      const dg = Math.abs(image.data[index + 1] - green);
      const db = Math.abs(image.data[index + 2] - blue);
      const distance = dr + dg + db;

      if (distance < tolerance) {
        image.data[index + 3] = 0;
      } else if (distance < tolerance * 3) {
        image.data[index + 3] = Math.min(
          image.data[index + 3],
          Math.round(((distance - tolerance) / (tolerance * 2)) * 255)
        );
      }
    }

    context.putImageData(image, 0, 0);
  };

  const getExportCrop = (canvas: HTMLCanvasElement): ExportCrop | null => {
    const liveGlyphs = glyphsRef.current.filter((glyph) => !glyph.deadAt);
    if (!liveGlyphs.length) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const bounds = liveGlyphs.reduce(
      (box, glyph) => {
        const marginX = glyph.size * 1.15;
        const marginTop = glyph.size * 1.65;
        const marginBottom = glyph.size * 1.35;

        return {
          minX: Math.min(box.minX, glyph.x - glyph.width / 2 - marginX),
          minY: Math.min(box.minY, glyph.y - marginTop),
          maxX: Math.max(box.maxX, glyph.x + glyph.width / 2 + marginX),
          maxY: Math.max(box.maxY, glyph.y + marginBottom),
        };
      },
      {
        minX: Number.POSITIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
      }
    );
    const padding = Math.max(28, liveGlyphs[0]?.size * 0.28);
    const sourceX = Math.max(0, Math.floor((bounds.minX - padding) * scaleX));
    const sourceY = Math.max(0, Math.floor((bounds.minY - padding) * scaleY));
    const sourceWidth = Math.min(
      canvas.width - sourceX,
      Math.ceil((bounds.maxX - bounds.minX + padding * 2) * scaleX)
    );
    const sourceHeight = Math.min(
      canvas.height - sourceY,
      Math.ceil((bounds.maxY - bounds.minY + padding * 2) * scaleY)
    );

    return { sourceX, sourceY, sourceWidth, sourceHeight };
  };

  const drawExportFrame = (
    sourceCanvas: HTMLCanvasElement,
    crop: ExportCrop,
    format: ExportFormat,
    targetSize?: number
  ) => {
    const exportScale = format === "png" ? 3 : 2;
    const exportCanvas = document.createElement("canvas");
    const contentWidth =
      format === "gif" && targetSize
        ? Math.round(crop.sourceWidth * Math.min(1, targetSize / Math.max(crop.sourceWidth, crop.sourceHeight)))
        : crop.sourceWidth * exportScale;
    const contentHeight =
      format === "gif" && targetSize
        ? Math.round(crop.sourceHeight * Math.min(1, targetSize / Math.max(crop.sourceWidth, crop.sourceHeight)))
        : crop.sourceHeight * exportScale;

    if (format === "jpg" || format === "gif") {
      const squareSize = targetSize ?? Math.max(contentWidth, contentHeight);
      exportCanvas.width = squareSize;
      exportCanvas.height = squareSize;
    } else {
      exportCanvas.width = contentWidth;
      exportCanvas.height = contentHeight;
    }

    const exportContext = exportCanvas.getContext("2d");
    if (!exportContext) return;
    exportContext.imageSmoothingEnabled = true;
    exportContext.imageSmoothingQuality = "high";

    if (format === "jpg" || format === "gif") {
      exportContext.fillStyle = activePalette.bg;
      exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }

    exportContext.drawImage(
      sourceCanvas,
      crop.sourceX,
      crop.sourceY,
      crop.sourceWidth,
      crop.sourceHeight,
      (exportCanvas.width - contentWidth) / 2,
      (exportCanvas.height - contentHeight) / 2,
      contentWidth,
      contentHeight
    );

    if (format === "png") {
      makeBackgroundTransparent(
        exportContext,
        exportCanvas.width,
        exportCanvas.height,
        activePalette.bg
      );
    }

    return { canvas: exportCanvas, context: exportContext };
  };

  const saveGifExport = async (canvas: HTMLCanvasElement, crop: ExportCrop) => {
    const gifSize = 360;
    const frameCount = 16;
    const frameDelay = 120;
    const frames: Uint8Array[] = [];
    setIsSavingExport(true);

    try {
      for (let frame = 0; frame < frameCount; frame++) {
        const rendered = drawExportFrame(canvas, crop, "gif", gifSize);
        if (!rendered) return;
        const image = rendered.context.getImageData(0, 0, gifSize, gifSize);
        frames.push(imageDataToGifIndices(image));

        if (frame < frameCount - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, frameDelay));
        }
      }

      const link = document.createElement("a");
      link.href = URL.createObjectURL(encodeGif(frames, gifSize, gifSize, frameDelay));
      link.download = "tamil-type-garden.gif";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 4000);
    } finally {
      setIsSavingExport(false);
      focusInput();
    }
  };

  const saveExport = async () => {
    if (isSavingExport) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const crop = getExportCrop(canvas);
    if (!crop) {
      focusInput();
      return;
    }

    if (exportFormat === "gif") {
      await saveGifExport(canvas, crop);
      return;
    }

    const rendered = drawExportFrame(canvas, crop, exportFormat);
    if (!rendered) return;

    const link = document.createElement("a");
    link.href =
      exportFormat === "jpg"
        ? rendered.canvas.toDataURL("image/jpeg", 0.94)
        : rendered.canvas.toDataURL("image/png");
    link.download = `tamil-type-garden.${exportFormat === "jpg" ? "jpg" : "png"}`;
    link.click();
    focusInput();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let fontFamily = "Mallikai";
    const computed = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-mallikai")
      .trim();
    const mallikaiFontFamily = computed ? `Mallikai, ${computed}` : "Mallikai";
    fontFamily = mallikaiFontFamily;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const layoutGlyphs = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const size = Math.max(54, Math.min(132, width / 8.5));
      const lineHeight = size * 1.42;
      const left = Math.max(22, width * 0.07);
      const right = width - left;
      const maxLineWidth = right - left;
      const lines: {
        items: { glyph: GardenGlyph; offset: number; width: number }[];
        width: number;
      }[] = [{ items: [], width: 0 }];
      let previousWord = glyphsRef.current[0]?.word ?? 0;

      ctx.font = `400 ${size}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";

      for (const glyph of glyphsRef.current) {
        let line = lines[lines.length - 1];
        let wordGap = glyph.word !== previousWord ? size * 0.5 : 0;

        if (glyph.word !== previousWord) {
          previousWord = glyph.word;
        }

        const metrics = ctx.measureText(glyph.text);
        const glyphWidth = Math.max(metrics.width, size * 0.38);
        const glyphGap = size * 0.06;

        if (line.width + wordGap + glyphWidth > maxLineWidth && line.items.length > 0) {
          line = { items: [], width: 0 };
          lines.push(line);
          wordGap = 0;
        }

        const offset = line.width + wordGap;
        glyph.ascent = metrics.actualBoundingBoxAscent || size * 0.78;
        glyph.descent = metrics.actualBoundingBoxDescent || size * 0.16;
        line.items.push({ glyph, offset, width: glyphWidth });
        line.width = offset + glyphWidth + glyphGap;
      }

      const firstBaseline = height * 0.54 - ((lines.length - 1) * lineHeight) / 2;

      lines.forEach((line, lineIndex) => {
        const visibleWidth = Math.max(
          0,
          line.width - (line.items.length > 0 ? size * 0.06 : 0)
        );
        const startX = width / 2 - visibleWidth / 2;
        const y = firstBaseline + lineIndex * lineHeight;

        for (const item of line.items) {
          item.glyph.x = startX + item.offset + item.width / 2;
          item.glyph.y = y;
          item.glyph.width = item.width;
          item.glyph.size = size;
          item.glyph.line = lineIndex;
        }
      });

      const lastLine = lines[lines.length - 1];
      const lastLineWidth = Math.max(
        0,
        lastLine.width - (lastLine.items.length > 0 ? size * 0.06 : 0)
      );

      return {
        x: width / 2 + lastLineWidth / 2 + size * 0.14,
        y: firstBaseline + (lines.length - 1) * lineHeight,
        size,
        empty: glyphsRef.current.length === 0,
      };
    };

    const drawGlyphBotanicals = (glyph: GardenGlyph, now: number, layer: 0 | 1) => {
      const palette = paletteRef.current;
      const flowerMode = flowerModeRef.current;
      const frame = Math.floor(now / 130);
      const steppedNow = stopMotionTime(now);
      const age = steppedNow - glyph.bornAt;
      const grow = easeOutCubic(age / 1200);
      const cut = glyph.cutAt ? easeOutCubic((steppedNow - glyph.cutAt) / 280) : 0;
      const wither = glyph.deadAt ? easeOutCubic((steppedNow - glyph.deadAt) / 650) : 0;
      const alpha = Math.max(0, 1 - wither);
      const sway = Math.sin(frame * 0.42 + glyph.seed * 0.01) * glyph.size * 0.02;
      const stems = makeStems(glyph);

      if (alpha <= 0.02) return;

      ctx.save();
      ctx.globalAlpha = alpha;

      for (let index = 0; index < stems.length; index++) {
        const stem = stems[index];

        const startX = glyph.x + stem.anchorX * glyph.width;
        const startY = glyph.y - glyph.ascent * stem.anchorDepth;
        const visibleProgress = Math.max(0, Math.min(1, grow));
        const liveLength = stem.length * (1 - cut * 0.28);

        const vinePath = makeVinePath(
          startX,
          startY,
          stem.angle,
          liveLength,
          glyph.size * 0.006,
          stem.waves,
          stem.phase,
          stem.bend / Math.max(1, glyph.size),
          42
        );
        const swayedPath = vinePath.map(([x, y], pathIndex) => {
          const u = pathIndex / Math.max(1, vinePath.length - 1);
          const jitter = seeded(glyph.seed + index * 1777 + frame * 331 + pathIndex * 19);
          const locked = Math.min(1, u * 2.4);
          const boilX = (jitter() - 0.5) * glyph.size * 0.012 * locked;
          const boilY = (jitter() - 0.5) * glyph.size * 0.012 * locked;
          const growthLift = stem.downward ? glyph.size * 0.035 : -glyph.size * 0.08;

          return [
            x + sway * u + boilX,
            y + growthLift * grow * u + boilY,
          ] as [number, number];
        });

        if (layer === 0 && visibleProgress > 0.01) {
          strokeRange(
            ctx,
            swayedPath,
            0,
            Math.min(visibleProgress, 0.12),
            palette.stem,
            Math.max(1.2, glyph.size * 0.022) * (1 - wither * 0.45)
          );
        }

        if (stem.stemLayer === layer && visibleProgress > 0.01) {
          const stemStart = layer === 1 ? 0.1 : 0;
          strokeRange(
            ctx,
            swayedPath,
            stemStart,
            visibleProgress,
            palette.stem,
            Math.max(1.2, glyph.size * 0.022) * (1 - wither * 0.45)
          );

          if (visibleProgress > 0.42) {
            const leaf = pointAtPath(swayedPath, 0.46);
            drawLeaf(
              ctx,
              palette,
              leaf.point[0],
              leaf.point[1],
              glyph.size * 0.18 * stem.leafScale * Math.max(0, grow - 0.42),
              leaf.angle + stem.side * 0.95,
              Math.max(0, grow - 0.42)
            );
          }
        }

        const tipInfo = pointAtPath(swayedPath, Math.max(0.02, visibleProgress));
        const tip = tipInfo.point;
        const bloom = spring((age - stem.bloomDelay) / 1000, 8, 14) * (1 - wither);
        if (stem.flowerLayer === layer && bloom > 0.01) {
          const drawFlower =
            flowerMode === "gloriosa" ? drawGloriosaLily : drawTypeGardenRose;

          drawFlower(
            ctx,
            palette,
            tip[0],
            tip[1],
            glyph.size * stem.flowerScale * (flowerMode === "gloriosa" ? 0.92 : 1),
            tipInfo.angle + Math.PI / 2,
            stem,
            age - stem.bloomDelay,
            bloom
          );
        }
      }

      ctx.restore();
    };

    const drawGlyphText = (glyph: GardenGlyph, now: number) => {
      const palette = paletteRef.current;
      const steppedNow = stopMotionTime(now);
      const wither = glyph.deadAt ? easeOutCubic((steppedNow - glyph.deadAt) / 650) : 0;
      const alpha = Math.max(0, 1 - wither);
      if (alpha <= 0.02) return;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `400 ${glyph.size}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = palette.text;
      ctx.fillText(glyph.text, glyph.x, glyph.y + wither * glyph.size * 0.08);
      ctx.restore();
    };

    const drawCutMark = (glyph: GardenGlyph, now: number) => {
      const palette = paletteRef.current;
      const steppedNow = stopMotionTime(now);
      const cut = glyph.cutAt ? easeOutCubic((steppedNow - glyph.cutAt) / 280) : 0;
      if (glyph.cutAt && cut < 1) {
        ctx.save();
        ctx.globalAlpha = (1 - cut) * 0.75;
        ctx.strokeStyle = palette.line;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(glyph.x - glyph.width * 0.44, glyph.y - glyph.size * 0.72);
        ctx.lineTo(glyph.x + glyph.width * 0.44, glyph.y - glyph.size * 0.8);
        ctx.stroke();
        ctx.restore();
      }
    };

    let lastPaint = 0;
    const minPaintMs = 110;

    const render = (now: number) => {
      clockRef.current = now;
      if (
        document.hidden ||
        (!forcePaintRef.current && now - lastPaint < minPaintMs)
      ) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      lastPaint = now;
      forcePaintRef.current = false;
      const palette = paletteRef.current;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const caret = layoutGlyphs();
      const nextCaret = {
        x: Math.round(caret.empty ? width / 2 : caret.x),
        y: Math.round(caret.y - caret.size * 0.72),
        size: Math.round(caret.size),
      };

      if (
        nextCaret.x !== caretStateRef.current.x ||
        nextCaret.y !== caretStateRef.current.y ||
        nextCaret.size !== caretStateRef.current.size
      ) {
        caretStateRef.current = nextCaret;
        setCaretState(nextCaret);
      }

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);

      for (const glyph of glyphsRef.current) {
        drawGlyphBotanicals(glyph, now, 0);
      }

      for (const glyph of glyphsRef.current) {
        drawGlyphText(glyph, now);
      }

      for (const glyph of glyphsRef.current) {
        drawGlyphBotanicals(glyph, now, 1);
      }

      for (const glyph of glyphsRef.current) {
        drawCutMark(glyph, now);
      }

      glyphsRef.current = glyphsRef.current.filter((glyph) => {
        return !glyph.deadAt || now - glyph.deadAt < 900;
      });

      rafRef.current = requestAnimationFrame(render);
    };

    resize();
    document.fonts?.load(`400 96px ${mallikaiFontFamily}`).then(() => {
      forcePaintRef.current = true;
      resize();
    });
    document.fonts?.ready.then(() => {
      forcePaintRef.current = true;
      resize();
    });
    rafRef.current = requestAnimationFrame(render);
    window.addEventListener("resize", resize);
    focusInput();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const cursorHeight = Math.max(46, caretState.size * 0.82);
  const cursorWidth = Math.max(3, caretState.size * 0.035);
  const cursorLeft = caretState.x ? `${caretState.x}px` : "50vw";
  const cursorTop = caretState.y ? `${caretState.y}px` : "50vh";
  const activeMobileSection =
    MALLIKAI_KEY_SECTIONS.find(
      (section) => section.label === activeMobileKeySection
    ) ?? MALLIKAI_KEY_SECTIONS[1];
  const isMobileMarksLayer = activeMobileKeySection === "marks";
  const mobilePrimaryRows = activeMobileSection.rows.slice(0, isMobileMarksLayer ? 3 : 2);
  const mobileThirdRow = isMobileMarksLayer
    ? activeMobileSection.rows[3] ?? []
    : activeMobileSection.rows[2].slice(0, 7);

  return (
    <div
      className="relative h-screen overflow-hidden font-mono text-white"
      style={{ backgroundColor: activePalette.bg }}
      onClick={focusInput}
    >
      <canvas ref={canvasRef} className="fixed inset-0 h-screen w-screen" />
      {!isScreenshotMode && (
        <div
          aria-hidden="true"
          className="type-garden-caret pointer-events-none fixed z-20 -translate-x-1/2 rounded-full"
          style={{
            left: cursorLeft,
            top: cursorTop,
            width: cursorWidth,
            height: cursorHeight,
            backgroundColor: activePalette.text,
          }}
        />
      )}
      <textarea
        ref={inputRef}
        aria-label="Type with the Mallikai keyboard layout to grow a Tamil garden"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        inputMode={isVirtualKeyboardOnly ? "none" : "text"}
        readOnly={isVirtualKeyboardOnly}
        spellCheck={false}
        onFocus={() => {
          if (virtualKeyboardOnlyRef.current) {
            inputRef.current?.blur();
          }
        }}
        onInput={handleInput}
        onKeyDown={(event) => {
          if (event.key === "Backspace") {
            event.preventDefault();
            witherLast();
          }
          if (event.key === "Enter") {
            event.preventDefault();
            clearGarden();
          }
        }}
        className="pointer-events-none fixed left-1/2 top-1/2 size-px resize-none opacity-0"
      />

      <header className="pointer-events-none relative z-10 flex items-start justify-between p-4 sm:p-7">
        <div className="rounded-2xl border border-white/14 bg-black/45 px-4 py-3 text-white backdrop-blur-md max-sm:px-3 max-sm:py-2">
          <p className="text-xl font-semibold text-white max-sm:text-sm">Tamil Type Garden</p>
        </div>
        <div className="pointer-events-auto flex flex-wrap justify-end gap-2 max-sm:hidden">
          <Button
            type="button"
            onClick={clearGarden}
            variant="outline"
            size="sm"
            className="h-7 rounded-full border-white/14 bg-black/45 px-3 text-white hover:bg-black/60 hover:text-white"
          >
            <RotateCcw className="size-3.5" />
            Clear
          </Button>
          <Badge variant="glass" className="h-7 gap-1.5">
            Export
            {EXPORT_FORMATS.map((format) => (
              <Button
                key={format}
                type="button"
                variant="ghost"
                size="xs"
                aria-pressed={exportFormat === format}
                onClick={(event) => {
                  event.stopPropagation();
                  selectExportFormat(format);
                }}
                className="h-5 rounded-full border border-white/20 bg-black/25 px-2 text-[10px] uppercase text-white hover:bg-black/40 hover:text-white aria-pressed:bg-white/20 aria-pressed:text-white"
              >
                {EXPORT_LABELS[format]}
              </Button>
            ))}
          </Badge>
          <Button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsScreenshotMode((value) => !value);
              focusInput();
            }}
            aria-pressed={isScreenshotMode}
            variant="outline"
            size="sm"
            className="h-7 rounded-full border-white/14 bg-black/45 px-3 text-white hover:bg-black/60 hover:text-white aria-pressed:border-[#D51C39] aria-pressed:bg-[#D51C39] aria-pressed:text-white"
          >
            <Camera className="size-3.5" />
            Screenshot
          </Button>
          <Button
            type="button"
            onClick={saveExport}
            disabled={isSavingExport}
            size="sm"
            className="h-7 rounded-full bg-[#D51C39] px-3 text-white hover:bg-[#B81731] hover:text-white"
          >
            <Download className="size-3.5" />
            {isSavingExport ? "Saving…" : `Save ${EXPORT_LABELS[exportFormat]}`}
          </Button>
        </div>
      </header>

      <div className="pointer-events-none fixed inset-x-3 top-16 z-20 flex flex-col gap-2 text-xs text-white sm:hidden">
        <div className="pointer-events-auto flex items-center justify-between gap-2">
          <Badge variant="glass" className="h-8 gap-1.5 px-2">
            Export
            {EXPORT_FORMATS.map((format) => (
              <Button
                key={format}
                type="button"
                variant="ghost"
                size="xs"
                aria-pressed={exportFormat === format}
                onClick={(event) => {
                  event.stopPropagation();
                  selectExportFormat(format);
                }}
                className="h-6 rounded-full border border-white/20 bg-black/25 px-2 text-[10px] uppercase text-white hover:bg-black/40 hover:text-white aria-pressed:bg-white/20 aria-pressed:text-white"
              >
                {EXPORT_LABELS[format]}
              </Button>
            ))}
          </Badge>
          <Button
            type="button"
            onClick={saveExport}
            disabled={isSavingExport}
            size="sm"
            className="h-8 rounded-full bg-[#D51C39] px-3 text-white hover:bg-[#B81731] hover:text-white"
          >
            <Download className="size-3.5" />
            {isSavingExport ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsScreenshotMode((value) => !value);
            }}
            aria-pressed={isScreenshotMode}
            size="sm"
            variant="outline"
            className="h-8 rounded-full border-white/14 bg-black/45 px-3 text-white hover:bg-black/60 hover:text-white aria-pressed:border-[#D51C39] aria-pressed:bg-[#D51C39] aria-pressed:text-white"
          >
            <Camera className="size-3.5" />
            Shot
          </Button>
        </div>

        <div className="pointer-events-auto flex items-center justify-between gap-2">
          <Badge variant="glass" className="h-8 gap-1.5 px-2">
            Flower
            {FLOWER_MODES.map((mode) => (
              <Button
                key={mode.id}
                type="button"
                variant="ghost"
                size="xs"
                aria-pressed={flowerMode === mode.id}
                onClick={(event) => {
                  event.stopPropagation();
                  selectFlowerMode(mode.id);
                }}
                className="h-6 rounded-full border border-white/20 bg-black/25 px-2 text-[10px] text-white hover:bg-black/40 hover:text-white aria-pressed:bg-white/20 aria-pressed:text-white"
              >
                {mode.label}
              </Button>
            ))}
          </Badge>
          <Badge variant="glass" className="h-8 gap-1.5 px-2">
            {GARDEN_PALETTES.map((palette, index) => (
              <Button
                key={palette.id}
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Use ${palette.name} palette`}
                aria-pressed={paletteIndex === index}
                onClick={(event) => {
                  event.stopPropagation();
                  selectPalette(index);
                }}
                className="rounded-full border border-white/20 bg-black/25 p-0 hover:bg-black/40 aria-pressed:ring-2 aria-pressed:ring-white/80"
                title={palette.name}
              >
                <span
                  className="size-3 rounded-full border border-white/45"
                  style={{
                    background: `conic-gradient(${palette.flowers[0]}, ${palette.stem}, ${palette.bg}, ${palette.flowers[2]}, ${palette.flowers[0]})`,
                  }}
                />
              </Button>
            ))}
          </Badge>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 hidden flex-wrap items-center justify-between gap-4 p-5 text-xs text-white sm:flex sm:p-7">
        <div className="flex flex-wrap items-center gap-4 rounded-full border border-white/14 bg-black/45 px-4 py-2 text-white backdrop-blur-md">
          <span>Type Mallikai keys → Tamil glyphs</span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd className="border border-white/18 bg-black/20 font-mono text-white">Space</Kbd>
            new garden
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd className="border border-white/18 bg-black/20 font-mono text-white">Enter</Kbd>
            clear all
          </span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <Badge variant="glass" className="gap-1.5">
            Flower
            {FLOWER_MODES.map((mode) => (
              <Button
                key={mode.id}
                type="button"
                variant="ghost"
                size="xs"
                aria-pressed={flowerMode === mode.id}
                onClick={(event) => {
                  event.stopPropagation();
                  selectFlowerMode(mode.id);
                }}
                className="h-5 rounded-full border border-white/20 bg-black/25 px-2 text-[10px] text-white hover:bg-black/40 hover:text-white aria-pressed:bg-white/20 aria-pressed:text-white"
              >
                {mode.label}
              </Button>
            ))}
          </Badge>
          <Badge variant="glass" className="gap-1.5">
            Palette
            {GARDEN_PALETTES.map((palette, index) => (
              <Button
                key={palette.id}
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Use ${palette.name} palette`}
                aria-pressed={paletteIndex === index}
                onClick={(event) => {
                  event.stopPropagation();
                  selectPalette(index);
                }}
                className="rounded-full border border-white/20 bg-black/25 p-0 hover:bg-black/40 aria-pressed:ring-2 aria-pressed:ring-white/80"
                title={palette.name}
              >
                <span
                  className="size-3 rounded-full border border-white/45"
                  style={{
                    background: `conic-gradient(${palette.flowers[0]}, ${palette.stem}, ${palette.bg}, ${palette.flowers[2]}, ${palette.flowers[0]})`,
                  }}
                />
              </Button>
            ))}
          </Badge>
        </div>
      </div>

      <div className="pointer-events-none fixed right-0 top-[132px] bottom-[104px] z-30 flex items-center max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:h-auto max-sm:items-end max-sm:justify-end">
        {!isGuideOpen ? (
          <button
            type="button"
            aria-label="Open Mallikai typing guide"
            onClick={(event) => {
              event.stopPropagation();
              setIsGuideOpen(true);
              focusInput();
            }}
            className="pointer-events-auto h-14 w-9 rounded-l-2xl border border-r-0 border-white/14 bg-black/70 font-mono text-xl text-white hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 max-sm:mb-3 max-sm:mr-3 max-sm:rounded-2xl max-sm:border-r"
          >
            {"<"}
          </button>
        ) : (
          <aside
            className="pointer-events-auto relative h-full w-[min(440px,calc(100vw-24px))] overflow-y-auto rounded-l-3xl border-l border-b border-t border-white/14 bg-black/90 p-5 font-mono text-white backdrop-blur-md [scrollbar-width:none] [-ms-overflow-style:none] max-sm:h-auto max-sm:max-h-[52vh] max-sm:w-full max-sm:rounded-b-none max-sm:rounded-t-[28px] max-sm:border-x-0 max-sm:border-b-0 max-sm:bg-[#151515] max-sm:p-2 max-sm:pt-3 [&::-webkit-scrollbar]:hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close Mallikai typing guide"
              onClick={() => {
                setIsGuideOpen(false);
                focusInput();
              }}
              className="absolute left-0 top-1/2 h-14 w-9 -translate-x-full -translate-y-1/2 rounded-l-2xl border border-r-0 border-white/14 bg-black/90 font-mono text-xl text-white hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 max-sm:hidden sm:max-lg:left-auto sm:max-lg:right-3 sm:max-lg:top-3 sm:max-lg:z-10 sm:max-lg:h-9 sm:max-lg:w-9 sm:max-lg:translate-x-0 sm:max-lg:translate-y-0 sm:max-lg:rounded-full sm:max-lg:border-r"
            >
              {">"}
            </button>
            <div className="space-y-3 text-sm leading-6 text-white/78">
              <section>
                <div className="hidden items-center justify-between gap-3 max-sm:hidden sm:flex">
                  <p className="font-semibold text-white">Type your name</p>
                  <button
                    type="button"
                    aria-label="Close Mallikai typing guide"
                    onClick={() => {
                      setIsGuideOpen(false);
                      focusInput();
                    }}
                    className="grid size-8 place-items-center rounded-full border border-white/14 bg-white/[0.08] text-lg leading-none text-white hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    {">"}
                  </button>
                </div>
                <div className="mt-3 space-y-4 max-sm:hidden">
                  {MALLIKAI_KEY_SECTIONS.map((section) => (
                    <div key={section.label} className="space-y-1.5">
                      <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">
                        {section.label}
                      </p>
                      <div className="space-y-1.5">
                        {section.rows.map((row, rowIndex) => (
                          <div
                            key={`${section.label}-${rowIndex}`}
                            className="flex justify-center gap-1"
                          >
                            {row.map((key) => (
                              <button
                                key={`${section.label}-${rowIndex}-${key}`}
                                type="button"
                                onClick={() => {
                                  addGlyph(key);
                                  focusInput();
                                }}
                                className="flex h-16 w-[34px] shrink-0 flex-col items-center justify-between rounded-xl border border-white/14 bg-white/[0.07] px-1 py-1.5 text-center hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                title={`Type ${key}`}
                              >
                                <span className="grid min-h-5 min-w-5 place-items-center rounded-md bg-white px-1 text-[11px] font-bold leading-none text-black">
                                  {key}
                                </span>
                                <span
                                  className="block text-[28px] leading-none text-white"
                                  style={{ fontFamily: "Mallikai, var(--font-mallikai)" }}
                                >
                                  {key}
                                </span>
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden space-y-2 max-sm:block">
                  {mobilePrimaryRows.map((row, rowIndex) => (
                    <div
                      key={`${activeMobileKeySection}-mobile-${rowIndex}`}
                      className="flex justify-center gap-1"
                    >
                      {row.map((key) => (
                        <button
                          key={`${activeMobileKeySection}-${rowIndex}-${key}`}
                          type="button"
                          onClick={() => addGlyph(key)}
                          className="grid h-[54px] w-[calc((100vw-56px)/10)] shrink-0 place-items-center rounded-[14px] border border-white/8 bg-[#2A2A2C] px-0.5 py-1.5 text-center hover:bg-[#343438] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                          title={`Type ${key}`}
                        >
                          <span
                            className="block text-[30px] leading-none text-white"
                            style={{ fontFamily: "Mallikai, var(--font-mallikai)" }}
                          >
                            {key}
                          </span>
                        </button>
                      ))}
                    </div>
                  ))}

                  <div className="flex justify-center gap-1">
                    <button
                      type="button"
                      aria-label={isMobileMarksLayer ? "Show letters" : "Toggle uppercase"}
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveMobileKeySection(
                          isMobileMarksLayer
                            ? "lower"
                            : activeMobileKeySection === "CAPS"
                              ? "lower"
                              : "CAPS"
                        );
                      }}
                      className="grid h-[54px] w-10 shrink-0 place-items-center rounded-[14px] border border-white/8 bg-[#3A3A3D] text-base font-bold text-white"
                    >
                      {isMobileMarksLayer ? "abc" : "⇧"}
                    </button>
                    {mobileThirdRow.map((key) => (
                      <button
                        key={`${activeMobileKeySection}-third-${key}`}
                        type="button"
                        onClick={() => addGlyph(key)}
                        className="grid h-[54px] w-[calc((100vw-128px)/7)] shrink-0 place-items-center rounded-[14px] border border-white/8 bg-[#2A2A2C] px-0.5 py-1.5 text-center hover:bg-[#343438] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                        title={`Type ${key}`}
                      >
                        <span
                          className="block text-[30px] leading-none text-white"
                          style={{ fontFamily: "Mallikai, var(--font-mallikai)" }}
                        >
                          {key}
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      aria-label="Erase last letter"
                      onClick={(event) => {
                        event.stopPropagation();
                        witherLast();
                      }}
                      className="grid h-[54px] w-10 shrink-0 place-items-center rounded-[14px] border border-white/8 bg-[#3A3A3D] text-lg font-bold text-white"
                    >
                      ⌫
                    </button>
                  </div>

                  <div className="flex justify-center gap-1.5">
                    <button
                      type="button"
                      aria-label={isMobileMarksLayer ? "Show letters" : "Show numbers and marks"}
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveMobileKeySection(isMobileMarksLayer ? "lower" : "marks");
                      }}
                      className="h-12 min-w-16 rounded-[14px] border border-white/8 bg-[#3A3A3D] px-3 text-sm font-bold text-white"
                    >
                      {isMobileMarksLayer ? "abc" : "?123"}
                    </button>
                    <button
                      type="button"
                      aria-label="Space"
                      onClick={(event) => {
                        event.stopPropagation();
                        cutWord();
                      }}
                      className="h-12 flex-1 rounded-[14px] border border-white/8 bg-[#2A2A2C] px-3 text-sm font-bold text-white"
                    >
                      Space
                    </button>
                    <button
                      type="button"
                      aria-label="Close Mallikai keyboard"
                      onClick={(event) => {
                        event.stopPropagation();
                        setIsGuideOpen(false);
                      }}
                      className="h-12 min-w-12 rounded-[14px] border border-white/8 bg-[#3A3A3D] px-3 text-lg font-bold text-white"
                    >
                      {">"}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
