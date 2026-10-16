"""Import an archived five-method case without changing native media/geometry."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import re
import shutil
import tempfile

import av

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', type=Path, required=True)
parser.add_argument('--id', required=True)
parser.add_argument('--dataset', required=True)
parser.add_argument('--title', required=True)
parser.add_argument('--identity', required=True)
args = parser.parse_args()
assert re.fullmatch(r'[a-z][a-z0-9-]*', args.id)
root = Path(__file__).resolve().parents[1]
docs = root / 'docs'
manifest = docs / 'cases.json'
records = json.loads(manifest.read_text())
assert not any(r['id'] == args.id for r in records), 'Case already exists'
destination = docs / 'scenes' / args.id
assert not destination.exists(), 'Never overwrite existing scenes'
comparison = (args.source / 'comparison.html').read_text()
assert args.identity in comparison, 'Source scene identity mismatch'
record = dict(id=args.id, dataset=args.dataset, title=args.title,
              identity=args.identity, has_depth=False, depth_frame=None, videos={})
checks = []
with tempfile.TemporaryDirectory(prefix='case-import-') as temporary:
    staged = Path(temporary)
    for method in ['wan', 'vrae', 'gen3r', 'aether', 'fantasyworld', 'gt']:
        video = args.source / f'{method}.mp4'
        times = []
        with av.open(str(video)) as container:
            for frame in container.decode(video=0):
                assert (frame.width, frame.height) == (560, 560)
                if not times:
                    frame.to_image().save(staged / f'{method}_poster.jpg', quality=90)
                times.append(float(frame.time))
        expected = 41 if method == 'aether' else 49
        assert len(times) == expected and all(b > a for a, b in zip(times, times[1:]))
        shutil.copy2(video, staged / video.name)
        record['videos'][method] = dict(frames=len(times), times=times)
        if method == 'gt':
            continue
        for mode in ['full', 'filtered']:
            for suffix in ['html', 'json.gz']:
                source = args.source / f'{method}_{mode}.{suffix}'
                if suffix == 'json.gz':
                    data = json.loads(gzip.decompress(source.read_bytes()))
                    assert data['frameCount'] == expected and data['pointsPerFrame'] == 313600
                shutil.copy2(source, staged / source.name)
                checks.append(dict(path=source.name, sha256=hashlib.sha256(source.read_bytes()).hexdigest()))
    comparison = re.sub(r'href="\.\./[^"]+"', 'href="../../index.html#explore"', comparison)
    (staged / 'comparison.html').write_text(comparison)
    shutil.copytree(staged, destination)
records.append(record)
manifest.write_text(json.dumps(records, indent=2) + '\n')
print(json.dumps(dict(case=args.id, identity=args.identity, geometry_copied_unchanged=checks)))
