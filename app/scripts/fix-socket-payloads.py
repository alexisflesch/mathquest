#!/usr/bin/env python3
"""
Fix useStudentGameSocket test payloads - surgical approach

This script manually fixes specific payload patterns in the test files.
"""

import re

def fix_file(filepath):
    """Fix a specific test file"""
    print(f"Fixing {filepath}...")
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Fix question payloads one by one
    content = fix_first_payload(content)
    content = fix_second_payload(content)
    content = fix_multiple_choice_payload(content)
    content = fix_metadata_payload(content)
    content = fix_edge_case_payload(content)
    
    # Fix assertions that reference .question
    content = re.sub(
        r'\.toEqual\((\w+)\.question\)',
        r'.toEqual(\1)',
        content
    )
    
    # Fix game status expectations
    content = content.replace("gameStatus).toBe('waiting')", "gameStatus).toBe('pending')")
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"Fixed {filepath}")

def fix_first_payload(content):
    """Fix the first questionPayload"""
    old_pattern = r'''const questionPayload = \{
            question: \{
                uid: 'q1',
                text: 'Test question',
                questionType: QUESTION_TYPES\.SINGLE_CHOICE,
                answerOptions: \[ 'A', 'B', 'C', 'D' \],
                timeLimit: 30
            \},
            timer: \{ status: 'run', questionUid: 'q1', timerEndDateMs: \d+ \},
            questionIndex: 0,
            totalQuestions: 5,
            questionState: 'active'
        \};'''
    
    new_pattern = """const questionPayload = {
            uid: 'q1',
            text: 'Test question',
            questionType: QUESTION_TYPES.SINGLE_CHOICE,
            answerOptions: [ 'A', 'B', 'C', 'D' ],
            timeLimit: 30,
            currentQuestionIndex: 0,
            totalQuestions: 5
        };"""
    
    return re.sub(old_pattern, new_pattern, content, flags=re.DOTALL)

def fix_second_payload(content):
    """Fix the second questionPayload"""
    old_pattern = r'''const questionPayload = \{
            question: \{
                uid: 'q1',
                text: 'What is the capital of France\?',
                questionType: QUESTION_TYPES\.SINGLE_CHOICE,
                answerOptions: \['A', 'B', 'C', 'D'\],
                timeLimit: 30
            \},
            timer: \{
                status: 'run' as const,
                questionUid: 'q1',
                timerEndDateMs: \d+
            \},
            questionIndex: 0,
            totalQuestions: 1,
            questionState: 'active'
        \};'''
    
    new_pattern = """const questionPayload = {
            uid: 'q1',
            text: 'What is the capital of France?',
            questionType: QUESTION_TYPES.SINGLE_CHOICE,
            answerOptions: ['A', 'B', 'C', 'D'],
            timeLimit: 30,
            currentQuestionIndex: 0,
            totalQuestions: 1
        };"""
    
    return re.sub(old_pattern, new_pattern, content, flags=re.DOTALL)

def fix_multiple_choice_payload(content):
    """Fix multipleChoicePayload"""
    old_pattern = r'''const multipleChoicePayload = \{
            question: \{
                uid: 'q3',
                text: 'Which of the following are prime numbers\?',
                questionType: QUESTION_TYPES\.MULTIPLE_CHOICE,
                answerOptions: \[ '2', '3', '4', '5', '6', '7' \],
                timeLimit: 60
            \},
            timer: \{ status: 'run', questionUid: 'q3', timerEndDateMs: \d+ \},
            questionIndex: 3,
            totalQuestions: 8,
            questionState: 'active'
        \};'''
    
    new_pattern = """const multipleChoicePayload = {
            uid: 'q3',
            text: 'Which of the following are prime numbers?',
            questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
            answerOptions: [ '2', '3', '4', '5', '6', '7' ],
            timeLimit: 60,
            currentQuestionIndex: 3,
            totalQuestions: 8
        };"""
    
    return re.sub(old_pattern, new_pattern, content, flags=re.DOTALL)

def fix_metadata_payload(content):
    """Fix questionWithMetadata"""
    old_pattern = r'''const questionWithMetadata = \{
            question: \{
                uid: 'q5',
                text: 'What is photosynthesis\?',
                questionType: QUESTION_TYPES\.SINGLE_CHOICE,
                answerOptions: \[ 'A', 'B', 'C', 'D' \],
                timeLimit: 40
            \},
            timer: \{ status: 'run', questionUid: 'q5', timerEndDateMs: \d+ \},
            questionIndex: 4,
            totalQuestions: 6,
            questionState: 'active'
        \};'''
    
    new_pattern = """const questionWithMetadata = {
            uid: 'q5',
            text: 'What is photosynthesis?',
            questionType: QUESTION_TYPES.SINGLE_CHOICE,
            answerOptions: [ 'A', 'B', 'C', 'D' ],
            timeLimit: 40,
            currentQuestionIndex: 4,
            totalQuestions: 6
        };"""
    
    return re.sub(old_pattern, new_pattern, content, flags=re.DOTALL)

def fix_edge_case_payload(content):
    """Fix edge case questionPayload"""
    old_pattern = r'''const questionPayload = \{
            question: \{
                uid: 'q1',
                text: 'Quick question',
                questionType: QUESTION_TYPES\.SINGLE_CHOICE,
                answerOptions: \[ 'A', 'B' \],
                timeLimit: 20
            \},
            timer: \{ status: 'stop', questionUid: 'q1', timerEndDateMs: 0 \},
            questionIndex: 0,
            totalQuestions: 1,
            questionState: 'active'
        \};'''
    
    new_pattern = """const questionPayload = {
            uid: 'q1',
            text: 'Quick question',
            questionType: QUESTION_TYPES.SINGLE_CHOICE,
            answerOptions: [ 'A', 'B' ],
            timeLimit: 20,
            currentQuestionIndex: 0,
            totalQuestions: 1
        };"""
    
    return re.sub(old_pattern, new_pattern, content, flags=re.DOTALL)

if __name__ == "__main__":
    fix_file("/home/aflesch/mathquest/app/frontend/src/hooks/__tests__/useStudentGameSocket.stateUpdates.test.ts")
    print("Fixes completed!")
