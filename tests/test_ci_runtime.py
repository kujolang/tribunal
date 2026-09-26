"""Boundary tests for the compatibility runtime installer; no network calls."""
import hashlib
import importlib.util
import io
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("runtime_installer", Path(__file__).resolve().parents[1] / "scripts/install_ci_runtime.py")
runtime = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runtime)


def archive(entries):
    output = io.BytesIO()
    with tarfile.open(fileobj=output, mode="w:gz") as bundle:
        for name, content, kind in entries:
            info = tarfile.TarInfo(name)
            info.type = kind
            info.size = len(content) if kind == tarfile.REGTYPE else 0
            bundle.addfile(info, io.BytesIO(content))
    return output


class RuntimeInstallerTests(unittest.TestCase):
    def test_valid_archive_reads_only_executable_bytes(self):
        data = archive([("release/kujo", b"binary", tarfile.REGTYPE), ("../ignored", b"other", tarfile.REGTYPE)])
        self.assertEqual(runtime.verified_binary(data, hashlib.sha256(data.getvalue()).hexdigest()), b"binary")

    def test_tampered_archive_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "checksum mismatch"):
            runtime.verified_binary(io.BytesIO(b"tampered"), "0" * 64)

    def test_link_and_duplicate_executables_are_rejected(self):
        for entries in [[("kujo", b"", tarfile.SYMTYPE)], [("a/kujo", b"a", tarfile.REGTYPE), ("b/kujo", b"b", tarfile.REGTYPE)]]:
            data = archive(entries)
            with self.assertRaisesRegex(ValueError, "exactly one regular"):
                runtime.verified_binary(data, hashlib.sha256(data.getvalue()).hexdigest())

    def test_archive_byte_limit_is_enforced(self):
        with patch.object(runtime, "MAX_ARCHIVE_BYTES", 1):
            with self.assertRaisesRegex(ValueError, "archive exceeds"):
                runtime.verified_binary(io.BytesIO(b"ab"), hashlib.sha256(b"ab").hexdigest())

    def test_executable_byte_limit_is_enforced(self):
        data = archive([("kujo", b"ab", tarfile.REGTYPE)])
        with patch.object(runtime, "MAX_BINARY_BYTES", 1):
            with self.assertRaisesRegex(ValueError, "executable exceeds"):
                runtime.verified_binary(data, hashlib.sha256(data.getvalue()).hexdigest())

    def test_existing_destination_is_preserved(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "kujo"
            target.write_bytes(b"existing")
            with self.assertRaisesRegex(ValueError, "already exist"):
                runtime.install(b"replacement", target)
            self.assertEqual(target.read_bytes(), b"existing")

    def test_wrong_version_leaves_no_executable_or_temporary_file(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "kujo"
            with self.assertRaisesRegex(ValueError, "wrong runtime version"):
                runtime.install(b"#!/bin/sh\nprintf 'kujo 1.0.0\\n'\n", target)
            self.assertEqual(list(Path(directory).iterdir()), [])


if __name__ == "__main__":
    unittest.main()
