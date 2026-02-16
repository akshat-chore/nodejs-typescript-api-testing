# 🧪 Manual API Testing Guide with Postman

## 📋 Prerequisites

✅ Server is running on `http://localhost:3000`
✅ Database is seeded with test users
✅ Postman is installed

---

## 🎯 Testing Workflow

We'll test the APIs in this order:
1. **Health Check** - Verify server is running
2. **Authentication** - Get JWT tokens
3. **Tasks CRUD** - Create, Read, Update, Delete tasks
4. **Authorization** - Test user permissions
5. **GraphQL** - Test GraphQL endpoint

---

## Step 1: Health Check (No Auth Required)

### Test 1.1: Root Endpoint

**Request:**
```
GET http://localhost:3000/
```

**Expected Response:** `200 OK`
```json
{
  "message": "Task Service API"
}
```

**In Postman:**
1. Create new request
2. Method: `GET`
3. URL: `http://localhost:3000/`
4. Click **Send**
5. ✅ Verify status is `200 OK`

---

### Test 1.2: Health Endpoint

**Request:**
```
GET http://localhost:3000/health
```

**Expected Response:** `200 OK`
```json
{
  "status": "healthy"
}
```

**In Postman:**
1. Method: `GET`
2. URL: `http://localhost:3000/health`
3. Click **Send**
4. ✅ Verify status is `200 OK`

---

## Step 2: Authentication

### Test 2.1: Login as Admin (Super User)

**Request:**
```
POST http://localhost:3000/api/v1/auth
Content-Type: application/json

{
  "username": "admin",
  "password": "12345"
}
```

**In Postman:**
1. Method: `POST`
2. URL: `http://localhost:3000/api/v1/auth`
3. Go to **Body** tab
4. Select **raw** and **JSON**
5. Enter:
```json
{
  "username": "admin",
  "password": "12345"
}
```
6. Click **Send**

**Expected Response:** `200 OK`
```json
{
  "type": "bearer",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiY..."
}
```

**✅ IMPORTANT: Copy the token value!** You'll need it for subsequent requests.

**Save the token:**
1. Copy the `token` value from response
2. In Postman, go to **Collections** → **Tasks** → **Variables** tab
3. Create variable: `adminToken` = `<paste token here>`

---

### Test 2.2: Login as Normal User

**Request:**
```
POST http://localhost:3000/api/v1/auth
Content-Type: application/json

{
  "username": "user",
  "password": "12345"
}
```

**In Postman:**
1. Same as above, but use `"username": "user"`
2. Copy the token from response
3. Save as `userToken` variable

**Expected Response:** `200 OK` with token

---

### Test 2.3: Login with Invalid Credentials (Negative Test)

**Request:**
```
POST http://localhost:3000/api/v1/auth
Content-Type: application/json

{
  "username": "invalid",
  "password": "wrong"
}
```

**Expected Response:** `404 Not Found`
```json
{
  "message": "User not found or invalid credentials"
}
```

**✅ This should FAIL** - That's expected! It's a negative test.

---

### Test 2.4: Get Current User Info

**Request:**
```
GET http://localhost:3000/api/v1/user
Authorization: Bearer <adminToken>
```

**In Postman:**
1. Method: `GET`
2. URL: `http://localhost:3000/api/v1/user`
3. Go to **Authorization** tab
4. Type: `Bearer Token`
5. Token: `{{adminToken}}` (use variable)
6. Click **Send**

**Expected Response:** `200 OK`
```json
{
  "id": "uuid-here",
  "name": "Admin User Name"
}
```

---

## Step 3: Tasks CRUD Operations

### Test 3.1: Get All Tasks (as Admin)

**Request:**
```
GET http://localhost:3000/api/v1/tasks
Authorization: Bearer <adminToken>
```

**In Postman:**
1. Method: `GET`
2. URL: `http://localhost:3000/api/v1/tasks`
3. Authorization: Bearer Token → `{{adminToken}}`
4. Click **Send**

**Expected Response:** `200 OK`
```json
[
  {
    "id": "uuid-1",
    "title": "Task title",
    "description": "Task description",
    "status": "todo",
    "userId": "user-id",
    "createdAt": "2024-04-07T10:30:00.000Z"
  },
  ...more tasks
]
```

**✅ Verify:**
- Status is `200 OK`
- Response is an array
- Each task has: `id`, `title`, `description`, `status`, `userId`, `createdAt`
- Admin sees tasks from multiple users

---

### Test 3.2: Get All Tasks (as Normal User)

**Request:**
```
GET http://localhost:3000/api/v1/tasks
Authorization: Bearer <userToken>
```

**In Postman:**
1. Same as above, but use `{{userToken}}`

**Expected Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "title": "User's task",
    "userId": "user-id",
    ...
  }
]
```

**✅ Verify:**
- Normal user only sees their own tasks
- All tasks have the same `userId`

---

### Test 3.3: Create a New Task

**Request:**
```
POST http://localhost:3000/api/v1/tasks
Authorization: Bearer <adminToken>
Content-Type: application/json

