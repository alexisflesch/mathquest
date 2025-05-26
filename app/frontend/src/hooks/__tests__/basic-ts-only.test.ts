// Minimal TypeScript Jest test (no React, no imports)
describe('Basic TS Test', () => {
  it('adds numbers', () => {
    const a: number = 2;
    const b: number = 3;
    expect(a + b).toBe(5);
  });
});
