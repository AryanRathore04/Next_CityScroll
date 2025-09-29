/**
 * Simple utility function tests
 */

describe('Utility Functions', () => {
  test('should add numbers correctly', () => {
    const add = (a: number, b: number) => a + b;
    expect(add(2, 3)).toBe(5);
    expect(add(-1, 1)).toBe(0);
    expect(add(0, 0)).toBe(0);
  });

  test('should format currency correctly', () => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(amount);
    };

    expect(formatCurrency(1000)).toBe('₹1,000.00');
    expect(formatCurrency(0)).toBe('₹0.00');
  });

  test('should validate email format', () => {
    const isValidEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user@domain.org')).toBe(true);
    expect(isValidEmail('invalid.email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  test('should generate future datetime correctly', () => {
    const generateFutureDateTime = (hoursFromNow: number) => {
      const future = new Date();
      future.setHours(future.getHours() + hoursFromNow);
      return future.toISOString();
    };

    const now = new Date();
    const future = new Date(generateFutureDateTime(24));
    
    expect(future > now).toBe(true);
    expect(future.getTime() - now.getTime()).toBeGreaterThan(23 * 60 * 60 * 1000); // At least 23 hours
  });
});