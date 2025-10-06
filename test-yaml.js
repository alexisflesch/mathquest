const yaml = require('js-yaml');

const testYaml = `- uid: question-1759738086489
  author: Teacher
  discipline: Mathématiques
  title: Nouvelle question
  text: Entrez le texte de la question ici...
  questionType: numeric
  themes: []
  tags: []
  timeLimit: 30
  difficulty: 1
  gradeLevel: CE1
  explanation: Entrez l'explication ici...
  feedbackWaitTime: 15
  correctAnswer: 0

- uid: fdqjklm`;

try {
  const parsed = yaml.load(testYaml);
  console.log('Parsed YAML:', JSON.stringify(parsed, null, 2));
} catch (e) {
  console.error('Parse error:', e.message);
}