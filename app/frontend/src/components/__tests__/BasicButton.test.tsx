import React from 'react';
import { render, screen } from '@testing-library/react';

const Button = () => <button>Click me</button>;

describe('Button component', () => {
    test('renders button with text', () => {
        render(<Button />);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });
});
