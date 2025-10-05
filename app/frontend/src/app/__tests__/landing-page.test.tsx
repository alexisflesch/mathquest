import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../page';

// Mock next/link and next/image for testing environment
jest.mock('next/link', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));
jest.mock('next/image', () => ({
    __esModule: true, default: (props: any) => {
        // Avoid spreading boolean props onto DOM (React warns). Only forward known attributes.
        const { src, alt, width, height, 'data-testid': dt } = props || {};
        const attrs: any = {};
        if (src) attrs.src = src;
        if (alt) attrs.alt = alt;
        if (width) attrs.width = width;
        if (height) attrs.height = height;
        if (dt) attrs['data-testid'] = dt;
        return <div {...attrs} />;
    }
}));

// Mock AuthProvider hook with helpers to switch states
jest.mock('@/components/AuthProvider', () => {
    const actual = jest.requireActual('@/components/AuthProvider');
    return {
        __esModule: true,
        ...actual,
        useAuth: jest.fn(),
    };
});

const { useAuth } = jest.requireMock('@/components/AuthProvider');

function setAuthMock(state: 'anonymous' | 'guest' | 'student' | 'teacher', username?: string) {
    (useAuth as jest.Mock).mockReturnValue({
        userState: state,
        userProfile: { username },
        isLoading: false,
        refreshAuth: jest.fn(),
    });
}

describe('Landing page variants', () => {
    it('renders anonymous variant with CTAs', () => {
        setAuthMock('anonymous');
        render(<Home />);
        expect(screen.getByText('Kutsum')).toBeInTheDocument();
        expect(screen.getByText('Commencer sans compte')).toBeInTheDocument();
        expect(screen.getByText('Se connecter / Créer un compte')).toBeInTheDocument();
    });

    it('renders guest/student variant with slogan and quick links', () => {
        setAuthMock('student', 'Alex');
        render(<Home />);
        expect(screen.getByText('Keep Up The Speed, Unleash Mastery !')).toBeInTheDocument();
        expect(screen.getByText(/Bonjour Alex/)).toBeInTheDocument();
        // Match specific CTA labels present in the UI to avoid ambiguous matches
        // 'Rejoindre une activité' appears more than once (strong + span) so assert at least one occurrence
        expect(screen.getAllByText('Rejoindre une activité').length).toBeGreaterThan(0);
        // 'Entraînement' can appear in multiple places (span + strong); assert at least one occurrence
        expect(screen.getAllByText(/Entraînement/i).length).toBeGreaterThan(0);
        // Accept either 'Mes activités' or 'Mon historique' depending on variant rendering
        expect(screen.getAllByText(/Mes activités|Mon historique/).length).toBeGreaterThan(0);
    });

    it('renders teacher variant with creation links and unified slogan', () => {
        setAuthMock('teacher', 'Mme Martin');
        render(<Home />);
        expect(screen.getByText('Keep Up The Speed, Unleash Mastery !')).toBeInTheDocument();
        expect(screen.getByText(/Bonjour Mme Martin/)).toBeInTheDocument();
        // Teacher view shows creation CTAs — assert specific strings present now
        expect(screen.getByText('Créer une activité')).toBeInTheDocument();
        expect(screen.getAllByText(/Mes activités|Gérer vos activités existantes/).length).toBeGreaterThan(0);
    });
});
