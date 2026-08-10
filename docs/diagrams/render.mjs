#!/usr/bin/env node
/**
 * Renders every diagram in the documentation to SVG and PNG.
 *
 * Two sources, one output directory:
 *
 *   1. `src/*.dot`   - hand-authored Graphviz. These are the two "hero" diagrams (use case
 *                      and architecture), laid out deliberately because an auto-laid-out
 *                      version of either was not readable at the size a report prints them.
 *   2. ```mermaid``` - every fenced mermaid block in ../*.md and ../../README.md. These are
 *                      extracted in document order and rendered to <doc>-<n>.png, so the
 *                      image beside a block always corresponds to that block.
 *
 * Nothing here is a build dependency of the application: the toolchain is fetched on demand
 * with `npx`, and the generated images are committed. A reader of the repository (or a
 * marker opening a PDF) never needs to run this - it exists so the images can be regenerated
 * when a diagram changes, rather than being hand-edited into a state nobody can reproduce.
 *
 *   node docs/diagrams/render.mjs            # everything
 *   node docs/diagrams/render.mjs --dot      # Graphviz only (fast)
 *   node docs/diagrams/render.mjs --mermaid  # mermaid only
 *
 * Requirements: network access for `npx`, and a Chromium for mermaid. Playwright's browser
 * is reused when present so no second copy is downloaded.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = resolve(HERE, "..");
const REPO = resolve(DOCS, "..");
const SRC = join(HERE, "src");
const MERMAID_OUT = join(HERE, "mermaid");
const TMP = join(HERE, ".tmp");

const only = process.argv.includes("--dot")
  ? "dot"
  : process.argv.includes("--mermaid")
    ? "mermaid"
    : "all";

mkdirSync(MERMAID_OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

/** PNG width in pixels. Wide enough that 9pt node text survives being printed. */
const PNG_WIDTH = 2400;

// ── Graphviz ────────────────────────────────────────────────────────────────────
//
// Rendered with @viz-js/viz - Graphviz compiled to WebAssembly - rather than a system
// `dot`. It installs from npm on any machine with no native toolchain and no root, which
// matters because this repository is marked on machines we do not control.
async function renderDot() {
  const { instance } = await import("@viz-js/viz");
  const viz = await instance();

  // The actor glyph is inlined as a data URI. Graphviz needs the file's dimensions at
  // layout time but writes a plain reference into the SVG; substituting the data URI
  // afterwards keeps the output self-contained, so the SVG survives being moved, emailed
  // or embedded in a PDF without silently losing every stick figure.
  const actorSvg = readFileSync(join(SRC, "actor.svg"), "utf8");
  const actorUri = `data:image/svg+xml;base64,${Buffer.from(actorSvg).toString("base64")}`;

  for (const file of readdirSync(SRC).filter((f) => f.endsWith(".dot"))) {
    const name = file.replace(/\.dot$/, "");
    const dot = readFileSync(join(SRC, file), "utf8");

    let svg = viz.renderString(dot, {
      format: "svg",
      images: [{ name: "actor.svg", width: "44px", height: "64px" }],
    });
    svg = svg.replaceAll('xlink:href="actor.svg"', `xlink:href="${actorUri}"`);
    svg = svg.replaceAll('href="actor.svg"', `href="${actorUri}"`);

    const svgPath = join(HERE, `${name}.svg`);
    writeFileSync(svgPath, svg);
    toPng(svgPath, join(HERE, `${name}.png`));
    console.log(`  dot      ${name}.svg + .png`);
  }
}

// ── Mermaid ─────────────────────────────────────────────────────────────────────

/** Every fenced mermaid block in a markdown file, in document order. */
function mermaidBlocks(markdown) {
  const blocks = [];
  const re = /^```mermaid\n([\s\S]*?)^```$/gm;
  let m;
  while ((m = re.exec(markdown)) !== null) blocks.push(m[1]);
  return blocks;
}

function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const cache = join(process.env.HOME ?? "", ".cache", "ms-playwright");
  try {
    for (const dir of readdirSync(cache).filter((d) => d.startsWith("chromium-"))) {
      // existsSync, not a read: the binary is well over 100 MB and reading it just to
      // prove it is there would allocate all of that for a boolean.
      const candidate = join(cache, dir, "chrome-linux64", "chrome");
      if (existsSync(candidate)) return candidate;
    }
  } catch {
    /* no Playwright cache - fall through to puppeteer's own download */
  }
  return null;
}

