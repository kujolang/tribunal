#!/usr/bin/env python3
"""Create a byte-for-byte deterministic Tribunal release ZIP."""

from __future__ import annotations

import argparse
import datetime as dt
import os
from pathlib import Path, PurePosixPath
import stat
import zipfile


def zip_timestamp(epoch: int) -> tuple[int, int, int, int, int, int]:
    timestamp = dt.datetime.fromtimestamp(max(epoch, 315532800), tz=dt.timezone.utc)
    return (
        timestamp.year,
        timestamp.month,
        timestamp.day,
        timestamp.hour,
        timestamp.minute,
        timestamp.second - timestamp.second % 2,
    )


def add_entry(
    archive: zipfile.ZipFile,
    source: Path,
    relative: PurePosixPath,
    timestamp: tuple[int, int, int, int, int, int],
) -> None:
    name = relative.as_posix()
    is_directory = source.is_dir()
    if is_directory:
        name += "/"
    info = zipfile.ZipInfo(name, date_time=timestamp)
    info.create_system = 3
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = (
        (stat.S_IFDIR | 0o755) if is_directory else (stat.S_IFREG | (0o755 if name == "bin/tribunal" else 0o644))
    ) << 16
    info.flag_bits = 0
    archive.writestr(info, b"" if is_directory else source.read_bytes(), compresslevel=9)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--epoch", required=True, type=int)
    args = parser.parse_args()

    source = args.source.resolve(strict=True)
    output = args.output.resolve()
    if not source.is_dir() or output.exists():
        return 2
    timestamp = zip_timestamp(args.epoch)
    entries = sorted(source.rglob("*"), key=lambda path: path.relative_to(source).as_posix())
    with zipfile.ZipFile(output, "x", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in entries:
            if path.is_symlink():
                return 3
            add_entry(archive, path, PurePosixPath(path.relative_to(source).as_posix()), timestamp)
    os.chmod(output, 0o644)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
