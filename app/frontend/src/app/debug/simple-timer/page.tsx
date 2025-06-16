/**
 * Simple Timer Debug Page
 * 
 * Test page for the new simple timer hook
 */

'use client';

import React, { useState } from 'react';
import { SimpleTimerTest } from '@/components/SimpleTimerTest';

export default function SimpleTimerDebugPage() {
    const [gameId, setGameId] = useState<string>('test-game-id');
    const [accessCode, setAccessCode] = useState<string>('TEST123');
    const [role, setRole] = useState<'teacher' | 'student' | 'projection'>('teacher');

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Simple Timer Debug</h1>

                {/* Configuration */}
                <div className="mb-8 p-6 bg-white rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Configuration</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Game ID</label>
                            <input
                                type="text"
                                value={gameId}
                                onChange={(e) => setGameId(e.target.value)}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Access Code</label>
                            <input
                                type="text"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as any)}
                                className="w-full p-2 border rounded"
                            >
                                <option value="teacher">Teacher</option>
                                <option value="student">Student</option>
                                <option value="projection">Projection</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Timer Test Component */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Timer Test</h2>
                    <SimpleTimerTest
                        gameId={gameId}
                        accessCode={accessCode}
                        role={role}
                    />
                </div>

                {/* Instructions */}
                <div className="p-6 bg-blue-50 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">Instructions</h2>
                    <div className="space-y-2 text-sm">
                        <p>• <strong>Teacher Role:</strong> Can start, pause, resume, and stop timers</p>
                        <p>• <strong>Student/Projection Roles:</strong> Can only view timer state</p>
                        <p>• The timer uses the existing backend system and shared types</p>
                        <p>• Local countdown provides smooth UI updates</p>
                        <p>• Backend is the single source of truth for timer state</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
