import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import * as sass from 'sass';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import * as esbuild from 'esbuild';

const WATCH = process.argv.includes('--watch');
const SERVE = process.argv.includes('--serve');

mkdirSync('dist', { recursive: true });

async function buildCss() {
  const result = sass.compile('src/scss/wmx.scss', { sourceMap: true, style: 'expanded' });
  writeFileSync('dist/wmx.css', result.css);

  const minified = await postcss([autoprefixer, cssnano({ preset: 'default' })]).process(
    result.css,
    { from: 'dist/wmx.css', to: 'dist/wmx.min.css' }
  );
  writeFileSync('dist/wmx.min.css', minified.css);
  console.log('[wmx] css built');
}

async function buildJs() {
  await esbuild.build({
    entryPoints: ['src/js/index.js'],
    bundle: true,
    format: 'iife',
    globalName: 'WMX',
    outfile: 'dist/wmx.js',
    sourcemap: true,
  });
  await esbuild.build({
    entryPoints: ['src/js/index.js'],
    bundle: true,
    format: 'iife',
    globalName: 'WMX',
    outfile: 'dist/wmx.min.js',
    minify: true,
    sourcemap: true,
  });
  console.log('[wmx] js built');
}

async function buildAll() {
  await Promise.all([buildCss(), buildJs()]);
}

await buildAll();

if (WATCH) {
  const fs = await import('node:fs');
  let pending = false;
  const rebuild = async () => {
    if (pending) return;
    pending = true;
    try {
      await buildAll();
    } catch (err) {
      console.error(err);
    }
    pending = false;
  };
  fs.watch('src', { recursive: true }, rebuild);
  console.log('[wmx] watching src/ for changes');
}

if (SERVE) {
  const MIME = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.map': 'application/json',
    '.svg': 'image/svg+xml',
  };
  const root = process.cwd();
  const server = createServer((req, res) => {
    const path = req.url.split('?')[0];
    if (path === '/') {
      // Redirect (not rewrite) so the browser's address bar reflects the real path —
      // otherwise relative links on that page (e.g. "guide.html") resolve against "/"
      // instead of "/docs/" and 404.
      res.writeHead(302, { Location: '/docs/index.html' });
      res.end();
      return;
    }
    const filePath = join(root, path);
    try {
      const data = readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  const port = 4173;
  server.listen(port, () => console.log(`[wmx] docs served at http://localhost:${port}`));
}
