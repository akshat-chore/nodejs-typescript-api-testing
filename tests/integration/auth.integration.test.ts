import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

/**
 * Integration Tests for Authentication API
 * 
 * These tests verify the actual HTTP endpoints work correctly with the database.
 * 
 * What we're testing:
 * 1. POST /api/v1/auth - Login with valid credentials
 * 2. POST /api/v1/auth - Login with invalid credentials
 * 3. GET /api/v1/user - Get current user info (requires authentication)
 * 
 * Test users (created by seed script):
 * - Username: "admin", Password: "12345" (super user)
 * - Username: "user", Password: "12345" (normal user)
 */

const BASE_URL = 'http://localhost:3000'

describe('Authentication API Integration Tests', () => {

    /**
     * Test 1: Login with valid credentials (admin user)
     * Expected: 200 status, JWT token returned
     */
    it('should authenticate admin user with valid credentials', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'admin',
                password: '12345',
            }),
        })

        const data = await response.json()

        // Assertions
        assert.equal(response.status, 200, 'Should return 200 OK')
        assert.ok(data.token, 'Should return a token')
        assert.equal(data.type, 'bearer', 'Token type should be bearer')
    })

    /**
     * Test 2: Login with valid credentials (normal user)
     * Expected: 200 status, JWT token returned
     */
    it('should authenticate normal user with valid credentials', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'user',
                password: '12345',
            }),
        })

        const data = await response.json()

        // Assertions
        assert.equal(response.status, 200, 'Should return 200 OK')
        assert.ok(data.token, 'Should return a token')
        assert.equal(data.type, 'bearer', 'Token type should be bearer')
    })

    /**
     * Test 3: Login with invalid username
     * Expected: 404 status, error message
     */
    it('should fail authentication with invalid username', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'nonexistent',
                password: '12345',
            }),
        })

        const data = await response.json()

        // Assertions
        assert.equal(response.status, 404, 'Should return 404 Not Found')
        assert.ok(data.message, 'Should return error message')
    })

    /**
     * Test 4: Login with invalid password
     * Expected: 404 status, error message
     */
    it('should fail authentication with invalid password', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'wrongpassword',
            }),
        })

        const data = await response.json()

        // Assertions
        assert.equal(response.status, 404, 'Should return 404 Not Found')
        assert.ok(data.message, 'Should return error message')
    })

    /**
     * Test 5: Get current user info with valid token
     * Expected: 200 status, user data returned
     */
    it('should get current user info with valid authentication', async () => {
        // First, login to get a fresh token
        const loginResponse = await fetch(`${BASE_URL}/api/v1/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'admin',
                password: '12345',
            }),
        })

        const loginData = await loginResponse.json()
        const token = loginData.token

        // Now get user info
        const response = await fetch(`${BASE_URL}/api/v1/user`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })

        const data = await response.json()

        // Assertions
        assert.equal(response.status, 200, 'Should return 200 OK')
        assert.ok(data.id, 'Should return user id')
        assert.ok(data.name, 'Should return user name')
    })

    /**
     * Test 6: Get current user info without authentication
     * Expected: 401 status, error message
     */
    it('should fail to get user info without authentication', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/user`, {
            method: 'GET',
        })

        const data = await response.json()

        // Assertions
        assert.equal(response.status, 401, 'Should return 401 Unauthorized')
        assert.ok(data.message, 'Should return error message')
    })

    /**
     * Test 7: Get current user info with invalid token
     * Expected: 401 status, error message
     */
    it('should fail to get user info with invalid token', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/user`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer invalid_token_here',
            },
        })

        const data = await response.json()

        // Assertions
        assert.equal(response.status, 401, 'Should return 401 Unauthorized')
        assert.ok(data.message, 'Should return error message')
    })
})
