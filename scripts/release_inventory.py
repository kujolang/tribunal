"""Select committed release inputs and reject mismatched or modified sources."""
import argparse
import json
from pathlib import Path
import subprocess
import sys

ROOTS = ['bin', 'src', 'schemas', 'scripts', 'tests', 'examples', 'docs',
         'completions', 'man', '.github']
FILES = ['tribunal.kujo', 'tribunal.spec.yml', 'kujo.toml', 'kennel.toml',
         'VERSION', 'README.md', 'CHANGELOG.md', 'CONTRIBUTING.md',
         'SECURITY.md', 'LICENSE', '.gitignore']


def inventory(repository, revision):
    def git(*args):
        return subprocess.run(['git', '-C', str(repository), *args],
                              capture_output=True, check=True, timeout=30).stdout

    head = git('rev-parse', 'HEAD').decode().strip()
    if revision != head:
        raise ValueError('Source revision must equal checkout HEAD')
    if git('diff', '--name-only', '-z', 'HEAD', '--', *ROOTS, *FILES):
        raise ValueError('Release inputs contain tracked changes')
    entries = git('ls-tree', '-r', '-z', '--full-tree', head, '--', *ROOTS, *FILES)
    files = []
    for entry in entries.split(b'\0'):
        if not entry:
            continue
        metadata, path = entry.split(b'\t', 1)
        mode, kind, _oid = metadata.split()
        if kind != b'blob' or mode not in (b'100644', b'100755'):
            raise ValueError('Release inputs must be regular tracked files')
        files.append(path.decode('utf-8'))
    if not files:
        raise ValueError('No committed release inputs found')
    return sorted(files)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repository', required=True, type=Path)
    parser.add_argument('--revision', required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(inventory(args.repository, args.revision)))
    except (ValueError, UnicodeError, subprocess.SubprocessError) as error:
        print('Release inventory refused: ' + str(error), file=sys.stderr)
        return 2
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
