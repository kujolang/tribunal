"""Install the checksum-pinned official runtime for compatibility verification."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile
from urllib.request import urlopen

VERSION = "1.5.0"
REVISION = "cc2d7dbb59a8dc05f00d629e100932f56f4062f6"
ASSETS = {
    "linux-x86_64": ("linux-x64", "cd267f39c1243f6500889fb3678a1a5206ad1ef99c53d7336265ff31267f0675"),
    "macos-x86_64": ("macos-x64", "1aebcd482125031104b2df79abae6db57973f1874ceb196f95989b14e287d820"),
    "macos-arm64": ("macos-arm64", "2dcbda6f3e3cb01cffa1c4824571a6df316165ae3b554e1ec4a15941432f2af0"),
}
MAX_ARCHIVE_BYTES = 64 * 1024 * 1024
MAX_BINARY_BYTES = 128 * 1024 * 1024


def verified_binary(archive, expected_sha256):
    archive.seek(0)
    digest = hashlib.sha256()
    observed = 0
    while chunk := archive.read(1024 * 1024):
        observed += len(chunk)
        if observed > MAX_ARCHIVE_BYTES:
            raise ValueError("Runtime archive exceeds its byte limit")
        digest.update(chunk)
    if digest.hexdigest() != expected_sha256:
        raise ValueError("Runtime archive checksum mismatch")
    archive.seek(0)
    with tarfile.open(fileobj=archive, mode="r:gz") as bundle:
        members = [m for m in bundle.getmembers() if Path(m.name).name == "kujo"]
        if len(members) != 1 or not members[0].isfile():
            raise ValueError("Runtime archive must contain exactly one regular kujo executable")
        member = members[0]
        if not 0 < member.size <= MAX_BINARY_BYTES:
            raise ValueError("Runtime executable exceeds its byte limit")
        # Never extract archive paths, links, or ancillary files onto the host.
        with bundle.extractfile(member) as source:
            binary = source.read(MAX_BINARY_BYTES + 1)
        if len(binary) != member.size:
            raise ValueError("Runtime executable size mismatch")
        return binary


def install(binary, destination):
    if destination.exists() or destination.is_symlink():
        raise ValueError("Runtime destination must not already exist")
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=destination.parent, delete=False) as staged:
            temporary = Path(staged.name)
            staged.write(binary)
        temporary.chmod(0o755)
        result = subprocess.run([str(temporary.resolve()), "--version"], capture_output=True,
                                text=True, check=True, timeout=10)
        if result.stdout.strip() != "kujo " + VERSION:
            raise ValueError("Downloaded executable reports the wrong runtime version")
        # Exclusive publication also refuses a destination created after the precheck.
        os.link(temporary, destination)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--platform", required=True, choices=ASSETS)
    parser.add_argument("--destination", required=True, type=Path)
    args = parser.parse_args()
    repository = Path(__file__).resolve().parents[1]
    matrix = json.loads((repository / "docs/INTEGRATION_MATRIX.json").read_text())
    runtime = [item for item in matrix["integrations"] if item["name"] == "Kujo Runtime"]
    if len(runtime) != 1 or runtime[0]["version"] != VERSION or runtime[0]["revision"] != REVISION:
        raise ValueError("Runtime archive pins must match the integration matrix")
    platform, expected = ASSETS[args.platform]
    asset = f"kujo-v{VERSION}-{platform}.tar.gz"
    url = f"https://github.com/kujolang/kujo/releases/download/v{VERSION}/{asset}"
    with tempfile.TemporaryFile() as archive:
        with urlopen(url, timeout=60) as response:
            observed = 0
            while chunk := response.read(1024 * 1024):
                observed += len(chunk)
                if observed > MAX_ARCHIVE_BYTES:
                    raise ValueError("Runtime download exceeds its byte limit")
                archive.write(chunk)
        binary = verified_binary(archive, expected)
    install(binary, args.destination)
    print(json.dumps({"version": VERSION, "sourceRevision": REVISION, "asset": asset,
                      "archiveSha256": expected, "binarySha256": hashlib.sha256(binary).hexdigest()}))


if __name__ == "__main__":
    main()
