import React from 'react';
import { render } from '@testing-library/react';
import TournamentTimer from '../../src/components/TournamentTimer';

// Mock the Timer icon from lucide-react
jest.mock('lucide-react', () => ({
    Timer: () => <div data-testid="timer-icon">Timer</div>
}));

describe('Timer Fix Verification', () => {
    it('should display "0" for undefined values instead of "NaN"', () => {
        // @ts-ignore - Testing undefined value which should be handled
        const { container } = render(<TournamentTimer timerS={undefined} isMobile={false} />);

        // Verify that "0" is displayed, not "NaN"
        expect(container.textContent).toContain('0');
        expect(container.textContent).not.toContain('NaN');
    });

    it('should display "0" for null values', () => {
        const { container } = render(<TournamentTimer timerS={null} isMobile={false} />);

        expect(container.textContent).toContain('0');
        expect(container.textContent).not.toContain('NaN');
    });

    it('should display "0" for negative values', () => {
        const { container } = render(<TournamentTimer timerS={-5} isMobile={false} />);

        expect(container.textContent).toContain('0');
        expect(container.textContent).not.toContain('NaN');
    });

    it('should display correct time for positive values', () => {
        const { container } = render(<TournamentTimer timerS={65} isMobile={false} />);

        expect(container.textContent).toContain('1:05');
        expect(container.textContent).not.toContain('NaN');
    });
});