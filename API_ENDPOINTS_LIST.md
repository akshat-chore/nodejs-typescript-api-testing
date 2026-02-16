# 📋 Complete API Endpoints List

## Base URL
```
http://localhost:3000
```

---

## 🔐 Authentication Required
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📑 Table of Contents
1. [Health & Info Endpoints](#health--info-endpoints) (2 endpoints)
2. [Authentication Endpoints](#authentication-endpoints) (2 endpoints)
3. [Tasks REST API Endpoints](#tasks-rest-api-endpoints) (6 endpoints)
4. [GraphQL Endpoint](#graphql-endpoint) (1 endpoint)

**Total: 11 API Endpoints**

---

## 1. Health & Info Endpoints

### 1.1 Root Endpoint
```http
GET /
```
**Description**: Base endpoint to check if API is running

**Authentication**: ❌ Not required

**Response**: `200 OK`
```json
{
  "message": "Task Service API"
}
```

---

### 1.2 Health Check
```http
GET /health
```
**Description**: Health check endpoint for monitoring/container orchestration

**Authentication**: ❌ Not required

**Response**: `200 OK`
```json
{
  "status": "healthy"
}
```

---

## 2. Authentication Endpoints

### 2.1 Login / Authenticate User
```http
POST /api/v1/auth
```
**Description**: Authenticate user with credentials and get JWT token

**Authentication**: ❌ Not required

**Request Body**:
```json
{
  "username": "admin",
  "password": "12345"
}
```

**Response**: `200 OK`
```json
{
  "type": "bearer",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- `404 Not Found` - Invalid username or password

**Test Credentials**:
```
Super User:
  username: admin
  password: 12345

Normal User:
  username: user
  password: 12345
```

---

### 2.2 Get Current User Info
```http
GET /api/v1/user
```
**Description**: Get information about the currently authenticated user

**Authentication**: ✅ Required

**Headers**:
```
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "id": "uuid-here",
  "name": "John Doe"
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token

---

## 3. Tasks REST API Endpoints

### 3.1 Get All Tasks
```http
GET /api/v1/tasks
```
**Description**: Get all tasks for the authenticated user
- **Super users**: See all tasks from all users
- **Normal users**: See only their own tasks

**Authentication**: ✅ Required

**Headers**:
```
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
[
  {
    "id": "uuid-1",
    "title": "Complete project documentation",
    "description": "Write comprehensive API docs",
    "status": "inProgress",
    "userId": "user-uuid",
    "createdAt": "2024-04-07T10:30:00.000Z"
  },
  {
    "id": "uuid-2",
    "title": "Review pull requests",
    "description": "Check team's code submissions",
    "status": "todo",
    "userId": "user-uuid",
    "createdAt": "2024-04-07T11:00:00.000Z"
  }
]
```

**Task Status Values**:
- `todo` - Task is pending
- `inProgress` - Task is being worked on
- `done` - Task is completed
- `archived` - Task is archived (final state)

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token

---

### 3.2 Get Single Task by ID
```http
GET /api/v1/tasks/:id
```
**Description**: Get a specific task by its ID
- **Super users**: Can access any task
- **Normal users**: Can only access their own tasks

**Authentication**: ✅ Required

**Headers**:
```
Authorization: Bearer <token>
```

**URL Parameters**:
- `id` (string, required) - UUID of the task

**Example**:
```
GET /api/v1/tasks/123e4567-e89b-12d3-a456-426614174000
```

**Response**: `200 OK`
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Complete project documentation",
  "description": "Write comprehensive API docs",
  "status": "inProgress",
  "userId": "user-uuid",
  "createdAt": "2024-04-07T10:30:00.000Z"
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User doesn't have permission to access this task
- `404 Not Found` - Task with given ID doesn't exist

---

### 3.3 Create New Task
```http
POST /api/v1/tasks
```
**Description**: Create a new task for the authenticated user

**Authentication**: ✅ Required

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "New task title",
  "description": "Task description here"
}
```

**Field Requirements**:
- `title` (string, required) - Task title
- `description` (string, required) - Task description

**Response**: `201 Created`
```json
{
  "id": "new-uuid",
  "title": "New task title",
  "description": "Task description here",
  "status": "todo",
  "userId": "user-uuid",
  "createdAt": "2024-04-07T12:00:00.000Z"
}
```

**Note**: New tasks are automatically created with status `todo`

**Error Responses**:
- `400 Bad Request` - Invalid request format
- `401 Unauthorized` - Missing or invalid token
- `422 Unprocessable Entity` - Validation failed (missing required fields)

---

### 3.4 Update Task (Title/Description)
```http
PATCH /api/v1/tasks/:id
```
**Description**: Update task title and/or description
- **Super users**: Can update any task
- **Normal users**: Can only update their own tasks
- **Cannot update archived tasks**

**Authentication**: ✅ Required

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters**:
- `id` (string, required) - UUID of the task

**Request Body** (partial update supported):
```json
{
  "title": "Updated title",
  "description": "Updated description"
}
```

**Example**:
```
PATCH /api/v1/tasks/123e4567-e89b-12d3-a456-426614174000
```

**Response**: `200 OK`
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Updated title",
  "description": "Updated description",
  "status": "inProgress",
  "userId": "user-uuid",
  "createdAt": "2024-04-07T10:30:00.000Z"
}
```

**Error Responses**:
- `400 Bad Request` - Invalid request format
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User doesn't have permission to update this task
- `404 Not Found` - Task doesn't exist
- `422 Unprocessable Entity` - Cannot update archived task

---

### 3.5 Update Task Status
```http
PATCH /api/v1/tasks/:id/status
```
**Description**: Change the status of a task
- **Super users**: Can update any task status
- **Normal users**: Can only update their own task status
- **Status transitions**: `todo` → `inProgress` → `done` → `archived`
- **Once archived, cannot be changed**

**Authentication**: ✅ Required

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters**:
- `id` (string, required) - UUID of the task

**Request Body**:
```json
{
  "status": "inProgress"
}
```

**Valid Status Values**:
- `todo`
- `inProgress`
- `done`
- `archived`

**Example**:
```
PATCH /api/v1/tasks/123e4567-e89b-12d3-a456-426614174000/status
```

**Response**: `200 OK`
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Complete project documentation",
  "description": "Write comprehensive API docs",
  "status": "done",
  "userId": "user-uuid",
  "createdAt": "2024-04-07T10:30:00.000Z"
}
```

**Business Rules**:
- ✅ Can move task to any status (except from archived)
- ❌ Cannot change status once task is archived

**Error Responses**:
- `400 Bad Request` - Invalid request format
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User doesn't have permission to update this task
- `404 Not Found` - Task doesn't exist
- `422 Unprocessable Entity` - Cannot move task from archived status

---

### 3.6 Delete Task
```http
DELETE /api/v1/tasks/:id
```
**Description**: Permanently delete a task (hard delete)
- **Super users**: Can delete any task
- **Normal users**: Can only delete their own tasks
- **Warning**: Data will be permanently lost

**Authentication**: ✅ Required

**Headers**:
```
Authorization: Bearer <token>
```

**URL Parameters**:
- `id` (string, required) - UUID of the task

**Example**:
```
DELETE /api/v1/tasks/123e4567-e89b-12d3-a456-426614174000
```

**Response**: `204 No Content`
(Empty response body)

**Error Responses**:
- `400 Bad Request` - Invalid task ID format
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User doesn't have permission to delete this task
- `404 Not Found` - Task doesn't exist

---

## 4. GraphQL Endpoint

### 4.1 GraphQL Query
```http
POST /api/v1/graphql
```
**Description**: Query tasks using GraphQL (Apollo Server)

**Authentication**: ✅ Required

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body** (GraphQL Query):
```json
{
  "query": "{ tasks { id title description status createdAt } }"
}
```

**Available Queries**:

#### Get All Tasks
```graphql
{
  tasks {
    id
    title
    description
    status
    createdAt
    userId
  }
}
```

#### Get Single Task by ID
```graphql
{
  task(id: "uuid-here") {
    id
    title
    description
    status
    createdAt
    userId
  }
}
```

#### Get Tasks by Status
```graphql
{
  tasksByStatus(status: "inProgress") {
    id
    title
    description
    status
    createdAt
  }
}
```

**Response**: `200 OK`
```json
{
  "data": {
    "tasks": [
      {
        "id": "uuid-1",
        "title": "Task 1",
        "description": "Description 1",
        "status": "todo",
        "createdAt": "2024-04-07T10:30:00.000Z",
        "userId": "user-uuid"
      }
    ]
  }
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `400 Bad Request` - Invalid GraphQL query syntax

---

## 📊 Summary Table

| # | Method | Endpoint | Auth Required | Description |
|---|--------|----------|---------------|-------------|
| 1 | GET | `/` | ❌ | Root endpoint |
| 2 | GET | `/health` | ❌ | Health check |
| 3 | POST | `/api/v1/auth` | ❌ | Login / Get JWT token |
| 4 | GET | `/api/v1/user` | ✅ | Get current user info |
| 5 | GET | `/api/v1/tasks` | ✅ | Get all tasks |
| 6 | GET | `/api/v1/tasks/:id` | ✅ | Get single task |
| 7 | POST | `/api/v1/tasks` | ✅ | Create new task |
| 8 | PATCH | `/api/v1/tasks/:id` | ✅ | Update task (title/description) |
| 9 | PATCH | `/api/v1/tasks/:id/status` | ✅ | Update task status |
| 10 | DELETE | `/api/v1/tasks/:id` | ✅ | Delete task |
| 11 | POST | `/api/v1/graphql` | ✅ | GraphQL queries |

**Total: 11 Endpoints**

---

## 🔑 Authentication Flow

```
1. Login to get token:
   POST /api/v1/auth
   Body: { "username": "admin", "password": "12345" }
   
2. Save the token from response:
   { "type": "bearer", "token": "eyJhbGc..." }
   
3. Use token in subsequent requests:
   Authorization: Bearer eyJhbGc...
```

---

## 👥 User Types & Permissions

| User Type | Username | Password | Can Access | Cannot Access |
|-----------|----------|----------|------------|---------------|
| **Super User** | `admin` | `12345` | All tasks from all users | - |
| **Normal User** | `user` | `12345` | Only their own tasks | Other users' tasks (403) |

---

## 📝 Task Status Lifecycle

```
┌──────┐    ┌────────────┐    ┌──────┐    ┌──────────┐
│ todo │ -> │ inProgress │ -> │ done │ -> │ archived │
└──────┘    └────────────┘    └──────┘    └──────────┘
   ✅             ✅              ✅             ❌
(can edit)    (can edit)     (can edit)   (CANNOT edit)
```

**Business Rules**:
- New tasks start as `todo`
- Can transition to any status
- Once `archived`, cannot be modified or moved

---

## 🧪 Testing with cURL

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"12345"}'
```

### Get All Tasks
```bash
curl -X GET http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Task
```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Task","description":"Task description"}'
```

### Update Task Status
```bash
curl -X PATCH http://localhost:3000/api/v1/tasks/TASK_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}'
```

### Delete Task
```bash
curl -X DELETE http://localhost:3000/api/v1/tasks/TASK_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📦 Postman Collection

Import the pre-built Postman collection:
```
docs/Tasks.postman_collection.json
```

This collection includes all endpoints with example requests!

---

**Happy Testing! 🚀**
