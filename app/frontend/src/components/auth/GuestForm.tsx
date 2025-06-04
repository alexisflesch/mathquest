'use client';

import React, { useState } from 'react';
import { User, Camera } from 'lucide-react';
import AvatarGrid from '../ui/AvatarGrid';

interface GuestFormProps {
    onSubmit: (data: { username: string; avatar: string }) => void;
    isLoading?: boolean;
    className?: string;
}

export default function GuestForm({
    onSubmit,
    isLoading = false,
    className = ""
}: GuestFormProps) {
    const [username, setUsername] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim() && selectedAvatar) {
            onSubmit({
                username: username.trim(),
                avatar: selectedAvatar
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-[color:var(--foreground)] mb-2">
                    <User className="inline w-4 h-4 mr-2" />
                    Pseudo
                </label>
                <input
                    type="text"
                    id="username"
                    data-testid="username-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choisissez votre pseudo..."
                    maxLength={20}
                    className="input input-bordered input-lg w-full"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-[color:var(--foreground)] mb-2">
                    <Camera className="inline w-4 h-4 mr-2" />
                    Avatar
                </label>
                <AvatarGrid
                    selectedAvatar={selectedAvatar}
                    onAvatarSelect={setSelectedAvatar}
                />
            </div>

            <button
                type="submit"
                disabled={!username.trim() || !selectedAvatar || isLoading}
                className="btn btn-primary w-full"
            >
                {isLoading ? 'Connexion...' : 'Commencer à jouer'}
            </button>
        </form>
    );
}
