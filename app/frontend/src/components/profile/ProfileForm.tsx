"use client";

import React, { useState } from 'react';
import { User, Camera } from 'lucide-react';
import AvatarGrid from '../ui/AvatarGrid';
import UsernameSelector from '../ui/UsernameSelector';

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
    // Split initialUsername into firstname and suffix
    const match = initialUsername.match(/^(.+?)\s([A-Z0-9])$/);
    const initialFirstname = match ? match[1] : initialUsername;
    const initialSuffix = match ? match[2] : '';

    const [username, setUsername] = useState(initialFirstname);
    const [suffix, setSuffix] = useState(initialSuffix);
    const [selectedAvatar, setSelectedAvatar] = useState(initialAvatar);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Compose username as "Firstname Suffix" if suffix exists
        const finalUsername = suffix ? `${username} ${suffix}` : username;
        await onSave({ username: finalUsername.trim(), avatar: selectedAvatar });
    };

    const hasChanges = (suffix ? `${username} ${suffix}` : username).trim() !== initialUsername || selectedAvatar !== initialAvatar;

    return (
        <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
            <div>
                <UsernameSelector
                    value={username}
                    onChange={val => {
                        // Split val into firstname and suffix
                        const m = val.match(/^(.+?)\s([A-Z0-9])$/);
                        setUsername(m ? m[1] : val);
                        setSuffix(m ? m[2] : '');
                    }}
                    suffix={suffix}
                    onSuffixChange={setSuffix}
                    id="username"
                    name="username"
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
                    disabled={isLoading || !hasChanges || !selectedAvatar || !username.trim()}
                    className="btn btn-primary btn-lg"
                >
                    {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
            </div>
        </form>
    );
}
