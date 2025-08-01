#!/usr/bin/env python3

# Minimal test of the import logic

import yaml

yaml_path = "/home/aflesch/mathquest/questions/CE1/mathématiques/ce1-math-gpt41-001.yaml"

with open(yaml_path, 'r', encoding='utf-8') as file:
    questions = yaml.safe_load(file)

q = questions[0]
idx = 0

print(f"Question UID: {q.get('uid')}")
print(f"Question Type: {q.get('questionType')}")

# Simulate the exact validation logic from the script
required_fields = ["uid", "text", "questionType", "discipline", "themes", "difficulty", "gradeLevel", "author", "timeLimit"]
missing = [field for field in required_fields if field not in q or q[field] in [None, ""]]

print(f"Initial missing: {missing}")

# Special handling for themes - allow empty list but not missing
if "themes" not in q:
    missing.append("themes")
    print("themes field missing")
elif q["themes"] is None:
    missing.append("themes")
    print("themes is None")
elif isinstance(q["themes"], list) and len(q["themes"]) == 0:
    missing.append("themes")
    print("themes is empty list")
else:
    print(f"themes is OK: {q['themes']}")

# Question type specific validation
if q.get("questionType") == "multipleChoice":
    print("Validating multiple choice...")
    mc_fields = ["answerOptions", "correctAnswers"]
    mc_missing = [field for field in mc_fields if field not in q or q[field] in [None, ""] or (isinstance(q[field], list) and len(q[field]) == 0)]
    missing.extend(mc_missing)
    print(f"MC missing: {mc_missing}")
elif q.get("questionType") == "numeric":
    print("Validating numeric...")
    if "correctAnswer" not in q or q["correctAnswer"] is None:
        missing.append("correctAnswer")
        print("correctAnswer missing")
    else:
        try:
            float(q["correctAnswer"])
            print(f"correctAnswer OK: {q['correctAnswer']}")
        except (ValueError, TypeError):
            print(f"correctAnswer not a number: {q['correctAnswer']}")
            # Would return here in the original script
else:
    print(f"Unknown questionType: {q.get('questionType')}")

print(f"Final missing: {missing}")

# Time limit validation
invalid_time_limit = False
if "timeLimit" in q:
    try:
        time_limit_val = int(q["timeLimit"])
        if time_limit_val <= 0:
            invalid_time_limit = True
            print("timeLimit <= 0")
        else:
            print(f"timeLimit OK: {time_limit_val}")
    except Exception as e:
        invalid_time_limit = True
        print(f"timeLimit not an int: {e}")

print(f"invalid_time_limit: {invalid_time_limit}")

# Final check
print(f"missing: {missing}")
print(f"bool(missing): {bool(missing)}")
print(f"invalid_time_limit: {invalid_time_limit}")
print(f"bool(invalid_time_limit): {bool(invalid_time_limit)}")
print(f"missing or invalid_time_limit: {missing or invalid_time_limit}")
print(f"bool(missing or invalid_time_limit): {bool(missing or invalid_time_limit)}")

if missing or invalid_time_limit:
    print("ERROR: Would trigger error condition")
else:
    print("SUCCESS: Would pass validation")
