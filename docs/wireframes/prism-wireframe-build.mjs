#!/usr/bin/env node
// Prism UI Wireframe Generator — v3 (hi-def, Rounds 1-4)
// Produces: ./prism-all-rounds-v2-with-round4.excalidraw
//
// NOTE: does NOT overwrite ./prism-all-rounds.excalidraw — that is the
// canonical file (Rounds 1-3, manually laid out). The v2 output is the
// generator's reproducible version with added Round 4 panels.
//
// Round 1 (x=80)    — Sitemap + Home + Dossier
// Round 2 (x=1720)  — Markets, Products, Insights, Functions, Compare, Company, Trending, Graveyard
// Round 3 (x=3360)  — Quick Preview Modal, Placeholder Audit, Tablet 768, Mobile 375
// Round 4 (x=5000)  — User Flow diagrams (4), Component Library palette
//
// Run: node prism-wireframe-build.mjs

import { writeFileSync } from 'node:fs';

// ──────────────────────────────────────────────────────────────────────
// Design tokens
// ──────────────────────────────────────────────────────────────────────
const INK         = '#0f172a';  // slate-900
const INK_MED     = '#475569';  // slate-600
const INK_LIGHT   = '#64748b';  // slate-500
const INK_DIM     = '#94a3b8';  // slate-400
const BORDER      = '#e2e8f0';  // slate-200
const BORDER_STRONG = '#cbd5e1'; // slate-300
const CANVAS      = '#ffffff';
const SURFACE     = '#f8fafc';  // slate-50
const SURFACE_2   = '#f1f5f9';  // slate-100
const GRID_LINE   = '#e2e8f0';

const ACCENT      = '#0ea5e9';  // sky-500
const ACCENT_DEEP = '#0369a1';  // sky-700
const ACCENT_SOFT = '#e0f2fe';  // sky-100
const ACCENT_TINT = '#f0f9ff';  // sky-50

const SUCCESS      = '#10b981'; // emerald-500
const SUCCESS_SOFT = '#d1fae5'; // emerald-100
const SUCCESS_TINT = '#ecfdf5'; // emerald-50

const WARNING      = '#f59e0b'; // amber-500
const WARNING_SOFT = '#fef3c7'; // amber-100
const WARNING_TINT = '#fffbeb'; // amber-50

const DANGER      = '#ef4444';  // red-500
const DANGER_SOFT = '#fee2e2';  // red-100
const DANGER_TINT = '#fef2f2';  // red-50

const PURPLE      = '#8b5cf6';  // violet-500
const PURPLE_SOFT = '#ede9fe';  // violet-100
const PURPLE_TINT = '#f5f3ff';  // violet-50

const FONT_SANS = 1;   // Virgil
const FONT_MONO = 3;   // Cascadia

// ──────────────────────────────────────────────────────────────────────
// Element primitives
// ──────────────────────────────────────────────────────────────────────
let elementCounter = 0;
const nextId = () => `el-${String(++elementCounter).padStart(5, '0')}`;
const nextSeed = () => Math.floor(Math.random() * 2_000_000_000);
const now = Date.now();

function base(type, x, y, width, height, overrides = {}) {
  return {
    id: nextId(),
    type, x, y, width, height,
    angle: 0,
    strokeColor: INK,
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1.5,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: nextSeed(),
    version: 1,
    versionNonce: nextSeed(),
    isDeleted: false,
    boundElements: [],
    updated: now,
    link: null,
    locked: false,
    ...overrides,
  };
}

function rect(x, y, w, h, opts = {}) {
  return base('rectangle', x, y, w, h, {
    strokeColor: opts.stroke ?? BORDER,
    backgroundColor: opts.fill ?? 'transparent',
    strokeWidth: opts.strokeWidth ?? 1.5,
    strokeStyle: opts.strokeStyle ?? 'solid',
    roundness: opts.rounded === false ? null : { type: 3, value: opts.radius ?? 12 },
    groupIds: opts.group ? [opts.group] : [],
  });
}

function ellipse(x, y, w, h, opts = {}) {
  return base('ellipse', x, y, w, h, {
    strokeColor: opts.stroke ?? BORDER,
    backgroundColor: opts.fill ?? 'transparent',
    strokeWidth: opts.strokeWidth ?? 1.5,
    groupIds: opts.group ? [opts.group] : [],
  });
}

function diamond(x, y, w, h, opts = {}) {
  return base('diamond', x, y, w, h, {
    strokeColor: opts.stroke ?? BORDER,
    backgroundColor: opts.fill ?? 'transparent',
    strokeWidth: opts.strokeWidth ?? 1.5,
  });
}

function line(x1, y1, x2, y2, opts = {}) {
  const minX = Math.min(x1, x2);
  const minY = Math.min(y1, y2);
  return {
    ...base('line', minX, minY, Math.abs(x2 - x1) || 1, Math.abs(y2 - y1) || 1, {
      strokeColor: opts.stroke ?? BORDER,
      strokeWidth: opts.strokeWidth ?? 1,
      strokeStyle: opts.strokeStyle ?? 'solid',
    }),
    points: [[x1 - minX, y1 - minY], [x2 - minX, y2 - minY]],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: null,
  };
}

function polyline(points, opts = {}) {
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX || 1;
  const h = Math.max(...ys) - minY || 1;
  return {
    ...base('line', minX, minY, w, h, {
      strokeColor: opts.stroke ?? INK,
      strokeWidth: opts.strokeWidth ?? 2,
      strokeStyle: opts.strokeStyle ?? 'solid',
      backgroundColor: opts.fill ?? 'transparent',
      fillStyle: 'solid',
    }),
    points: points.map(([px, py]) => [px - minX, py - minY]),
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: null,
  };
}

function arrow(x1, y1, x2, y2, opts = {}) {
  const minX = Math.min(x1, x2);
  const minY = Math.min(y1, y2);
  return {
    ...base('arrow', minX, minY, Math.abs(x2 - x1) || 1, Math.abs(y2 - y1) || 1, {
      strokeColor: opts.stroke ?? INK_LIGHT,
      strokeWidth: opts.strokeWidth ?? 1.5,
      strokeStyle: opts.strokeStyle ?? 'solid',
    }),
    points: [[x1 - minX, y1 - minY], [x2 - minX, y2 - minY]],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: 'arrow',
  };
}

function text(x, y, str, opts = {}) {
  const fontSize = opts.size ?? 13;
  const fontFamily = opts.mono ? FONT_MONO : FONT_SANS;
  const charW = fontSize * (opts.mono ? 0.6 : 0.56);
  const width = opts.width ?? Math.max(20, Math.ceil(str.length * charW));
  const height = Math.max(fontSize * 1.25, fontSize + 4);
  return {
    ...base('text', x, y, width, height, {
      strokeColor: opts.color ?? INK,
      groupIds: opts.group ? [opts.group] : [],
    }),
    text: str,
    fontSize,
    fontFamily,
    textAlign: opts.align ?? 'left',
    verticalAlign: 'top',
    baseline: Math.round(fontSize * 0.9),
    containerId: null,
    originalText: str,
    lineHeight: 1.25,
    autoResize: true,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Hi-def UI helpers
// ──────────────────────────────────────────────────────────────────────

// Card with subtle shadow + rounded corners + border
function card(x, y, w, h, opts = {}) {
  const items = [];
  // soft shadow (offset duplicate in very light gray)
  if (opts.shadow !== false) {
    items.push(rect(x + 2, y + 3, w, h, {
      fill: '#00000008',
      stroke: '#00000008',
      strokeWidth: 0,
      radius: opts.radius ?? 12,
    }));
  }
  // main card
  items.push(rect(x, y, w, h, {
    fill: opts.fill ?? CANVAS,
    stroke: opts.stroke ?? BORDER,
    strokeWidth: opts.strokeWidth ?? 1.5,
    radius: opts.radius ?? 12,
  }));
  return items;
}

// Widget: card with accent bar + title + description
function widget(x, y, w, h, title, desc, opts = {}) {
  const items = [];
  items.push(...card(x, y, w, h, { fill: opts.fill ?? CANVAS, stroke: BORDER }));
  // accent strip
  const accent = opts.accent ?? ACCENT;
  items.push(rect(x + 16, y + 16, 4, 24, { fill: accent, stroke: accent, strokeWidth: 0, rounded: false }));
  // title
  items.push(text(x + 28, y + 16, title, { size: opts.titleSize ?? 15, color: INK }));
  // description
  if (desc) {
    items.push(text(x + 28, y + 36, desc, { size: 10, color: INK_DIM, mono: true }));
  }
  return items;
}

// Pill / badge
function pill(x, y, label, opts = {}) {
  const size = opts.size ?? 11;
  const padX = opts.padX ?? 10;
  const w = Math.max(label.length * size * 0.56 + padX * 2, 30);
  const h = size + 10;
  const fill = opts.fill ?? ACCENT_SOFT;
  const stroke = opts.stroke ?? ACCENT;
  const color = opts.color ?? ACCENT_DEEP;
  return [
    rect(x, y, w, h, { fill, stroke, strokeWidth: 1, radius: h / 2 }),
    text(x + padX, y + 5, label, { size, color }),
    w, // return width for chaining
  ];
}

function pillRow(x, y, labels, opts = {}) {
  const items = [];
  let cx = x;
  labels.forEach(label => {
    const [rec, txt, w] = pill(cx, y, label, opts);
    items.push(rec, txt);
    cx += w + (opts.gap ?? 6);
  });
  return items;
}

// Avatar / logo placeholder (circle)
function avatar(x, y, size, label = '') {
  const items = [];
  items.push(ellipse(x, y, size, size, {
    fill: SURFACE_2,
    stroke: BORDER_STRONG,
    strokeWidth: 1.5,
  }));
  if (label) {
    const fontSize = Math.floor(size * 0.4);
    items.push(text(x + size / 2 - fontSize * 0.5, y + size / 2 - fontSize * 0.6, label, {
      size: fontSize,
      color: INK_MED,
    }));
  }
  return items;
}

// Button
function button(x, y, w, h, label, opts = {}) {
  const items = [];
  const filled = opts.filled !== false;
  items.push(rect(x, y, w, h, {
    fill: filled ? (opts.fill ?? ACCENT) : CANVAS,
    stroke: opts.stroke ?? ACCENT,
    strokeWidth: 1.5,
    radius: opts.radius ?? 8,
  }));
  const fontSize = opts.size ?? 13;
  const textW = label.length * fontSize * 0.56;
  items.push(text(
    x + (w - textW) / 2,
    y + (h - fontSize * 1.25) / 2,
    label,
    { size: fontSize, color: filled ? CANVAS : ACCENT_DEEP }
  ));
  return items;
}

// Status dot
function dot(x, y, color = SUCCESS) {
  return ellipse(x, y, 10, 10, { fill: color, stroke: color, strokeWidth: 0 });
}

// Horizontal divider
function divider(x, y, w, color = BORDER) {
  return line(x, y, x + w, y, { stroke: color, strokeWidth: 1 });
}

// ──────────────────────────────────────────────────────────────────────
// Chart primitives
// ──────────────────────────────────────────────────────────────────────

// Plot area with background + grid lines
function plotArea(x, y, w, h, opts = {}) {
  const items = [];
  items.push(rect(x, y, w, h, {
    fill: opts.fill ?? SURFACE,
    stroke: opts.stroke ?? BORDER,
    strokeWidth: 1,
    radius: 6,
  }));
  // horizontal grid lines
  const hLines = opts.hLines ?? 4;
  for (let i = 1; i < hLines; i++) {
    const gy = y + (h * i / hLines);
    items.push(line(x + 8, gy, x + w - 8, gy, { stroke: GRID_LINE, strokeWidth: 0.5 }));
  }
  return items;
}

// Bar chart — values in [0, 1] normalized or absolute
function barChart(x, y, w, h, values, opts = {}) {
  const items = [];
  items.push(...plotArea(x, y, w, h, opts));
  const pad = 10;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const max = opts.max ?? Math.max(...values);
  const barGap = opts.gap ?? 2;
  const barW = (innerW - (values.length - 1) * barGap) / values.length;
  const color = opts.color ?? ACCENT;
  values.forEach((v, i) => {
    const normalized = v / max;
    const bh = normalized * innerH;
    const bx = x + pad + i * (barW + barGap);
    const by = y + h - pad - bh;
    items.push(rect(bx, by, barW, bh, {
      fill: color,
      stroke: color,
      strokeWidth: 0,
      radius: 2,
    }));
  });
  return items;
}

// Stacked bar chart — array of {values: [v1,v2,v3], colors: [c1,c2,c3]}
function stackedBarChart(x, y, w, h, series, colors, opts = {}) {
  const items = [];
  items.push(...plotArea(x, y, w, h, opts));
  const pad = 10;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const max = Math.max(...series.map(s => s.reduce((a, b) => a + b, 0)));
  const barGap = 2;
  const barW = (innerW - (series.length - 1) * barGap) / series.length;
  series.forEach((stack, i) => {
    let by = y + h - pad;
    const bx = x + pad + i * (barW + barGap);
    stack.forEach((v, j) => {
      const bh = (v / max) * innerH;
      by -= bh;
      items.push(rect(bx, by, barW, bh, {
        fill: colors[j],
        stroke: colors[j],
        strokeWidth: 0,
        radius: 0,
      }));
    });
  });
  return items;
}

// Smooth-ish line chart via many segments
function lineChart(x, y, w, h, values, opts = {}) {
  const items = [];
  items.push(...plotArea(x, y, w, h, opts));
  const pad = 12;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const max = opts.max ?? Math.max(...values);
  const min = opts.min ?? 0;
  const range = max - min || 1;
  const points = values.map((v, i) => [
    x + pad + (i * innerW) / (values.length - 1),
    y + h - pad - ((v - min) / range) * innerH,
  ]);
  // area fill (if requested) — polyline closed to baseline
  if (opts.area) {
    const areaPoints = [
      [points[0][0], y + h - pad],
      ...points,
      [points[points.length - 1][0], y + h - pad],
    ];
    items.push(polyline(areaPoints, {
      stroke: opts.color ?? ACCENT,
      strokeWidth: 0,
      fill: opts.areaFill ?? ACCENT_SOFT,
    }));
  }
  // line segments
  for (let i = 0; i < points.length - 1; i++) {
    items.push(line(
      points[i][0], points[i][1],
      points[i + 1][0], points[i + 1][1],
      { stroke: opts.color ?? ACCENT, strokeWidth: opts.strokeWidth ?? 2 }
    ));
  }
  // data points
  if (opts.dots) {
    points.forEach(([px, py]) => {
      items.push(ellipse(px - 3, py - 3, 6, 6, {
        fill: opts.color ?? ACCENT,
        stroke: opts.color ?? ACCENT,
        strokeWidth: 0,
      }));
    });
  }
  return items;
}

// Multi-line chart
function multiLineChart(x, y, w, h, seriesList, colorList, opts = {}) {
  const items = [];
  items.push(...plotArea(x, y, w, h, opts));
  const pad = 12;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const all = seriesList.flat();
  const max = Math.max(...all);
  const min = 0;
  const range = max - min || 1;
  seriesList.forEach((values, seriesIdx) => {
    const color = colorList[seriesIdx];
    const points = values.map((v, i) => [
      x + pad + (i * innerW) / (values.length - 1),
      y + h - pad - ((v - min) / range) * innerH,
    ]);
    for (let i = 0; i < points.length - 1; i++) {
      items.push(line(
        points[i][0], points[i][1],
        points[i + 1][0], points[i + 1][1],
        { stroke: color, strokeWidth: 2 }
      ));
    }
  });
  return items;
}

// Donut chart — values are proportions summing to 1
function donutChart(cx, cy, outerR, innerR, values, colors) {
  const items = [];
  // outer ring placeholder as concentric ellipses divided by "pie slice" rectangles
  // Simpler: approximate with wedge lines
  items.push(ellipse(cx - outerR, cy - outerR, outerR * 2, outerR * 2, {
    fill: SURFACE_2,
    stroke: BORDER,
    strokeWidth: 1,
  }));
  // Draw slices as lines from center to edge and colored segments
  let angle = -Math.PI / 2;
  values.forEach((v, i) => {
    const sweep = v * Math.PI * 2;
    const segments = Math.max(4, Math.floor(sweep * 8));
    const color = colors[i];
    for (let s = 0; s < segments; s++) {
      const a1 = angle + (sweep * s) / segments;
      const a2 = angle + (sweep * (s + 1)) / segments;
      const x1 = cx + Math.cos(a1) * outerR;
      const y1 = cy + Math.sin(a1) * outerR;
      const x2 = cx + Math.cos(a2) * outerR;
      const y2 = cy + Math.sin(a2) * outerR;
      items.push(line(x1, y1, x2, y2, { stroke: color, strokeWidth: 4 }));
    }
    angle += sweep;
  });
  // inner hole
  items.push(ellipse(cx - innerR, cy - innerR, innerR * 2, innerR * 2, {
    fill: CANVAS,
    stroke: BORDER,
    strokeWidth: 1,
  }));
  return items;
}

// Radar chart
function radarChart(cx, cy, radius, values, labels, opts = {}) {
  const items = [];
  const sides = values.length;
  const color = opts.color ?? ACCENT;
  // concentric background rings
  for (let ring = 1; ring <= 4; ring++) {
    const r = (radius * ring) / 4;
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    for (let i = 0; i < sides; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % sides];
      items.push(line(p1[0], p1[1], p2[0], p2[1], {
        stroke: ring === 4 ? BORDER_STRONG : GRID_LINE,
        strokeWidth: ring === 4 ? 1 : 0.5,
      }));
    }
  }
  // spokes
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
    items.push(line(
      cx, cy,
      cx + Math.cos(a) * radius,
      cy + Math.sin(a) * radius,
      { stroke: GRID_LINE, strokeWidth: 0.5 }
    ));
  }
  // data polygon
  const dataPts = values.map((v, i) => {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * radius * v, cy + Math.sin(a) * radius * v];
  });
  for (let i = 0; i < sides; i++) {
    const p1 = dataPts[i];
    const p2 = dataPts[(i + 1) % sides];
    items.push(line(p1[0], p1[1], p2[0], p2[1], { stroke: color, strokeWidth: 2 }));
  }
  // data points
  dataPts.forEach(([px, py]) => {
    items.push(ellipse(px - 3, py - 3, 6, 6, { fill: color, stroke: color, strokeWidth: 0 }));
  });
  // axis labels
  labels.forEach((label, i) => {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
    const lx = cx + Math.cos(a) * (radius + 18) - label.length * 3;
    const ly = cy + Math.sin(a) * (radius + 18) - 6;
    items.push(text(lx, ly, label, { size: 10, color: INK_MED }));
  });
  return items;
}

// Heatmap — 2D array of values in [0,1]
function heatmap(x, y, w, h, rows, opts = {}) {
  const items = [];
  const rowCount = rows.length;
  const colCount = rows[0].length;
  const cellW = w / colCount;
  const cellH = h / rowCount;
  const baseColor = opts.color ?? ACCENT;
  rows.forEach((row, r) => {
    row.forEach((v, c) => {
      // opacity via fill color lightness — use 5 discrete shades
      const shades = [SURFACE, ACCENT_TINT, ACCENT_SOFT, '#7dd3fc', ACCENT];
      const idx = Math.min(4, Math.floor(v * 5));
      items.push(rect(
        x + c * cellW, y + r * cellH,
        cellW - 1, cellH - 1,
        {
          fill: shades[idx],
          stroke: BORDER,
          strokeWidth: 0.3,
          rounded: false,
        }
      ));
    });
  });
  return items;
}

// Sparkline (mini inline chart)
function sparkline(x, y, w, h, values, opts = {}) {
  const items = [];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => [
    x + (i * w) / (values.length - 1),
    y + h - ((v - min) / range) * h,
  ]);
  for (let i = 0; i < points.length - 1; i++) {
    items.push(line(
      points[i][0], points[i][1],
      points[i + 1][0], points[i + 1][1],
      { stroke: opts.color ?? ACCENT, strokeWidth: 1.5 }
    ));
  }
  return items;
}

// ──────────────────────────────────────────────────────────────────────
// Page components
// ──────────────────────────────────────────────────────────────────────

