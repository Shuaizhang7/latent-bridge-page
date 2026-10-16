const assert = require('node:assert/strict');
const zlib = require('node:zlib');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.PAGE_URL || 'http://127.0.0.1:8792/latent-bridge-page/';
(async () => {
  const index = await fetch(base);
  assert.equal(index.status, 200);
  assert((await index.text()).includes('Latent Bridge'));
  const nested = await fetch(new URL('applications/driving_case_010/player.html', base));
  assert.equal(nested.status, 200);
  const media = new URL('applications/driving_case_010/rgb.mp4', base);
  const head = await fetch(media, {method:'HEAD'});
  assert.equal(head.status, 200);
  assert(head.headers.get('content-type').startsWith('video/mp4'));
  const part = await fetch(media, {headers:{Range:'bytes=0-63'}});
  assert.equal(part.status, 206);
  assert.equal((await part.arrayBuffer()).byteLength, 64);
  const suffix = await fetch(media, {headers:{Range:'bytes=-64'}});
  assert.equal(suffix.status, 206);
  assert.equal((await suffix.arrayBuffer()).byteLength, 64);
  const invalid = await fetch(media, {headers:{Range:'bytes=9999999999-'}});
  assert.equal(invalid.status, 416);
  const geometry = await fetch(new URL('applications/driving_case_010/geometry.json.gz', base));
  assert.equal(geometry.status, 200);
  const compressed = Buffer.from(await geometry.arrayBuffer());
  assert.equal(compressed[0], 0x1f, 'Geometry must be delivered as a gzip file, not transparently decoded');
  JSON.parse(zlib.gunzipSync(compressed));
  for (const url of ['../README.md','%2e%2e%2fREADME.md','.github/workflows/pages.yml']) {
    assert([403,404].includes((await fetch(new URL(url, base))).status));
  }
  const report = {status:'passed', project_subpath:true, nested_players:true, mp4_range:true, compressed_geometry:true, repository_files_not_served:true};
  const folder = path.join(__dirname,'test-results');fs.mkdirSync(folder,{recursive:true});
  fs.writeFileSync(path.join(folder,'http-validation.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
})().catch(e => {console.error(e);process.exit(1);});
