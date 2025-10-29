'use client';

import React, { useState } from 'react';
import { User, Camera } from 'lucide-react';
import AvatarGrid from '../ui/AvatarGrid';
import UsernameSelector from '../ui/UsernameSelector';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

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
        const trimmedUsername = username.trim();

        // Validate: username must be at least 2 characters and not just a suffix
        // (prevent single letter/digit usernames that are likely just suffixes)
        const isValidUsername = trimmedUsername.length >= 2 ||
            (trimmedUsername.length === 1 && !/^[A-Z0-9]$/.test(trimmedUsername));

        if (isValidUsername && selectedAvatar) {
            onSubmit({
                username: trimmedUsername,
                avatar: selectedAvatar
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
            <div>
                <UsernameSelector
                    value={username}
                    onChange={setUsername}
                    id="username"
                    name="username"
                    placeholder="Choisissez votre pseudo..."
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

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={
                        !username.trim() ||
                        username.trim().length < 2 || // Require at least 2 characters
                        !selectedAvatar ||
                        isLoading
                    }
                    className="btn btn-primary"
                    title={username.trim().length < 2 ? "Le prénom doit contenir au moins 2 caractères" : undefined}
                >
                    {isLoading ? 'Connexion...' : 'Commencer à jouer'}
                </button>
            </div>
        </form>
    );
}
