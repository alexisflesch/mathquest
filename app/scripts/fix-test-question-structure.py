#!/usr/bin/env python3
"""
Script to fix test question data structure to use multipleChoiceQuestion.answerOptions
"""

import re
import sys

def fix_question_structure(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Pattern to match question objects with answerOptions at root level
    pattern = r'(currentQuestion:\s*{[^}]*questionType:\s*[\'"]multiple-choice[\'"][^}]*?)\s*answerOptions:\s*(\[[^\]]+\])'
    
    def replacement(match):
        question_start = match.group(1)
        answer_options = match.group(2)
        
        # Add multipleChoiceQuestion wrapper
        return f'{question_start}\n                    multipleChoiceQuestion: {{\n                        answerOptions: {answer_options}\n                    }}'
    
    # Replace all occurrences
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    with open(file_path, 'w') as f:
        f.write(new_content)
    
    print(f"Fixed question structure in {file_path}")

if __name__ == "__main__":
    file_path = "/home/aflesch/mathquest/app/frontend/src/test/live-game-page-comprehensive.test.tsx"
    fix_question_structure(file_path)
