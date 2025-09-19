/**
 * Type Mapping Utilities
 *
 * This file contains utilities for mapping between different structures
 * of similar types, helping to handle inconsistencies between frontend
 * and backend representations of the same entities.
 */

import { Question } from '../quiz/question';
import { BaseQuestion, Answer } from '../question';
import { QUESTION_TYPES } from '../../constants/questionTypes';

// Re-export commonly used types for convenience (keeping only Answer since BaseQuestion is already exported from core)
export type { Answer } from '../question';