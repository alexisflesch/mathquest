"use client";

import React, { useState, useMemo } from 'react';
import { User } from 'lucide-react';
import prenoms from '@shared/prenoms.json';

interface Props {
    value?: string;
    onChange: (value: string) => void;
    suffix?: string;
    onSuffixChange?: (value: string) => void;
    id?: string;
    name?: string;
    className?: string;
    placeholder?: string;
    required?: boolean;
}


export default function UsernameSelector({ value = '', onChange, suffix, onSuffixChange, id, name, className = '', placeholder = 'Tapez les premières lettres pour chercher...', required = false }: Props) {
    const [input, setInput] = useState(value);
    const [searchTerm, setSearchTerm] = useState('');
    const [internalSuffix, setInternalSuffix] = useState(suffix ?? '');
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState<number>(-1);

    // Capitalize first letter, lowercase rest
    const formatName = (n: string) => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
    const firstnames = useMemo(() => Array.isArray(prenoms) ? prenoms : [], []);

    const filtered = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return firstnames.slice(0, 50);
        return firstnames.filter((n: string) => n.toLowerCase().startsWith(q)).slice(0, 50);
    }, [searchTerm, firstnames]);

    const joinName = (base: string, sfx: string) => {
        if (sfx) return `${base} ${sfx}`.slice(0, 20);
        return base.slice(0, 20);
    };

    const applyChange = (base: string, sfx: string) => {
        const formattedBase = formatName(base);
        const final = joinName(formattedBase, sfx);
        setInput(formattedBase);
        setSearchTerm(''); // Clear search term after selection
        if (onSuffixChange) onSuffixChange(sfx);
        setInternalSuffix(sfx);
        onChange(final);
        setOpen(false);
        setHighlight(-1);
    };

    const handleSearchInput = (v: string) => {
        // Only allow search terms that match the beginning of existing prenoms
        // This prevents users from entering custom firstnames not in the list
        const hasMatches = prenoms.some(p => p.toLowerCase().startsWith(v.toLowerCase()));

        // If there are no matches and the user is typing (not empty), don't update
        if (v && !hasMatches) {
            return; // Reject input that doesn't match any prenom
        }

        setSearchTerm(v);
        setOpen(true);
        setHighlight(-1);

        // If the search term exactly matches a prenom, auto-select it
        const exactMatch = prenoms.find(p => p.toLowerCase() === v.toLowerCase());
        if (!v) {
            // Clear selection if search is empty
            setInput('');
            onChange('');
        }
    };

    const handleSuffix = (v: string) => {
        // allow only one char, uppercase letter or digit
        const s = v.toUpperCase().slice(0, 1);
        if (s && !/^[A-Z0-9]$/.test(s)) return;
        if (onSuffixChange) onSuffixChange(s);
        setInternalSuffix(s);
        onChange(joinName(input, s));
    };

    const clearSelection = () => {
        setInput('');
        setSearchTerm('');
        onChange('');
        setOpen(false);
        setHighlight(-1);
    };

    // Keyboard navigation for dropdown
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open || filtered.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlight(h => Math.min(filtered.length - 1, h + 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlight(h => Math.max(0, h - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlight >= 0) {
                // Select highlighted item
                applyChange(filtered[highlight], (suffix ?? internalSuffix));
            } else if (filtered.length === 1) {
                // Auto-select if only one match
                applyChange(filtered[0], (suffix ?? internalSuffix));
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
            setHighlight(-1);
        }
    };


    // Ref for scrolling dropdown
    const listRef = React.useRef<HTMLUListElement>(null);
    React.useEffect(() => {
        if (highlight >= 0 && listRef.current) {
            const item = listRef.current.children[highlight] as HTMLElement | undefined;
            if (item) item.scrollIntoView({ block: 'nearest' });
        }
    }, [highlight]);

    return (
        <div className={`username-selector ${className}`}>
            <label htmlFor={id} className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                <User className="inline w-4 h-4 mr-2" />
                Prénom <span className="text-[color:var(--muted-foreground)]">(et suffixe éventuel)</span>
            </label>
            <div className="flex flex-col sm:flex-row sm:items-start sm:gap-2">
                <div className="relative flex-1">
                    {/* Show selected firstname or search input */}
                    {input ? (
                        <div className="relative">
                            <input
                                id={id}
                                name={name}
                                value={input}
                                readOnly
                                onClick={() => setOpen(!open)}
                                placeholder={placeholder}
                                className="input input-bordered input-lg w-full cursor-pointer bg-base-100"
                                autoComplete="off"
                                required={required}
                            />
                            <button
                                type="button"
                                onClick={clearSelection}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] w-5 h-5 flex items-center justify-center"
                                aria-label="Effacer la sélection"
                            >
                                ×
                            </button>
                        </div>
                    ) : (
                        <input
                            id={id}
                            name={name}
                            value={searchTerm}
                            onChange={e => handleSearchInput(e.target.value)}
                            onFocus={() => setOpen(true)}
                            onBlur={() => setTimeout(() => setOpen(false), 120)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            className="input input-bordered input-lg w-full"
                            autoComplete="off"
                            required={required}
                        />
                    )}
                    {open && filtered.length > 0 && (
                        <ul ref={listRef} className="absolute z-20 bg-base-100 border rounded-md mt-1 w-full max-h-48 overflow-auto shadow-lg">
                            {filtered.map((n: string, i: number) => (
                                <li
                                    key={n}
                                    className={`px-3 py-2 hover:bg-[color:var(--muted)] cursor-pointer ${highlight === i ? 'bg-[color:var(--muted)]' : ''}`}
                                    onMouseDown={() => applyChange(n, (suffix ?? internalSuffix))}
                                >
                                    {formatName(n)}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="mt-2 sm:mt-0 sm:w-24">
                    <label className="sr-only">Suffixe</label>
                    <input
                        type="text"
                        inputMode="text"
                        value={suffix ?? internalSuffix}
                        onChange={e => handleSuffix(e.target.value)}
                        placeholder="Suffixe"
                        maxLength={1}
                        className="input input-bordered input-lg w-full text-center"
                        aria-label="Suffixe (lettre majuscule ou chiffre)"
                    />
                </div>
            </div>
        </div>
    );
}
