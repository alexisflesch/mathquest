import React from 'react';
import { render, screen } from '@testing-library/react';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

const Button = () => <button>Click me</button>;

describe('Button component', () => {
    test('renders button with text', () => {
        render(<Button />);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });
});
