import importlib.util
import os
import unittest
from pathlib import Path
from unittest.mock import patch

from ..yaml2latex import latex

MODULE_PATH = Path(__file__).resolve().parents[1] / 'yaml2latex.py'
SPEC = importlib.util.spec_from_file_location('yaml2latex_script', MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError('Unable to load yaml2latex module for testing')
yaml2latex = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(yaml2latex)


class ToFileUriTests(unittest.TestCase):
    def test_wsl_uri_conversion(self):
        path = Path('/home/user/mathquest/questions/demo/test.yaml')
        with patch.dict(os.environ, {'WSL_DISTRO_NAME': 'Ubuntu'}, clear=False):
            uri = yaml2latex.to_file_uri(path)
        self.assertEqual(
            uri,
            'file://wsl.localhost/Ubuntu/home/user/mathquest/questions/demo/test.yaml',
        )

    def test_uri_encodes_unicode_and_spaces(self):
        path = Path('/home/user/mathquest/questions/L2/matèπs/demo final.yaml')
        with patch.dict(os.environ, {'WSL_DISTRO_NAME': 'Ubuntu'}, clear=False):
            uri = yaml2latex.to_file_uri(path)
        self.assertEqual(
            uri,
            'file://wsl.localhost/Ubuntu/home/user/mathquest/questions/L2/mat%C3%A8%CF%80s/demo%20final.yaml',
        )

    def test_non_wsl_falls_back_to_standard_uri(self):
        path = Path('/tmp/demo.yaml')
        with patch.dict(os.environ, {}, clear=True):
            uri = yaml2latex.to_file_uri(path)
        self.assertTrue(uri.startswith('file:///'))
        self.assertTrue(uri.endswith('demo.yaml'))


class LatexQuestionLinkTests(unittest.TestCase):
    def test_uid_hyperlink_uses_file_uri(self):
        question = {
            'uid': 'demo-question-001',
            'title': 'Question démo',
            'questionType': 'single_choice',
            'text': 'Quel est le résultat ?',
            'answerOptions': ['Option A', 'Option B'],
            'correctAnswers': [True, False],
            '_file_uri': 'file://wsl.localhost/Ubuntu/home/user/questions/math%C3%A9matiques/demo.yaml',
            '_line_number': 37,
        }

        rendered = latex.latex_question(question)

        self.assertIn(
            '\\href{file://wsl.localhost/Ubuntu/home/user/questions/math\\%C3\\%A9matiques/demo.yaml}',
            rendered,
        )
        self.assertIn('(ligne 37)', rendered)


if __name__ == '__main__':
    unittest.main()
