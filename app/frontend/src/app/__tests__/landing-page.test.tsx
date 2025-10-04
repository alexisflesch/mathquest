import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../page';

// Mock next/link and next/image for testing environment
jest.mock('next/link', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));
jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => <div data-testid="next-image-mock" {...props} /> }));

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
        expect(screen.getByText('Rejoindre (Tournoi/Quiz)')).toBeInTheDocument();
        expect(screen.getByText('Rejoindre (Entraînement)')).toBeInTheDocument();
        expect(screen.getByText('Mes activités')).toBeInTheDocument();
    });

    it('renders teacher variant with creation links and unified slogan', () => {
        setAuthMock('teacher', 'Mme Martin');
        render(<Home />);
        expect(screen.getByText('Keep Up The Speed, Unleash Mastery !')).toBeInTheDocument();
        expect(screen.getByText(/Bonjour Mme Martin/)).toBeInTheDocument();
        expect(screen.getByText(/Créer un modèle/)).toBeInTheDocument();
        expect(screen.getByText('Instancier et animer')).toBeInTheDocument();
    });
});
