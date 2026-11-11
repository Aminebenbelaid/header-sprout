"""Copy shared source + browser manifest and produce reproducible store ZIPs."""
from pathlib import Path
import json
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
RUNTIME_FILES = ['background.js', 'core.js', 'platform.js', 'popup.js',
                 'popup.html', 'style.css', 'mascot.svg', 'icons']

def build():
    package = json.loads((ROOT / 'package.json').read_text())
    archives = ROOT / 'artifacts'
    archives.mkdir(exist_ok=True)
    for browser in ('chromium', 'firefox'):
        output = ROOT / 'dist' / browser
        if output.exists():
            shutil.rmtree(output)
        output.mkdir(parents=True)
        manifest = json.loads((ROOT / 'manifests' / f'{browser}.json').read_text())
        manifest['version'] = package['version']
        for name in RUNTIME_FILES:
            source = ROOT / 'src' / name
            if source.is_dir():
                shutil.copytree(source, output / name)
            else:
                shutil.copyfile(source, output / name)
        (output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
        archive = archives / f'header-sprout-{browser}-{package["version"]}.zip'
        with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as bundle:
            for path in sorted(output.rglob('*')):
                if path.is_file():
                    info = zipfile.ZipInfo(path.relative_to(output).as_posix(), (2026, 1, 1, 0, 0, 0))
                    info.compress_type = zipfile.ZIP_DEFLATED
                    info.external_attr = 0o100644 << 16
                    bundle.writestr(info, path.read_bytes())
        print(f'{browser}: {output.relative_to(ROOT)} → {archive.relative_to(ROOT)}')

if __name__ == '__main__':
    build()
