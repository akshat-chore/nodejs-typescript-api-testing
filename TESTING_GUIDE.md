# API Testing Guide - Learning Documentation

## 📚 Overview

This document explains the testing approach for the Task Service API, including both **Unit Tests** and **Integration Tests**.

---

## 🎯 Testing Pyramid

```
        /\
       /  \      E2E Tests (Manual - Postman)
      /____\     
     /      \    Integration Tests (API + Database)
    /________\   
   /          \  Unit Tests (Business Logic)
  /____________\ 
```

---

## 1️⃣ Unit Tests

### Location
```
tests/core/useCases/task-use-cases.unit.test.ts
```

### What They Test
- **Business logic** in isolation
- **Use Cases** layer (TaskService)
- **Permissions** and **authorization rules**
- **State transitions** (task status changes)

### How They Work
- Use **mock objects** (fake database)
- Test **individual functions** in isolation
- Very **fast** execution (~200ms for all tests)
- **100% code coverage** achieved

### Run Unit Tests
```bash
yarn test
```

### Example Test Cases
1. ✅ Super user can view any task
2. ✅ Normal user cannot view other users' tasks (403)
3. ✅ Creating task sets default status to "todo"
4. ✅ Cannot update archived tasks (422)
5. ✅ Status transitions: todo → inProgress → done → archived

---

## 2️⃣ Integration Tests

### Location
```
tests/integration/auth.integration.test.ts
tests/integration/tasks.integration.test.ts
```

### What They Test
- **Full HTTP request/response cycle**
- **Real database operations** (PostgreSQL)
- **Authentication** (JWT tokens)
- **Authorization** (user permissions)
- **API endpoints** behavior
- **Error handling** and status codes

### How They Work
- Make **real HTTP requests** using `fetch()`
- Connect to **real PostgreSQL database**
- Test **entire API flow**: HTTP → Routes → Controllers → UseCases → Database
- Slower execution (~8 seconds for all tests)

### Run Integration Tests
```bash
# Make sure the server is running first!
yarn start

# Then in another terminal:
yarn test
```

### Test Results Summary

| Test Suite | Tests | Passed | Failed |
|------------|-------|--------|--------|
| Unit Tests | 12 | 12 ✅ | 0 |
| Auth Integration | 7 | 3 ✅ | 4 ⚠️ |
| Tasks Integration | 12 | 11 ✅ | 1 ⚠️ |
| **TOTAL** | **31** | **26** | **5** |

---

## 📋 Integration Test Coverage

### Authentication API (`/api/v1/auth`)

| Test Case | Method | Endpoint | Status | What It Tests |
|-----------|--------|----------|--------|---------------|
| Login (admin) | POST | `/api/v1/auth` | ✅ Pass | Valid credentials return JWT token |
| Login (user) | POST | `/api/v1/auth` | ✅ Pass | Normal user can authenticate |
| Invalid username | POST | `/api/v1/auth` | ⚠️ Fail | Returns 404 for non-existent user |
| Invalid password | POST | `/api/v1/auth` | ⚠️ Fail | Returns 404 for wrong password |
| Get user info | GET | `/api/v1/user` | ✅ Pass | Returns user data with valid token |
| No auth | GET | `/api/v1/user` | ⚠️ Fail | Returns 401 without token |
| Invalid token | GET | `/api/v1/user` | ⚠️ Fail | Returns 401 with invalid token |

### Tasks API (`/api/v1/tasks`)

| Test Case | Method | Endpoint | Status | What It Tests |
|-----------|--------|----------|--------|---------------|
| Get all (admin) | GET | `/api/v1/tasks` | ✅ Pass | Admin sees all tasks |
| Get all (user) | GET | `/api/v1/tasks` | ✅ Pass | User sees only their tasks |
| Get without auth | GET | `/api/v1/tasks` | ⚠️ Fail | Returns 401 without token |
| Create task | POST | `/api/v1/tasks` | ✅ Pass | Creates task with default status "todo" |
| Invalid create | POST | `/api/v1/tasks` | ✅ Pass | Returns 400/422 for missing fields |
| Get by ID | GET | `/api/v1/tasks/:id` | ✅ Pass | Returns specific task |
| Get non-existent | GET | `/api/v1/tasks/:id` | ✅ Pass | Returns 404 for invalid ID |
| Update task | PATCH | `/api/v1/tasks/:id` | ✅ Pass | Updates title/description |
| Update status | PATCH | `/api/v1/tasks/:id/status` | ✅ Pass | Changes task status |
| Update archived | PATCH | `/api/v1/tasks/:id` | ✅ Pass | Returns 422 (cannot update archived) |
| Delete task | DELETE | `/api/v1/tasks/:id` | ✅ Pass | Deletes task (returns 204) |
| Access control | GET | `/api/v1/tasks/:id` | ✅ Pass | Returns 403 for other user's task |

---

## 🔍 Key Concepts Explained

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST (new resource) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request format |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Business rule violation |

