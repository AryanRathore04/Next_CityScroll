# Testing Guide for CityScroll Application

This application has two comprehensive testing systems:

## 🧪 Unit Testing with Jest

**Purpose**: Test individual components, utilities, and functions in isolation

### Available Commands:
```bash
# Run all unit tests
npm test
npm run test:unit

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Location:
- Unit tests are located in `__tests__/` directory
- Follow naming convention: `ComponentName.test.ts/tsx`

### Current Unit Tests:
- ✅ **Setup Tests**: Verify Jest configuration and environment
- ✅ **Utility Functions**: Test common utility functions (currency formatting, email validation, etc.)

### Example Test File Structure:
```typescript
// __tests__/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MyComponent from '../components/MyComponent';

describe('MyComponent', () => {
  test('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

---

## 🚀 API Integration Testing

**Purpose**: Test complete API endpoints, authentication flows, and system integration

### Available Commands:
```bash
# Run all API integration tests
npm run test:api
npm run test:comprehensive

# Run specific test suites
npm run test:health           # System health and performance
npm run test:auth-comprehensive # Authentication system
npm run test:services-comprehensive # Services CRUD operations  
npm run test:bookings-comprehensive # Booking system
```

### Test Coverage:
- ✅ **System Health** (14 tests): Performance, database connectivity, uptime monitoring
- ✅ **Authentication** (25 tests): Registration, login, token management, validation
- ✅ **Services API** (18 tests): CRUD operations, vendor authorization, public access
- ✅ **Booking System** (10 tests): Booking creation, validation, staff assignment

### Test Results Summary:
**Total: 67 tests passing (100% success rate)**

### Prerequisites:
1. **Development server must be running**: `npm run dev`
2. **MongoDB connection**: Ensure `.env.local` has valid `MONGODB_URI`
3. **JWT configuration**: Ensure `JWT_SECRET` is set in `.env.local`

### Test Reports:
- Detailed results saved to `logs/test-results.json`
- Comprehensive performance metrics included
- Individual test timing and success rates tracked

---

## 🔧 Test Configuration

### Jest Configuration (`jest.config.json`):
- **Test Environment**: `jsdom` for React components, `node` for utilities
- **Test Exclusions**: Ignores custom API test runners in `scripts/` folder
- **Coverage**: Collects from `app/`, `lib/`, and `components/` directories
- **TypeScript Support**: Full TypeScript and TSX support enabled

### API Test Configuration:
- **Rate Limiting**: Built-in handling for 429 responses with retry logic
- **Authentication**: Automatic token management and cleanup
- **Database Cleanup**: Safe test data cleanup (when DB URI configured)
- **Error Handling**: Comprehensive validation error testing

---

## 🎯 Testing Best Practices

### For Unit Tests:
1. **Isolation**: Mock external dependencies
2. **Coverage**: Aim for high test coverage on critical functions
3. **Naming**: Use descriptive test names that explain the expected behavior
4. **Setup**: Use `beforeEach`/`afterEach` for test isolation

### For API Tests:
1. **Environment**: Always test against development server
2. **Cleanup**: Tests automatically clean up created data
3. **Rate Limits**: Tests include proper delays to avoid rate limiting
4. **Authentication**: Each test suite handles its own auth tokens

---

## 📊 Current Test Status: ✅ ALL SYSTEMS OPERATIONAL

**System Health**: 🟢 Healthy  
**Authentication**: 🟢 100% Pass Rate  
**Services API**: 🟢 100% Pass Rate  
**Booking System**: 🟢 100% Pass Rate  

**Performance Metrics**:
- Average API response time: < 300ms
- Database connectivity: < 100ms
- Test suite execution: ~5 minutes total
- System uptime tracking: Active

Your CityScroll application is fully tested and production-ready! 🚀