{
  "title": "My Manual Test Task",
  "description": "This task was created via Postman manual testing"
}
```

**In Postman:**
1. Method: `POST`
2. URL: `http://localhost:3000/api/v1/tasks`
3. Authorization: Bearer Token → `{{adminToken}}`
4. Body → raw → JSON:
```json
{
  "title": "My Manual Test Task",
  "description": "This task was created via Postman manual testing"
}
```
5. Click **Send**

**Expected Response:** `201 Created`
```json
{
  "id": "new-uuid",
  "title": "My Manual Test Task",
  "description": "This task was created via Postman manual testing",
  "status": "todo",
  "userId": "admin-user-id",
  "createdAt": "2024-04-07T12:00:00.000Z"
}
```

**✅ Verify:**
- Status is `201 Created`
- Default status is `todo`
- Task has an `id`
- **Copy the task ID** for next tests!

---

### Test 3.4: Get Single Task by ID

**Request:**
```
GET http://localhost:3000/api/v1/tasks/<task-id>
Authorization: Bearer <adminToken>
```

**In Postman:**
1. Method: `GET`
2. URL: `http://localhost:3000/api/v1/tasks/<paste-task-id-here>`
3. Authorization: Bearer Token → `{{adminToken}}`
4. Click **Send**

**Expected Response:** `200 OK`
```json
{
  "id": "task-id",
  "title": "My Manual Test Task",
  "description": "This task was created via Postman manual testing",
  "status": "todo",
  ...
}
```

---

### Test 3.5: Update Task (Title & Description)

**Request:**
```
PATCH http://localhost:3000/api/v1/tasks/<task-id>
Authorization: Bearer <adminToken>
Content-Type: application/json

{
  "title": "Updated Task Title",
  "description": "Updated description via Postman"
}
```

**In Postman:**
1. Method: `PATCH`
2. URL: `http://localhost:3000/api/v1/tasks/<task-id>`
3. Authorization: Bearer Token → `{{adminToken}}`
4. Body → raw → JSON:
```json
{
  "title": "Updated Task Title",
  "description": "Updated description via Postman"
}
```
5. Click **Send**

**Expected Response:** `200 OK`
```json
{
  "id": "task-id",
  "title": "Updated Task Title",
  "description": "Updated description via Postman",
  "status": "todo",
  ...
}
```

**✅ Verify:**
- Title and description are updated
- Status remains unchanged

---

### Test 3.6: Update Task Status (todo → inProgress)

**Request:**
```
PATCH http://localhost:3000/api/v1/tasks/<task-id>/status
Authorization: Bearer <adminToken>
Content-Type: application/json

{
  "status": "inProgress"
}
```

**In Postman:**
1. Method: `PATCH`
2. URL: `http://localhost:3000/api/v1/tasks/<task-id>/status`
3. Authorization: Bearer Token → `{{adminToken}}`
4. Body → raw → JSON:
```json
{
  "status": "inProgress"
}
```
5. Click **Send**

**Expected Response:** `200 OK`
```json
{
  "id": "task-id",
  "title": "Updated Task Title",
  "status": "inProgress",
  ...
}
```

**✅ Verify:** Status changed to `inProgress`

---

### Test 3.7: Test Status Transitions

Test the full lifecycle:

**Step 1:** `todo` → `inProgress` ✅
```json
{ "status": "inProgress" }
```

**Step 2:** `inProgress` → `done` ✅
```json
{ "status": "done" }
```

**Step 3:** `done` → `archived` ✅
```json
{ "status": "archived" }
```

**Step 4:** Try to update archived task ❌ (Should fail with 422)
```
PATCH /api/v1/tasks/<task-id>
Body: { "title": "Trying to update archived task" }
```

**Expected:** `422 Unprocessable Entity`
```json
{
  "message": "It is not possible to change the information on a Task on 'Archived' status."
}
```

---

### Test 3.8: Delete a Task

**Request:**
```
DELETE http://localhost:3000/api/v1/tasks/<task-id>
Authorization: Bearer <adminToken>
```

**In Postman:**
1. Method: `DELETE`
2. URL: `http://localhost:3000/api/v1/tasks/<task-id>`
3. Authorization: Bearer Token → `{{adminToken}}`
4. Click **Send**

**Expected Response:** `204 No Content`
(Empty response body)

**✅ Verify:**
- Status is `204 No Content`
- Try to GET the same task → should return `404 Not Found`

---

## Step 4: Authorization Tests

### Test 4.1: Normal User Cannot Access Another User's Task

**Setup:**
1. Login as admin, create a task (save task ID)
2. Login as normal user, try to access admin's task

**Request:**
```
GET http://localhost:3000/api/v1/tasks/<admin-task-id>
Authorization: Bearer <userToken>
```

**Expected Response:** `403 Forbidden`
```json
{
  "message": "You do not have permission to see this task."
}
```

**✅ This should FAIL** - Normal users can't access other users' tasks!

---

### Test 4.2: Normal User Cannot Update Another User's Task

