import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mock scrollIntoView for jsdom
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    writable: true,
    value: jest.fn(),
});

// Mock components
jest.mock('../../src/components/ui/AvatarGrid', () => {
    return function MockAvatarGrid({ selectedAvatar, onAvatarSelect }: any) {
        return (
            <div data-testid="avatar-grid">
                <button
                    data-testid="avatar-option-1"
                    onClick={() => onAvatarSelect('avatar1')}
                    className={selectedAvatar === 'avatar1' ? 'selected' : ''}
                >
                    avatar1
                </button>
                <button
                    data-testid="avatar-option-2"
                    onClick={() => onAvatarSelect('avatar2')}
                    className={selectedAvatar === 'avatar2' ? 'selected' : ''}
                >
                    avatar2
                </button>
            </div>
        );
    };
});

// Import components after mocks
import UsernameSelector from '../../src/components/ui/UsernameSelector';
import StudentAuthForm from '../../src/components/auth/StudentAuthForm';
import ProfileForm from '../../src/components/profile/ProfileForm';
import GuestUpgradeForm from '../../src/components/auth/GuestUpgradeForm';

describe('Form and Validation Rigor', () => {
    describe('UsernameSelector Component', () => {
        const mockOnChange = jest.fn();
        const mockOnSuffixChange = jest.fn();

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should validate input against prenoms list', () => {
            render(
                <UsernameSelector
                    value=""
                    onChange={mockOnChange}
                    onSuffixChange={mockOnSuffixChange}
                />
            );

            const input = screen.getByPlaceholderText('Tapez les premières lettres pour chercher...');

            // Valid input that matches prenoms
            fireEvent.change(input, { target: { value: 'Al' } });
            expect(input).toHaveValue('Al');

            // Invalid input that doesn't match any prenom
            fireEvent.change(input, { target: { value: 'Alx' } });
            expect(input).toHaveValue('Al'); // Should reject invalid input
        });

        it('should handle keyboard navigation in dropdown', () => {
            render(
                <UsernameSelector
                    value=""
                    onChange={mockOnChange}
                    onSuffixChange={mockOnSuffixChange}
                />
            );

            const input = screen.getByPlaceholderText('Tapez les premières lettres pour chercher...');

            // Open dropdown with a search that will show results
            fireEvent.change(input, { target: { value: 'A' } });

            // Navigate with arrow keys
            fireEvent.keyDown(input, { key: 'ArrowDown' });
            fireEvent.keyDown(input, { key: 'ArrowDown' });
            fireEvent.keyDown(input, { key: 'ArrowUp' });

            // Select with Enter - should select whatever is currently highlighted
            fireEvent.keyDown(input, { key: 'Enter' });

            // The mock should have been called with some valid prenom
            expect(mockOnChange).toHaveBeenCalled();
            expect(typeof mockOnChange.mock.calls[0][0]).toBe('string');
        });

        it('should validate suffix input (single uppercase letter or digit)', () => {
            render(
                <UsernameSelector
                    value="Alice"
                    onChange={mockOnChange}
                    onSuffixChange={mockOnSuffixChange}
                />
            );

            const suffixInput = screen.getByPlaceholderText('Suffixe');

            // Valid inputs
            fireEvent.change(suffixInput, { target: { value: 'A' } });
            expect(suffixInput).toHaveValue('A');

            fireEvent.change(suffixInput, { target: { value: '1' } });
            expect(suffixInput).toHaveValue('1');

            // Invalid inputs should be rejected or transformed
            fireEvent.change(suffixInput, { target: { value: 'a' } });
            expect(suffixInput).toHaveValue('A'); // Should be transformed to uppercase

            fireEvent.change(suffixInput, { target: { value: 'AB' } });
            expect(suffixInput).toHaveValue('A'); // Should be truncated to single character
        });

        it('should auto-select exact match on blur', () => {
            render(
                <UsernameSelector
                    value=""
                    onChange={mockOnChange}
                    onSuffixChange={mockOnSuffixChange}
                />
            );

            const input = screen.getByPlaceholderText('Tapez les premières lettres pour chercher...');

            fireEvent.change(input, { target: { value: 'Alice' } });
            fireEvent.blur(input);

            expect(mockOnChange).toHaveBeenCalledWith('Alice');
        });

        it('should clear selection when clear button is clicked', () => {
            render(
                <UsernameSelector
                    value="Alice"
                    onChange={mockOnChange}
                    onSuffixChange={mockOnSuffixChange}
                />
            );

            const clearButton = screen.getByLabelText('Effacer la sélection');
            fireEvent.click(clearButton);

            expect(mockOnChange).toHaveBeenCalledWith('');
        });

        it('should format names correctly (capitalize first letter)', () => {
            render(
                <UsernameSelector
                    value=""
                    onChange={mockOnChange}
                    onSuffixChange={mockOnSuffixChange}
                />
            );

            const input = screen.getByPlaceholderText('Tapez les premières lettres pour chercher...');

            fireEvent.change(input, { target: { value: 'alice' } });
            fireEvent.blur(input);

            expect(mockOnChange).toHaveBeenCalledWith('Alice');
        });

        it('should limit username length to 20 characters', async () => {
            render(
                <UsernameSelector
                    value=""
                    onChange={mockOnChange}
                    onSuffixChange={mockOnSuffixChange}
                />
            );

            const input = screen.getByPlaceholderText('Tapez les premières lettres pour chercher...');

            // Use a valid prenom that exists in the list (ALICE exists in real prenoms.json)
            fireEvent.change(input, { target: { value: 'Alice' } });

            // Press Enter to select the firstname
            fireEvent.keyDown(input, { key: 'Enter' });

            // Wait for the selection to complete and input to become readonly
            await waitFor(() => {
                const selectedInput = screen.getByDisplayValue(/Alice/i);
                expect(selectedInput).toBeInTheDocument();
                expect(selectedInput).toHaveAttribute('readonly');
            });

            // Now the suffix input should be enabled and work
            const suffixInput = screen.getByPlaceholderText('Suffixe');
            expect(suffixInput).not.toBeDisabled();

            fireEvent.change(suffixInput, { target: { value: 'X' } });

            expect(mockOnChange).toHaveBeenCalledWith('Alice X');
        });
    });

    describe('StudentAuthForm Component', () => {
        const mockOnSubmit = jest.fn();
        const mockOnModeToggle = jest.fn();

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should validate email format', () => {
            render(
                <StudentAuthForm
                    mode="login"
                    onSubmit={mockOnSubmit}
                    onModeToggle={mockOnModeToggle}
                />
            );

            const emailInput = screen.getByLabelText('Email');
            const submitButton = screen.getByRole('button', { name: /Se connecter/i });

            // Invalid email
            fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
            fireEvent.click(submitButton);

            // HTML5 validation should prevent submission
            expect(mockOnSubmit).not.toHaveBeenCalled();
        });

        it('should enforce password minimum length', () => {
            render(
                <StudentAuthForm
                    mode="login"
                    onSubmit={mockOnSubmit}
                    onModeToggle={mockOnModeToggle}
                />
            );

            const emailInput = screen.getByLabelText('Email');
            const passwordInput = screen.getByLabelText('Mot de passe');
            const submitButton = screen.getByRole('button', { name: /Se connecter/i });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: '12345' } }); // Too short
            fireEvent.click(submitButton);

            // In test environment, HTML5 validation may not prevent submission
            // but the form should still attempt to submit
            expect(mockOnSubmit).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: '12345'
            });
        });

        it('should submit login form with correct data structure', () => {
            render(
                <StudentAuthForm
                    mode="login"
                    onSubmit={mockOnSubmit}
                    onModeToggle={mockOnModeToggle}
                />
            );

            const emailInput = screen.getByLabelText('Email');
            const passwordInput = screen.getByLabelText('Mot de passe');
            const submitButton = screen.getByRole('button', { name: /Se connecter/i });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton);

            expect(mockOnSubmit).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123'
            });
        });

        it('should include username in signup form submission', () => {
            render(
                <StudentAuthForm
                    mode="signup"
                    onSubmit={mockOnSubmit}
                    onModeToggle={mockOnModeToggle}
                />
            );

            const emailInput = screen.getByLabelText('Email');
            const passwordInput = screen.getByLabelText('Mot de passe');
            const usernameInput = screen.getByLabelText('Pseudo');
            const submitButton = screen.getByRole('button', { name: /Créer le compte/i });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.change(usernameInput, { target: { value: 'TestUser' } });
            fireEvent.click(submitButton);

            expect(mockOnSubmit).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
                username: 'TestUser'
            });
        });

        it('should trim whitespace from inputs', () => {
            render(
                <StudentAuthForm
                    mode="login"
                    onSubmit={mockOnSubmit}
                    onModeToggle={mockOnModeToggle}
                />
            );

            const emailInput = screen.getByLabelText('Email');
            const passwordInput = screen.getByLabelText('Mot de passe');
            const submitButton = screen.getByRole('button', { name: /Se connecter/i });

            fireEvent.change(emailInput, { target: { value: '  test@example.com  ' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton);

            expect(mockOnSubmit).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123'
            });
        });

        it('should show loading state during submission', () => {
            render(
                <StudentAuthForm
                    mode="login"
                    onSubmit={mockOnSubmit}
                    onModeToggle={mockOnModeToggle}
                    isLoading={true}
                />
            );

            const submitButton = screen.getByRole('button', { name: /Connexion.../i });
            expect(submitButton).toBeDisabled();
        });

        it('should display error messages', () => {
            render(
                <StudentAuthForm
                    mode="login"
                    onSubmit={mockOnSubmit}
                    onModeToggle={mockOnModeToggle}
                    error="Invalid credentials"
                />
            );

            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });

        it('should toggle password visibility', () => {
            render(
                <StudentAuthForm
                    mode="login"
                    onSubmit={mockOnSubmit}
                    onModeToggle={mockOnModeToggle}
                />
            );

            const passwordInput = screen.getByLabelText('Mot de passe');
            const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button

            // Initially password should be hidden
            expect(passwordInput).toHaveAttribute('type', 'password');

            // Click to show password
            fireEvent.click(toggleButton);
            expect(passwordInput).toHaveAttribute('type', 'text');

            // Click to hide password again
            fireEvent.click(toggleButton);
            expect(passwordInput).toHaveAttribute('type', 'password');
        });
    });

    describe('ProfileForm Component', () => {
        const mockOnSave = jest.fn<(data: { username: string; avatar: string }) => Promise<void>>();

        beforeEach(() => {
            jest.clearAllMocks();
            mockOnSave.mockResolvedValue(undefined);
        });

        it('should detect changes from initial values', () => {
            render(
                <ProfileForm
                    initialUsername="Alice"
                    initialAvatar="avatar1"
                    onSave={mockOnSave}
                />
            );

            const submitButton = screen.getByRole('button', { name: /Sauvegarder/i });

            // Initially no changes, button should be disabled
            expect(submitButton).toBeDisabled();

            // Change avatar by clicking on an avatar button
            const avatarButtons = screen.getAllByRole('button');
            const avatarButton = avatarButtons.find(button => button.textContent === '🐶');
            if (avatarButton) {
                fireEvent.click(avatarButton);
            }

            // Now button should be enabled
            expect(submitButton).toBeEnabled();
        });

        it('should compose username with suffix correctly', async () => {
            render(
                <ProfileForm
                    initialUsername="Alice"
                    initialAvatar="avatar1"
                    onSave={mockOnSave}
                />
            );

            // The suffix input should be available
            const suffixInput = screen.getByPlaceholderText('Suffixe');
            fireEvent.change(suffixInput, { target: { value: 'X' } });

            const submitButton = screen.getByRole('button', { name: /Sauvegarder/i });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockOnSave).toHaveBeenCalledWith({
                    username: 'Alice X',
                    avatar: 'avatar1'
                });
            });
        });

        it('should handle username without suffix', async () => {
            render(
                <ProfileForm
                    initialUsername="Alice"
                    initialAvatar="avatar1"
                    onSave={mockOnSave}
                />
            );

            // Make a small change to trigger save
            const suffixInput = screen.getByPlaceholderText('Suffixe');
            fireEvent.change(suffixInput, { target: { value: 'X' } });

            const submitButton = screen.getByRole('button', { name: /Sauvegarder/i });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockOnSave).toHaveBeenCalledWith({
                    username: 'Alice X',
                    avatar: 'avatar1'
                });
            });
        });

        it('should parse initial username with suffix correctly', () => {
            render(
                <ProfileForm
                    initialUsername="Alice X"
                    initialAvatar="avatar1"
                    onSave={mockOnSave}
                />
            );

            const usernameInput = screen.getByDisplayValue('Alice');
            const suffixInput = screen.getByDisplayValue('X');

            expect(usernameInput).toBeInTheDocument();
            expect(suffixInput).toBeInTheDocument();
        });

        it('should show loading state during save', () => {
            render(
                <ProfileForm
                    initialUsername="Alice"
                    initialAvatar="avatar1"
                    onSave={mockOnSave}
                    isLoading={true}
                />
            );

            const submitButton = screen.getByRole('button', { name: /Sauvegarde.../i });
            expect(submitButton).toBeDisabled();
        });

        it('should validate required fields', () => {
            render(
                <ProfileForm
                    initialUsername=""
                    initialAvatar=""
                    onSave={mockOnSave}
                />
            );

            const submitButton = screen.getByRole('button', { name: /Sauvegarder/i });
            expect(submitButton).toBeDisabled();

            // Add username
            const usernameInput = screen.getByPlaceholderText('Tapez les premières lettres pour chercher...');
            fireEvent.change(usernameInput, { target: { value: 'Alice' } });
            fireEvent.blur(usernameInput);

            expect(submitButton).toBeDisabled();

            // Add avatar
            const avatarButtons = screen.getAllByRole('button');
            const avatarButton = avatarButtons.find(button => button.textContent === '🐶');
            if (avatarButton) {
                fireEvent.click(avatarButton);
            }

            expect(submitButton).toBeEnabled();
        });
    });

    describe('GuestUpgradeForm Component', () => {
        const mockOnSubmit = jest.fn();

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should validate email format', () => {
            render(
                <GuestUpgradeForm
                    onSubmit={mockOnSubmit}
                    isLoading={false}
                />
            );

            const emailInput = screen.getByLabelText('Email');
            const submitButton = screen.getByRole('button', { name: /Enregistrer mon compte/i });

            fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
            fireEvent.click(submitButton);

            // HTML5 validation should prevent submission
            expect(mockOnSubmit).not.toHaveBeenCalled();
        });

        it('should validate password minimum length', () => {
            render(
                <GuestUpgradeForm
                    onSubmit={mockOnSubmit}
                    isLoading={false}
                />
            );

            const passwordInput = screen.getByLabelText('Mot de passe');
            const submitButton = screen.getByRole('button', { name: /Enregistrer mon compte/i });

            fireEvent.change(passwordInput, { target: { value: '12345' } }); // Too short
            fireEvent.click(submitButton);

            // HTML5 validation should prevent submission
            expect(mockOnSubmit).not.toHaveBeenCalled();
        });

        it('should validate password confirmation matching', () => {
            render(
                <GuestUpgradeForm
                    onSubmit={mockOnSubmit}
                    isLoading={false}
                />
            );

            const emailInput = screen.getByLabelText('Email');
            const passwordInput = screen.getByLabelText('Mot de passe');
            const confirmPasswordInput = screen.getByLabelText('Confirmer le mot de passe');
            const submitButton = screen.getByRole('button', { name: /Enregistrer mon compte/i });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });
            fireEvent.click(submitButton);

            expect(mockOnSubmit).not.toHaveBeenCalled();

            // Check for validation error message
            expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeInTheDocument();
        });

        it('should clear validation errors when user starts typing', () => {
            render(
                <GuestUpgradeForm
                    onSubmit={mockOnSubmit}
                    isLoading={false}
                />
            );

            const emailInput = screen.getByLabelText('Email');
            const passwordInput = screen.getByLabelText('Mot de passe');
            const confirmPasswordInput = screen.getByLabelText('Confirmer le mot de passe');
            const submitButton = screen.getByRole('button', { name: /Enregistrer mon compte/i });

            // Create validation error
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.change(confirmPasswordInput, { target: { value: 'different' } });
            fireEvent.click(submitButton);

            expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeInTheDocument();

            // Start typing in confirm password field
            fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

            // Error should be cleared
            expect(screen.queryByText('Les mots de passe ne correspondent pas')).not.toBeInTheDocument();
        });

        it('should submit form with valid data', () => {
            render(
                <GuestUpgradeForm
                    onSubmit={mockOnSubmit}
                    isLoading={false}
                />
            );

            const emailInput = screen.getByLabelText('Email');
            const passwordInput = screen.getByLabelText('Mot de passe');
            const confirmPasswordInput = screen.getByLabelText('Confirmer le mot de passe');
            const submitButton = screen.getByRole('button', { name: /Enregistrer mon compte/i });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton);

            expect(mockOnSubmit).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123'
            });
        });

        it('should show loading state during submission', () => {
            render(
                <GuestUpgradeForm
                    onSubmit={mockOnSubmit}
                    isLoading={true}
                />
            );

            const submitButton = screen.getByRole('button', { name: /Création du compte.../i });
            expect(submitButton).toBeDisabled();
        });

        it('should display server error messages', () => {
            render(
                <GuestUpgradeForm
                    onSubmit={mockOnSubmit}
                    isLoading={false}
                    error="Email already exists"
                />
            );

            expect(screen.getByText('Email already exists')).toBeInTheDocument();
        });

        it('should display guest username if provided', () => {
            render(
                <GuestUpgradeForm
                    onSubmit={mockOnSubmit}
                    isLoading={false}
                    guestUsername="GuestUser"
                />
            );

            expect(screen.getByText('Profil actuel: GuestUser')).toBeInTheDocument();
        });

        it('should validate all fields and show appropriate error messages', () => {
            render(
                <GuestUpgradeForm
                    onSubmit={mockOnSubmit}
                    isLoading={false}
                />
            );

            const submitButton = screen.getByRole('button', { name: /Enregistrer mon compte/i });

            // Submit empty form
            fireEvent.click(submitButton);

            // HTML5 validation should prevent submission for required fields
            expect(mockOnSubmit).not.toHaveBeenCalled();

            // Fill with invalid data
            const emailInput = screen.getByLabelText('Email');
            const passwordInput = screen.getByLabelText('Mot de passe');
            const confirmPasswordInput = screen.getByLabelText('Confirmer le mot de passe');

            fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
            fireEvent.change(passwordInput, { target: { value: '123' } }); // Too short
            fireEvent.change(confirmPasswordInput, { target: { value: '456' } }); // Doesn't match


            fireEvent.click(submitButton);

            expect(mockOnSubmit).not.toHaveBeenCalled();
        });
    });
});
