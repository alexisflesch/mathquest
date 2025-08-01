import yaml
import sys

# Load and inspect the problematic file
yaml_path = "/home/aflesch/mathquest/questions/CE1/mathématiques/ce1-math-gpt41-001.yaml"

try:
    with open(yaml_path, 'r', encoding='utf-8') as file:
        questions = yaml.safe_load(file)
    
    print(f"File loaded successfully. Type: {type(questions)}")
    print(f"Number of questions: {len(questions) if isinstance(questions, list) else 'Not a list'}")
    
    if isinstance(questions, list) and len(questions) > 0:
        q = questions[0]
        print(f"\nFirst question fields:")
        for key, value in q.items():
            print(f"  {key}: {repr(value)}")
        
        # Check required fields
        required_fields = ["uid", "text", "questionType", "discipline", "themes", "difficulty", "gradeLevel", "author", "timeLimit"]
        print(f"\nChecking required fields:")
        missing = []
        for field in required_fields:
            if field not in q:
                print(f"  {field}: MISSING")
                missing.append(field)
            elif q[field] in [None, ""]:
                print(f"  {field}: EMPTY ({repr(q[field])})")
                missing.append(field)
            else:
                print(f"  {field}: OK ({repr(q[field])})")
        
        # Special check for themes
        if "themes" in q:
            if q["themes"] is None or (isinstance(q["themes"], list) and len(q["themes"]) == 0):
                print(f"  themes: EMPTY LIST/NULL")
                if "themes" not in missing:
                    missing.append("themes")
        
        print(f"\nMissing fields: {missing}")
        
        # Check numeric specific fields
        if q.get("questionType") == "numeric":
            print(f"\nNumeric question validation:")
            if "correctAnswer" not in q or q["correctAnswer"] is None:
                print(f"  correctAnswer: MISSING")
                missing.append("correctAnswer")
            else:
                print(f"  correctAnswer: OK ({repr(q['correctAnswer'])})")
        
        print(f"Final missing fields: {missing}")
        
except Exception as e:
    print(f"Error loading file: {e}")
