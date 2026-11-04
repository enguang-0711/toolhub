import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(root, 'index.html');
const sourceHtml = await readFile(sourcePath, 'utf8');
const modules = ['src/state.js', 'src/audio.js', 'src/matcher.js', 'src/preview.js', 'src/editing.js', 'src/history.js', 'src/export.js', 'src/app.js'];
let bundle = '';
for (const relativePath of modules) {
  let source = await readFile(resolve(root, relativePath), 'utf8');
  source = source.replace(/^\s*import\s+[^;]+;\s*$/gm, '');
  source = source.replace(/\bexport\s+(?=(?:const|function|class|async function)\b)/g, '');
  bundle += `\n/* --- ${relativePath} --- */\n${source}\n`;
}
if (/\b(?:import|export)\s/.test(bundle)) throw new Error('Unbundled module syntax remains');
const inline = `<script id="app-bundle">\n${bundle}\n</script>`;
let outputHtml = sourceHtml
  .replace(/<script id="app-bundle">[\s\S]*?<\/script>/g, '')
  .replace(/<script\s+type="module"\s+src="\.\/src\/app\.js"><\/script>/g, '');
outputHtml = outputHtml.replace('</body>', `${inline}\n</body>`);
if (outputHtml === sourceHtml) throw new Error('Could not find document body');
await writeFile(sourcePath, outputHtml, 'utf8');
console.log(`Built standalone file://-compatible app: ${sourcePath}`);
