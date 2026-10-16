const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../docs');
const manifestPath = path.resolve(__dirname, '../site-manifest.json');
const blocked = /\/(?:Users|home)\/[^/\s]+\/|\/(?:job_data|[^/\s]*bucket)\/|(?:https?:\/\/)(?:localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(?=[:/\s"]|$)|\b(?:AKIA|ASIA)[A-Z0-9]{16}\b|\bgh[pousr]_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b|-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/;
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    const full = path.join(dir, entry.name);
    assert(!entry.isSymbolicLink(), `Symlink is not allowed: ${path.relative(root, full)}`);
    if (entry.isDirectory()) walk(full); else if (entry.isFile()) files.push(full);
  }
}
walk(root); files.sort();
let links = 0, scripts = 0, compressed = 0;
function localFile(from, url) {
  if (!url || url.startsWith('#') || /^(https?:|mailto:|data:|blob:)/.test(url)) return;
  assert(!url.startsWith('/'), `Root-absolute URL breaks project Pages: ${url}`);
  const target = path.resolve(path.dirname(from), decodeURIComponent(url.split(/[?#]/)[0]));
  assert(target.startsWith(root + path.sep), `Resource escapes docs/: ${url}`);
  assert(fs.existsSync(target), `Missing resource in ${path.relative(root, from)}: ${url}`);
  links++;
}
const manifest = files.map(file => {
  const relative = path.relative(root, file).split(path.sep).join('/');
  assert(!/(?:^|\/)(?:\.env(?:\..*)?|\.DS_Store|\.git|test-results)(?:\/|$)/.test(relative), `Private file: ${relative}`);
  assert(!/\.(?:ckpt|pt|pth|pkl|zip|log)$/i.test(relative), `Non-site artifact: ${relative}`);
  const buffer = fs.readFileSync(file);
  assert(!buffer.subarray(0,100).toString().startsWith('version https://git-lfs.github.com/spec/'), `LFS pointer is not a deployable media asset: ${relative}`);
  assert(buffer.length < 100 * 1024 ** 2, `File exceeds GitHub's normal Git limit: ${relative}`);
  if (/\.(?:html|js|css|json|svg)$/.test(relative)) {
    const text = buffer.toString('utf8');
    assert(!blocked.test(text), `Internal URL/path or credential pattern: ${relative}`);
    if (relative.endsWith('.json')) JSON.parse(text);
    if (relative.endsWith('.js')) { new vm.Script(text); scripts++; }
    if (relative.endsWith('.html')) {
      for (const [,body] of text.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
        if (body.trim()) { new vm.Script(body); scripts++; }
      }
      for (const [,url] of text.matchAll(/(?:src|href|poster)="([^"<>]*)"/g)) localFile(file, url);
    }
  }
  if (relative.endsWith('.json.gz')) {
    const text = zlib.gunzipSync(buffer).toString('utf8');
    JSON.parse(text); compressed++;
    assert(!blocked.test(text), `Private compressed metadata: ${relative}`);
  }
  return {path:relative, bytes:buffer.length, sha256:crypto.createHash('sha256').update(buffer).digest('hex')};
});
for (const r of JSON.parse(fs.readFileSync(path.join(root, 'applications.json')))) {
  for (const name of ['player.html','rgb.mp4','depth.mp4','rgb.jpg','depth.jpg','geometry.json.gz']) localFile(path.join(root,'index.html'), `${r.base}/${name}`);
  if (r.sky_mask_default) localFile(path.join(root,'index.html'), `${r.base}/sky.json.gz`);
}
for (const r of JSON.parse(fs.readFileSync(path.join(root,'cases.json')))) {
  const methods = ['wan','vrae','gen3r','aether','fantasyworld'];
  for (const m of methods) {
    for (const suffix of ['.mp4','_poster.jpg','_full.html']) localFile(path.join(root,'index.html'), `scenes/${r.id}/${m}${suffix}`);
    if (r.has_depth) for (const suffix of ['_rgb.png','_depth.png','_depth_contrast.png']) localFile(path.join(root,'index.html'), `scenes/${r.id}/${m}${suffix}`);
    assert.equal(r.videos[m].times.length, r.videos[m].frames);
  }
}
const total = manifest.reduce((n, r) => n + r.bytes, 0);
assert(total < 1024 ** 3, 'Site exceeds 1 GiB');
assert(fs.existsSync(path.join(root,'.nojekyll')), 'Missing .nojekyll');
if (process.argv.includes('--write-manifest')) fs.writeFileSync(manifestPath, JSON.stringify({files:manifest}, null, 2) + '\n');
else assert.deepEqual(manifest, JSON.parse(fs.readFileSync(manifestPath)).files, 'Site changed: review changes, then run npm run manifest');
console.log(JSON.stringify({status:'passed',files:files.length,bytes:total,links_checked:links,scripts_checked:scripts,compressed_json_checked:compressed,integrity:'sha256',rights_review:'manual_required'}));
