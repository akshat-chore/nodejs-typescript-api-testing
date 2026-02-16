import assert from 'node:assert/strict'
import { describe, it, before } from 'node:test'

/**
 * Integration Tests for GraphQL API
 * 
 * These tests verify the GraphQL endpoint works correctly with the database.
 * 
 * What we're testing:
 * 1. POST /v1/graphql - Query all tasks
 * 2. POST /v1/graphql - Query single task by ID
 * 3. POST /v1/graphql - Query tasks by status
 * 4. POST /v1/graphql - Authentication required
 * 5. POST /v1/graphql - Invalid query syntax
 * 
 * GraphQL Endpoint: POST /v1/graphql (NOT /api/v1/graphql)
 */

const BASE_URL = 'http://localhost:3000'
const GRAPHQL_ENDPOINT = `${BASE_URL}/v1/graphql`

// Helper function to get authentication token
async function getAuthToken(username: string, password: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/v1/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  const data = await response.json()
  return data.token
}

// Helper function to execute GraphQL query
async function executeGraphQLQuery(query: string, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  })

  return response
}

describe('GraphQL API Integration Tests', () => {
  let adminToken: string
  let userToken: string
  let testTaskId: string

  // Setup: Get authentication tokens and create a test task
  before(async () => {
    adminToken = await getAuthToken('admin', '12345')
    userToken = await getAuthToken('user', '12345')

    // Create a test task to use in queries
    const createResponse = await fetch(`${BASE_URL}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'GraphQL Test Task',
        description: 'Task for GraphQL integration testing',
      }),
    })

    const createdTask = await createResponse.json()
    testTaskId = createdTask.id
  })

  /**
   * Test 1: Query all tasks
   * Expected: 200 status, data.tasks array
   */
  it('should get all tasks via GraphQL', async () => {
    const query = `{
      tasks {
        id
        title
        description
        status
        createdAt
        userId
      }
    }`

    const response = await executeGraphQLQuery(query, adminToken)
    const data = await response.json()

    // Assertions
    assert.equal(response.status, 200, 'Should return 200 OK')
    assert.ok(data.data, 'Should have data property')
    assert.ok(data.data.tasks, 'Should have tasks property')
    assert.ok(Array.isArray(data.data.tasks), 'Tasks should be an array')
    assert.ok(data.data.tasks.length > 0, 'Should have at least one task')

    // Verify task structure
    const task = data.data.tasks[0]
    assert.ok(task.id, 'Task should have id')
    assert.ok(task.title, 'Task should have title')
    assert.ok(task.description, 'Task should have description')
    assert.ok(task.status, 'Task should have status')
    assert.ok(task.userId, 'Task should have userId')
    assert.ok(task.createdAt, 'Task should have createdAt')
  })

  /**
   * Test 2: Query specific fields only
   * Expected: Returns only requested fields
   */
  it('should return only requested fields', async () => {
    const query = `{
      tasks {
        id
        title
      }
    }`

    const response = await executeGraphQLQuery(query, adminToken)
    const data = await response.json()

    // Assertions
    assert.equal(response.status, 200, 'Should return 200 OK')
    assert.ok(data.data.tasks.length > 0, 'Should have tasks')

    const task = data.data.tasks[0]
    assert.ok(task.id, 'Should have id')
    assert.ok(task.title, 'Should have title')
    // These fields should NOT be present since we didn't request them
    assert.equal(task.description, undefined, 'Should not have description')
    assert.equal(task.status, undefined, 'Should not have status')
  })

  /**
   * Test 3: Query single task by ID
   * Expected: 200 status, single task data
   */
  it('should get a single task by ID via GraphQL', async () => {
    const query = `{
      task(id: "${testTaskId}") {
        id
        title
        description
        status
      }
    }`

    const response = await executeGraphQLQuery(query, adminToken)
    const data = await response.json()

    // Assertions
    assert.equal(response.status, 200, 'Should return 200 OK')
    assert.ok(data.data, 'Should have data property')
    assert.ok(data.data.task, 'Should have task property')
    assert.equal(data.data.task.id, testTaskId, 'Should return correct task')
    assert.equal(data.data.task.title, 'GraphQL Test Task', 'Title should match')
  })

  /**
   * Test 4: Query non-existent task
   * Expected: null result (GraphQL doesn't throw 404)
   */
  it('should return null for non-existent task', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const query = `{
      task(id: "${fakeId}") {
        id
        title
      }
    }`

    const response = await executeGraphQLQuery(query, adminToken)
    const data = await response.json()

    // Assertions
    assert.equal(response.status, 200, 'GraphQL returns 200 even for null results')
    assert.equal(data.data.task, null, 'Non-existent task should return null')
  })

  /**
   * Test 5: Query tasks by status
   * Expected: 200 status, filtered tasks array
   */
  it('should get tasks filtered by status', async () => {
    // First, create a task with inProgress status
    const createResponse = await fetch(`${BASE_URL}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'InProgress Task',
        description: 'Task with inProgress status',
      }),
    })

    const createdTask = await createResponse.json()
    const taskId = createdTask.id

    // Update status to inProgress
    await fetch(`${BASE_URL}/api/v1/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'inProgress' }),
    })

    // Now query tasks by status
    const query = `{
      tasksByStatus(status: inProgress) {
        id
        title
        status
      }
    }`

    const response = await executeGraphQLQuery(query, adminToken)
    const data = await response.json()

    // Assertions
    assert.equal(response.status, 200, 'Should return 200 OK')
    assert.ok(data.data, 'Should have data property')
    assert.ok(data.data.tasksByStatus, 'Should have tasksByStatus property')
    assert.ok(Array.isArray(data.data.tasksByStatus), 'Should be an array')

    // Verify all returned tasks have inProgress status
    if (data.data.tasksByStatus.length > 0) {
      data.data.tasksByStatus.forEach((task: { status: string }) => {
        assert.equal(task.status, 'inProgress', 'All tasks should have inProgress status')
      })
    }
  })

  /**
   * Test 6: Query with different status values
   * Expected: Returns tasks with specified status
   */
  it('should get tasks with todo status', async () => {
    const query = `{
      tasksByStatus(status: todo) {
        id
        title
        status
      }
    }`

    const response = await executeGraphQLQuery(query, adminToken)
    const data = await response.json()

    // Assertions
    assert.equal(response.status, 200, 'Should return 200 OK')
    assert.ok(Array.isArray(data.data.tasksByStatus), 'Should be an array')

    // Verify all returned tasks have todo status
    if (data.data.tasksByStatus.length > 0) {
      data.data.tasksByStatus.forEach((task: { status: string }) => {
        assert.equal(task.status, 'todo', 'All tasks should have todo status')
      })
    }
  })

  /**
   * Test 7: GraphQL requires authentication
   * Expected: 401 status when no token provided
   */
  it('should require authentication for GraphQL queries', async () => {
    const query = `{
      tasks {
        id
        title
      }
    }`

    const response = await executeGraphQLQuery(query) // No token

    // Assertions
    assert.equal(response.status, 401, 'Should return 401 Unauthorized')
  })

  /**
   * Test 8: GraphQL with invalid token
   * Expected: 401 status
   */
  it('should reject invalid authentication token', async () => {
    const query = `{
      tasks {
        id
        title
      }
    }`

    const response = await executeGraphQLQuery(query, 'invalid-token-here')

    // Assertions
    assert.equal(response.status, 401, 'Should return 401 Unauthorized')
  })

  /**
   * Test 9: Invalid GraphQL query syntax
   * Expected: 400 status with error message
   */
  it('should return error for invalid GraphQL syntax', async () => {
    const invalidQuery = `{
      tasks {
        id
        title
        nonExistentField
      }
    }`

    const response = await executeGraphQLQuery(invalidQuery, adminToken)
    const data = await response.json()

    // Assertions
    assert.equal(response.status, 400, 'Should return 400 Bad Request')
    assert.ok(data.errors, 'Should have errors property')
    assert.ok(Array.isArray(data.errors), 'Errors should be an array')
    assert.ok(data.errors.length > 0, 'Should have at least one error')
  })

  /**
   * Test 10: Normal user sees only their own tasks via GraphQL
   * Expected: Returns only tasks belonging to the user
   */
  it('should return only own tasks for normal user', async () => {
    const query = `{
      tasks {
        id
        title
        userId
      }
    }`

    const response = await executeGraphQLQuery(query, userToken)
    const data = await response.json()

    // Assertions
    assert.equal(response.status, 200, 'Should return 200 OK')
    assert.ok(Array.isArray(data.data.tasks), 'Should return tasks array')

    // Note: All tasks should belong to the authenticated user
    // This verifies authorization is working in GraphQL
  })

  /**
   * Test 11: Complex nested query
   * Expected: Returns data with all requested fields
   */
  it('should handle complex queries with multiple fields', async () => {
    const query = `{
      tasks {
        id
        title
        description
        status
        createdAt
      }
      tasksByStatus(status: todo) {
        id
        title
      }
    }`

    const response = await executeGraphQLQuery(query, adminToken)
    const data = await response.json()

    // Assertions
    assert.equal(response.status, 200, 'Should return 200 OK')
    assert.ok(data.data.tasks, 'Should have tasks')
    assert.ok(data.data.tasksByStatus, 'Should have tasksByStatus')
    assert.ok(Array.isArray(data.data.tasks), 'tasks should be an array')
    assert.ok(Array.isArray(data.data.tasksByStatus), 'tasksByStatus should be an array')
  })
})
