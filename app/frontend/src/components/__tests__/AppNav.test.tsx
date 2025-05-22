import React from 'react';
import { render, screen } from '@testing-library/react';
import AppNav from '../AppNav';

// Mock useAuth to return a default unauthenticated state
jest.mock('../AuthProvider', () => ({
    useAuth: () => ({ isAuthenticated: false, isStudent: false, isTeacher: false })
}));

describe('AppNav', () => {
    it('renders sidebar nav for desktop', () => {
        const setSidebarCollapsed = () => { };
        render(<AppNav sidebarCollapsed={false} setSidebarCollapsed={setSidebarCollapsed} />);
        // Sidebar nav should be present
        expect(screen.getByRole('navigation')).toBeInTheDocument();
        // Check for a known menu label
        expect(screen.getByText('Accueil')).toBeInTheDocument();
    });
});
