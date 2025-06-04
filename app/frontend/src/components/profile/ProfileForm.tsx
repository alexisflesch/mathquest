'use client';

import React, { useState } from 'react';
import { User, Camera } from 'lucide-react';
import AvatarGrid from '../ui/AvatarGrid';

interface ProfileFormProps {
    initialUsername: string;
    initialAvatar: string;
    onSave: (data: { username: string; avatar: string }) => Promise<void>;
    isLoading?: boolean;
    className?: string;
}

export default function ProfileForm({
    initialUsername,
    initialAvatar,
    onSave,
    isLoading = false,
    className = ""
}: ProfileFormProps) {
    const [username, setUsername] = useState(initialUsername);
    const [selectedAvatar, setSelectedAvatar] = useState(initialAvatar);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave({ username: username.trim(), avatar: selectedAvatar });
    };

    const hasChanges = username.trim() !== initialUsername || selectedAvatar !== initialAvatar;

    return (
        <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                    <User className="inline w-4 h-4 mr-2" />
                    Nom d'utilisateur
                </label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
                disabled={isLoading || !hasChanges || !selectedAvatar || !username.trim()}
                className="btn btn-primary btn-lg w-full"
            >
                {isLoading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
            </button>
        </form>
    );
}
