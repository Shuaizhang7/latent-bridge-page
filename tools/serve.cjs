// Preview a project-site subpath, including video Range requests.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../docs');
const port = Number(process.env.PORT || 8792);
const base = process.env.BASE_PATH || '/latent-bridge-page/';
if (!/^\/(?:[\w-]+\/)*$/.test(base)) throw Error('BASE_PATH must start and end with /');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.gz':'application/gzip','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.pdf':'application/pdf','.svg':'image/svg+xml'};
http.createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); return res.end(); }
  if (pathname === '/' && base !== '/') { res.writeHead(302, {Location: base}); return res.end(); }
  if (!pathname.startsWith(base)) { res.writeHead(404); return res.end(); }
  const relative = pathname.slice(base.length) + (pathname.endsWith('/') ? 'index.html' : '');
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) { res.writeHead(404); return res.end('Not found'); }
    if (!fs.realpathSync(file).startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    const headers = {'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Accept-Ranges':'bytes', 'Cache-Control':'no-cache'};
    let start = 0, end = stat.size - 1, status = 200;
    if (req.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (!match || (!match[1] && !match[2])) { res.writeHead(416, {'Content-Range':`bytes */${stat.size}`}); return res.end(); }
      if (match[1]) { start = Number(match[1]); if (match[2]) end = Math.min(Number(match[2]), end); }
      else start = Math.max(0, stat.size - Number(match[2]));
      if (start > end || start >= stat.size || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
        res.writeHead(416, {'Content-Range':`bytes */${stat.size}`}); return res.end();
      }
      status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
    }
    headers['Content-Length'] = Math.max(0, end - start + 1);
    res.writeHead(status, headers);
    if (req.method === 'HEAD' || stat.size === 0) return res.end();
    fs.createReadStream(file, {start, end}).on('error', () => res.destroy()).pipe(res);
  });
}).listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port}${base}`));

