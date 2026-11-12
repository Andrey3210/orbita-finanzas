import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const port = Number(process.argv[2] ?? 4176);
createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    const filename = resolve(root, '.' + decodeURIComponent(path === '/' ? '/index.html' : path));
    if (!filename.startsWith(resolve(root) + sep) || !Object.hasOwn(mime, extname(filename))) {
      res.writeHead(404).end();
      return;
    }
    const data = await readFile(filename);
    res.writeHead(200, { 'Content-Type': mime[extname(filename)] + '; charset=utf-8' }).end(data);
  } catch {
    res.writeHead(404).end();
  }
}).listen(port, '127.0.0.1', () => console.log('foxio: http://127.0.0.1:' + port + '/'));