function renderMermaid() {
  const chromium = chromiumPath();
  const puppeteerConfig = join(TMP, "puppeteer.json");
  writeFileSync(
    puppeteerConfig,
    JSON.stringify({
      ...(chromium ? { executablePath: chromium } : {}),
      // --no-sandbox is required to run Chromium as root in CI containers. This browser
      // only ever loads a local file this script just wrote, never remote content.
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    }),
  );

  const docs = [
    ...readdirSync(DOCS)
      .filter((f) => f.endsWith(".md"))
      .map((f) => ({ label: f.replace(/\.md$/, ""), path: join(DOCS, f) })),
    { label: "readme", path: join(REPO, "README.md") },
  ];

  for (const doc of docs) {
    let markdown;
    try {
      markdown = readFileSync(doc.path, "utf8");
    } catch {
      continue;
    }

    mermaidBlocks(markdown).forEach((block, i) => {
      const stem = `${doc.label}-${i + 1}`;
      const input = join(TMP, `${stem}.mmd`);
      writeFileSync(input, block);

      for (const ext of ["svg", "png"]) {
        execFileSync(
          "npx",
          [
            "--yes",
            "@mermaid-js/mermaid-cli",
            "-i", input,
            "-o", join(MERMAID_OUT, `${stem}.${ext}`),
            "-p", puppeteerConfig,
            "-b", "white",
            // Scale rather than a fixed width: a 4-node flowchart and a 30-node
            // architecture graph should not be forced to the same pixel width, or one of
            // them ends up either unreadable or absurdly large.
            "-s", ext === "png" ? "3" : "1",
          ],
          { stdio: ["ignore", "ignore", "inherit"] },
        );
      }
      console.log(`  mermaid  ${stem}.svg + .png`);
    });
  }
}

/**
 * SVG to PNG through Chromium, not ImageMagick. ImageMagick's SVG path rasterises text with
 * whichever renderer is compiled in and silently drops web-font and data-URI content on some
 * builds - which is exactly the content these diagrams are made of.
 */
function toPng(svgPath, pngPath) {
  const chromium = chromiumPath();
  if (!chromium) {
    console.warn(`  ! no Chromium found; skipping PNG for ${svgPath}`);
    return;
  }

  // Headless Chromium screenshots the WINDOW, not the document, so the window has to be
  // sized to the drawing or the image is silently cropped to the default viewport. Graphviz
  // writes its intrinsic size in points; scaling that to a fixed pixel width keeps the
  // aspect ratio and gives a predictable resolution whatever the diagram's shape.
  const svg = readFileSync(svgPath, "utf8");
  const [, w, h] = svg.match(/width="(\d+)pt"\s+height="(\d+)pt"/) ?? [];
  const width = PNG_WIDTH;
  const height = w && h ? Math.ceil((Number(h) / Number(w)) * PNG_WIDTH) : 1200;

  // The SVG is wrapped in an HTML page rather than loaded directly: opened on its own it
  // renders at its intrinsic point size and the screenshot is cropped to whatever the
  // window happens to be. Stretched to 100% width inside a page whose window matches the
  // aspect ratio, the whole drawing lands in the frame at a known resolution.
  const html = join(TMP, "shot.html");
  writeFileSync(
    html,
    `<style>html,body{margin:0;padding:0;background:#fff}` +
      `img{display:block;width:100%}</style>` +
      `<img src="file://${svgPath}">`,
  );

  execFileSync(
    chromium,
    [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--hide-scrollbars",
      "--default-background-color=FFFFFFFF",
      "--allow-file-access-from-files",
      `--screenshot=${pngPath}`,
      `--window-size=${width},${height}`,
      "--force-device-scale-factor=1",
      `file://${html}`,
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
}

console.log("Rendering diagrams...");
if (only !== "mermaid") await renderDot();
if (only !== "dot") renderMermaid();
rmSync(TMP, { recursive: true, force: true });
console.log("Done.");
