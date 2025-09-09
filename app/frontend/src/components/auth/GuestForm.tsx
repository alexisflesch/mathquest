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
                    disabled={!username.trim() || !selectedAvatar || isLoading}
                    className="btn btn-primary"
                >
                    {isLoading ? 'Connexion...' : 'Commencer à jouer'}
                </button>
            </div>
        </form>
    );
}
