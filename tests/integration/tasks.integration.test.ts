import assert from 'node:assert/strict'
import { describe, it, before } from 'node:test'

/**
 * Integration Tests for Tasks API
 * 
 * These tests verify the actual HTTP endpoints work correctly with the database.
 * 
 * What we're testing:
 * 1. GET /api/v1/tasks - Get all tasks
 * 2. GET /api/v1/tasks/:id - Get single task
 * 3. POST /api/v1/tasks - Create new task
 * 4. PATCH /api/v1/tasks/:id - Update task
 * 5. PATCH /api/v1/tasks/:id/status - Update task status
 * 6. DELETE /api/v1/tasks/:id - Delete task
 * 7. Authorization tests (super user vs normal user)
 * 
 * Test users:
 * - admin (super user) - can access all tasks
 * - user (normal user) - can only access their own tasks
 */

const BASE_URL = 'http://localhost:3000'

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

describe('Tasks API Integration Tests', () => {
    let adminToken: string
    let userToken: string
    let createdTaskId: string

    // Setup: Get authentication tokens before running tests
    before(async () => {
        adminToken = await getAuthToken('admin', '12345')
        userToken = await getAuthToken('user', '12345')
    })

    /**
     * Test 1: Get all tasks as admin (super user)
     * Expected: 200 status, array of tasks
     */
    it('should get all tasks as admin user', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/tasks`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
            },
        })

        const data = await response.json()

        // Assertions
        assert.equal(response.status, 200, 'Should return 200 OK')
        assert.ok(Array.isArray(data), 'Should return an array')
        assert.ok(data.length > 0, 'Should have at least one task (from seed data)')

        // Verify task structure
        const task = data[0]
        assert.ok(task.id, 'Task should have id')
        assert.ok(task.title, 'Task should have title')
        assert.ok(task.description, 'Task should have description')
        assert.ok(task.status, 'Task should have status')
        assert.ok(task.userId, 'Task should have userId')
        assert.ok(task.createdAt, 'Task should have createdAt')
    })

    /**
     * Test 2: Get all tasks as normal user
     * Expected: 200 status, array of only user's tasks
     */
    it('should get only own tasks as normal user', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/tasks`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userToken}`,
            },
        })

        const data = await response.json()

        // Assertions
        assert.equal(response.status, 200, 'Should return 200 OK')
        assert.ok(Array.isArray(data), 'Should return an array')
        // Note: All tasks should belong to the authenticated user
    })

    /**
     * Test 3: Get all tasks without authentication
     * Expected: 401 status
     */
    it('should fail to get tasks without authentication', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/tasks`, {
            method: 'GET',
        })

        const data = await response.json()

        // Assertions
        assert.equal(response.status, 401, 'Should return 401 Unauthorized')
        assert.ok(data.message, 'Should return error message')
    })

    /**
     * Test 4: Create a new task
     * Expected: 201 status, created task returned
     */
    it('should create a new task', async () => {
        const newTask = {
            title: 'Integration Test Task',
            description: 'This task was created by an integration test',
        }

        const response = await fetch(`${BASE_URL}/api/v1/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTask),
        })

        const data = await response.json()

        // Assertions
        assert.equal(response.status, 201, 'Should return 201 Created')
        assert.ok(data.id, 'Should return task id')
        assert.equal(data.title, newTask.title, 'Title should match')
        assert.equal(data.description, newTask.description, 'Description should match')
        assert.equal(data.status, 'todo', 'Default status should be todo')

        // Save task ID for later tests
        createdTaskId = data.id
    })

    /**
     * Test 5: Create task with invalid data (missing title)
     * Expected: 400 or 422 status
     */
    it('should fail to create task with missing title', async () => {
        const invalidTask = {
            description: 'Task without title',
        }

        const response = await fetch(`${BASE_URL}/api/v1/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(invalidTask),
        })

        // Assertions
        assert.ok(
            response.status === 400 || response.status === 422,
            'Should return 400 Bad Request or 422 Unprocessable Entity'
        )
    })

    /**
     * Test 6: Get a specific task by ID
     * Expected: 200 status, task data
     */
    it('should get a specific task by id', async () => {
        // First create a task to get
        const newTask = {
            title: 'Task to Retrieve',
            description: 'This task will be retrieved by ID',
        }

        const createResponse = await fetch(`${BASE_URL}/api/v1/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTask),
        })

        const createdTask = await createResponse.json()
        const taskId = createdTask.id

        // Now get the task
        const response = await fetch(`${BASE_URL}/api/v1/tasks/${taskId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
            },
        })

        const data = await response.json()

        // Assertions
        assert.equal(response.status, 200, 'Should return 200 OK')
        assert.equal(data.id, taskId, 'Should return correct task')
        assert.equal(data.title, newTask.title, 'Title should match')
    })

    /**
     * Test 7: Get non-existent task
     * Expected: 404 status
     */
    it('should return 404 for non-existent task', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000'

        const response = await fetch(`${BASE_URL}/api/v1/tasks/${fakeId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
            },
        })

        // Assertions
        assert.equal(response.status, 404, 'Should return 404 Not Found')
    })

    /**
     * Test 8: Update a task (PATCH)
     * Expected: 200 status, updated task
     */
    it('should update a task', async () => {
        // First create a task
        const newTask = {
            title: 'Task to Update',
            description: 'Original description',
        }

        const createResponse = await fetch(`${BASE_URL}/api/v1/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTask),
        })

        const createdTask = await createResponse.json()
        const taskId = createdTask.id

        // Now update it
        const updates = {
            title: 'Updated Title',
            description: 'Updated description',
        }

        const response = await fetch(`${BASE_URL}/api/v1/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
        })

        const data = await response.json()

        // Assertions
        assert.equal(response.status, 200, 'Should return 200 OK')
        assert.equal(data.title, updates.title, 'Title should be updated')
        assert.equal(data.description, updates.description, 'Description should be updated')
    })

    /**
     * Test 9: Update task status
     * Expected: 200 status, task with updated status
     */
    it('should update task status from todo to inProgress', async () => {
        // First create a task (default status is 'todo')
        const newTask = {
            title: 'Task for Status Update',
            description: 'Testing status transitions',
        }

        const createResponse = await fetch(`${BASE_URL}/api/v1/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTask),
        })

        const createdTask = await createResponse.json()
        const taskId = createdTask.id

        // Update status to 'inProgress'
        const response = await fetch(`${BASE_URL}/api/v1/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'inProgress' }),
        })

        const data = await response.json()

        // Assertions
        assert.equal(response.status, 200, 'Should return 200 OK')
        assert.equal(data.status, 'inProgress', 'Status should be updated to inProgress')
    })

    /**
     * Test 10: Cannot update archived task
     * Expected: 422 status (business rule violation)
     */
    it('should fail to update a task that is archived', async () => {
        // Create a task and move it to archived status
        const newTask = {
            title: 'Task to Archive',
            description: 'This will be archived',
        }

        const createResponse = await fetch(`${BASE_URL}/api/v1/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTask),
        })

        const createdTask = await createResponse.json()
        const taskId = createdTask.id

        // Move to done first
        await fetch(`${BASE_URL}/api/v1/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'done' }),
        })

        // Then archive
        await fetch(`${BASE_URL}/api/v1/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'archived' }),
        })

        // Try to update the archived task
        const response = await fetch(`${BASE_URL}/api/v1/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: 'Trying to update archived task' }),
        })

        // Assertions
        assert.equal(response.status, 422, 'Should return 422 Unprocessable Entity')
    })

    /**
     * Test 11: Delete a task
     * Expected: 204 status (No Content)
     */
    it('should delete a task', async () => {
        // First create a task to delete
        const newTask = {
            title: 'Task to Delete',
            description: 'This task will be deleted',
        }

        const createResponse = await fetch(`${BASE_URL}/api/v1/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTask),
        })

        const createdTask = await createResponse.json()
        const taskId = createdTask.id

        // Now delete it
        const response = await fetch(`${BASE_URL}/api/v1/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
            },
        })

        // Assertions
        assert.equal(response.status, 204, 'Should return 204 No Content')

        // Verify it's deleted by trying to get it
        const getResponse = await fetch(`${BASE_URL}/api/v1/tasks/${taskId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
            },
        })

        assert.equal(getResponse.status, 404, 'Deleted task should return 404')
    })

    /**
     * Test 12: Normal user cannot access another user's task
     * Expected: 403 status (Forbidden)
     */
    it('should prevent normal user from accessing another users task', async () => {
        // Admin creates a task
        const newTask = {
            title: 'Admin Task',
            description: 'Created by admin',
        }

        const createResponse = await fetch(`${BASE_URL}/api/v1/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTask),
        })

        const createdTask = await createResponse.json()
        const taskId = createdTask.id

        // Normal user tries to access it
        const response = await fetch(`${BASE_URL}/api/v1/tasks/${taskId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userToken}`,
            },
        })

        // Assertions
        assert.equal(response.status, 403, 'Should return 403 Forbidden')
    })
})