// Global header (reused across all pages)
function globalHeader(x, y, w) {
  const items = [];
  items.push(rect(x, y, w, 64, { fill: CANVAS, stroke: BORDER, strokeWidth: 1, radius: 0 }));
  items.push(line(x, y + 64, x + w, y + 64, { stroke: BORDER, strokeWidth: 1 }));
  // Logo
  items.push(rect(x + 24, y + 18, 28, 28, { fill: ACCENT, stroke: ACCENT, strokeWidth: 0, radius: 6 }));
  items.push(text(x + 32, y + 24, 'P', { size: 16, color: CANVAS }));
  items.push(text(x + 60, y + 22, 'PRODUCT_NAME', { size: 17, color: INK }));
  // Nav
  const nav = ['Feed', 'Products', 'Markets', 'Insights', 'Explore'];
  nav.forEach((item, i) => {
    items.push(text(x + 220 + i * 90, y + 24, item, {
      size: 13,
      color: i === 0 ? ACCENT : INK_MED,
    }));
  });
  // Search
  items.push(rect(x + w - 380, y + 16, 220, 32, { fill: SURFACE, stroke: BORDER, strokeWidth: 1, radius: 8 }));
  items.push(text(x + w - 368, y + 24, '⌘K  Search products, companies…', { size: 11, color: INK_DIM }));
  // Icons + user
  items.push(text(x + w - 140, y + 24, '🔔', { size: 15 }));
  items.push(rect(x + w - 108, y + 16, 80, 32, { fill: CANVAS, stroke: ACCENT, strokeWidth: 1.5, radius: 8 }));
  items.push(text(x + w - 94, y + 24, 'Sign in', { size: 12, color: ACCENT_DEEP }));
  return items;
}

// Page frame with title label
function pageFrame(x, y, w, h, route, subtitle) {
  const items = [];
  items.push(text(x, y - 56, route, { size: 26, color: INK }));
  items.push(text(x, y - 24, subtitle, { size: 12, color: INK_LIGHT }));
  items.push(text(x + w - 140, y - 24, `Desktop 1440×${h}`, { size: 11, color: INK_DIM, mono: true }));
  // outer page background
  items.push(rect(x, y, w, h, { fill: CANVAS, stroke: BORDER_STRONG, strokeWidth: 2, radius: 8 }));
  return items;
}

// Product card mock (used in grids)
function productCardMock(x, y, w, h, data) {
  const items = [];
  items.push(...card(x, y, w, h, { fill: CANVAS, stroke: BORDER }));
  items.push(...avatar(x + 12, y + 12, 40));
  items.push(text(x + 62, y + 16, data.name, { size: 13, color: INK }));
  items.push(text(x + 62, y + 34, data.tag, { size: 10, color: INK_LIGHT }));
  items.push(line(x + 12, y + 66, x + w - 12, y + 66, { stroke: GRID_LINE }));
  // category pill
  const [pRect, pText] = pill(x + 12, y + 76, data.cat, { size: 9, padX: 6 });
  items.push(pRect, pText);
  // buzz row
  items.push(...sparkline(x + w - 70, y + 82, 42, 12, data.spark || [3, 5, 4, 7, 6, 8, 10]));
  items.push(text(x + w - 24, y + 82, `${data.score}`, { size: 11, color: SUCCESS }));
  items.push(text(x + w - 24, y + 96, '▲', { size: 9, color: SUCCESS }));
  return items;
}

// Small horizontal product row
function productRowMock(x, y, w, h, data) {
  const items = [];
  items.push(...card(x, y, w, h, { fill: CANVAS, stroke: BORDER }));
  items.push(...avatar(x + 12, y + (h - 32) / 2, 32));
  items.push(text(x + 56, y + 14, data.name, { size: 13, color: INK }));
  items.push(text(x + 56, y + 32, data.tag, { size: 10, color: INK_LIGHT }));
  if (data.meta) {
    items.push(text(x + 56, y + 50, data.meta, { size: 9, color: INK_DIM, mono: true }));
  }
  // right side
  if (data.rightLabel) {
    items.push(text(x + w - 120, y + 14, data.rightLabel, { size: 11, color: INK_LIGHT }));
  }
  if (data.rightValue) {
    items.push(text(x + w - 120, y + 30, data.rightValue, { size: 14, color: data.rightColor ?? SUCCESS }));
  }
  return items;
}

// ──────────────────────────────────────────────────────────────────────
// Build scene
// ──────────────────────────────────────────────────────────────────────
const elements = [];
const add = (items) => {
  if (Array.isArray(items)) items.forEach(el => elements.push(el));
  else if (items) elements.push(items);
};
const push = (el) => elements.push(el);