**Request:**
```
PATCH http://localhost:3000/api/v1/tasks/<admin-task-id>
Authorization: Bearer <userToken>
Content-Type: application/json

{
  "title": "Trying to hack admin's task"
}
```

**Expected Response:** `403 Forbidden`

---

### Test 4.3: Unauthorized Access (No Token)

**Request:**
```
GET http://localhost:3000/api/v1/tasks
```
(No Authorization header)

**Expected Response:** `401 Unauthorized`
```json
{
  "message": "Authentication required."
}
```

---

## Step 5: GraphQL Testing

### Test 5.1: Get All Tasks via GraphQL

**Request:**
```
POST http://localhost:3000/api/v1/graphql
Authorization: Bearer <adminToken>
Content-Type: application/json

{
  "query": "{ tasks { id title description status createdAt } }"
}
```

**In Postman:**
1. Method: `POST`
2. URL: `http://localhost:3000/v1/graphql`
3. Authorization: Bearer Token → `{{adminToken}}`
4. Body → raw → JSON:
```json
{
  "query": "{ tasks { id title description status createdAt } }"
}
```
5. Click **Send**

**Expected Response:** `200 OK`
```json
{
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "title": "Task title",
        "description": "Description",
        "status": "todo",
        "createdAt": "2024-04-07T10:30:00.000Z"
      },
      ...
    ]
  }
}
```

---

### Test 5.2: Get Single Task via GraphQL

**Request:**
```json
{
  "query": "{ task(id: \"<task-id>\") { id title description status } }"
}
```

---

### Test 5.3: Get Tasks by Status via GraphQL

**Request:**
```json
{
  "query": "{ tasksByStatus(status: inProgress) { id title status } }"
}
```

---

## 📊 Testing Checklist

Use this checklist to track your manual testing:

### Health & Info
- [ ] GET `/` - Root endpoint
- [ ] GET `/health` - Health check

### Authentication
- [ ] POST `/api/v1/auth` - Login as admin
- [ ] POST `/api/v1/auth` - Login as user
- [ ] POST `/api/v1/auth` - Invalid credentials (negative test)
- [ ] GET `/api/v1/user` - Get current user info

### Tasks CRUD
- [ ] GET `/api/v1/tasks` - Get all tasks (admin)
- [ ] GET `/api/v1/tasks` - Get all tasks (user)
- [ ] POST `/api/v1/tasks` - Create new task
- [ ] GET `/api/v1/tasks/:id` - Get single task
- [ ] PATCH `/api/v1/tasks/:id` - Update task
- [ ] PATCH `/api/v1/tasks/:id/status` - Update status
- [ ] DELETE `/api/v1/tasks/:id` - Delete task

### Authorization
- [ ] Normal user cannot access other user's task (403)
- [ ] Normal user cannot update other user's task (403)
- [ ] No token returns 401

### Business Rules
- [ ] New tasks default to `todo` status
- [ ] Cannot update archived tasks (422)
- [ ] Cannot change status from archived (422)

### GraphQL
- [ ] Query all tasks
- [ ] Query single task by ID
- [ ] Query tasks by status

---

## 🎯 Expected Results Summary

| Test Type | Total Tests | Expected Pass | Expected Fail |
|-----------|-------------|---------------|---------------|
| Health | 2 | 2 | 0 |
| Auth | 4 | 3 | 1 (invalid creds) |
| Tasks CRUD | 7 | 7 | 0 |
| Authorization | 3 | 0 | 3 (should fail) |
| Business Rules | 3 | 1 | 2 (should fail) |
| GraphQL | 3 | 3 | 0 |
| **TOTAL** | **22** | **16** | **6** |

**Note:** The "Expected Fail" tests are **negative tests** - they should fail to verify error handling works correctly!

---

## 💡 Tips for Manual Testing

1. **Use Postman Collections** - Organize requests by feature
2. **Use Environment Variables** - Store tokens, base URL
3. **Save Responses** - Use as examples for documentation
4. **Test Edge Cases** - Invalid data, missing fields, wrong IDs
5. **Check Response Times** - Note slow endpoints
6. **Verify Data in Database** - Use pgAdmin or psql to check actual data
7. **Test Different Users** - Admin vs normal user permissions
8. **Document Bugs** - Screenshot errors, save request/response

---

## 🐛 Common Issues & Solutions

### Issue: 401 Unauthorized
**Solution:** Check if token is expired or invalid. Re-login to get new token.

### Issue: 403 Forbidden
**Solution:** User doesn't have permission. Use admin token or correct user.

### Issue: 404 Not Found
**Solution:** Check if resource exists. Verify task ID is correct.

### Issue: 422 Unprocessable Entity
**Solution:** Check request body validation. Ensure required fields are present.

### Issue: Server not responding
**Solution:** Check if `yarn start` is running. Verify port 3000 is not blocked.

---

**Happy Manual Testing! 🚀**

Remember: Manual testing helps you understand the API behavior and catch issues that automated tests might miss!
