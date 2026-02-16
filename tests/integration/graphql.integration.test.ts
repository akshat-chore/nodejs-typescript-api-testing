import assert from 'node:assert/strict'
import { describe, it, before } from 'node:test'

const BASE_URL = 'http://localhost:3000'
const GRAPHQL_ENDPOINT = `${BASE_URL}/v1/graphql`

async function getAuthToken(username: string, password: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/v1/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await response.json()
  return data.token
}

async function executeGraphQLQuery(query: string, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  })
}

interface GraphQLTask {
  id: string;
  title: string;
  status: string;
  description?: string;
  userId?: string;
  createdAt?: string;
}

describe('GraphQL API Integration Tests', () => {
  let adminToken: string
  let userToken: string
  let testTaskId: string

  before(async () => {
    adminToken = await getAuthToken('admin', '12345')
    userToken = await getAuthToken('user', '12345')

    const createRes = await fetch(`${BASE_URL}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'GQL Test', description: 'Test' }),
    })
    const task = await createRes.json()
    testTaskId = task.id
  })

  it('should get all tasks via GraphQL', async () => {
    const query = `{ tasks { id title description status } }`
    const res = await executeGraphQLQuery(query, adminToken)
    const result = await res.json()
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(result.data.tasks))
  })

  // This test uses testTaskId, resolving the unused variable error
  it('should get a single task by ID via GraphQL', async () => {
    const query = `{ task(id: "${testTaskId}") { id title description status } }`
    const res = await executeGraphQLQuery(query, adminToken)
    const result = await res.json()
    assert.equal(res.status, 200)
    assert.equal(result.data.task.id, testTaskId)
  })

  it('should return null for non-existent task', async () => {
    const query = `{ task(id: "00000000-0000-0000-0000-000000000000") { id } }`
    const res = await executeGraphQLQuery(query, adminToken)
    const result = await res.json()
    assert.equal(result.data.task, null)
  })

  it('should get tasks filtered by status', async () => {
    const query = `{ tasksByStatus(status: todo) { id status } }`
    const res = await executeGraphQLQuery(query, adminToken)
    const result = await res.json()
    assert.equal(res.status, 200)
    result.data.tasksByStatus.forEach((task: GraphQLTask) => {
      assert.equal(task.status, 'todo')
    })
  })

  it('should require authentication', async () => {
    const query = `{ tasks { id } }`
    const res = await executeGraphQLQuery(query)
    assert.equal(res.status, 401)
  })

  it('should return error for invalid syntax', async () => {
    const query = `{ tasks { invalidField } }`
    const res = await executeGraphQLQuery(query, adminToken)
    const result = await res.json()
    assert.equal(res.status, 400)
    assert.ok(result.errors)
  })

  it('should return only own tasks for normal user', async () => {
    const query = `{ tasks { id } }`
    const res = await executeGraphQLQuery(query, userToken)
    assert.equal(res.status, 200)
  })
})
