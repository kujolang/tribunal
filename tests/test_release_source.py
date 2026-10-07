"""Behavior checks for protected-main publication of immutable release tags."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/release_source.sh'


class ReleaseSourceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.git('init', '-b', 'main')
        self.git('config', 'user.name', 'Release fixture')
        self.git('config', 'user.email', 'release@example.invalid')
        self.git('config', 'commit.gpgsign', 'false')
        (self.root / 'VERSION').write_text('1.0.2\n')
        self.git('add', 'VERSION')
        self.git('commit', '-m', 'release source')
        self.source = self.git('rev-parse', 'HEAD')
        self.git('tag', 'v1.0.2')
        self.git('commit', '--allow-empty', '-m', 'later main workflow')
        self.main = self.git('rev-parse', 'HEAD')

    def git(self, *args):
        return subprocess.check_output(['git', *args], cwd=self.root,
                                       text=True, stderr=subprocess.DEVNULL).strip()

    def resolve(self, **overrides):
        env = {**os.environ, 'GITHUB_SHA': self.main,
               'GITHUB_REF': 'refs/heads/main', 'PUBLISH_RELEASE': 'true',
               'RELEASE_TAG': 'v1.0.2', **overrides}
        return subprocess.run(['bash', str(SCRIPT)], cwd=self.root,
                              env=env, text=True, capture_output=True)

    def test_publishes_merged_tag_without_relabeling_workflow_commit(self):
        result = self.resolve()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, f'revision={self.source}\n')
        self.assertEqual(self.git('rev-parse', 'HEAD'), self.main)

    def test_rejects_publication_from_tag_or_feature_branch(self):
        for ref in ['refs/tags/v1.0.2', 'refs/heads/feature']:
            with self.subTest(ref=ref):
                self.assertNotEqual(self.resolve(GITHUB_REF=ref).returncode, 0)

    def test_rejects_wrong_version_or_branch_instead_of_tag(self):
        self.assertNotEqual(self.resolve(RELEASE_TAG='v1.0.1').returncode, 0)
        self.git('tag', '-d', 'v1.0.2')
        self.git('branch', 'v1.0.2')
        self.assertNotEqual(self.resolve().returncode, 0)

    def test_rejects_unmerged_tag(self):
        self.git('switch', '-c', 'unmerged')
        self.git('commit', '--allow-empty', '-m', 'unreviewed source')
        self.git('tag', '-f', 'v1.0.2')
        self.git('switch', 'main')
        self.assertNotEqual(self.resolve().returncode, 0)

    def test_rejects_tagged_version_mismatch(self):
        (self.root / 'VERSION').write_text('1.0.3\n')
        self.git('add', 'VERSION')
        self.git('commit', '-m', 'version mismatch')
        self.git('tag', '-f', 'v1.0.2')
        (self.root / 'VERSION').write_text('1.0.2\n')
        self.git('add', 'VERSION')
        self.git('commit', '-m', 'restore version')
        self.assertNotEqual(self.resolve(GITHUB_SHA=self.git('rev-parse', 'HEAD')).returncode, 0)

    def test_verification_only_preserves_workflow_source(self):
        result = self.resolve(PUBLISH_RELEASE='false', RELEASE_TAG='')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, f'revision={self.main}\n')

    def test_tag_verification_requires_exact_source(self):
        self.git('checkout', '--detach', self.source)
        result = self.resolve(PUBLISH_RELEASE='false', GITHUB_REF='refs/tags/v1.0.2', GITHUB_SHA=self.source)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotEqual(self.resolve(PUBLISH_RELEASE='false', GITHUB_REF='refs/tags/v1.0.2').returncode, 0)


if __name__ == '__main__':
    unittest.main()