// ══════════════════════════════════════════════════════════════════════
// SECTION 1: SITEMAP
// ══════════════════════════════════════════════════════════════════════
{
  const X = 80, Y = 100;
  push(text(X, Y, 'PRODUCT_NAME — SITEMAP', { size: 36, color: INK }));
  push(text(X, Y + 46, 'All 25 routes grouped by section. Replace PRODUCT_NAME with final brand when locked.', { size: 12, color: INK_LIGHT }));

  // Central hub card
  const hubX = X + 960, hubY = Y + 130;
  add(card(hubX, hubY, 220, 88, { fill: ACCENT_TINT, stroke: ACCENT, strokeWidth: 2 }));
  push(rect(hubX + 16, hubY + 16, 4, 24, { fill: ACCENT, stroke: ACCENT, strokeWidth: 0, rounded: false }));
  push(text(hubX + 28, hubY + 14, '/', { size: 18, mono: true, color: ACCENT_DEEP }));
  push(text(hubX + 28, hubY + 36, 'Home · The Feed', { size: 14, color: INK }));
  push(text(hubX + 28, hubY + 56, 'breaking news of products', { size: 10, color: INK_LIGHT }));

  // Section definitions
  const sections = [
    {
      title: '▸ DISCOVERY',
      subtitle: 'Browse + filter by taxonomy',
      color: ACCENT,
      tint: ACCENT_TINT,
      soft: ACCENT_SOFT,
      x: X,
      routes: [
        ['/products', 'Faceted browse'],
        ['/functions/[slug]', 'Leaf taxonomy'],
        ['/categories/[slug]', 'Top-level'],
        ['/sub-categories/[slug]', 'Mid-level'],
        ['/attributes/[grp]/[val]', 'Attribute slice'],
        ['/tools-to/[task]', 'Task SEO page'],
        ['/search', 'Unified results'],
      ],
    },
    {
      title: '▸ INTELLIGENCE',
      subtitle: 'The monetizable depth layer',
      color: SUCCESS,
      tint: SUCCESS_TINT,
      soft: SUCCESS_SOFT,
      x: X + 480,
      routes: [
        ['/dossier/[slug]', 'Full product file ⭐'],
        ['/markets', 'Bloomberg analytics'],
        ['/trending', 'Breakout feed'],
        ['/companies/[slug]', 'Company profile'],
        ['/compare?a=&b=', 'Side-by-side'],
        ['/funding', 'Funding feed'],
        ['/acquisitions', 'M&A tracker'],
      ],
    },
    {
      title: '▸ RESEARCH',
      subtitle: 'Editorial + graph + history',
      color: WARNING,
      tint: WARNING_TINT,
      soft: WARNING_SOFT,
      x: X + 960,
      routes: [
        ['/insights', 'Articles hub'],
        ['/insights/[slug]', 'Reader + graph'],
        ['/explore', 'Knowledge graph'],
        ['/evolution', 'Era timeline'],
        ['/graveyard', 'Discontinued'],
      ],
    },
    {
      title: '▸ USER / ADMIN',
      subtitle: 'Auth, dashboards, monetization',
      color: DANGER,
      tint: DANGER_TINT,
      soft: DANGER_SOFT,
      x: X + 1440,
      routes: [
        ['/login', 'Sign in'],
        ['/signup', 'Register'],
        ['/profile', 'User profile'],
        ['/watchlist', 'Saved + alerts'],
        ['/dashboard', 'User home'],
        ['/submit', 'Add product'],
        ['/pricing', 'Tiers'],
        ['/api/docs', 'API reference'],
      ],
    },
  ];

  sections.forEach(sec => {
    const sy = Y + 280;
    // section header card
    add(card(sec.x, sy, 400, 56, { fill: sec.tint, stroke: sec.color, strokeWidth: 1.5 }));
    push(rect(sec.x + 16, sy + 16, 4, 24, { fill: sec.color, stroke: sec.color, strokeWidth: 0, rounded: false }));
    push(text(sec.x + 28, sy + 14, sec.title, { size: 15, color: INK }));
    push(text(sec.x + 28, sy + 34, sec.subtitle, { size: 10, color: INK_LIGHT }));

    sec.routes.forEach(([route, label], i) => {
      const ry = sy + 72 + i * 64;
      add(card(sec.x, ry, 400, 52, { fill: CANVAS, stroke: BORDER }));
      push(rect(sec.x + 12, ry + 14, 3, 24, { fill: sec.color, stroke: sec.color, strokeWidth: 0, rounded: false }));
      push(text(sec.x + 24, ry + 10, route, { size: 12, mono: true, color: INK }));
      push(text(sec.x + 24, ry + 28, label, { size: 11, color: INK_LIGHT }));
      // arrow hint on right
      push(text(sec.x + 380, ry + 18, '→', { size: 14, color: INK_DIM }));
    });
  });

  // Connector arrows from hub to each section header
  const hubBotX = hubX + 110;
  const hubBotY = hubY + 88;
  push(arrow(hubBotX, hubBotY, X + 200, Y + 280, { stroke: ACCENT, strokeWidth: 1.5 }));
  push(arrow(hubBotX, hubBotY, X + 680, Y + 280, { stroke: SUCCESS, strokeWidth: 1.5 }));
  push(arrow(hubBotX, hubBotY, X + 1160, Y + 280, { stroke: WARNING, strokeWidth: 1.5 }));
  push(arrow(hubBotX, hubBotY, X + 1640, Y + 280, { stroke: DANGER, strokeWidth: 1.5 }));

  // Legend
  const legY = Y + 800;
  add(card(X, legY, 900, 48, { fill: SURFACE, stroke: BORDER }));
  push(text(X + 20, legY + 16, 'Legend:', { size: 12, color: INK }));
  const leg = [
    ['Discovery', ACCENT, ACCENT_TINT],
    ['Intelligence', SUCCESS, SUCCESS_TINT],
    ['Research', WARNING, WARNING_TINT],
    ['User/Admin', DANGER, DANGER_TINT],
  ];
  leg.forEach(([lbl, c, t], i) => {
    const lx = X + 100 + i * 180;
    push(rect(lx, legY + 14, 16, 16, { fill: t, stroke: c, strokeWidth: 1 }));
    push(text(lx + 24, legY + 16, lbl, { size: 11, color: INK_MED }));
  });
  push(text(X + 820, legY + 16, '⭐ = monetized', { size: 10, color: INK_DIM }));
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 2: HOME (DESKTOP)
// ══════════════════════════════════════════════════════════════════════
{
  const X = 80, Y = 1050, W = 1440, H = 2260;
  add(pageFrame(X, Y, W, H, '/ — HOME (FEED)', 'Product Hunt-style launch feed with Bloomberg signal overlays. First page shipped.'));
  add(globalHeader(X, Y, W));

  // Hero strip
  const heroY = Y + 80;
  add(card(X + 16, heroY, W - 32, 56, { fill: ACCENT_TINT, stroke: ACCENT, strokeWidth: 1.5 }));
  push(text(X + 40, heroY + 20, '47 new products today  •  312 this week  •  8 breakouts', { size: 15, color: ACCENT_DEEP }));
  add(button(X + W - 200, heroY + 12, 164, 32, '+ Submit product', { filled: true }));

  // 2-col layout
  const contentY = heroY + 72;
  const leftX = X + 16, leftW = 900;
  const rightX = X + 940, rightW = 484;

  // ─── LEFT COLUMN ───
  let ly = contentY;

  // Launched Today widget (420h)
  add(widget(leftX, ly, leftW, 440, '🚀 LAUNCHED TODAY', '→ products WHERE launched_date = today   •   4×2 card grid'));
  const mockProducts = [
    { name: 'Notion AI', tag: 'AI writing for teams', cat: 'AI', score: 94, spark: [2, 3, 5, 4, 7, 8, 10] },
    { name: 'Linear v2', tag: 'Issue tracking reborn', cat: 'Dev', score: 91, spark: [3, 4, 4, 6, 7, 8, 9] },
    { name: 'Cursor', tag: 'AI pair programmer', cat: 'Dev', score: 88, spark: [1, 3, 5, 7, 6, 9, 10] },
    { name: 'Raycast', tag: 'Command-bar everything', cat: 'Prod', score: 85, spark: [4, 5, 5, 6, 7, 7, 8] },
    { name: 'Vercel AI', tag: 'Edge AI toolkit', cat: 'AI', score: 82, spark: [2, 4, 3, 5, 6, 8, 9] },
    { name: 'Warp', tag: 'Rust-native terminal', cat: 'Dev', score: 79, spark: [3, 4, 5, 5, 6, 7, 8] },
    { name: 'Arc', tag: 'Browser reimagined', cat: 'Web', score: 76, spark: [5, 4, 6, 5, 7, 6, 8] },
    { name: 'Figma AI', tag: 'Design with intent', cat: 'Des', score: 74, spark: [4, 5, 6, 5, 7, 8, 9] },
  ];
  for (let i = 0; i < 8; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const cx = leftX + 24 + col * 214;
    const cy = ly + 66 + row * 164;
    add(productCardMock(cx, cy, 200, 150, mockProducts[i]));
  }
  push(text(leftX + 24, ly + 412, 'view all today\'s launches →', { size: 11, color: ACCENT_DEEP }));
  ly += 460;

  // Breakout Alerts widget (360h)
  add(widget(leftX, ly, leftW, 360, '⚡ BREAKOUT ALERTS', '→ product_signal_scores WHERE is_breakout AND score_date = today', { accent: DANGER }));
  const breakouts = [
    { name: 'Product Alpha', velocity: '+340%', meta: 'velocity > 2σ above 90-day avg' },
    { name: 'Product Beta', velocity: '+220%', meta: 'mention spike across Reddit + HN' },
    { name: 'Product Gamma', velocity: '+180%', meta: 'funding + press coverage' },
    { name: 'Product Delta', velocity: '+145%', meta: 'Show HN top-5 last 24h' },
  ];
  breakouts.forEach((b, i) => {
    const by = ly + 68 + i * 66;
    add(card(leftX + 24, by, leftW - 48, 56, { fill: i === 0 ? DANGER_TINT : CANVAS, stroke: i === 0 ? DANGER : BORDER }));
    add(avatar(leftX + 36, by + 12, 32));
    push(text(leftX + 80, by + 12, b.name, { size: 13, color: INK }));
    push(text(leftX + 80, by + 30, b.meta, { size: 10, color: INK_LIGHT }));
    // sparkline
    add(sparkline(leftX + leftW - 220, by + 18, 100, 24, [2, 3, 4, 5, 8, 14, 28], { color: DANGER }));
    // delta
    push(rect(leftX + leftW - 108, by + 16, 68, 26, { fill: DANGER_SOFT, stroke: DANGER, strokeWidth: 1, radius: 6 }));
    push(text(leftX + leftW - 96, by + 22, b.velocity, { size: 11, color: DANGER }));
  });
  push(text(leftX + 24, ly + 334, 'view all breakouts →', { size: 11, color: ACCENT_DEEP }));
  ly += 380;

  // Trending This Week (300h)
  add(widget(leftX, ly, leftW, 300, '📈 TRENDING THIS WEEK', '→ product_signal_scores 7d delta, top 10 ranked'));
  const trending = [
    { name: 'Supabase', tag: 'Open-source Firebase alt', delta: '+67' },
    { name: 'Resend', tag: 'Email for developers', delta: '+54' },
    { name: 'Turso', tag: 'libSQL edge database', delta: '+48' },
    { name: 'Dub.co', tag: 'Open-source link analytics', delta: '+42' },
    { name: 'Shadcn UI', tag: 'Copy-paste component library', delta: '+38' },
  ];
  trending.forEach((t, i) => {
    const ty = ly + 66 + i * 44;
    push(text(leftX + 24, ty + 10, `${i + 1}.`, { size: 13, color: INK_MED, mono: true }));
    add(avatar(leftX + 52, ty + 4, 32));
    push(text(leftX + 96, ty + 6, t.name, { size: 13, color: INK }));
    push(text(leftX + 96, ty + 24, t.tag, { size: 10, color: INK_LIGHT }));
    add(sparkline(leftX + leftW - 220, ty + 14, 80, 16, [3, 4, 5, 7, 6, 9, 10], { color: SUCCESS }));
    push(text(leftX + leftW - 120, ty + 12, `${t.delta} pts`, { size: 12, color: SUCCESS }));
    push(text(leftX + leftW - 60, ty + 12, '▲', { size: 11, color: SUCCESS }));
  });
  push(text(leftX + 24, ly + 280, '+ 5 more →', { size: 11, color: ACCENT_DEEP }));
  ly += 320;

  // Category Spotlight (400h)
  add(widget(leftX, ly, leftW, 440, '🏛️  CATEGORY SPOTLIGHT — "When did note-taking apps peak?"', '→ market_size_snapshots lifecycle curve, rotating featured category', { accent: WARNING }));
  // Chart
  const chart = { x: leftX + 40, y: ly + 80, w: leftW - 80, h: 320 };
  const lifespanData = [5, 8, 12, 18, 28, 42, 58, 72, 85, 92, 88, 72, 58, 42, 38];
  add(lineChart(chart.x, chart.y, chart.w, chart.h, lifespanData, {
    color: WARNING, area: true, areaFill: WARNING_SOFT, dots: true,
  }));
  // x-axis labels
  const years = ['2005', '2008', '2011', '2014', '2017', '2019', '2022', '2025'];
  years.forEach((year, i) => {
    const lx = chart.x + 20 + (i * (chart.w - 40)) / (years.length - 1);
    push(text(lx - 12, chart.y + chart.h + 6, year, { size: 10, color: INK_LIGHT }));
    if (year === '2019') {
      push(text(lx - 22, chart.y - 18, '◀ PEAK', { size: 10, color: WARNING }));
    }
  });
  push(text(chart.x, chart.y - 18, '# active products', { size: 10, color: INK_LIGHT }));

  // ─── RIGHT RAIL ───
  let ry = contentY;

  // Market Pulse (320h)
  add(widget(rightX, ry, rightW, 320, '📊 MARKET PULSE', '→ market_size_snapshots 7d velocity'));
  const pulse = [
    { cat: 'AI Tools', delta: '+12%', color: SUCCESS, data: [3, 4, 5, 6, 7, 8, 9] },
    { cat: 'Dev Tools', delta: '+8%', color: SUCCESS, data: [4, 5, 5, 6, 7, 7, 8] },
    { cat: 'Productivity', delta: '0%', color: INK_LIGHT, data: [5, 5, 5, 5, 5, 5, 5] },
    { cat: 'Design', delta: '-2%', color: DANGER, data: [6, 6, 5, 5, 4, 4, 4] },
    { cat: 'Finance', delta: '-3%', color: DANGER, data: [5, 5, 4, 4, 3, 3, 3] },
    { cat: 'Security', delta: '+5%', color: SUCCESS, data: [3, 4, 4, 5, 5, 6, 6] },
  ];
  pulse.forEach((p, i) => {
    const py = ry + 66 + i * 38;
    push(text(rightX + 24, py, p.cat, { size: 12, color: INK }));
    add(sparkline(rightX + 180, py + 2, 150, 18, p.data, { color: p.color }));
    push(text(rightX + rightW - 60, py, p.delta, { size: 12, color: p.color }));
  });
  push(text(rightX + 24, ry + 296, 'view markets →', { size: 11, color: ACCENT_DEEP }));
  ry += 340;

  // From the News (420h)
  add(widget(rightX, ry, rightW, 420, '📰 FROM THE NEWS', '→ press_mentions ORDER BY mention_date DESC'));
  const news = [
    { src: 'TechCrunch', time: '2h', head: 'Notion raises $275M Series C at $10B valuation', sent: '😊' },
    { src: 'The Verge', time: '4h', head: 'Arc browser shuts down after 4 years', sent: '😐' },
    { src: 'Hacker News', time: '6h', head: 'Show HN: I built an open-source Linear alternative', sent: '😊' },
    { src: 'Wired', time: '8h', head: 'The return of the markdown note-taker', sent: '😊' },
    { src: 'VentureBeat', time: '11h', head: 'GitHub Copilot hits $400M ARR', sent: '😊' },
  ];
  news.forEach((n, i) => {
    const ny = ry + 66 + i * 66;
    add(dot(rightX + 24, ny + 5, ACCENT));
    push(text(rightX + 38, ny, n.src, { size: 11, color: ACCENT_DEEP }));
    push(text(rightX + rightW - 60, ny, n.time, { size: 10, color: INK_DIM }));
    push(text(rightX + rightW - 30, ny, n.sent, { size: 11 }));
    push(text(rightX + 24, ny + 22, n.head, { size: 11, color: INK, width: rightW - 48 }));
    if (i < news.length - 1) {
      push(divider(rightX + 24, ny + 56, rightW - 48, GRID_LINE));
    }
  });
  push(text(rightX + 24, ry + 398, 'news feed →', { size: 11, color: ACCENT_DEEP }));
  ry += 440;

  // Fresh Funding (300h)
  add(widget(rightX, ry, rightW, 300, '💰 FRESH FUNDING', '→ funding_rounds last 7 days', { accent: SUCCESS }));
  const funding = [
    ['$275M', 'Series C', 'Notion'],
    ['$50M', 'Series B', 'Product X'],
    ['$12M', 'Seed', 'Product Y'],
    ['$8B', 'Acquisition', 'Product Z → BigCo'],
    ['$4.5M', 'Pre-seed', 'Startup A'],
  ];
  funding.forEach(([amt, round, who], i) => {
    const fy = ry + 66 + i * 42;
    push(rect(rightX + 24, fy, 72, 26, { fill: SUCCESS_SOFT, stroke: SUCCESS, strokeWidth: 1, radius: 6 }));
    push(text(rightX + 32, fy + 6, amt, { size: 12, color: SUCCESS }));
    push(text(rightX + 108, fy + 2, round, { size: 10, color: INK_LIGHT }));
    push(text(rightX + 108, fy + 16, who, { size: 12, color: INK }));
  });
  push(text(rightX + 24, ry + 278, 'funding feed →', { size: 11, color: ACCENT_DEEP }));
  ry += 320;

  // Graveyard this week (260h)
  add(widget(rightX, ry, rightW, 260, '🪦 GRAVEYARD THIS WEEK', '→ product_graveyard last 7 days', { accent: DANGER }));
  const graves = [
    { name: 'Product X', when: '3 days ago', reason: 'shutdown — ran out of runway' },
    { name: 'Product Y', when: '5 days ago', reason: 'acquired by BigCo' },
    { name: 'Product Z', when: '6 days ago', reason: 'pivoted to new category' },
  ];
  graves.forEach((g, i) => {
    const gy = ry + 66 + i * 52;
    add(avatar(rightX + 24, gy, 32));
    push(text(rightX + 66, gy + 2, g.name, { size: 13, color: INK }));
    push(text(rightX + 66, gy + 20, g.when, { size: 10, color: DANGER }));
    push(text(rightX + 66, gy + 34, g.reason, { size: 10, color: INK_LIGHT }));
  });
  push(text(rightX + 24, ry + 238, 'graveyard →', { size: 11, color: ACCENT_DEEP }));
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 3: DOSSIER (DESKTOP)
// ══════════════════════════════════════════════════════════════════════
{
  const X = 80, Y = 3520, W = 1440, H = 3460;
  add(pageFrame(X, Y, W, H, '/dossier/[slug]', 'THE premium unit. Everything known about one product. Long-scroll with sticky TOC. Monetized.'));
  add(globalHeader(X, Y, W));

  // Dossier hero (180h)
  const heroY = Y + 88;
  add(card(X + 16, heroY, W - 32, 180, { fill: SURFACE, stroke: BORDER }));
  // Logo
  push(ellipse(X + 40, heroY + 24, 120, 120, { fill: CANVAS, stroke: BORDER_STRONG, strokeWidth: 2 }));
  push(text(X + 82, heroY + 76, 'LOGO', { size: 14, color: INK_DIM }));
  // Name + tagline
  push(text(X + 184, heroY + 24, 'Product Name', { size: 34, color: INK }));
  push(text(X + 184, heroY + 68, 'Tagline line goes here — what the product does in one sentence.', { size: 14, color: INK_LIGHT }));
  // Badges
  add(pillRow(X + 184, heroY + 100, ['AI Tools', 'Note-Taking', 'Markdown Editor'], { fill: ACCENT_SOFT, stroke: ACCENT, color: ACCENT_DEEP }));
  // Status
  add(dot(X + 540, heroY + 106, SUCCESS));
  push(text(X + 556, heroY + 102, 'active', { size: 11, color: SUCCESS }));
  // Links row
  push(text(X + 184, heroY + 136, '🔗  website.com', { size: 12, color: ACCENT_DEEP }));
  push(text(X + 330, heroY + 136, '🐙  github.com/org/repo', { size: 12, color: ACCENT_DEEP }));
  push(text(X + 520, heroY + 136, '🐦  @product', { size: 12, color: ACCENT_DEEP }));
  push(text(X + 640, heroY + 136, '📖  docs', { size: 12, color: ACCENT_DEEP }));
  // Actions
  add(button(X + W - 280, heroY + 24, 120, 38, '🔖 Save', { filled: false }));
  add(button(X + W - 150, heroY + 24, 120, 38, '📤 Share', { filled: true }));
  // data src annotations
  push(text(X + W - 280, heroY + 72, '→ products JOIN companies', { size: 9, color: INK_DIM, mono: true }));
  push(text(X + W - 280, heroY + 86, '→ logo from logo_url', { size: 9, color: INK_DIM, mono: true }));

  // Quick stats strip (90h)
  const statsY = Y + 290;
  add(card(X + 16, statsY, W - 32, 80, { fill: WARNING_TINT, stroke: WARNING }));
  const stats = [
    ['Age', '6 yrs'],
    ['Funding', '$280M'],
    ['Signal', '87 ▲'],
    ['Breakout', 'YES'],
    ['Revenue', '$45M'],
    ['Employees', '247'],
    ['Lifespan', '—'],
    ['Confidence', '5/5'],
  ];
  stats.forEach(([label, value], i) => {
    const sx = X + 40 + i * 175;
    push(text(sx, statsY + 16, label, { size: 10, color: INK_LIGHT }));
    push(text(sx, statsY + 34, value, { size: 22, color: i === 3 ? DANGER : INK }));
    if (i < stats.length - 1) {
      push(line(sx + 160, statsY + 14, sx + 160, statsY + 66, { stroke: BORDER }));
    }
  });

  // Main area: sticky TOC + content
  const mainY = Y + 390;
  const tocW = 220;
  const mainColX = X + 40 + tocW + 24;
  const mainColW = W - 80 - tocW - 24;

  // Sticky TOC
  add(card(X + 20, mainY, tocW, 1080, { fill: SURFACE, stroke: BORDER }));
  push(text(X + 40, mainY + 20, '◆ TABLE OF CONTENTS', { size: 11, color: INK_LIGHT }));
  push(text(X + 40, mainY + 36, 'sticky on scroll', { size: 9, color: INK_DIM, mono: true }));
  const toc = [
    'Overview', 'Attributes', 'Dimensional scores', 'Signal charts',
    'Funding timeline', 'Revenue', 'Press mentions', 'Relationships',
    'Alternatives', 'Changelog', 'Related tasks', 'Related insights', 'Metadata',
  ];
  toc.forEach((item, i) => {
    const ty = mainY + 66 + i * 30;
    if (i === 0) {
      push(rect(X + 32, ty - 4, 3, 20, { fill: ACCENT, stroke: ACCENT, strokeWidth: 0, rounded: false }));
    }
    push(text(X + 44, ty, item, { size: 12, color: i === 0 ? ACCENT_DEEP : INK_MED }));
  });

  // Main content widgets
  let my = mainY;

  // Description + screenshots row (260h)
  add(widget(mainColX, my, mainColW, 260, '📝 DESCRIPTION + SCREENSHOTS', '→ products.description + products.screenshots[]'));
  push(text(mainColX + 28, my + 58, 'Long-form product description — 2-3 paragraphs about what the product does,', { size: 11, color: INK_LIGHT }));
  push(text(mainColX + 28, my + 74, 'history, positioning, key differentiators vs competitors, and interesting facts.', { size: 11, color: INK_LIGHT }));
  // 3 screenshots
  for (let i = 0; i < 3; i++) {
    const sx = mainColX + 28 + i * 328;
    add(card(sx, my + 100, 310, 140, { fill: SURFACE_2, stroke: BORDER }));
    push(text(sx + 120, my + 160, '[ screenshot ]', { size: 11, color: INK_DIM }));
  }
  my += 280;

  // Attribute panel (240h)
  add(widget(mainColX, my, mainColW, 240, '🏷️  ATTRIBUTE PANEL', '→ product_tags JOIN tags GROUP BY tag_group   •   controlled vocabulary'));
  const attrGroups = [
    ['Capability:', ['collaborative', 'real-time', 'ai-assist', 'offline-capable'], ACCENT_SOFT, ACCENT],
    ['Audience:', ['developers', 'solopreneurs', 'smb'], PURPLE_SOFT, PURPLE],
    ['Pricing:', ['freemium', 'has-free-tier'], SUCCESS_SOFT, SUCCESS],
    ['Deployment:', ['cloud', 'desktop-app', 'mobile-app'], WARNING_SOFT, WARNING],
    ['Integrations:', ['slack', 'notion', 'zapier', 'github'], ACCENT_SOFT, ACCENT],
    ['Compliance:', ['soc2', 'gdpr'], DANGER_SOFT, DANGER],
  ];
  attrGroups.forEach(([label, tags, bg, color], i) => {
    const ay = my + 60 + i * 28;
    push(text(mainColX + 28, ay + 4, label, { size: 11, color: INK_LIGHT }));
    add(pillRow(mainColX + 138, ay, tags, { fill: bg, stroke: color, color: color, size: 10 }));
  });
  my += 260;

  // Dimensional scores + Signal charts row (340h)
  // Radar
  add(widget(mainColX, my, mainColW / 2 - 12, 340, '📊 DIMENSIONAL SCORES', '→ products.functionality_scores JSONB'));
  const radarCx = mainColX + (mainColW / 2 - 12) / 2;
  const radarCy = my + 190;
  add(radarChart(radarCx, radarCy, 100, [0.8, 1.0, 0.6, 0.8, 1.0, 0.8, 0.6, 1.0],
    ['Ease', 'Features', 'Value', 'Support', 'Perf', 'Docs', 'Mobile', 'Integr'], { color: ACCENT }));

  // Signal charts 2×2
  const schartX = mainColX + mainColW / 2 + 12;
  const schartW = mainColW / 2 - 12;
  add(widget(schartX, my, schartW, 340, '🔥 SIGNAL CHARTS', '→ social_mentions + product_signal_scores'));
  const cellW = (schartW - 72) / 2;
  const cellH = 110;
  // Cell 1: Mention volume (stacked bar)
  const series1 = Array.from({ length: 8 }, (_, i) => [
    3 + Math.sin(i * 0.5) * 2 + i * 0.3,
    2 + Math.cos(i * 0.7) * 1.5 + i * 0.2,
    1 + Math.sin(i * 0.3) * 1 + i * 0.1,
  ]);
  add(stackedBarChart(schartX + 24, my + 60, cellW, cellH, series1,
    [ACCENT, PURPLE, SUCCESS]));
  push(text(schartX + 28, my + 180, 'Mentions by platform', { size: 10, color: INK_MED }));
  // Cell 2: Sentiment trend
  add(lineChart(schartX + 40 + cellW, my + 60, cellW, cellH,
    [0.3, 0.4, 0.5, 0.45, 0.55, 0.65, 0.7, 0.72], { color: SUCCESS, area: true, areaFill: SUCCESS_SOFT }));
  push(text(schartX + 44 + cellW, my + 180, '30-day sentiment rolling', { size: 10, color: INK_MED }));
  // Cell 3: Velocity
  add(lineChart(schartX + 24, my + 210, cellW, cellH,
    [2, 3, 5, 4, 7, 12, 18, 24], { color: DANGER, area: true, areaFill: DANGER_SOFT, dots: true }));
  push(text(schartX + 28, my + 330, 'Velocity (WoW)', { size: 10, color: INK_MED }));
  // Cell 4: Platform mix donut
  add(donutChart(schartX + 40 + cellW + cellW / 2, my + 265, 48, 22,
    [0.35, 0.25, 0.20, 0.15, 0.05], [ACCENT, DANGER, WARNING, SUCCESS, PURPLE]));
  push(text(schartX + 40 + cellW + 6, my + 330, 'Platform mix', { size: 10, color: INK_MED }));

  my += 360;

  // Funding timeline (260h)
  add(widget(mainColX, my, mainColW, 260, '💰 FUNDING & VALUATION TIMELINE', '→ funding_rounds + valuation_snapshots   •   dual-axis'));
  const tlX = mainColX + 40;
  const tlY = my + 170;
  const tlW = mainColW - 80;
  push(line(tlX, tlY, tlX + tlW, tlY, { stroke: BORDER_STRONG, strokeWidth: 2 }));
  // Tick marks
  const fundingPoints = [
    { frac: 0.05, label: 'Seed $2M', year: '2019' },
    { frac: 0.25, label: 'Series A $12M', year: '2020' },
    { frac: 0.5, label: 'Series B $50M', year: '2022' },
    { frac: 0.75, label: 'Series C $150M', year: '2024' },
    { frac: 0.95, label: 'Series D $275M', year: '2026' },
  ];
  fundingPoints.forEach(fp => {
    const dx = tlX + tlW * fp.frac;
    push(ellipse(dx - 8, tlY - 8, 16, 16, { fill: SUCCESS, stroke: SUCCESS, strokeWidth: 0 }));
    push(text(dx - 44, tlY - 40, fp.label, { size: 10, color: INK }));
    push(text(dx - 12, tlY + 20, fp.year, { size: 10, color: INK_LIGHT }));
  });
  // Valuation line overlay
  const valuationPoints = [50, 200, 800, 3200, 10000];
  const valX = fundingPoints.map(f => tlX + tlW * f.frac);
  const valMax = Math.max(...valuationPoints);
  const valY = valuationPoints.map(v => my + 120 - (v / valMax) * 50);
  for (let i = 0; i < valX.length - 1; i++) {
    push(line(valX[i], valY[i], valX[i + 1], valY[i + 1], {
      stroke: WARNING, strokeWidth: 2, strokeStyle: 'dashed',
    }));
  }
  // Legend
  push(rect(mainColX + mainColW - 180, my + 58, 160, 40, { fill: SURFACE, stroke: BORDER, radius: 6 }));
  push(ellipse(mainColX + mainColW - 170, my + 66, 10, 10, { fill: SUCCESS, stroke: SUCCESS, strokeWidth: 0 }));
  push(text(mainColX + mainColW - 154, my + 64, 'funding round', { size: 10, color: INK_MED }));
  push(line(mainColX + mainColW - 172, my + 84, mainColX + mainColW - 160, my + 84, { stroke: WARNING, strokeWidth: 2, strokeStyle: 'dashed' }));
  push(text(mainColX + mainColW - 154, my + 80, 'valuation →', { size: 10, color: INK_MED }));

  my += 280;

  // Press mentions + Relationships row (280h)
  const pressW = mainColW * 0.6 - 12;
  add(widget(mainColX, my, pressW, 280, '📰 PRESS MENTIONS', '→ press_mentions WHERE product_id'));
  const press = [
    ['TechCrunch', '2024-03', '"Product X raises $50M in Series B led by a16z"', '😊'],
    ['The Verge', '2024-01', '"Product X vs Notion: which note app wins in 2024?"', '😐'],
    ['Hacker News', '2023-11', '"Show HN: I built Product X in 6 months" [+342]', '😊'],
    ['Wired', '2023-08', '"The return of the markdown note-taker"', '😊'],
  ];
  press.forEach(([src, date, head, sent], i) => {
    const py = my + 64 + i * 50;
    add(dot(mainColX + 28, py + 6, ACCENT));
    push(text(mainColX + 42, py, src, { size: 11, color: ACCENT_DEEP }));
    push(text(mainColX + 132, py, date, { size: 10, color: INK_DIM, mono: true }));
    push(text(mainColX + pressW - 36, py, sent, { size: 11 }));
    push(text(mainColX + 28, py + 20, head, { size: 11, color: INK, width: pressW - 60 }));
    if (i < press.length - 1) {
      push(divider(mainColX + 28, py + 42, pressW - 56, GRID_LINE));
    }
  });

  const graphX = mainColX + pressW + 24;
  const graphW = mainColW - pressW - 24;
  add(widget(graphX, my, graphW, 280, '🕸️  RELATIONSHIPS', '→ product_relationships   •   mini force-graph'));
  // Central node
  const gcx = graphX + graphW / 2;
  const gcy = my + 170;
  push(ellipse(gcx - 22, gcy - 22, 44, 44, { fill: ACCENT, stroke: ACCENT_DEEP, strokeWidth: 2 }));
  push(text(gcx - 15, gcy - 8, 'THIS', { size: 11, color: CANVAS }));
  const neighbors = [
    { dx: -110, dy: -60, name: 'Notion', rel: 'competes' },
    { dx: 110, dy: -60, name: 'Obsidian', rel: 'inspired' },
    { dx: -100, dy: 70, name: 'Roam', rel: 'killed' },
    { dx: 100, dy: 70, name: 'Craft', rel: 'competes' },
  ];
  neighbors.forEach(n => {
    const nx = gcx + n.dx;
    const ny = gcy + n.dy;
    push(line(gcx, gcy, nx, ny, { stroke: BORDER_STRONG, strokeWidth: 1.5 }));
    push(ellipse(nx - 18, ny - 18, 36, 36, { fill: SURFACE, stroke: BORDER_STRONG, strokeWidth: 1.5 }));
    push(text(nx - 15, ny - 6, n.name.slice(0, 5), { size: 9, color: INK_MED }));
    push(text(nx - 22, ny + 22, n.rel, { size: 9, color: INK_DIM }));
  });
  push(text(graphX + 28, my + 256, 'open in Explore →', { size: 10, color: ACCENT_DEEP }));

  my += 300;

  // Alternatives + Changelog row (200h)
  const altW = mainColW * 0.62 - 12;
  add(widget(mainColX, my, altW, 200, '🔄 ALTERNATIVES', '→ same primary_function_id ORDER BY attribute overlap'));
  for (let i = 0; i < 4; i++) {
    const ax = mainColX + 28 + i * 170;
    add(productCardMock(ax, my + 60, 156, 120, {
      name: `Alt ${i + 1}`, tag: 'similar tool', cat: 'Notes', score: 72 - i * 5,
      spark: [3, 4, 5, 5, 6, 6, 7],
    }));
  }
  const chgX = mainColX + altW + 24;
  const chgW = mainColW - altW - 24;
  add(widget(chgX, my, chgW, 200, '📜 CHANGELOG', '→ product_changelog audit trail'));
  const changelog = [
    ['2024-03', 'acquired by BigCo'],
    ['2023-09', 'pivoted from X to Y'],
    ['2022-05', 'launched public API'],
    ['2021-01', 'raised Series B'],
    ['2019-08', 'first version shipped'],
  ];
  changelog.forEach(([when, what], i) => {
    const cy = my + 64 + i * 28;
    push(ellipse(chgX + 28, cy + 4, 8, 8, { fill: ACCENT, stroke: ACCENT, strokeWidth: 0 }));
    push(text(chgX + 44, cy, when, { size: 10, mono: true, color: INK_DIM }));
    push(text(chgX + 108, cy, what, { size: 11, color: INK }));
  });
  my += 220;

  // Tasks + insights + metadata (bottom footer)
  add(widget(mainColX, my, mainColW, 180, '🎯 RELATED TASKS  +  📖 INSIGHTS  +  ℹ️  METADATA', '→ task_search_tags → /tools-to/  •  insights WHERE mentions_product  •  data freshness'));
  push(text(mainColX + 28, my + 62, 'Tasks:', { size: 11, color: INK_LIGHT }));
  add(pillRow(mainColX + 90, my + 58, ['→ write documentation', '→ take meeting notes', '→ sync across devices', '→ search my knowledge base'], { fill: WARNING_SOFT, stroke: WARNING, color: INK, size: 10 }));
  push(text(mainColX + 28, my + 98, 'Insights:', { size: 11, color: INK_LIGHT }));
  push(text(mainColX + 90, my + 98, '• "The markdown wars of 2022" — PRODUCT_NAME Research', { size: 11, color: ACCENT_DEEP }));
  push(divider(mainColX + 28, my + 128, mainColW - 56, BORDER));
  push(text(mainColX + 28, my + 140, 'Source: product_hunt   •   Confidence 5/5   •   Last verified 2h ago   •   47 data points', { size: 10, color: INK_DIM, mono: true }));
}

// ══════════════════════════════════════════════════════════════════════
// ROUND 2 — Remaining 8 desktop pages
// Arranged in a second column to the right of Round 1
// ══════════════════════════════════════════════════════════════════════

const R2_X = 1720; // second column x offset

// ══════════════════════════════════════════════════════════════════════
// SECTION 4: MARKETS (Bloomberg analytics)
// ══════════════════════════════════════════════════════════════════════
{
  const X = R2_X, Y = 100, W = 1440, H = 2700;
  add(pageFrame(X, Y, W, H, '/markets', 'Bloomberg-style market analytics. $ aggregations across categories, attributes, functions, time. THE moat.'));
  add(globalHeader(X, Y, W));

  // Filter bar
  const filterY = Y + 88;
  add(card(X + 16, filterY, W - 32, 52, { fill: SURFACE, stroke: BORDER }));
  push(text(X + 32, filterY + 20, 'MARKETS — Tech Product Intelligence Layer', { size: 14, color: INK }));
  add(button(X + 560, filterY + 12, 110, 28, 'Category ▾', { filled: false, size: 11 }));
  add(button(X + 680, filterY + 12, 110, 28, 'Attribute ▾', { filled: false, size: 11 }));
  add(button(X + 800, filterY + 12, 120, 28, 'Time range ▾', { filled: false, size: 11 }));
  add(button(X + W - 160, filterY + 12, 130, 28, '↓ Export CSV', { filled: true, size: 11 }));

  let my = filterY + 72;

  // Category heatmap (full width, 300h)
  add(widget(X + 16, my, W - 32, 300, '🗺️  CATEGORY × TIME HEATMAP', '→ market_size_snapshots scope_type=category   •   cell color = total VC $ invested'));
  const hmX = X + 140, hmY = my + 68, hmW = W - 200, hmH = 200;
  // Year labels (x)
  const hmYears = ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];
  const hmCats = ['AI Tools', 'Dev Tools', 'Productivity', 'Design', 'Marketing', 'Finance', 'Security', 'Data'];
  hmYears.forEach((y, i) => {
    const lx = hmX + (i * hmW) / hmYears.length + (hmW / hmYears.length) / 2 - 12;
    push(text(lx, hmY - 16, y, { size: 10, color: INK_LIGHT }));
  });
  // Category labels (y)
  hmCats.forEach((c, i) => {
    const ly = hmY + (i * hmH) / hmCats.length + (hmH / hmCats.length) / 2 - 5;
    push(text(X + 32, ly, c, { size: 10, color: INK_MED }));
  });
  // Heatmap data
  const hmData = [
    [0.2, 0.3, 0.5, 0.8, 0.9, 1.0, 1.0, 1.0],  // AI Tools
    [0.5, 0.6, 0.7, 0.8, 0.7, 0.7, 0.8, 0.9],  // Dev Tools
    [0.6, 0.7, 0.8, 0.7, 0.5, 0.4, 0.3, 0.3],  // Productivity
    [0.5, 0.6, 0.7, 0.8, 0.7, 0.6, 0.5, 0.5],  // Design
    [0.4, 0.5, 0.6, 0.6, 0.5, 0.4, 0.4, 0.4],  // Marketing
    [0.6, 0.7, 0.8, 0.9, 0.6, 0.5, 0.5, 0.6],  // Finance
    [0.5, 0.5, 0.6, 0.7, 0.8, 0.8, 0.8, 0.9],  // Security
    [0.4, 0.5, 0.6, 0.7, 0.7, 0.8, 0.8, 0.8],  // Data
  ];
  add(heatmap(hmX, hmY, hmW, hmH, hmData));
  // Legend
  push(text(X + W - 280, my + 276, 'less $  ', { size: 10, color: INK_DIM }));
  for (let i = 0; i < 5; i++) {
    const shades = [SURFACE, ACCENT_TINT, ACCENT_SOFT, '#7dd3fc', ACCENT];
    push(rect(X + W - 216 + i * 16, my + 276, 14, 14, { fill: shades[i], stroke: BORDER, strokeWidth: 0.5 }));
  }
  push(text(X + W - 140, my + 276, '  more $', { size: 10, color: INK_DIM }));

  my += 320;

  // Row: Funding velocity leaderboard + Lifecycle curves (360h)
  add(widget(X + 16, my, W / 2 - 24, 360, '💰 FUNDING VELOCITY (last 90d)', '→ SUM(funding_rounds.amount_usd) last 90d GROUP BY category', { accent: SUCCESS }));
  const lbCats = [
    ['AI Tools', '$4.2B', 1.0],
    ['Dev Tools', '$1.8B', 0.42],
    ['Fintech', '$1.5B', 0.36],
    ['Security', '$900M', 0.21],
    ['Design', '$400M', 0.10],
    ['Data', '$350M', 0.08],
  ];
  lbCats.forEach(([cat, amt, frac], i) => {
    const ly = my + 74 + i * 44;
    push(text(X + 36, ly + 4, `${i + 1}.`, { size: 13, color: INK_MED, mono: true }));
    push(text(X + 64, ly + 4, cat, { size: 13, color: INK }));
    // bar
    push(rect(X + 200, ly + 6, 380 * frac, 18, { fill: SUCCESS_SOFT, stroke: SUCCESS, strokeWidth: 1, radius: 4 }));
    push(text(X + 200 + 380 * frac + 8, ly + 6, amt, { size: 12, color: SUCCESS }));
  });

  add(widget(X + W / 2 + 8, my, W / 2 - 24, 360, '📊 CATEGORY LIFECYCLE CURVES', '→ market_size_snapshots.active_product_count per year per category', { accent: WARNING }));
  const lcX = X + W / 2 + 40, lcY = my + 88, lcW = W / 2 - 88, lcH = 240;
  const lcSeries = [
    [5, 10, 15, 25, 40, 60, 85, 110, 130, 140, 145],  // Notes
    [3, 5, 8, 15, 28, 45, 62, 75, 85, 92, 95],        // CRM
    [20, 35, 45, 55, 60, 55, 48, 38, 28, 20, 15],     // Word processors (declining)
  ];
  add(multiLineChart(lcX, lcY, lcW, lcH, lcSeries, [ACCENT, SUCCESS, DANGER]));
  // Legend
  push(text(lcX + 10, lcY + 10, '━━ Notes', { size: 10, color: ACCENT }));
  push(text(lcX + 10, lcY + 26, '━━ CRM', { size: 10, color: SUCCESS }));
  push(text(lcX + 10, lcY + 42, '━━ Word processors', { size: 10, color: DANGER }));
  push(text(lcX, lcY + lcH + 8, '1990', { size: 10, color: INK_LIGHT }));
  push(text(lcX + lcW - 30, lcY + lcH + 8, '2026', { size: 10, color: INK_LIGHT }));

  my += 380;

  // Row: Survival curves + Attribute market share (320h)
  add(widget(X + 16, my, W / 2 - 24, 320, '📉 SURVIVAL CURVES (by cohort year)', '→ Kaplan-Meier of products.launched_year × discontinued_year'));
  const scX = X + 56, scY = my + 80, scW = W / 2 - 120, scH = 200;
  const scSeries = [
    [100, 90, 78, 62, 48, 38, 30, 24],  // 2015 cohort
    [100, 92, 82, 70, 58, 48, 40, 34],  // 2018
    [100, 94, 86, 76, 66, 56, 48, 42],  // 2020
    [100, 96, 90, 82, 72, 64, 56, 50],  // 2022
  ];
  add(multiLineChart(scX, scY, scW, scH, scSeries, [DANGER, WARNING, ACCENT, SUCCESS]));
  push(text(scX, scY + scH + 8, '0 mo', { size: 10, color: INK_LIGHT }));
  push(text(scX + scW - 40, scY + scH + 8, '60 mo', { size: 10, color: INK_LIGHT }));
  push(text(scX + scW + 10, scY + 10, '━ 2015', { size: 9, color: DANGER }));
  push(text(scX + scW + 10, scY + 24, '━ 2018', { size: 9, color: WARNING }));
  push(text(scX + scW + 10, scY + 38, '━ 2020', { size: 9, color: ACCENT }));
  push(text(scX + scW + 10, scY + 52, '━ 2022', { size: 9, color: SUCCESS }));

  add(widget(X + W / 2 + 8, my, W / 2 - 24, 320, '🎯 ATTRIBUTE MARKET SHARE', '→ market_size_snapshots scope_type=attribute   •   open-source vs proprietary $'));
  const amX = X + W / 2 + 48, amY = my + 80, amW = W / 2 - 112, amH = 200;
  // Stacked area (approximated with stacked bars)
  const amYears = 10;
  const amData = [];
  for (let i = 0; i < amYears; i++) {
    amData.push([20 + i * 8, 80 - i * 3]); // open-source growing, proprietary shrinking
  }
  add(stackedBarChart(amX, amY, amW, amH, amData, [SUCCESS, INK_MED]));
  push(text(amX, amY + amH + 8, '2016', { size: 10, color: INK_LIGHT }));
  push(text(amX + amW - 30, amY + amH + 8, '2026', { size: 10, color: INK_LIGHT }));
  push(rect(amX, amY + amH + 30, 12, 12, { fill: SUCCESS, stroke: SUCCESS, strokeWidth: 0 }));
  push(text(amX + 18, amY + amH + 30, 'open-source $', { size: 10, color: INK_MED }));
  push(rect(amX + 130, amY + amH + 30, 12, 12, { fill: INK_MED, stroke: INK_MED, strokeWidth: 0 }));
  push(text(amX + 148, amY + amH + 30, 'proprietary $', { size: 10, color: INK_MED }));

  my += 340;

  // Acquisition tracker (300h)
  add(widget(X + 16, my, W - 32, 300, '🛒 ACQUISITION TRACKER', '→ acquisitions ORDER BY price_usd DESC  •  M&A feed'));
  // Table header
  const tblX = X + 40, tblY = my + 70;
  const colW = [160, 160, 120, 100, 80, 140, 140];
  const colLabels = ['Acquired', 'Acquirer', 'Price', 'Type', 'Year', 'Outcome', 'Link'];
  let tx = tblX;
  colLabels.forEach((lbl, i) => {
    push(text(tx, tblY, lbl, { size: 10, color: INK_LIGHT }));
    tx += colW[i];
  });
  push(divider(tblX, tblY + 20, W - 80, BORDER));
  // Rows
  const acqs = [
    ['Figma', 'Adobe', '$20B', 'full', '2024', 'spun out', 'source'],
    ['Slack', 'Salesforce', '$27.7B', 'full', '2021', 'integrated', 'source'],
    ['GitHub', 'Microsoft', '$7.5B', 'full', '2018', 'autonomous', 'source'],
    ['Heroku', 'Salesforce', '$212M', 'full', '2010', 'active', 'source'],
    ['Product X', 'BigCo', '$500M', 'full', '2024', 'integrated', 'source'],
  ];
  acqs.forEach((row, i) => {
    const ry = tblY + 36 + i * 32;
    let rx = tblX;
    row.forEach((cell, j) => {
      const color = j === 2 ? SUCCESS : j === 6 ? ACCENT_DEEP : INK;
      push(text(rx, ry, cell, { size: 11, color }));
      rx += colW[j];
    });
    if (i < acqs.length - 1) {
      push(divider(tblX, ry + 20, W - 80, GRID_LINE));
    }
  });

  my += 320;

  // Breakout history (280h)
  add(widget(X + 16, my, W - 32, 280, '⚡ BREAKOUT HISTORY (time-series)', '→ product_signal_scores GROUP BY score_date COUNT(is_breakout)'));
  const bhX = X + 48, bhY = my + 80, bhW = W - 128, bhH = 160;
  const bhData = Array.from({ length: 60 }, (_, i) =>
    3 + Math.sin(i * 0.3) * 2 + Math.cos(i * 0.17) * 1.5 + Math.random() * 2
  );
  add(barChart(bhX, bhY, bhW, bhH, bhData, { color: DANGER, gap: 1 }));
  push(text(bhX, bhY + bhH + 10, 'Jan', { size: 10, color: INK_LIGHT }));
  push(text(bhX + bhW * 0.17, bhY + bhH + 10, 'Feb', { size: 10, color: INK_LIGHT }));
  push(text(bhX + bhW * 0.33, bhY + bhH + 10, 'Mar', { size: 10, color: INK_LIGHT }));
  push(text(bhX + bhW * 0.5, bhY + bhH + 10, 'Apr', { size: 10, color: INK_LIGHT }));
  push(text(bhX + bhW * 0.67, bhY + bhH + 10, 'May', { size: 10, color: INK_LIGHT }));
  push(text(bhX + bhW * 0.83, bhY + bhH + 10, 'Jun', { size: 10, color: INK_LIGHT }));
  push(text(bhX, bhY - 20, '# products hitting breakout per day', { size: 10, color: INK_LIGHT }));
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 5: PRODUCTS BROWSE (faceted filter)
// ══════════════════════════════════════════════════════════════════════
{
  const X = R2_X, Y = 3000, W = 1440, H = 1900;
  add(pageFrame(X, Y, W, H, '/products', 'Faceted browse + filter with attribute taxonomy sidebar. The search entry point.'));
  add(globalHeader(X, Y, W));

  // Top bar
  const topY = Y + 88;
  add(card(X + 16, topY, W - 32, 56, { fill: CANVAS, stroke: BORDER }));
  // Search
  push(rect(X + 32, topY + 12, 460, 32, { fill: SURFACE, stroke: BORDER, radius: 8 }));
  push(text(X + 44, topY + 20, '🔍  Search 2,847 products, companies, functions…', { size: 12, color: INK_DIM }));
  // Sort + view controls (right)
  add(button(X + W - 420, topY + 12, 110, 32, 'Sort: Buzz ▾', { filled: false, size: 11 }));
  add(button(X + W - 300, topY + 12, 100, 32, 'Filter ▾', { filled: false, size: 11 }));
  add(button(X + W - 190, topY + 12, 60, 32, 'Grid', { filled: true, size: 11 }));
  add(button(X + W - 120, topY + 12, 60, 32, 'List', { filled: false, size: 11 }));
  // Active filters chips
  push(text(X + 32, topY + 66, 'Active filters:', { size: 11, color: INK_LIGHT }));
  add(pillRow(X + 132, topY + 62, ['AI Tools ×', 'freemium ×', 'soc2 ×'], { fill: ACCENT_SOFT, stroke: ACCENT, color: ACCENT_DEEP }));
  push(text(X + 420, topY + 66, 'clear all', { size: 11, color: DANGER }));

  // Main content: filter sidebar + product grid
  const mainY = topY + 100;
  const filterX = X + 16;
  const filterW = 280;
  const gridX = filterX + filterW + 16;
  const gridW = W - 32 - filterW - 16;

  // Filter sidebar
  add(card(filterX, mainY, filterW, 1560, { fill: SURFACE, stroke: BORDER }));
  push(text(filterX + 20, mainY + 20, '🎛️  FILTERS', { size: 14, color: INK }));

  // Taxonomy tree
  push(text(filterX + 20, mainY + 60, 'TAXONOMY', { size: 10, color: INK_LIGHT }));
  const taxonomy = [
    ['▾ Category', false],
    ['    ☑ AI Tools  (847)', true],
    ['    ☐ Dev Tools  (612)', false],
    ['    ☐ Productivity  (495)', false],
    ['    ☐ Design  (302)', false],
    ['    ☐ Marketing  (218)', false],
    ['  + 9 more…', false],
    ['▾ Sub-category', false],
    ['    ☐ Code Editors', false],
    ['    ☐ Note-Taking', false],
    ['    ☐ CRM', false],
    ['    ☐ Vector DBs', false],
    ['▾ Function', false],
    ['    (search leaf)', false],
  ];
  taxonomy.forEach((row, i) => {
    const ty = mainY + 84 + i * 24;
    const [label, active] = row;
    push(text(filterX + 20, ty, label, { size: 11, color: active ? ACCENT_DEEP : INK_MED }));
  });

  // Attribute facets
  push(text(filterX + 20, mainY + 510, 'ATTRIBUTES', { size: 10, color: INK_LIGHT }));
  const attrGroups = [
    '▾ Capability (10 vals)',
    '    ☑ collaborative',
    '    ☐ real-time',
    '    ☐ offline-capable',
    '▾ Pricing',
    '    ☑ freemium',
    '    ☐ paid-only',
    '    ☐ open-source',
    '▸ Audience',
    '▸ Deployment',
    '▸ Integration',
    '▸ Compliance',
    '▸ Tech stack',
    '▸ Data format',
    '▸ UX pattern',
    '▸ Business model',
  ];
  attrGroups.forEach((row, i) => {
    const ty = mainY + 534 + i * 24;
    push(text(filterX + 20, ty, row, { size: 11, color: INK_MED }));
  });

  // Metadata
  push(text(filterX + 20, mainY + 960, 'METADATA', { size: 10, color: INK_LIGHT }));
  push(text(filterX + 20, mainY + 984, 'Status:', { size: 11, color: INK_MED }));
  push(text(filterX + 40, mainY + 1004, '● active  ○ dead  ○ acquired', { size: 11, color: INK_MED }));
  push(text(filterX + 20, mainY + 1034, 'Launched year:', { size: 11, color: INK_MED }));
  push(rect(filterX + 20, mainY + 1056, 240, 6, { fill: ACCENT_SOFT, stroke: ACCENT, strokeWidth: 0, radius: 3 }));
  push(ellipse(filterX + 56, mainY + 1052, 14, 14, { fill: ACCENT, stroke: ACCENT, strokeWidth: 0 }));
  push(ellipse(filterX + 200, mainY + 1052, 14, 14, { fill: ACCENT, stroke: ACCENT, strokeWidth: 0 }));
  push(text(filterX + 20, mainY + 1080, '1990 — 2026', { size: 10, color: INK_LIGHT }));

  push(text(filterX + 20, mainY + 1114, 'Total funding:', { size: 11, color: INK_MED }));
  push(rect(filterX + 20, mainY + 1136, 240, 6, { fill: SUCCESS_SOFT, stroke: SUCCESS, strokeWidth: 0, radius: 3 }));
  push(ellipse(filterX + 80, mainY + 1132, 14, 14, { fill: SUCCESS, stroke: SUCCESS, strokeWidth: 0 }));
  push(text(filterX + 20, mainY + 1160, '$1M — $10B', { size: 10, color: INK_LIGHT }));

  add(button(filterX + 20, mainY + 1200, 240, 36, 'Apply filters', { filled: true }));
  add(button(filterX + 20, mainY + 1246, 240, 32, 'Reset all', { filled: false }));

  // Product grid (4 cols × 6 rows)
  push(text(gridX + 4, mainY + 16, 'Showing 1–24 of 2,847', { size: 11, color: INK_LIGHT }));
  const cardW = (gridW - 48) / 4;
  const cardH = 160;
  for (let i = 0; i < 24; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const cx = gridX + col * (cardW + 16);
    const cy = mainY + 40 + row * (cardH + 16);
    add(productCardMock(cx, cy, cardW, cardH, {
      name: `Product ${i + 1}`,
      tag: 'tagline fragment here',
      cat: ['AI', 'Dev', 'Prod', 'Des'][col],
      score: 95 - i * 3,
      spark: [3, 4, 5, 4, 6, 7, 8],
    }));
  }

  // Pagination
  const pagY = mainY + 40 + 6 * (cardH + 16);
  push(text(gridX + gridW / 2 - 100, pagY + 20, '←  1  2  3  4  …  119  →', { size: 12, color: INK_MED }));
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 6: INSIGHTS DETAIL (with Obsidian-style graph)
// ══════════════════════════════════════════════════════════════════════
{
  const X = R2_X, Y = 5100, W = 1440, H = 2200;
  add(pageFrame(X, Y, W, H, '/insights/[slug]', 'Article reader with Obsidian-style force graph showing product relationships in the article'));
  add(globalHeader(X, Y, W));

  // Breadcrumb
  push(text(X + 32, Y + 88, '←  Insights  /  Trend Report', { size: 11, color: ACCENT_DEEP }));

  // Main 2-col layout
  const mainY = Y + 116;
  const contentX = X + 32;
  const contentW = W - 32 - 500 - 16;
  const sideX = contentX + contentW + 16;
  const sideW = 500;

  // Article header + body
  push(text(contentX, mainY + 8, 'TREND REPORT', { size: 10, color: WARNING }));
  push(text(contentX, mainY + 32, 'The Markdown Wars of 2022: Obsidian vs Notion', { size: 28, color: INK }));
  push(text(contentX, mainY + 80, 'How a group of indie developers rebuilt note-taking from first principles', { size: 13, color: INK_LIGHT, width: contentW }));
  // Metadata
  push(text(contentX, mainY + 116, 'by Prism Research  •  12 min read  •  Mar 15, 2024', { size: 11, color: INK_DIM }));
  add(button(contentX + 320, mainY + 110, 90, 28, '🔖 Save', { filled: false, size: 11 }));
  add(button(contentX + 418, mainY + 110, 100, 28, '📤 Share', { filled: false, size: 11 }));

  // Cover image
  add(card(contentX, mainY + 156, contentW, 240, { fill: SURFACE_2, stroke: BORDER }));
  push(text(contentX + contentW / 2 - 60, mainY + 270, '[ cover image ]', { size: 13, color: INK_DIM }));

  // Article body
  const bodyY = mainY + 420;
  const paragraphs = [
    ['h2', 'The 2022 shift'],
    ['p', 'In early 2022, something unexpected happened in the note-taking market. For years, Notion had been the dominant player — a beautifully-designed, VC-funded, all-in-one workspace that absorbed productivity tools one by one…'],
    ['p', 'But underneath the surface, a different movement was gathering. Obsidian, a scrappy indie tool built by a two-person team in Toronto, was quietly winning over knowledge workers, academics, and developers…'],
    ['h2', 'Notion\'s moat'],
    ['p', 'Notion\'s early success came from a key insight: content should be structured like a database but read like a document. Blocks, relations, filters — these were primitives powerful enough to build anything…'],
    ['blockquote', '"Obsidian feels like a personal extension of your mind. Notion feels like a team tool that happens to support individuals." — Cory Wilkerson, 2023'],
    ['p', 'The crack in Notion\'s armor wasn\'t features. It was speed, ownership, and the vibes of indie software. Obsidian was fast, local-first, file-based…'],
  ];
  let py = bodyY;
  paragraphs.forEach(([kind, content]) => {
    if (kind === 'h2') {
      push(text(contentX, py, content, { size: 18, color: INK }));
      py += 32;
    } else if (kind === 'p') {
      push(text(contentX, py, content, { size: 12, color: INK_MED, width: contentW }));
      py += 56;
    } else if (kind === 'blockquote') {
      push(rect(contentX, py, 4, 40, { fill: ACCENT, stroke: ACCENT, strokeWidth: 0, rounded: false }));
      push(text(contentX + 16, py + 4, content, { size: 13, color: INK_MED, width: contentW - 20 }));
      py += 60;
    }
  });

  // Right sidebar
  let sy = mainY;

  // TOC
  add(widget(sideX, sy, sideW, 200, '📚 TABLE OF CONTENTS', 'sticky on scroll'));
  const tocArticle = ['Introduction', 'The 2022 shift', 'Notion\'s moat', 'Obsidian\'s comeback', 'What changed in 2023', 'Looking ahead', 'References'];
  tocArticle.forEach((item, i) => {
    push(text(sideX + 28, sy + 66 + i * 18, `• ${item}`, { size: 11, color: i === 1 ? ACCENT_DEEP : INK_MED }));
  });
  sy += 220;

  // Featured products
  add(widget(sideX, sy, sideW, 260, '🏷️  FEATURED PRODUCTS', '→ insights.featured_product_ids[]'));
  const featured = [
    { name: 'Notion', tag: 'All-in-one workspace', cat: 'Prod', score: 91 },
    { name: 'Obsidian', tag: 'Local-first knowledge', cat: 'Prod', score: 87 },
    { name: 'Roam Research', tag: 'Networked thought', cat: 'Prod', score: 72 },
    { name: 'Craft', tag: 'Beautiful docs', cat: 'Prod', score: 68 },
  ];
  featured.forEach((f, i) => {
    add(productRowMock(sideX + 20, sy + 64 + i * 46, sideW - 40, 42, {
      name: f.name, tag: f.tag, rightLabel: 'buzz', rightValue: `${f.score} ▲`, rightColor: SUCCESS,
    }));
  });
  sy += 280;

  // ★ Obsidian-style product relationship graph ★
  add(widget(sideX, sy, sideW, 360, '🕸️  PRODUCT RELATIONSHIP GRAPH', '→ product_relationships WHERE featured   •   sigma.js force-directed', { accent: PURPLE }));
  // Canvas
  add(card(sideX + 24, sy + 60, sideW - 48, 270, { fill: '#0f172a', stroke: BORDER_STRONG }));
  // Graph nodes — dark canvas Obsidian-style
  const graphCx = sideX + sideW / 2;
  const graphCy = sy + 195;
  const graphNodes = [
    { x: graphCx - 90, y: graphCy - 50, label: 'Notion', size: 24, color: ACCENT },
    { x: graphCx + 90, y: graphCy - 50, label: 'Obsidian', size: 26, color: SUCCESS },
    { x: graphCx - 120, y: graphCy + 60, label: 'Roam', size: 18, color: WARNING },
    { x: graphCx + 120, y: graphCy + 60, label: 'Craft', size: 16, color: WARNING },
    { x: graphCx, y: graphCy + 100, label: 'Logseq', size: 14, color: WARNING },
    { x: graphCx - 180, y: graphCy + 20, label: 'Evernote', size: 14, color: DANGER },
    { x: graphCx, y: graphCy - 100, label: 'Zettlr', size: 12, color: WARNING },
  ];
  // Edges
  const edges = [
    [0, 1], [0, 2], [0, 3], [1, 2], [1, 4], [0, 5], [5, 0], [2, 4], [1, 6],
  ];
  edges.forEach(([a, b]) => {
    push(line(graphNodes[a].x, graphNodes[a].y, graphNodes[b].x, graphNodes[b].y, {
      stroke: '#334155', strokeWidth: 1,
    }));
  });
  // Nodes
  graphNodes.forEach(n => {
    push(ellipse(n.x - n.size / 2, n.y - n.size / 2, n.size, n.size, {
      fill: n.color, stroke: n.color, strokeWidth: 0,
    }));
    push(text(n.x - n.label.length * 3, n.y + n.size / 2 + 4, n.label, {
      size: 9, color: '#e2e8f0',
    }));
  });
  // Legend
  push(text(sideX + 32, sy + 64 + 280, 'nodes: products in article', { size: 9, color: INK_DIM }));
  push(text(sideX + 32, sy + 64 + 294, 'edges: competed_with, inspired, killed', { size: 9, color: INK_DIM }));
  push(text(sideX + sideW - 120, sy + 64 + 280, 'click → dossier', { size: 9, color: ACCENT_DEEP }));
  push(text(sideX + sideW - 120, sy + 64 + 294, 'open in Explore →', { size: 9, color: ACCENT_DEEP }));
  sy += 380;

  // Related signal chart
  add(widget(sideX, sy, sideW, 260, '📊 RELATED SIGNAL', 'Note-taking mention volume 2019→2026'));
  add(stackedBarChart(sideX + 28, sy + 72, sideW - 56, 140,
    [[2, 3, 1], [4, 4, 2], [6, 5, 3], [8, 7, 4], [10, 9, 5], [12, 11, 6], [14, 10, 5], [13, 8, 4]],
    [ACCENT, PURPLE, SUCCESS]));
  push(text(sideX + 32, sy + 222, '■ Reddit  ■ HN  ■ Twitter', { size: 10, color: INK_LIGHT }));
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 7: FUNCTION LEAF PAGE /functions/[slug]
// ══════════════════════════════════════════════════════════════════════
{
  const X = R2_X, Y = 7500, W = 1440, H = 2000;
  add(pageFrame(X, Y, W, H, '/functions/[slug]', 'Function leaf page — e.g. /functions/markdown-note-editor. All products that do this specific thing.'));
  add(globalHeader(X, Y, W));

  // Breadcrumb + header
  push(text(X + 32, Y + 88, 'Discovery  /  Productivity  /  Note-Taking Apps  /  Markdown Note Editor', { size: 11, color: ACCENT_DEEP }));

  const headerY = Y + 116;
  add(card(X + 16, headerY, W - 32, 120, { fill: ACCENT_TINT, stroke: ACCENT }));
  push(text(X + 40, headerY + 20, 'Markdown Note Editor', { size: 32, color: INK }));
  push(text(X + 40, headerY + 64, 'Text editors that render markdown in real-time with live preview and wiki-linking', { size: 13, color: INK_LIGHT }));
  // Stat tiles
  const fnStats = [
    ['147', 'products', INK],
    ['$1.2B', 'total funding', SUCCESS],
    ['12 yrs', 'median lifespan', INK_MED],
    ['32', 'active today', ACCENT],
    ['8', 'discontinued', DANGER],
  ];
  fnStats.forEach(([val, lbl, col], i) => {
    const sx = X + W - 800 + i * 155;
    push(text(sx, headerY + 24, val, { size: 22, color: col }));
    push(text(sx, headerY + 54, lbl, { size: 10, color: INK_LIGHT }));
  });

  let my = headerY + 140;

  // Row: Market $ chart (half) + Lifecycle chart (half)
  add(widget(X + 16, my, W / 2 - 24, 320, '💰 TOTAL FUNDING INTO THIS FUNCTION', '→ market_size_snapshots scope_value=\'markdown-note-editor\'', { accent: SUCCESS }));
  const mX = X + 56, mY = my + 80, mW = W / 2 - 120, mH = 200;
  const fundingData = [5, 8, 12, 20, 35, 62, 98, 145, 220, 280, 340, 395];
  add(lineChart(mX, mY, mW, mH, fundingData, { color: SUCCESS, area: true, areaFill: SUCCESS_SOFT, dots: true }));
  push(text(mX, mY + mH + 8, '2014', { size: 10, color: INK_LIGHT }));
  push(text(mX + mW - 30, mY + mH + 8, '2026', { size: 10, color: INK_LIGHT }));
  push(text(mX, mY - 20, '$M invested (cumulative)', { size: 10, color: INK_LIGHT }));

  add(widget(X + W / 2 + 8, my, W / 2 - 24, 320, '📈 LIFECYCLE (launches vs deaths)', '→ COUNT products by launched_year + discontinued_year'));
  const lX = X + W / 2 + 48, lY = my + 80, lW = W / 2 - 112, lH = 200;
  const launches = [2, 3, 5, 8, 12, 18, 14, 10, 8, 6];
  const deaths = [0, 0, 1, 1, 2, 3, 4, 5, 5, 6];
  add(multiLineChart(lX, lY, lW, lH, [launches, deaths], [SUCCESS, DANGER]));
  push(text(lX, lY + lH + 8, '2016', { size: 10, color: INK_LIGHT }));
  push(text(lX + lW - 30, lY + lH + 8, '2026', { size: 10, color: INK_LIGHT }));
  push(text(lX + lW + 8, lY + 10, '━ launches', { size: 10, color: SUCCESS }));
  push(text(lX + lW + 8, lY + 28, '━ deaths', { size: 10, color: DANGER }));

  my += 340;

  // Top 10 ranked list
  add(widget(X + 16, my, W - 32, 440, '🏆 TOP 10 BY SIGNAL SCORE', '→ products WHERE primary_function_id=X ORDER BY signal_score DESC LIMIT 10'));
  const topProducts = [
    ['Obsidian', 'Local-first knowledge base', '$0 (indie)', '87', '+12%'],
    ['Notion', 'All-in-one workspace', '$280M Series D', '84', '+8%'],
    ['Roam Research', 'Networked thought', '$9M Seed', '72', '-3%'],
    ['Logseq', 'Outliner + graph', 'Open source', '68', '+15%'],
    ['Craft', 'Beautiful docs', '$12M Series A', '65', '+4%'],
    ['Zettlr', 'Academic markdown', 'Open source', '52', '+2%'],
    ['Bear', 'Apple-only markdown', '$5M Seed', '48', '0%'],
    ['iA Writer', 'Minimal markdown', 'Perpetual', '45', '+1%'],
    ['Ulysses', 'Long-form markdown', 'Subscription', '42', '-2%'],
    ['Dendron', 'Structured knowledge', '$8M Seed', '38', '+6%'],
  ];
  topProducts.forEach((p, i) => {
    const py = my + 66 + i * 36;
    push(text(X + 40, py + 6, `${i + 1}.`, { size: 13, color: INK_MED, mono: true }));
    add(avatar(X + 72, py, 24));
    push(text(X + 108, py + 2, p[0], { size: 13, color: INK }));
    push(text(X + 108, py + 18, p[1], { size: 10, color: INK_LIGHT }));
    push(text(X + 560, py + 6, p[2], { size: 11, color: INK_MED }));
    push(text(X + 820, py + 6, `${p[3]}`, { size: 13, color: SUCCESS }));
    push(text(X + 860, py + 6, '▲', { size: 11, color: SUCCESS }));
    // sparkline
    add(sparkline(X + 920, py + 8, 120, 18, [3, 4, 5, 5, 6, 7, 8], { color: p[4].startsWith('+') ? SUCCESS : DANGER }));
    push(text(X + 1060, py + 6, p[4], { size: 11, color: p[4].startsWith('+') ? SUCCESS : DANGER }));
    if (i < topProducts.length - 1) {
      push(divider(X + 32, py + 30, W - 64, GRID_LINE));
    }
  });

  my += 460;

  // Full product grid below
  add(widget(X + 16, my, W - 32, 360, '📦 ALL 147 PRODUCTS', 'full product grid, paginated'));
  for (let i = 0; i < 16; i++) {
    const col = i % 8;
    const row = Math.floor(i / 8);
    const cx = X + 32 + col * 175;
    const cy = my + 66 + row * 140;
    add(productCardMock(cx, cy, 160, 124, {
      name: `Product ${i + 1}`, tag: 'markdown editor', cat: 'Notes', score: 72 - i * 3,
      spark: [3, 4, 5, 4, 6, 7, 8],
    }));
  }
  push(text(X + W - 200, my + 340, 'showing 16 of 147  →  page 1/10', { size: 11, color: INK_DIM }));
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 8: COMPARE VIEW /compare?a=&b=
// ══════════════════════════════════════════════════════════════════════
{
  const X = R2_X, Y = 9700, W = 1440, H = 1900;
  add(pageFrame(X, Y, W, H, '/compare?a=notion&b=obsidian', 'Side-by-side comparison with radar overlay, attribute diff, and AI verdict'));
  add(globalHeader(X, Y, W));

  // Header
  push(text(X + 32, Y + 96, 'Compare Products', { size: 28, color: INK }));
  push(text(X + 32, Y + 134, 'Notion  vs  Obsidian  —  note-taking category', { size: 14, color: INK_LIGHT }));

  // Two hero cards side by side
  const heroY = Y + 170;
  const heroH = 200;
  const heroW = (W - 48 - 16) / 2;
  // Card A
  add(card(X + 16, heroY, heroW, heroH, { fill: SURFACE, stroke: ACCENT, strokeWidth: 2 }));
  push(rect(X + 32, heroY + 16, 4, 24, { fill: ACCENT, stroke: ACCENT, strokeWidth: 0, rounded: false }));
  push(text(X + 44, heroY + 14, 'PRODUCT A', { size: 10, color: ACCENT_DEEP }));
  push(ellipse(X + 32, heroY + 48, 64, 64, { fill: CANVAS, stroke: BORDER_STRONG, strokeWidth: 2 }));
  push(text(X + 116, heroY + 54, 'Notion', { size: 24, color: INK }));
  push(text(X + 116, heroY + 84, 'All-in-one workspace', { size: 12, color: INK_LIGHT }));
  push(text(X + 116, heroY + 108, '🔗 notion.so  •  6 yrs  •  $280M raised', { size: 11, color: INK_MED }));
  add(pillRow(X + 32, heroY + 140, ['AI Tools', 'Productivity', 'Collaborative'], { fill: ACCENT_SOFT, stroke: ACCENT, color: ACCENT_DEEP }));
  push(text(X + heroW - 120, heroY + 16, 'Signal:  91 ▲', { size: 13, color: SUCCESS }));

  // Card B
  const bX = X + 16 + heroW + 16;
  add(card(bX, heroY, heroW, heroH, { fill: SURFACE, stroke: SUCCESS, strokeWidth: 2 }));
  push(rect(bX + 16, heroY + 16, 4, 24, { fill: SUCCESS, stroke: SUCCESS, strokeWidth: 0, rounded: false }));
  push(text(bX + 28, heroY + 14, 'PRODUCT B', { size: 10, color: SUCCESS }));
  push(ellipse(bX + 16, heroY + 48, 64, 64, { fill: CANVAS, stroke: BORDER_STRONG, strokeWidth: 2 }));
  push(text(bX + 100, heroY + 54, 'Obsidian', { size: 24, color: INK }));
  push(text(bX + 100, heroY + 84, 'Local-first knowledge base', { size: 12, color: INK_LIGHT }));
  push(text(bX + 100, heroY + 108, '🔗 obsidian.md  •  5 yrs  •  bootstrapped', { size: 11, color: INK_MED }));
  add(pillRow(bX + 16, heroY + 140, ['Dev Tools', 'Note-Taking', 'Local-First'], { fill: SUCCESS_SOFT, stroke: SUCCESS, color: SUCCESS }));
  push(text(bX + heroW - 120, heroY + 16, 'Signal:  87 ▲', { size: 13, color: SUCCESS }));

  let my = heroY + heroH + 24;

  // Radar overlay + attribute diff row (420h)
  add(widget(X + 16, my, W / 2 - 24, 420, '📊 DIMENSIONAL SCORES OVERLAY', '→ functionality_scores A vs B on same radar'));
  const rcx = X + (W / 2 - 24) / 2;
  const rcy = my + 220;
  // Both radars
  add(radarChart(rcx, rcy, 120, [0.9, 1.0, 0.6, 0.9, 0.8, 0.9, 0.8, 1.0],
    ['Ease', 'Features', 'Value', 'Support', 'Perf', 'Docs', 'Mobile', 'Integr'], { color: ACCENT }));
  // Overlay B (different values)
  const sidesB = 8;
  const valuesB = [1.0, 0.7, 1.0, 0.6, 1.0, 0.8, 0.5, 0.6];
  const dataPtsB = valuesB.map((v, i) => {
    const a = (i / sidesB) * Math.PI * 2 - Math.PI / 2;
    return [rcx + Math.cos(a) * 120 * v, rcy + Math.sin(a) * 120 * v];
  });
  for (let i = 0; i < sidesB; i++) {
    push(line(dataPtsB[i][0], dataPtsB[i][1], dataPtsB[(i + 1) % sidesB][0], dataPtsB[(i + 1) % sidesB][1], {
      stroke: SUCCESS, strokeWidth: 2,
    }));
  }
  dataPtsB.forEach(([px, py]) => {
    push(ellipse(px - 3, py - 3, 6, 6, { fill: SUCCESS, stroke: SUCCESS, strokeWidth: 0 }));
  });
  // Legend
  push(rect(X + 36, my + 376, 14, 14, { fill: ACCENT, stroke: ACCENT, strokeWidth: 0 }));
  push(text(X + 54, my + 378, 'Notion', { size: 11, color: INK_MED }));
  push(rect(X + 120, my + 376, 14, 14, { fill: SUCCESS, stroke: SUCCESS, strokeWidth: 0 }));
  push(text(X + 138, my + 378, 'Obsidian', { size: 11, color: INK_MED }));

  // Attribute diff
  add(widget(X + W / 2 + 8, my, W / 2 - 24, 420, '🔀 ATTRIBUTE DIFF', 'what each has that the other doesn\'t'));
  // 3-col diff layout
  const dX = X + W / 2 + 40;
  const dW = (W / 2 - 88) / 3;
  push(text(dX, my + 64, 'ONLY A', { size: 11, color: ACCENT_DEEP }));
  push(text(dX + dW + 10, my + 64, 'BOTH', { size: 11, color: INK_MED }));
  push(text(dX + 2 * (dW + 10), my + 64, 'ONLY B', { size: 11, color: SUCCESS }));
  const onlyA = ['databases', 'templates', 'team permissions', 'integrations (50+)', 'ai-assist'];
  const both = ['markdown', 'tagging', 'search', 'mobile sync', 'api', 'web export'];
  const onlyB = ['local-first', 'e2e-encrypted', 'file ownership', 'graph view', 'plugins (1000+)'];
  onlyA.forEach((a, i) => {
    push(text(dX, my + 90 + i * 24, `• ${a}`, { size: 11, color: INK }));
  });
  both.forEach((b, i) => {
    push(text(dX + dW + 10, my + 90 + i * 24, `• ${b}`, { size: 11, color: INK }));
  });
  onlyB.forEach((b, i) => {
    push(text(dX + 2 * (dW + 10), my + 90 + i * 24, `• ${b}`, { size: 11, color: INK }));
  });

  my += 440;

  // Signal overlay + funding comparison (320h)
  add(widget(X + 16, my, W / 2 - 24, 320, '📈 SIGNAL TIMELINE (overlay)', 'mention volume A vs B same timeline'));
  const siX = X + 56, siY = my + 80, siW = W / 2 - 120, siH = 200;
  const seriesA = [3, 5, 8, 12, 15, 18, 22, 24, 26, 28, 30, 32];
  const seriesB = [1, 2, 4, 6, 10, 15, 20, 25, 28, 32, 36, 40];
  add(multiLineChart(siX, siY, siW, siH, [seriesA, seriesB], [ACCENT, SUCCESS]));
  push(text(siX, siY + siH + 8, '2019', { size: 10, color: INK_LIGHT }));
  push(text(siX + siW - 30, siY + siH + 8, '2026', { size: 10, color: INK_LIGHT }));
  push(text(siX + siW + 8, siY + 10, '━ Notion', { size: 10, color: ACCENT }));
  push(text(siX + siW + 8, siY + 28, '━ Obsidian', { size: 10, color: SUCCESS }));

  add(widget(X + W / 2 + 8, my, W / 2 - 24, 320, '💰 FUNDING COMPARISON', 'total raised dual bar'));
  const fcX = X + W / 2 + 56, fcY = my + 80, fcW = W / 2 - 120, fcH = 200;
  add(barChart(fcX, fcY, fcW, fcH, [280, 0], { color: ACCENT, max: 300 }));
  push(text(fcX + fcW * 0.15, fcY + fcH + 8, 'Notion $280M', { size: 11, color: ACCENT }));
  push(text(fcX + fcW * 0.65, fcY + fcH + 8, 'Obsidian $0', { size: 11, color: SUCCESS }));

  my += 340;

  // AI verdict strip
  add(card(X + 16, my, W - 32, 90, { fill: WARNING_TINT, stroke: WARNING }));
  push(rect(X + 32, my + 16, 4, 56, { fill: WARNING, stroke: WARNING, strokeWidth: 0, rounded: false }));
  push(text(X + 48, my + 14, '🤖 VERDICT', { size: 11, color: WARNING }));
  push(text(X + 48, my + 34, 'Notion wins on team features and ecosystem (databases, integrations, templates)', { size: 13, color: INK }));
  push(text(X + 48, my + 54, 'Obsidian wins on individual workflow, ownership, and extensibility (plugins, local-first)', { size: 13, color: INK }));
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 9: COMPANY PROFILE /companies/[slug]
// ══════════════════════════════════════════════════════════════════════
{
  const X = R2_X, Y = 11700, W = 1440, H = 2000;
  add(pageFrame(X, Y, W, H, '/companies/[slug]', 'Company view — all products, full funding history, valuations, related companies'));
  add(globalHeader(X, Y, W));

  // Company hero
  const heroY = Y + 96;
  add(card(X + 16, heroY, W - 32, 160, { fill: SURFACE, stroke: BORDER }));
  push(ellipse(X + 40, heroY + 24, 112, 112, { fill: CANVAS, stroke: BORDER_STRONG, strokeWidth: 2 }));
  push(text(X + 80, heroY + 76, 'LOGO', { size: 13, color: INK_DIM }));
  push(text(X + 172, heroY + 24, 'Notion Labs, Inc.', { size: 32, color: INK }));
  push(text(X + 172, heroY + 66, 'Founded 2013 • San Francisco, CA • 247 employees', { size: 12, color: INK_LIGHT }));
  push(text(X + 172, heroY + 88, '🔗 notion.so   •   🐦 @notion   •   💼 linkedin.com/company/notion', { size: 11, color: ACCENT_DEEP }));
  // Stat tiles
  const compStats = [
    ['$280M', 'total raised'],
    ['$10B', 'valuation'],
    ['Series D', 'latest round'],
    ['3', 'products'],
    ['2013', 'founded'],
  ];
  compStats.forEach(([v, l], i) => {
    const cx = X + W - 620 + i * 120;
    push(text(cx, heroY + 28, v, { size: 18, color: SUCCESS }));
    push(text(cx, heroY + 52, l, { size: 10, color: INK_LIGHT }));
  });

  let my = heroY + 180;

  // Products by this company (row)
  add(widget(X + 16, my, W - 32, 220, '📦 ALL PRODUCTS BY THIS COMPANY', '→ products WHERE company_id'));
  const compProducts = [
    { name: 'Notion', tag: 'All-in-one workspace', cat: 'Prod', score: 91, spark: [5, 6, 7, 8, 9, 10, 10] },
    { name: 'Notion Calendar', tag: 'Cron, acquired 2024', cat: 'Prod', score: 72, spark: [3, 4, 5, 6, 7, 8, 9] },
    { name: 'Notion AI', tag: 'AI writing assistant', cat: 'AI', score: 84, spark: [2, 4, 6, 7, 8, 9, 10] },
  ];
  compProducts.forEach((p, i) => {
    add(productCardMock(X + 40 + i * 250, my + 66, 236, 140, p));
  });

  my += 240;

  // Funding timeline (320h)
  add(widget(X + 16, my, W - 32, 320, '💰 FULL FUNDING HISTORY', '→ funding_rounds WHERE company_id ORDER BY year,month', { accent: SUCCESS }));
  // Timeline
  const tlX = X + 60, tlY = my + 180, tlW = W - 160;
  push(line(tlX, tlY, tlX + tlW, tlY, { stroke: BORDER_STRONG, strokeWidth: 2 }));
  const compFunding = [
    { frac: 0.05, label: 'Pre-seed', amt: '$250K', year: '2015' },
    { frac: 0.18, label: 'Seed', amt: '$2M', year: '2016' },
    { frac: 0.35, label: 'Series A', amt: '$18M', year: '2019' },
    { frac: 0.5, label: 'Series B', amt: '$50M', year: '2020' },
    { frac: 0.68, label: 'Series C', amt: '$275M', year: '2022' },
    { frac: 0.95, label: 'Series D', amt: '$600M', year: '2024' },
  ];
  compFunding.forEach(cf => {
    const dx = tlX + tlW * cf.frac;
    push(ellipse(dx - 10, tlY - 10, 20, 20, { fill: SUCCESS, stroke: SUCCESS, strokeWidth: 0 }));
    push(text(dx - 30, tlY - 50, cf.label, { size: 10, color: INK }));
    push(text(dx - 24, tlY - 34, cf.amt, { size: 11, color: SUCCESS }));
    push(text(dx - 14, tlY + 22, cf.year, { size: 10, color: INK_LIGHT }));
  });

  my += 340;

  // Row: Valuation chart + Related companies (280h)
  add(widget(X + 16, my, W / 2 - 24, 280, '📈 VALUATION OVER TIME', '→ valuation_snapshots WHERE company_id'));
  const vX = X + 56, vY = my + 80, vW = W / 2 - 120, vH = 160;
  const valData = [2, 20, 150, 800, 2000, 4500, 10000];
  add(lineChart(vX, vY, vW, vH, valData, { color: WARNING, area: true, areaFill: WARNING_SOFT, dots: true }));
  push(text(vX, vY + vH + 8, '2015', { size: 10, color: INK_LIGHT }));
  push(text(vX + vW - 30, vY + vH + 8, '2026', { size: 10, color: INK_LIGHT }));
  push(text(vX, vY - 20, '$M valuation (log-ish)', { size: 10, color: INK_LIGHT }));

  add(widget(X + W / 2 + 8, my, W / 2 - 24, 280, '🔗 RELATED COMPANIES', 'co-invested, same stage, acquired'));
  const related = [
    { name: 'Figma', tag: 'Design tool — co-invested by Sequoia', score: 88 },
    { name: 'Linear', tag: 'Issue tracker — a16z portfolio', score: 82 },
    { name: 'Vercel', tag: 'Infra — similar Series D stage', score: 79 },
    { name: 'Supabase', tag: 'Backend — Benchmark co-invested', score: 74 },
  ];
  related.forEach((r, i) => {
    const ry = my + 70 + i * 50;
    add(productRowMock(X + W / 2 + 32, ry, W / 2 - 64, 42, {
      name: r.name, tag: r.tag, rightLabel: 'signal', rightValue: `${r.score} ▲`, rightColor: SUCCESS,
    }));
  });
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 10: TRENDING /trending
// ══════════════════════════════════════════════════════════════════════
{
  const X = R2_X, Y = 13900, W = 1440, H = 1700;
  add(pageFrame(X, Y, W, H, '/trending', 'Real-time breakout feed. Products where is_breakout = TRUE, sorted by velocity.'));
  add(globalHeader(X, Y, W));

  // Header
  push(text(X + 32, Y + 96, '⚡ Trending Breakouts', { size: 28, color: INK }));
  push(text(X + 32, Y + 134, '8 products hitting breakout status right now  •  updated every 6 hours', { size: 12, color: INK_LIGHT }));

  // Filter row
  const filterY = Y + 176;
  add(button(X + 32, filterY, 100, 32, 'All ▾', { filled: true, size: 11 }));
  add(button(X + 140, filterY, 120, 32, 'Category ▾', { filled: false, size: 11 }));
  add(button(X + 268, filterY, 130, 32, 'Attribute ▾', { filled: false, size: 11 }));
  add(button(X + 406, filterY, 120, 32, 'Last 24h ▾', { filled: false, size: 11 }));
  push(text(X + W - 200, filterY + 10, 'sort: velocity ▾', { size: 11, color: INK_LIGHT }));

  // Main 2-col: breakout feed + velocity chart
  const mainY = filterY + 52;
  const feedW = W - 32 - 500 - 16;

  // Velocity global chart (right)
  add(widget(X + 32 + feedW + 16, mainY, 500, 340, '📊 BREAKOUT VELOCITY', 'global breakout count over time'));
  const vcX = X + 72 + feedW + 16, vcY = mainY + 80, vcW = 460, vcH = 200;
  const vcData = Array.from({ length: 30 }, (_, i) => 2 + Math.sin(i * 0.3) * 3 + Math.cos(i * 0.15) * 2 + i * 0.1);
  add(barChart(vcX, vcY, vcW, vcH, vcData, { color: DANGER, gap: 2 }));
  push(text(vcX, vcY + vcH + 8, '30 days ago', { size: 10, color: INK_LIGHT }));
  push(text(vcX + vcW - 30, vcY + vcH + 8, 'today', { size: 10, color: INK_LIGHT }));
  push(text(vcX, vcY - 20, '# products hitting breakout', { size: 10, color: INK_LIGHT }));

  // Breakout feed (left — big scrollable list)
  add(widget(X + 16, mainY, feedW, 1100, '⚡ BREAKOUT FEED', '→ product_signal_scores WHERE is_breakout ORDER BY velocity DESC', { accent: DANGER }));
  const breakouts = [
    { name: 'Product Alpha', tag: 'AI-native note-taker', v: '+340%', score: 92, meta: 'velocity > 2σ • 4h ago', cat: 'AI' },
    { name: 'Product Beta', tag: 'Open-source Linear alt', v: '+220%', score: 88, meta: 'mention spike on HN + Reddit', cat: 'Dev' },
    { name: 'Product Gamma', tag: 'Low-code workflow builder', v: '+180%', score: 84, meta: 'TC coverage + Series A announce', cat: 'Auto' },
    { name: 'Product Delta', tag: 'Rust-native terminal', v: '+145%', score: 80, meta: 'Show HN #1 last 24h', cat: 'Dev' },
    { name: 'Product Epsilon', tag: 'CRM for solo founders', v: '+128%', score: 76, meta: 'Product Hunt top-5 today', cat: 'SMB' },
    { name: 'Product Zeta', tag: 'Markdown wiki engine', v: '+112%', score: 73, meta: 'BetaList feature + tweets', cat: 'Notes' },
    { name: 'Product Eta', tag: 'Self-hosted analytics', v: '+95%', score: 70, meta: 'GitHub trending #2', cat: 'Data' },
    { name: 'Product Theta', tag: 'AI code review bot', v: '+82%', score: 67, meta: 'VS Code marketplace spike', cat: 'AI' },
  ];
  breakouts.forEach((b, i) => {
    const by = mainY + 66 + i * 120;
    add(card(X + 32, by, feedW - 32, 108, { fill: i === 0 ? DANGER_TINT : CANVAS, stroke: i === 0 ? DANGER : BORDER }));
    add(avatar(X + 48, by + 14, 48));
    push(text(X + 108, by + 14, b.name, { size: 15, color: INK }));
    // category pill
    add(pillRow(X + 270, by + 16, [b.cat], { fill: ACCENT_SOFT, stroke: ACCENT, color: ACCENT_DEEP, size: 10 }));
    push(text(X + 108, by + 36, b.tag, { size: 12, color: INK_LIGHT }));
    push(text(X + 108, by + 56, `📡 ${b.meta}`, { size: 10, color: INK_DIM, mono: true }));
    // Sparkline
    add(sparkline(X + 108, by + 76, 240, 20, [2, 3, 5, 4, 7, 12, 18, 28], { color: DANGER }));
    // Velocity
    push(rect(X + feedW - 180, by + 24, 80, 32, { fill: DANGER_SOFT, stroke: DANGER, strokeWidth: 1.5, radius: 8 }));
    push(text(X + feedW - 170, by + 34, b.v, { size: 13, color: DANGER }));
    // Signal score
    push(text(X + feedW - 80, by + 28, 'signal', { size: 10, color: INK_LIGHT }));
    push(text(X + feedW - 80, by + 44, `${b.score} ▲`, { size: 16, color: SUCCESS }));
  });
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 11: GRAVEYARD /graveyard
// ══════════════════════════════════════════════════════════════════════
{
  const X = R2_X, Y = 15800, W = 1440, H = 1700;
  add(pageFrame(X, Y, W, H, '/graveyard', 'Discontinued products. Grouped by year, with death reason breakdown and pre-death signal teaser.'));
  add(globalHeader(X, Y, W));

  // Header
  push(text(X + 32, Y + 96, '🪦 Product Graveyard', { size: 28, color: INK }));
  push(text(X + 32, Y + 134, '2,143 products that died so others could learn', { size: 12, color: INK_LIGHT }));

  // Stats
  const gStats = [
    ['2,143', 'total dead'],
    ['847', 'shutdowns'],
    ['612', 'acquired'],
    ['384', 'pivoted'],
    ['300', 'bankrupt'],
  ];
  gStats.forEach(([v, l], i) => {
    const sx = X + W - 600 + i * 120;
    push(text(sx, Y + 96, v, { size: 24, color: DANGER }));
    push(text(sx, Y + 128, l, { size: 10, color: INK_LIGHT }));
  });

  let my = Y + 176;

  // Row: Death reason pie + Pre-death signal teaser (280h)
  add(widget(X + 16, my, W / 2 - 24, 280, '💀 DEATH REASON BREAKDOWN', '→ product_graveyard GROUP BY death_reason'));
  const dpX = X + (W / 2 - 24) / 2;
  const dpY = my + 170;
  add(donutChart(dpX, dpY, 80, 40,
    [0.40, 0.29, 0.18, 0.14],
    [DANGER, WARNING, ACCENT, PURPLE]));
  // Legend
  const dlY = my + 68;
  const legends = [
    ['shutdown (40%)', DANGER],
    ['acquired (29%)', WARNING],
    ['pivoted (18%)', ACCENT],
    ['bankruptcy (14%)', PURPLE],
  ];
  legends.forEach(([lbl, c], i) => {
    const ly = dlY + i * 24;
    push(rect(X + 40, ly, 14, 14, { fill: c, stroke: c, strokeWidth: 0 }));
    push(text(X + 62, ly + 2, lbl, { size: 11, color: INK_MED }));
  });

  add(widget(X + W / 2 + 8, my, W / 2 - 24, 280, '🔮 PRE-DEATH SIGNALS', 'teaser for paid tier — early warning pattern detection', { accent: PURPLE }));
  push(text(X + W / 2 + 40, my + 70, 'Products that died in 2024 showed warning signs 6 months before:', { size: 12, color: INK }));
  const signals = [
    ['📉', 'Mention volume dropped 60%+', '89% of dead products'],
    ['👥', 'Executive departure', '72%'],
    ['💰', 'No funding in 18 months', '68%'],
    ['🔕', 'Zero press mentions in 90 days', '64%'],
  ];
  signals.forEach(([icon, label, pct], i) => {
    const sy = my + 100 + i * 36;
    push(text(X + W / 2 + 40, sy, icon, { size: 14 }));
    push(text(X + W / 2 + 68, sy, label, { size: 11, color: INK_MED }));
    push(text(X + W - 140, sy, pct, { size: 11, color: PURPLE }));
  });
  add(button(X + W / 2 + 40, my + 240, 240, 32, '🔔 Get early warnings →', { filled: true, fill: PURPLE, stroke: PURPLE, size: 11 }));

  my += 300;

  // Dead products grouped by year (big list)
  add(widget(X + 16, my, W - 32, 940, '⚰️  RECENT DEATHS', 'grouped by year, chronological'));
  const graveSections = [
    {
      year: '2024',
      count: 42,
      products: [
        { name: 'Arc Browser', reason: 'shutdown — replaced by Dia', date: 'Oct 2024', cat: 'Web' },
        { name: 'Cron', reason: 'acquired by Notion', date: 'Jun 2024', cat: 'Prod' },
        { name: 'Teehan+Lax', reason: 'acquired by Facebook', date: 'Feb 2024', cat: 'Des' },
      ],
    },
    {
      year: '2023',
      count: 89,
      products: [
        { name: 'MakerLog', reason: 'shutdown — indie tired', date: 'Nov 2023', cat: 'Prod' },
        { name: 'Wunderlist', reason: 'replaced by MS To Do', date: 'May 2023', cat: 'Prod' },
        { name: 'Readymag', reason: 'pivoted to AI', date: 'Mar 2023', cat: 'Des' },
      ],
    },
    {
      year: '2022',
      count: 134,
      products: [
        { name: 'Google Stadia', reason: 'shutdown by Google', date: 'Dec 2022', cat: 'Game' },
      ],
    },
  ];
  let gy = my + 66;
  graveSections.forEach(sec => {
    // Year header
    push(rect(X + 40, gy, 80, 30, { fill: DANGER_SOFT, stroke: DANGER, strokeWidth: 1.5, radius: 6 }));
    push(text(X + 56, gy + 6, sec.year, { size: 16, color: DANGER }));
    push(text(X + 136, gy + 8, `${sec.count} products died this year`, { size: 11, color: INK_LIGHT }));
    gy += 40;
    sec.products.forEach(p => {
      add(card(X + 40, gy, W - 80, 70, { fill: CANVAS, stroke: BORDER }));
      add(avatar(X + 60, gy + 14, 42));
      push(text(X + 120, gy + 14, p.name, { size: 14, color: INK }));
      push(text(X + 120, gy + 34, p.reason, { size: 11, color: INK_LIGHT }));
      push(text(X + 120, gy + 50, p.date, { size: 10, color: INK_DIM, mono: true }));
      add(pillRow(X + W - 180, gy + 22, [p.cat], { fill: SURFACE, stroke: BORDER, color: INK_MED, size: 10 }));
      push(text(X + W - 110, gy + 22, '[ dossier → ]', { size: 10, color: ACCENT_DEEP }));
      gy += 82;
    });
    gy += 16;
  });
}

// ══════════════════════════════════════════════════════════════════════
// ROUND 3 — Interaction + Responsive
// Column at x=3360. Four panels stacked vertically.
// ══════════════════════════════════════════════════════════════════════

const R3_X = 3360;

// ─── Panel 9: QUICK PREVIEW MODAL ─────────────────────────────────────
{
  const X = R3_X, Y = 100, W = 1440, H = 1100;
  add(pageFrame(X, Y, W, H, '/ → quick preview modal', 'Click any product card in the feed → modal opens with dossier excerpt. Esc or backdrop click closes. Full dossier via "Open full dossier →".'));
  add(globalHeader(X, Y, W));

  // Dimmed backdrop over a mini feed
  const feedY = Y + 88;
  push(rect(X + 16, feedY, W - 32, H - 104, { fill: SURFACE_2, stroke: BORDER, radius: 8 }));
  // A few ghosted product cards showing the "behind the modal" state
  const cardW = 220, cardH = 180, gap = 16;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const cx = X + 32 + col * (cardW + gap);
      const cy = feedY + 24 + row * (cardH + gap);
      add(card(cx, cy, cardW, cardH, { fill: CANVAS, stroke: BORDER, strokeWidth: 1 }));
      // ghosted content
      push(rect(cx + 12, cy + 12, 36, 36, { fill: SURFACE_2, stroke: BORDER_STRONG, radius: 6 }));
      push(rect(cx + 56, cy + 16, 90, 10, { fill: SURFACE_2, stroke: 'transparent', radius: 4 }));
      push(rect(cx + 56, cy + 32, 60, 8, { fill: SURFACE_2, stroke: 'transparent', radius: 4 }));
      push(rect(cx + 12, cy + 60, cardW - 24, 80, { fill: SURFACE, stroke: BORDER, radius: 6 }));
      push(rect(cx + 12, cy + 150, 80, 14, { fill: SURFACE_2, stroke: 'transparent', radius: 4 }));
    }
  }

  // Dim overlay to darken the feed
  push(rect(X + 16, feedY, W - 32, H - 104, { fill: '#0f172a22', stroke: 'transparent', radius: 8 }));

  // Highlight the "clicked" card (col 2, row 1) with accent outline
  const hotX = X + 32 + 2 * (cardW + gap);
  const hotY = feedY + 24 + 1 * (cardH + gap);
  push(rect(hotX - 3, hotY - 3, cardW + 6, cardH + 6, { fill: 'transparent', stroke: ACCENT, strokeWidth: 3, radius: 14 }));
  push(text(hotX + cardW + 10, hotY - 4, '① user clicked here', { size: 11, color: ACCENT_DEEP }));

  // Modal card, centered
  const modalW = 760, modalH = 560;
  const modalX = X + (W - modalW) / 2;
  const modalY = feedY + 100;
  add(card(modalX, modalY, modalW, modalH, { fill: CANVAS, stroke: BORDER_STRONG, strokeWidth: 2, radius: 16 }));

  // Modal close button
  push(rect(modalX + modalW - 40, modalY + 16, 24, 24, { fill: SURFACE, stroke: BORDER, radius: 6 }));
  push(text(modalX + modalW - 32, modalY + 20, '✕', { size: 13, color: INK_MED }));

  // Modal header: logo + name + tagline
  add(avatar(modalX + 28, modalY + 28, 56, 'N'));
  push(text(modalX + 100, modalY + 32, 'Notion', { size: 22, color: INK }));
  push(text(modalX + 100, modalY + 60, 'The all-in-one workspace for notes, docs, and databases', { size: 12, color: INK_LIGHT }));

  // Pill row: category + attributes
  add(pillRow(modalX + 28, modalY + 102, ['Productivity', 'collaborative', 'real-time', 'markdown', 'api-first'], { size: 10 }));

  // Two-col stats
  push(divider(modalX + 28, modalY + 140, modalW - 56));
  const statY = modalY + 158;
  push(text(modalX + 28, statY, 'BUZZ', { size: 9, color: INK_DIM, mono: true }));
  push(text(modalX + 28, statY + 14, '94', { size: 24, color: SUCCESS }));
  push(text(modalX + 80, statY + 24, '▲ 12%', { size: 10, color: SUCCESS }));
  add(sparkline(modalX + 150, statY + 16, 120, 24, [3, 5, 4, 6, 8, 7, 9, 11], { stroke: SUCCESS }));

  push(text(modalX + 300, statY, 'LAUNCHED', { size: 9, color: INK_DIM, mono: true }));
  push(text(modalX + 300, statY + 14, '2016', { size: 18, color: INK }));
  push(text(modalX + 300, statY + 36, '10 years active', { size: 10, color: INK_LIGHT }));

  push(text(modalX + 440, statY, 'FUNDING', { size: 9, color: INK_DIM, mono: true }));
  push(text(modalX + 440, statY + 14, '$343M', { size: 18, color: INK }));
  push(text(modalX + 440, statY + 36, 'Series C · 2021', { size: 10, color: INK_LIGHT }));

  push(text(modalX + 580, statY, 'USERS', { size: 9, color: INK_DIM, mono: true }));
  push(text(modalX + 580, statY + 14, '30M+', { size: 18, color: INK }));
  push(text(modalX + 580, statY + 36, '▲ 4M YoY', { size: 10, color: SUCCESS }));

  // Description preview
  push(divider(modalX + 28, modalY + 220, modalW - 56));
  push(text(modalX + 28, modalY + 236, 'Notion combines a modern editor with block-based databases,', { size: 12, color: INK_MED }));
  push(text(modalX + 28, modalY + 254, 'replacing Evernote, Airtable, and Google Docs in one canvas.', { size: 12, color: INK_MED }));
  push(text(modalX + 28, modalY + 272, 'Popular with startups, product teams, and solo knowledge workers.', { size: 12, color: INK_MED }));

  // Recent activity
  push(text(modalX + 28, modalY + 310, 'RECENT SIGNALS', { size: 10, color: INK_DIM, mono: true }));
  const sigs = [
    ['▲ Buzz +8% this week', SUCCESS],
    ['📰 Mentioned in TechCrunch (2h ago)', ACCENT_DEEP],
    ['⭐ 2.1k new GitHub stars for notion-api (7d)', SUCCESS],
    ['💬 Top of HN /show last Tuesday', WARNING],
  ];
  sigs.forEach(([label, color], i) => {
    push(text(modalX + 28, modalY + 328 + i * 18, label, { size: 11, color }));
  });

  // Actions row
  push(divider(modalX + 28, modalY + 420, modalW - 56));
  add(button(modalX + 28, modalY + 440, 220, 40, 'Open full dossier →', { filled: true, size: 14 }));
  add(button(modalX + 262, modalY + 440, 140, 40, '＋ Compare', { filled: false, size: 13 }));
  add(button(modalX + 416, modalY + 440, 140, 40, '☆ Save', { filled: false, size: 13 }));
  push(text(modalX + 580, modalY + 452, '⌘ + ↵ to open   ·   Esc to close', { size: 10, color: INK_DIM, mono: true }));

  // Interaction arrow: from highlighted card to modal
  add(arrow(hotX + cardW, hotY + cardH / 2, modalX, modalY + modalH / 2, { stroke: ACCENT, strokeWidth: 2 }));
  push(text(hotX + cardW + 20, hotY + cardH / 2 - 20, '② opens modal', { size: 11, color: ACCENT_DEEP }));

  // Interaction annotations strip
  const annY = modalY + modalH + 24;
  add(card(X + 16, annY, W - 32, 80, { fill: ACCENT_TINT, stroke: ACCENT, strokeWidth: 1.5 }));
  push(text(X + 32, annY + 12, 'INTERACTION SPEC', { size: 11, color: ACCENT_DEEP, mono: true }));
  push(text(X + 32, annY + 32, '• Click card or press ⌘ + ↵ on focused card → open modal (200ms fade + scale 0.95→1)', { size: 11, color: INK_MED }));
  push(text(X + 32, annY + 48, '• Click backdrop or Esc → close. URL updates to ?preview={slug} (shareable). Back button closes modal.', { size: 11, color: INK_MED }));
  push(text(X + 32, annY + 64, '• "Open full dossier →" navigates to /dossier/{slug}. Modal data is a cached fetch (30s stale-while-revalidate).', { size: 11, color: INK_MED }));
}

// ─── Panel 10: PLACEHOLDER AUDIT ──────────────────────────────────────
{
  const X = R3_X, Y = 1280, W = 1440, H = 1600;
  add(pageFrame(X, Y, W, H, 'Placeholder audit — Rounds 1+2', 'Every home-feed element labeled REAL (wired to Supabase) or MOCK (hardcoded in lib/mock-data.ts). Run before Day 5 UI cut-over.'));

  // Legend
  const legY = Y + 16;
  add(card(X + 16, legY, W - 32, 60, { fill: SURFACE, stroke: BORDER }));
  push(rect(X + 32, legY + 20, 18, 18, { fill: DANGER_SOFT, stroke: DANGER, strokeWidth: 2, radius: 4 }));
  push(text(X + 58, legY + 22, 'MOCK — hardcoded in lib/mock-data.ts (must replace)', { size: 12, color: INK_MED }));
  push(rect(X + 460, legY + 20, 18, 18, { fill: SUCCESS_SOFT, stroke: SUCCESS, strokeWidth: 2, radius: 4 }));
  push(text(X + 486, legY + 22, 'REAL — will query Supabase from day 5 onwards', { size: 12, color: INK_MED }));
  push(rect(X + 880, legY + 20, 18, 18, { fill: WARNING_SOFT, stroke: WARNING, strokeWidth: 2, radius: 4 }));
  push(text(X + 906, legY + 22, 'HYBRID — structure real, copy still TBD', { size: 12, color: INK_MED }));

  // Audit rows — grouped by widget
  const audit = [
    { widget: '🏠  Hero / Global Header', real: ['nav routes (static)'], mock: ['logo wordmark', 'user menu (auth not wired)'], hybrid: [] },
    { widget: '🚀  Launched Today 4×2', real: [], mock: ['8 product cards', 'buzz scores', 'sparklines', 'category tags', 'launched dates'], hybrid: ['REAL source = product_hunt.featured_today → query on day 5'] },
    { widget: '🔥  Breakout Alerts', real: [], mock: ['velocity %', 'signal source pills'], hybrid: ['REAL source = signal_scores WHERE velocity > 1.5 → day 6'] },
    { widget: '📈  Trending Feed', real: [], mock: ['rank numbers', '10 product rows', 'weekly change arrows'], hybrid: ['REAL source = ORDER BY buzz.weekly_change DESC LIMIT 10'] },
    { widget: '🎯  Category Spotlight', real: [], mock: ['category name', 'lifecycle chart data', '3 featured products'], hybrid: ['REAL source = categories.pinned_slug + category_lifecycle view'] },
    { widget: '📊  Market Pulse', real: [], mock: ['6 sparkline widgets', 'metric names', '% changes'], hybrid: ['REAL source = market_size_snapshots (last 30d rollup)'] },
    { widget: '📰  News Feed', real: [], mock: ['article titles', 'source names', 'timestamps', 'thumbnails'], hybrid: ['REAL source = news_items (RSS feed, day 7 automation)'] },
    { widget: '💰  Fresh Funding', real: [], mock: ['company names', 'round sizes', 'dates'], hybrid: ['REAL source = funding_rounds ORDER BY date DESC'] },
    { widget: '⚰️  Graveyard strip', real: [], mock: ['4 dead product cards', 'death reasons', 'sunset dates'], hybrid: ['REAL source = products WHERE status = dead LIMIT 4'] },
    { widget: '🦶  Footer', real: ['static links'], mock: ['newsletter form (not wired)'], hybrid: [] },
  ];

  let ay = legY + 80;
  audit.forEach(row => {
    add(card(X + 16, ay, W - 32, 96, { fill: CANVAS, stroke: BORDER }));
    push(text(X + 32, ay + 12, row.widget, { size: 14, color: INK }));
    // MOCK pills
    if (row.mock.length) {
      push(text(X + 32, ay + 36, 'MOCK:', { size: 10, color: DANGER, mono: true }));
      add(pillRow(X + 80, ay + 34, row.mock, { fill: DANGER_SOFT, stroke: DANGER, color: DANGER, size: 10 }));
    }
    // REAL pills (inline)
    if (row.real.length) {
      push(text(X + 32, ay + 58, 'REAL:', { size: 10, color: SUCCESS, mono: true }));
      add(pillRow(X + 80, ay + 56, row.real, { fill: SUCCESS_SOFT, stroke: SUCCESS, color: SUCCESS, size: 10 }));
    }
    // HYBRID notes
    if (row.hybrid.length) {
      push(text(X + 32, ay + 78, '→  ' + row.hybrid[0], { size: 10, color: WARNING, mono: true }));
    }
    ay += 108;
  });

  // Summary
  const sumY = ay + 12;
  add(card(X + 16, sumY, W - 32, 60, { fill: WARNING_TINT, stroke: WARNING, strokeWidth: 1.5 }));
  push(text(X + 32, sumY + 14, 'SUMMARY', { size: 11, color: WARNING, mono: true }));
  push(text(X + 32, sumY + 32, 'Only 2 static elements are real. 42 elements are MOCK. Supabase cut-over is a single large PR (Day 5 in STRATEGIC-PLAN).', { size: 12, color: INK_MED }));
}

// ─── Panel 11: TABLET BREAKPOINT (768px) ──────────────────────────────
{
  const X = R3_X, Y = 2960, W = 820, H = 1400;
  const INNER = 768;
  push(text(X, Y - 56, '/ @ tablet 768px', { size: 26, color: INK }));
  push(text(X, Y - 24, 'Landscape tablet / narrow desktop. Nav collapses to icon row. Feed grid goes 4-col → 2-col. No sidebar.', { size: 12, color: INK_LIGHT }));
  push(text(X + W - 120, Y - 24, `Tablet ${INNER}×${H}`, { size: 11, color: INK_DIM, mono: true }));

  // Viewport outline
  push(rect(X, Y, W, H, { fill: SURFACE, stroke: BORDER_STRONG, strokeWidth: 2, radius: 12 }));
  const pad = (W - INNER) / 2;
  const cx = X + pad;

  // Tablet header (shorter)
  add(rect(cx, Y + 20, INNER, 56, { fill: CANVAS, stroke: BORDER, radius: 0 }));
  push(rect(cx + 16, Y + 34, 28, 28, { fill: ACCENT, stroke: ACCENT, radius: 6 }));
  push(text(cx + 24, Y + 40, 'P', { size: 16, color: CANVAS }));
  push(text(cx + 52, Y + 40, 'PRODUCT_NAME', { size: 15, color: INK }));
  // Icon-only nav
  ['🏠', '🔍', '📊', '📖', '☰'].forEach((ic, i) => {
    push(text(cx + INNER - 200 + i * 40, Y + 40, ic, { size: 16 }));
  });

  // Hero strip
  const heroY = Y + 96;
  add(card(cx + 16, heroY, INNER - 32, 100, { fill: ACCENT_TINT, stroke: ACCENT, strokeWidth: 1.5 }));
  push(text(cx + 32, heroY + 20, 'Track the entire arc of tech.', { size: 18, color: INK }));
  push(text(cx + 32, heroY + 48, 'From 1960s → today. Signals + dossiers + market analytics.', { size: 11, color: INK_LIGHT }));
  add(button(cx + 32, heroY + 68, 140, 28, 'Browse feed', { filled: true, size: 11 }));

  // 2-col product grid
  const gridY = heroY + 120;
  push(text(cx + 16, gridY, '🚀  LAUNCHED TODAY', { size: 14, color: INK }));
  const tCardW = (INNER - 48) / 2;
  const tCardH = 140;
  for (let i = 0; i < 6; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const tcx = cx + 16 + col * (tCardW + 16);
    const tcy = gridY + 24 + row * (tCardH + 16);
    add(productCardMock(tcx, tcy, tCardW, tCardH, {
      name: ['Notion', 'Linear', 'Arc', 'Raycast', 'Vercel', 'Cursor'][i],
      tag: 'Productivity',
      cat: 'SaaS',
      score: 80 + i,
      spark: [3, 5, 4, 7, 6, 8, 10],
    }));
  }

  // Trending list (single column)
  const trendY = gridY + 24 + 3 * (tCardH + 16) + 16;
  push(text(cx + 16, trendY, '📈  TRENDING', { size: 14, color: INK }));
  ['Supabase', 'Bun', 'Tauri', 'Rive'].forEach((n, i) => {
    add(productRowMock(cx + 16, trendY + 24 + i * 56, INNER - 32, 48, {
      name: n, tag: 'Dev Tools', rightValue: `+${12 - i * 2}%`, rightColor: SUCCESS,
    }));
  });

  // Annotation
  const annY = trendY + 260;
  add(card(cx + 16, annY, INNER - 32, 56, { fill: SURFACE, stroke: BORDER }));
  push(text(cx + 32, annY + 16, '📐 Breakpoint notes', { size: 11, color: INK, mono: true }));
  push(text(cx + 32, annY + 34, '• md breakpoint (768+): 2-col grid, icon nav, no sidebar, sparklines still visible', { size: 10, color: INK_LIGHT }));
}

// ─── Panel 12: MOBILE BREAKPOINT (375px) ──────────────────────────────
{
  const X = R3_X + 880, Y = 2960, W = 430, H = 1400;
  const INNER = 375;
  push(text(X, Y - 56, '/ @ mobile 375px', { size: 26, color: INK }));
  push(text(X, Y - 24, 'iPhone 14/15 standard. Hamburger menu. 1-col feed. Bottom nav bar. Touch targets 44px+.', { size: 12, color: INK_LIGHT }));
  push(text(X + W - 100, Y - 24, `Mobile ${INNER}×${H}`, { size: 11, color: INK_DIM, mono: true }));

  push(rect(X, Y, W, H, { fill: SURFACE, stroke: BORDER_STRONG, strokeWidth: 2, radius: 24 }));
  const pad = (W - INNER) / 2;
  const mx = X + pad;

  // Status bar
  push(rect(mx, Y + 16, INNER, 20, { fill: 'transparent', stroke: 'transparent' }));
  push(text(mx + 12, Y + 20, '9:41', { size: 10, color: INK }));
  push(text(mx + INNER - 40, Y + 20, '▫️▫️🔋', { size: 10, color: INK }));

  // Mobile header
  add(rect(mx, Y + 40, INNER, 52, { fill: CANVAS, stroke: BORDER, radius: 0 }));
  push(text(mx + 12, Y + 56, '☰', { size: 18, color: INK_MED }));
  push(rect(mx + INNER / 2 - 14, Y + 52, 28, 28, { fill: ACCENT, stroke: ACCENT, radius: 6 }));
  push(text(mx + INNER / 2 - 6, Y + 58, 'P', { size: 16, color: CANVAS }));
  push(text(mx + INNER - 44, Y + 56, '🔍', { size: 16 }));

  // Search bar
  add(rect(mx + 12, Y + 104, INNER - 24, 36, { fill: SURFACE_2, stroke: BORDER, radius: 10 }));
  push(text(mx + 24, Y + 116, '🔍  Search products, companies…', { size: 11, color: INK_DIM }));

  // Hero card
  const heroY = Y + 156;
  add(card(mx + 12, heroY, INNER - 24, 120, { fill: ACCENT_TINT, stroke: ACCENT, strokeWidth: 1.5 }));
  push(text(mx + 24, heroY + 14, 'The arc of tech.', { size: 16, color: INK }));
  push(text(mx + 24, heroY + 36, '1960s → today.', { size: 16, color: INK }));
  push(text(mx + 24, heroY + 60, 'Signals, dossiers, markets.', { size: 10, color: INK_LIGHT }));
  add(button(mx + 24, heroY + 80, 140, 32, 'Open feed', { filled: true, size: 11 }));

  // Section: Launched today (1-col)
  let my = heroY + 140;
  push(text(mx + 12, my, '🚀  LAUNCHED TODAY', { size: 13, color: INK }));
  my += 20;
  for (let i = 0; i < 3; i++) {
    add(productRowMock(mx + 12, my, INNER - 24, 72, {
      name: ['Notion AI', 'Linear', 'Arc'][i],
      tag: ['Productivity', 'Project Mgmt', 'Browser'][i],
      meta: `launched 2h ago · buzz ${90 - i * 3}`,
      rightLabel: '▲ 12%',
    }));
    my += 80;
  }

  // Section: Trending
  my += 12;
  push(text(mx + 12, my, '📈  TRENDING', { size: 13, color: INK }));
  my += 20;
  for (let i = 0; i < 3; i++) {
    add(productRowMock(mx + 12, my, INNER - 24, 56, {
      name: ['Supabase', 'Bun', 'Tauri'][i],
      tag: ['Dev Tools', 'Runtime', 'Desktop'][i],
      rightValue: `+${14 - i * 3}%`,
      rightColor: SUCCESS,
    }));
    my += 62;
  }

  // Bottom tab bar (fixed)
  const btY = Y + H - 72;
  push(rect(mx, btY, INNER, 72, { fill: CANVAS, stroke: BORDER, radius: 0 }));
  push(line(mx, btY, mx + INNER, btY, { stroke: BORDER }));
  const tabs = [
    ['🏠', 'Feed', true],
    ['🔍', 'Browse', false],
    ['📊', 'Markets', false],
    ['☰', 'More', false],
  ];
  tabs.forEach(([ic, lbl, active], i) => {
    const tx = mx + 20 + i * (INNER - 40) / (tabs.length - 1) - 10;
    push(text(tx, btY + 18, ic, { size: 18 }));
    push(text(tx - 6, btY + 42, lbl, { size: 9, color: active ? ACCENT_DEEP : INK_DIM }));
  });

  // Annotation
  const annY = btY - 80;
  add(card(mx + 12, annY, INNER - 24, 60, { fill: SURFACE, stroke: BORDER }));
  push(text(mx + 22, annY + 10, '📐 Breakpoint notes', { size: 10, color: INK, mono: true }));
  push(text(mx + 22, annY + 26, '• sm: 1-col, hamburger, bottom nav', { size: 9, color: INK_LIGHT }));
  push(text(mx + 22, annY + 40, '• 44px touch targets, sparklines hidden', { size: 9, color: INK_LIGHT }));
}

// ══════════════════════════════════════════════════════════════════════
// ROUND 4 — User Flows + Component Library
// Column at x=5000. Two large panels.
// ══════════════════════════════════════════════════════════════════════

const R4_X = 5000;

// ─── Panel 13: USER FLOW DIAGRAMS ─────────────────────────────────────
{
  const X = R4_X, Y = 100, W = 1600, H = 2800;
  push(text(X, Y - 56, 'User flows', { size: 26, color: INK }));
  push(text(X, Y - 24, 'Four critical flows. Each row = one flow. Rectangles = pages/states. Diamonds = decisions. Arrows = transitions.', { size: 12, color: INK_LIGHT }));
  push(rect(X, Y, W, H, { fill: CANVAS, stroke: BORDER_STRONG, strokeWidth: 2, radius: 8 }));

  // Flow node helper (local to this panel)
  const flowNode = (fx, fy, label, sub, color = ACCENT) => {
    const w = 180, h = 68;
    const items = [];
    items.push(...card(fx, fy, w, h, { fill: CANVAS, stroke: color, strokeWidth: 1.5, radius: 10 }));
    items.push(rect(fx + 12, fy + 12, 4, 44, { fill: color, stroke: color, rounded: false }));
    items.push(text(fx + 24, fy + 14, label, { size: 13, color: INK }));
    if (sub) items.push(text(fx + 24, fy + 36, sub, { size: 10, color: INK_LIGHT, mono: true }));
    return { items, w, h };
  };
  const flowDecision = (fx, fy, label) => {
    const w = 130, h = 74;
    const items = [];
    items.push(diamond(fx, fy, w, h, { fill: WARNING_SOFT, stroke: WARNING, strokeWidth: 1.5 }));
    items.push(text(fx + 16, fy + h / 2 - 8, label, { size: 11, color: INK, align: 'center', width: w - 32 }));
    return { items, w, h };
  };

  const drawFlow = (fy, title, tint, nodes, arrows) => {
    // flow header
    push(rect(X + 24, fy, W - 48, 52, { fill: tint, stroke: BORDER, radius: 8 }));
    push(text(X + 40, fy + 16, title, { size: 15, color: INK }));
    const startY = fy + 80;
    let lastRight = null;
    const positions = [];
    nodes.forEach((n, i) => {
      const nx = X + 48 + i * 230;
      const ny = startY;
      if (n.type === 'decision') {
        const d = flowDecision(nx, ny, n.label);
        d.items.forEach(el => elements.push(el));
        positions.push({ x: nx, y: ny, w: d.w, h: d.h });
      } else {
        const node = flowNode(nx, ny, n.label, n.sub, n.color || ACCENT);
        node.items.forEach(el => elements.push(el));
        positions.push({ x: nx, y: ny, w: node.w, h: node.h });
      }
    });
    // connect
    arrows.forEach(([from, to, lbl]) => {
      const a = positions[from];
      const b = positions[to];
      push(arrow(a.x + a.w, a.y + a.h / 2, b.x, b.y + b.h / 2));
      if (lbl) {
        const mx = (a.x + a.w + b.x) / 2;
        push(text(mx - 20, a.y + a.h / 2 - 14, lbl, { size: 10, color: INK_DIM, mono: true }));
      }
    });
  };

  // Flow 1: Signup → first dossier
  drawFlow(Y + 40, '① SIGNUP → FIRST DOSSIER VIEW', ACCENT_TINT, [
    { label: '/signup', sub: 'email + password', color: ACCENT },
    { label: 'email verify', sub: 'code → confirm', color: ACCENT },
    { label: '/onboarding', sub: 'pick 3 categories', color: ACCENT },
    { label: '/  (feed)', sub: 'personalized', color: SUCCESS },
    { label: '/dossier/[slug]', sub: 'first open', color: SUCCESS },
    { label: '★ saved', sub: 'localStorage + db', color: SUCCESS },
  ], [[0, 1], [1, 2], [2, 3], [3, 4, 'click card'], [4, 5, '☆ save']]);

  // Flow 2: Browse → compare → save
  drawFlow(Y + 240, '② BROWSE → COMPARE → SAVE', SUCCESS_TINT, [
    { label: '/products', sub: 'faceted filter', color: ACCENT },
    { label: '+ add to compare', sub: 'sticky tray', color: ACCENT },
    { label: '+ another', sub: 'tray shows 2', color: ACCENT },
    { label: '/compare?a=&b=', sub: 'side-by-side', color: SUCCESS },
    { label: 'AI verdict', sub: 'Claude-powered', color: PURPLE },
    { label: '★ save set', sub: 'shareable URL', color: SUCCESS },
  ], [[0, 1], [1, 2], [2, 3, 'open'], [3, 4], [4, 5]]);

  // Flow 3: Search → filter → dossier
  drawFlow(Y + 440, '③ SEARCH → FILTER → DOSSIER', WARNING_TINT, [
    { label: '⌘K search', sub: 'command palette', color: ACCENT },
    { label: '/search?q=', sub: 'fuzzy match', color: ACCENT },
    { type: 'decision', label: 'refine?' },
    { label: '/products + facet', sub: 'sidebar filters', color: ACCENT },
    { label: '/dossier/[slug]', sub: 'full file', color: SUCCESS },
    { label: '/dossier/[slug]', sub: 'via "similar to"', color: SUCCESS },
  ], [[0, 1, 'enter'], [1, 2], [2, 3, 'yes'], [3, 4, 'click'], [1, 4, 'no'], [4, 5, 'similar →']]);

  // Flow 4: Funding alert → dossier
  drawFlow(Y + 640, '④ FUNDING ALERT → FOLLOW COMPANY', PURPLE_SOFT, [
    { label: '🔔 push alert', sub: '$X raised Series B', color: DANGER },
    { label: '/dossier/[slug]', sub: 'scrolled to funding', color: ACCENT },
    { label: 'funding timeline', sub: 'expanded', color: ACCENT },
    { label: '/companies/[slug]', sub: 'parent co.', color: SUCCESS },
    { label: '★ follow', sub: 'email digest', color: SUCCESS },
  ], [[0, 1, 'tap'], [1, 2, 'scroll'], [2, 3, 'open co.'], [3, 4]]);

  // Legend
  const legY = Y + 860;
  add(card(X + 24, legY, W - 48, 80, { fill: SURFACE, stroke: BORDER }));
  push(text(X + 40, legY + 14, 'LEGEND', { size: 11, color: INK, mono: true }));
  push(rect(X + 40, legY + 40, 16, 16, { fill: CANVAS, stroke: ACCENT, strokeWidth: 1.5, radius: 4 }));
  push(text(X + 62, legY + 42, 'Navigable route', { size: 11, color: INK_MED }));
  push(rect(X + 220, legY + 40, 16, 16, { fill: CANVAS, stroke: SUCCESS, strokeWidth: 1.5, radius: 4 }));
  push(text(X + 242, legY + 42, 'Success state / conversion event', { size: 11, color: INK_MED }));
  push(diamond(X + 500, legY + 38, 24, 20, { fill: WARNING_SOFT, stroke: WARNING, strokeWidth: 1.5 }));
  push(text(X + 530, legY + 42, 'Decision / branch', { size: 11, color: INK_MED }));
  push(rect(X + 700, legY + 40, 16, 16, { fill: CANVAS, stroke: PURPLE, strokeWidth: 1.5, radius: 4 }));
  push(text(X + 722, legY + 42, 'AI / LLM-assisted step', { size: 11, color: INK_MED }));
  push(rect(X + 920, legY + 40, 16, 16, { fill: CANVAS, stroke: DANGER, strokeWidth: 1.5, radius: 4 }));
  push(text(X + 942, legY + 42, 'Out-of-app entry (push, email, deeplink)', { size: 11, color: INK_MED }));

  // Notes section
  const noteY = Y + 960;
  add(card(X + 24, noteY, W - 48, 200, { fill: CANVAS, stroke: BORDER }));
  push(text(X + 40, noteY + 14, 'PHASE 1 COVERAGE', { size: 11, color: INK, mono: true }));
  const notes = [
    'Flow ① — Signup + onboarding blocked on auth (Phase 4). For Phase 1, skip onboarding, drop users straight to /.',
    'Flow ② — /compare works with mock data today. Real data after Day 5 cut-over. AI verdict uses Claude Sonnet 4.6.',
    'Flow ③ — ⌘K palette already built in components/search-command.tsx. Backend query = pg_trgm + pgvector hybrid.',
    'Flow ④ — Push alerts are Phase 5+. For Phase 1, funding alerts are email digest only (resend.com integration).',
    '',
    'Metrics to instrument per flow: TTI (time to first meaningful action), drop-off per step, % completion, time per step.',
    'Analytics tooling: PostHog event tracking on every node transition. Funnel reports wired in Week 4.',
  ];
  notes.forEach((n, i) => {
    push(text(X + 40, noteY + 36 + i * 20, n, { size: 11, color: n === '' ? INK_DIM : INK_MED }));
  });
}

// ─── Panel 14: COMPONENT LIBRARY ──────────────────────────────────────
{
  const X = R4_X, Y = 3000, W = 1600, H = 2200;
  push(text(X, Y - 56, 'Component library', { size: 26, color: INK }));
  push(text(X, Y - 24, 'Reusable primitives pulled out as a standalone palette. Reference when building any page.', { size: 12, color: INK_LIGHT }));
  push(rect(X, Y, W, H, { fill: CANVAS, stroke: BORDER_STRONG, strokeWidth: 2, radius: 8 }));

  // 3-col grid: width of each section ~500
  const col = (i) => X + 32 + i * 512;

  // ── Section: Product cards ───────────────────────────────────────
  let sy = Y + 24;
  push(text(col(0), sy, '🧩  PRODUCT CARDS', { size: 14, color: INK }));
  push(text(col(0), sy + 22, '4 variants — default, compact, featured, list', { size: 10, color: INK_LIGHT, mono: true }));
  // default
  add(productCardMock(col(0), sy + 48, 220, 180, { name: 'Notion', tag: 'All-in-one workspace', cat: 'Productivity', score: 94 }));
  push(text(col(0), sy + 236, 'default  (grid card, 220×180)', { size: 9, color: INK_DIM, mono: true }));
  // compact
  add(productCardMock(col(0) + 240, sy + 48, 180, 140, { name: 'Linear', tag: 'Issue tracker', cat: 'Dev Tools', score: 88 }));
  push(text(col(0) + 240, sy + 196, 'compact  (180×140)', { size: 9, color: INK_DIM, mono: true }));
  // featured
  add(card(col(0), sy + 260, 420, 110, { fill: ACCENT_TINT, stroke: ACCENT, strokeWidth: 1.5 }));
  add(avatar(col(0) + 16, sy + 276, 60, 'R'));
  push(text(col(0) + 88, sy + 280, 'Raycast', { size: 18, color: INK }));
  push(text(col(0) + 88, sy + 304, 'Supercharged launcher for Mac', { size: 11, color: INK_LIGHT }));
  add(pillRow(col(0) + 88, sy + 324, ['Featured', 'Productivity', 'free'], { fill: ACCENT_SOFT, stroke: ACCENT, color: ACCENT_DEEP, size: 10 }));
  push(text(col(0), sy + 380, 'featured  (hero 420×110)', { size: 9, color: INK_DIM, mono: true }));
  // list
  add(productRowMock(col(0), sy + 400, 420, 72, { name: 'Arc', tag: 'Browser', meta: 'launched 2022', rightValue: '+12%' }));
  push(text(col(0), sy + 478, 'list  (row 420×72)', { size: 9, color: INK_DIM, mono: true }));

  // ── Section: Buttons ─────────────────────────────────────────────
  push(text(col(1), sy, '🔘  BUTTONS', { size: 14, color: INK }));
  push(text(col(1), sy + 22, '4 variants × 3 sizes', { size: 10, color: INK_LIGHT, mono: true }));
  add(button(col(1), sy + 48, 130, 40, 'Primary', { filled: true, size: 14 }));
  add(button(col(1) + 146, sy + 48, 130, 40, 'Outline', { filled: false, size: 14 }));
  add(button(col(1) + 292, sy + 48, 130, 40, 'Ghost', { filled: false, stroke: 'transparent' }));
  add(button(col(1), sy + 100, 110, 32, 'Small', { filled: true, size: 12 }));
  add(button(col(1) + 126, sy + 100, 110, 32, 'Small out', { filled: false, size: 12 }));
  add(button(col(1) + 252, sy + 100, 90, 32, '＋ Save', { filled: false, size: 12 }));
  add(button(col(1), sy + 148, 160, 48, 'Open dossier →', { filled: true, size: 15 }));

  // ── Section: Pills / badges ──────────────────────────────────────
  push(text(col(1), sy + 216, '🏷️  PILLS & BADGES', { size: 14, color: INK }));
  push(text(col(1), sy + 238, 'Used in attribute panel, filter chips, category tags', { size: 10, color: INK_LIGHT, mono: true }));
  add(pillRow(col(1), sy + 262, ['Productivity', 'Dev Tools', 'AI', 'Finance'], { size: 11 }));
  add(pillRow(col(1), sy + 288, ['collaborative', 'real-time', 'api-first'], { fill: SUCCESS_SOFT, stroke: SUCCESS, color: SUCCESS, size: 11 }));
  add(pillRow(col(1), sy + 314, ['free', 'open-source'], { fill: WARNING_SOFT, stroke: WARNING, color: WARNING, size: 11 }));
  add(pillRow(col(1), sy + 340, ['soc2', 'gdpr', 'hipaa'], { fill: PURPLE_SOFT, stroke: PURPLE, color: PURPLE, size: 11 }));
  add(pillRow(col(1), sy + 366, ['▲ trending', '🔥 breakout'], { fill: DANGER_SOFT, stroke: DANGER, color: DANGER, size: 11 }));

  // ── Section: Charts ──────────────────────────────────────────────
  push(text(col(2), sy, '📊  CHART PRIMITIVES', { size: 14, color: INK }));
  push(text(col(2), sy + 22, 'sparkline, bar, line, radar, donut, heatmap', { size: 10, color: INK_LIGHT, mono: true }));
  // sparkline
  add(card(col(2), sy + 48, 220, 56, { fill: CANVAS, stroke: BORDER }));
  add(sparkline(col(2) + 14, sy + 64, 190, 28, [2, 4, 3, 6, 5, 7, 9, 8, 11, 13]));
  push(text(col(2) + 14, sy + 92, 'sparkline', { size: 9, color: INK_DIM, mono: true }));
  // bar
  add(card(col(2) + 240, sy + 48, 220, 56, { fill: CANVAS, stroke: BORDER }));
  add(barChart(col(2) + 254, sy + 60, 190, 36, [5, 8, 4, 10, 7, 12, 9]));
  push(text(col(2) + 254, sy + 92, 'bar chart', { size: 9, color: INK_DIM, mono: true }));
  // line chart
  add(card(col(2), sy + 120, 220, 100, { fill: CANVAS, stroke: BORDER }));
  add(lineChart(col(2) + 14, sy + 134, 190, 70, [10, 20, 15, 30, 28, 40, 38, 55, 60, 70]));
  push(text(col(2) + 14, sy + 206, 'line chart', { size: 9, color: INK_DIM, mono: true }));
  // radar
  add(card(col(2) + 240, sy + 120, 220, 100, { fill: CANVAS, stroke: BORDER }));
  add(radarChart(col(2) + 350, sy + 170, 38, [0.8, 0.6, 0.9, 0.7, 0.5, 0.85], ['UX', 'Depth', 'Value', 'Support', 'Perf', 'Docs'], { stroke: ACCENT, fill: ACCENT_SOFT }));
  push(text(col(2) + 254, sy + 206, 'radar chart', { size: 9, color: INK_DIM, mono: true }));

  // donut
  add(card(col(2), sy + 236, 220, 140, { fill: CANVAS, stroke: BORDER }));
  add(donutChart(col(2) + 110, sy + 306, 56, 32, [40, 25, 15, 20], [ACCENT, SUCCESS, WARNING, DANGER]));
  push(text(col(2) + 14, sy + 372, 'donut chart', { size: 9, color: INK_DIM, mono: true }));
  // heatmap mini
  add(card(col(2) + 240, sy + 236, 220, 140, { fill: CANVAS, stroke: BORDER }));
  add(heatmap(col(2) + 256, sy + 252, 188, 108, [
    [0.1, 0.2, 0.4, 0.6, 0.8],
    [0.3, 0.4, 0.6, 0.7, 0.9],
    [0.5, 0.6, 0.7, 0.8, 1.0],
  ]));
  push(text(col(2) + 254, sy + 372, 'heatmap', { size: 9, color: INK_DIM, mono: true }));

  // ── Section: Avatars / logos ─────────────────────────────────────
  let sy2 = Y + 560;
  push(text(col(0), sy2, '👤  AVATARS & LOGOS', { size: 14, color: INK }));
  push(text(col(0), sy2 + 22, '4 sizes — small 24, med 40, large 56, xl 80', { size: 10, color: INK_LIGHT, mono: true }));
  add(avatar(col(0), sy2 + 48, 24, 'S'));
  add(avatar(col(0) + 44, sy2 + 48, 40, 'M'));
  add(avatar(col(0) + 104, sy2 + 48, 56, 'L'));
  add(avatar(col(0) + 184, sy2 + 48, 80, 'XL'));

  // ── Section: Dividers & misc ─────────────────────────────────────
  push(text(col(1), sy2, '➖  DIVIDERS & MISC', { size: 14, color: INK }));
  push(divider(col(1), sy2 + 52, 400));
  push(text(col(1), sy2 + 60, 'default divider (BORDER)', { size: 9, color: INK_DIM, mono: true }));
  push(divider(col(1), sy2 + 86, 400, ACCENT));
  push(text(col(1), sy2 + 94, 'accent divider', { size: 9, color: INK_DIM, mono: true }));
  add(dot(col(1), sy2 + 120, SUCCESS));
  push(text(col(1) + 16, sy2 + 114, 'status dot (success, warning, danger)', { size: 10, color: INK_MED }));
  add(dot(col(1), sy2 + 140, WARNING));
  add(dot(col(1), sy2 + 160, DANGER));

  // ── Section: Widget / card ───────────────────────────────────────
  push(text(col(2), sy2, '🗂️  WIDGET / CARD', { size: 14, color: INK }));
  push(text(col(2), sy2 + 22, 'card + accent bar + title + description', { size: 10, color: INK_LIGHT, mono: true }));
  add(widget(col(2), sy2 + 48, 420, 120, '🏆 SAMPLE WIDGET', '→ data_source.join(other) WHERE condition   •   refresh rate: 1h'));
  push(text(col(2) + 16, sy2 + 128, 'Content area. Any chart, list, or form fits here.', { size: 11, color: INK_MED }));

  // ── Footer / usage notes ─────────────────────────────────────────
  const footY = Y + H - 200;
  add(card(X + 24, footY, W - 48, 160, { fill: SURFACE, stroke: BORDER }));
  push(text(X + 40, footY + 14, 'USAGE NOTES', { size: 11, color: INK, mono: true }));
  const usageNotes = [
    'All primitives live in docs/wireframes/prism-wireframe-build.mjs — treat them as wireframe-only.',
    'Production counterparts: components/product-card.tsx, components/market-pulse.tsx, components/ui/* (shadcn).',
    'When a new page is designed, add it as a new { ... } block and reuse helpers — never duplicate primitives.',
    '',
    'Color tokens (kept in sync with app/globals.css):',
    '  ACCENT = sky-500   SUCCESS = emerald-500   WARNING = amber-500   DANGER = red-500   PURPLE = violet-500',
    '  CANVAS = white   SURFACE = slate-50   BORDER = slate-200   INK = slate-900   INK_LIGHT = slate-500',
  ];
  usageNotes.forEach((n, i) => {
    push(text(X + 40, footY + 36 + i * 18, n, { size: 10, color: n === '' ? INK_DIM : INK_MED, mono: n.startsWith('  ') }));
  });
}

// ══════════════════════════════════════════════════════════════════════
// SECTION HEADERS — big labels above each column
// ══════════════════════════════════════════════════════════════════════
{
  const headerY = -60;
  const headers = [
    { x: 80,   w: 1440, label: 'ROUND 1 — FOUNDATION',              sub: 'sitemap · home · dossier',                  color: ACCENT,  tint: ACCENT_TINT },
    { x: 1720, w: 1440, label: 'ROUND 2 — DESKTOP ROUTES',          sub: 'markets · products · insights · compare · etc', color: SUCCESS, tint: SUCCESS_TINT },
    { x: 3360, w: 1440, label: 'ROUND 3 — INTERACTION + RESPONSIVE', sub: 'modal · audit · tablet · mobile',            color: WARNING, tint: WARNING_TINT },
    { x: 5000, w: 1600, label: 'ROUND 4 — FLOWS + COMPONENTS',       sub: 'user flows · component library',            color: PURPLE,  tint: PURPLE_TINT },
  ];
  headers.forEach(h => {
    push(rect(h.x, headerY, h.w, 120, { fill: h.tint, stroke: h.color, strokeWidth: 2, radius: 12 }));
    push(rect(h.x + 20, headerY + 20, 6, 80, { fill: h.color, stroke: h.color, rounded: false }));
    push(text(h.x + 40, headerY + 18, h.label, { size: 32, color: INK }));
    push(text(h.x + 40, headerY + 66, h.sub, { size: 14, color: INK_LIGHT, mono: true }));
  });
}

// ──────────────────────────────────────────────────────────────────────
// Write file
// ──────────────────────────────────────────────────────────────────────
const file = {
  type: 'excalidraw',
  version: 2,
  source: 'https://excalidraw.com',
  elements,
  appState: {
    gridSize: null,
    viewBackgroundColor: '#ffffff',
  },
  files: {},
};

const outPath = new URL('./prism-all-rounds-v2-with-round4.excalidraw', import.meta.url);
writeFileSync(outPath, JSON.stringify(file));
console.log(`Wrote prism-all-rounds-v2-with-round4.excalidraw  (${elements.length} elements, Rounds 1-4)`);
console.log(`File: ${outPath}`);
