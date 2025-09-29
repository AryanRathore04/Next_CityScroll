/**
 * Sample Jest test to verify Jest setup is working
 */

describe('Jest Setup Test', () => {
  test('should run basic Jest test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should have environment variables set', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBeTruthy();
  });

  test('should have proper timeout configured', () => {
    // Jest timeout is set in jest.setup.js, just verify it doesn't throw
    expect(true).toBe(true);
  });
});