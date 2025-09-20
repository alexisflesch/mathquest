// jest-dom type declarations for all test files
import '@testing-library/jest-dom';

declare module 'expect' {
    interface Matchers<R> {
        toBeInTheDocument(): R;
        toHaveClass(className: string): R;
        toHaveAttribute(attr: string, value?: string): R;
        toHaveValue(value?: string | number | string[]): R;
        toBeVisible(): R;
        toBeDisabled(): R;
        toBeEnabled(): R;
        toBeChecked(): R;
        toHaveFocus(): R;
        toHaveTextContent(text?: string | RegExp): R;
        toContainElement(element: HTMLElement | null): R;
        toHaveStyle(css: string | object): R;
        toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R;
    }
}

export { };