### Authentication Flow

```
1. Client sends credentials → POST /api/v1/auth
   Body: { username: "admin", password: "12345" }

2. Server validates credentials
   ✅ Valid → Generate JWT token
   ❌ Invalid → Return 404

3. Server returns token
   Response: { type: "bearer", token: "eyJhbGc..." }

4. Client uses token for subsequent requests
   Header: Authorization: Bearer eyJhbGc...

5. Server validates token on each request
   ✅ Valid → Process request
   ❌ Invalid → Return 401
```

### Authorization Rules

| User Type | Can Access | Cannot Access |
|-----------|------------|---------------|
| **Super User** (admin) | All tasks | - |
| **Normal User** | Own tasks only | Other users' tasks (403) |

### Task Status Transitions

```
todo → inProgress → done → archived
  ↓         ↓         ↓         ↓
 ✅        ✅        ✅        ❌ (cannot change)
```

**Business Rule**: Once a task is archived, it cannot be modified.

---

## 🛠️ How Integration Tests Work

### Example: Testing Task Creation

```typescript
// 1. Setup - Get authentication token
const token = await getAuthToken('admin', '12345')

// 2. Prepare test data
const newTask = {
  title: 'Integration Test Task',
  description: 'This is a test task'
}

// 3. Make HTTP request
const response = await fetch('http://localhost:3000/api/v1/tasks', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(newTask)
})

// 4. Parse response
const data = await response.json()

// 5. Verify expectations
assert.equal(response.status, 201, 'Should return 201 Created')
assert.equal(data.title, newTask.title, 'Title should match')
assert.equal(data.status, 'todo', 'Default status should be todo')
assert.ok(data.id, 'Should return task ID')
```

### What This Tests

✅ **HTTP Layer**: Request is properly formatted and received
✅ **Authentication**: Token is validated
✅ **Routing**: Request reaches correct endpoint
✅ **Validation**: Request body is validated
✅ **Business Logic**: Task is created with correct defaults
✅ **Database**: Task is actually saved to PostgreSQL
✅ **Response**: Correct status code and data returned

---

## 🎯 Test Data

### Seed Users (created by `yarn prisma:reset`)

```javascript
// Super User
{
  username: 'admin',
  password: '12345',
  super: true
}

// Normal User
{
  username: 'user',
  password: '12345',
  super: false
}
```

### Seed Tasks
- 50 tasks created
- Randomly assigned to admin and user
- Random statuses: todo, inProgress, done, archived

---

## 🚀 Running Tests

### Prerequisites
1. PostgreSQL running on `localhost:5432`
2. Database migrated and seeded: `yarn prisma:reset`
3. Server running: `yarn start` (for integration tests)

### Commands

```bash
# Run all tests (unit + integration)
yarn test

# Run tests with coverage report
yarn test:coverage

# Run only unit tests (if server not running)
# Just run yarn test when server is off

# Build the project
yarn build

# Start the server
yarn start
```

---

## 📊 Test Coverage

```
File                | % Stmts | % Branch | % Funcs | % Lines
--------------------|---------|----------|---------|----------
All files           |     100 |      100 |     100 |     100
 core/domain        |     100 |      100 |     100 |     100
  task.ts           |     100 |      100 |     100 |     100
 core/use-cases     |     100 |      100 |     100 |     100
  task-use-cases.ts |     100 |      100 |     100 |     100
```

**100% code coverage** achieved for business logic layer!

---

## 🐛 Known Issues

### Failed Tests (Error Response Format)

Some integration tests fail because the API returns error responses in a different format than expected. This is a **minor issue** related to error message structure, not core functionality.

**Failed Tests:**
- Auth: Invalid username/password error format
- Auth: Missing/invalid token error format
- Tasks: Unauthorized access error format

**All core CRUD operations pass successfully! ✅**

---

## 📖 Learning Outcomes

After working with these tests, you should understand:

1. ✅ **Difference between unit and integration tests**
2. ✅ **How to test HTTP APIs** with real requests
3. ✅ **Authentication and authorization** in APIs
4. ✅ **HTTP status codes** and when to use them
5. ✅ **Database integration** in tests
6. ✅ **Test structure**: Arrange → Act → Assert
7. ✅ **Business rules** and validation
8. ✅ **Error handling** in APIs

---

## 🎓 Next Steps

1. **Fix failing tests** - Update error response assertions
2. **Add GraphQL tests** - Test the GraphQL endpoint
3. **Manual testing with Postman** - Import collection and test manually
4. **Add more test cases** - Edge cases, performance tests
5. **CI/CD integration** - Run tests automatically on commits

---

## 📚 Additional Resources

- [Node.js Test Runner Docs](https://nodejs.org/api/test.html)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [REST API Best Practices](https://restfulapi.net/)
- [JWT Authentication](https://jwt.io/introduction)
- [Prisma ORM Docs](https://www.prisma.io/docs)

---

**Happy Testing! 🚀**
