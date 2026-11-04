import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(root, 'tools/audio-match-editor/index-standalone.html');
const outputPath = resolve(root, 'tools/audio-match-editor/index.html');
let html = await readFile(sourcePath, 'utf8');
let bundle = '';
for (const name of (await readdir(resolve(root, 'tools/audio-match-editor/src'))).filter(name => name.endsWith('.js')).sort()) {
  const relative = `tools/audio-match-editor/src/${name}`;
  let source = await readFile(resolve(root, relative), 'utf8');
  source = source.replace(/^\s*import\s+[^;]+;\s*$/gm, '');
  source = source.replace(/\bexport\s+(?=(?:const|function|class|async function)\b)/g, '');
  bundle += `\n/* --- ${relative} --- */\n${source}\n`;
}
if (/\b(?:import|export)\s/.test(bundle)) throw new Error('Unbundled module syntax remains');
html = html.replace(/<script id="app-bundle">[\s\S]*?<\/script>/g, '');
html = html.replace(/<script\s+type="module"\s+src="\.\/src\/app\.js"><\/script>/g, '');
html = html.replace('</body>', `<script id="app-bundle">\n${bundle}\n</script>\n</body>`);
await writeFile(outputPath, html, 'utf8');
console.log(`Built standalone file://-compatible app: ${outputPath}`);
