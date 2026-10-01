#!/usr/bin/env node
// Derive the claude.ai artifact page from index.html. The artifact host wraps the page in its own
// <!doctype html> skeleton, so it wants a fragment: the <title>, the stylesheet link, and the body.
// Usage: node tools/make-artifact.mjs <out-file>
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const out = process.argv[2];
if (!out) { console.error('usage: make-artifact.mjs <out-file>'); process.exit(1); }
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const title = (html.match(/<title>([^<]*)<\/title>/) || [, 'Shop Simulator'])[1];
const body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>')).trim();
const page = `<title>${title}</title>\n<link rel="stylesheet" href="style.css">\n${body}\n`;
await mkdir(dirname(out), { recursive: true });
await writeFile(out, page);
console.log(`wrote ${out} (${page.length} bytes)`);
