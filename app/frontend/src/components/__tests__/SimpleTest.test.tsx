import React from 'react';
import { render, screen } from '@testing-library/react';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

// Create a simple test component
const SimpleComponent = () => {
    return <div data-testid="simple-component">Simple Component</div>;
};

describe('Simple Component Test', () => {
    it('renders correctly', () => {
        render(<SimpleComponent />);
        expect(screen.getByTestId('simple-component')).toBeInTheDocument();
    });
});
