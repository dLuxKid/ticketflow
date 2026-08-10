# Diagram sources and rendered images

Every diagram in the documentation exists as an **image** as well as text, because a mermaid
block only renders on a host that supports it — a PDF export, a Word document or a printed
submission shows the fenced source instead, which is unreadable.

## What is here

| Path | What it is |
|---|---|
| `src/use-case.dot` | Hand-authored Graphviz — the UML use case diagram |
| `src/architecture.dot` | Hand-authored Graphviz — the layered system architecture |
| `src/actor.svg` | The UML stick figure, inlined into the use case diagram at render time |
| `use-case.svg` / `.png` | Rendered from `src/use-case.dot` |
| `architecture.svg` / `.png` | Rendered from `src/architecture.dot` |
| `mermaid/<doc>-<n>.svg` / `.png` | Every mermaid block in `docs/*.md`, in document order |
| `render.mjs` | Renders all of the above |

`mermaid/<doc>-<n>` is positional: `design-models-3.png` is the **third** mermaid block in
`design-models.md`. Insert or delete a block and the numbering after it shifts, so re-run the
renderer and re-check the image links whenever blocks are added or removed.

## Regenerating

```bash
cd docs/diagrams && npm install && npm run render
```

`npm run render:dot` does the two Graphviz diagrams only and takes about a second;
`npm run render:mermaid` does the rest.

**Edit the `.dot` source, never the `.svg`.** The generated files are overwritten on every
run, so a hand-edit to an image is lost the moment anyone regenerates it.

## Why these tools

- **Graphviz via `@viz-js/viz`** (WebAssembly, not a system binary) — it installs from npm
  with no native toolchain and no root, which matters for a repository that gets marked on
  machines we do not control.
- **Chromium for rasterising**, reusing Playwright's browser when one is already installed.
  ImageMagick's SVG path rasterises text with whichever renderer happens to be compiled in
  and silently drops data-URI content on some builds — which is exactly what these files are
  made of.

Neither is a dependency of the application. `docs/diagrams/node_modules` is git-ignored
(about 425 MB); the rendered images are committed, so nobody needs a toolchain to read a
diagram.

## The two hand-authored diagrams

The use case and architecture diagrams are laid out by hand rather than generated from the
mermaid, for one reason: automatic layout of graphs this size produces something technically
correct and practically unreadable. The mermaid use case diagram lays out as a single row
roughly ten times wider than it is tall — fine to scroll on screen, useless on a page. Both
mermaid blocks are kept in the documents, collapsed, so the content stays diffable as text.

Font choice is load-bearing rather than cosmetic. Both sources use **Courier** and
**Helvetica** because Graphviz has exact built-in metric tables for them. With a font it can
only estimate — DejaVu Sans Mono, for instance — layout is computed from text widths that do
not match what the renderer later draws, and every label overflows its shape by a few
characters.
