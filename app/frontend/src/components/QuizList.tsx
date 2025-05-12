/**
 * Quiz List Component
 * 
 * This component displays a list of available quizzes and provides selection
 * functionality. Currently implemented as a simple list with basic styling, 
 * but marked for future enhancement.
 * 
 * Key features:
 * - Displays quiz names in a vertical list
 * - Provides empty state messaging when no quizzes are available
 * - Supports selection callback for navigation to quiz details
 * - Simple, clean UI with hover effects
 * 
 * Used in teacher dashboards and quiz management screens to display
 * available quizzes for selection, editing, or deployment.
 */

import React from 'react';

// TODO: Replace with real quiz list logic and props
export default function QuizList({ quizzes = [], onSelect }: { quizzes?: { id: string; nom: string }[]; onSelect?: (id: string) => void }) {
    return (
        <div>
            <h2 className="text-xl font-bold mb-2">Quiz disponibles</h2>
            <ul className="space-y-2">
                {quizzes.length === 0 && <li className="text-gray-500">Aucun quiz disponible.</li>}
                {quizzes.map((quiz) => (
                    <li key={quiz.id}>
                        <button
                            className="px-4 py-2 bg-blue-100 rounded hover:bg-blue-200"
                            onClick={() => onSelect && onSelect(quiz.id)}
                        >
                            {quiz.nom}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
