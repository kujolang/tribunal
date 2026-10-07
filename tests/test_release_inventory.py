"""Behavioral release-input boundaries using disposable Git repositories."""
import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest

spec = importlib.util.spec_from_file_location(
    'release_inventory', Path(__file__).resolve().parents[1] / 'scripts/release_inventory.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ReleaseInventoryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name)
        self.git('init', '-q')
        self.git('config', 'user.name', 'Release fixture')
        self.git('config', 'user.email', 'fixture@example.invalid')
        (self.repo / 'README.md').write_text('committed source\n')
        (self.repo / 'scripts').mkdir()
        (self.repo / 'scripts/build.py').write_text('print("source")\n')
        self.git('add', '.')
        self.git('-c', 'commit.gpgsign=false', 'commit', '-qm', 'fixture')
        self.revision = self.git('rev-parse', 'HEAD').strip()

    def git(self, *args):
        return subprocess.check_output(['git', '-C', str(self.repo), *args], text=True)

    def test_generated_and_untracked_inputs_are_excluded(self):
        expected = module.inventory(self.repo, self.revision)
        cache = self.repo / 'scripts/__pycache__'
        cache.mkdir()
        (cache / 'build.cpython-fixture.pyc').write_bytes(b'generated cache')
        (self.repo / 'scripts/unreviewed.py').write_text('unreviewed\n')
        self.assertEqual(module.inventory(self.repo, self.revision), expected)
        self.assertEqual(expected, ['README.md', 'scripts/build.py'])

    def test_modified_tracked_input_is_refused(self):
        (self.repo / 'README.md').write_text('uncommitted alteration\n')
        with self.assertRaisesRegex(ValueError, 'tracked changes'):
            module.inventory(self.repo, self.revision)
        self.git('add', 'README.md')
        with self.assertRaisesRegex(ValueError, 'tracked changes'):
            module.inventory(self.repo, self.revision)

    def test_mismatched_revision_is_refused(self):
        with self.assertRaisesRegex(ValueError, 'checkout HEAD'):
            module.inventory(self.repo, '0' * 40)

    def test_committed_symlink_is_refused(self):
        (self.repo / 'scripts/link').symlink_to('../README.md')
        self.git('add', 'scripts/link')
        self.git('-c', 'commit.gpgsign=false', 'commit', '-qm', 'symlink fixture')
        with self.assertRaisesRegex(ValueError, 'regular tracked files'):
            module.inventory(self.repo, self.git('rev-parse', 'HEAD').strip())


if __name__ == '__main__':
    unittest.main()
