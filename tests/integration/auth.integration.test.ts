import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

/**
 * Integration Tests for Authentication API
 */

const BASE_URL = 'http://localhost:3000'

describe('Authentication API Integration Tests', () => {
    /**
     * Test 1: Login with valid credentials (admin user)
     */
    it('should authenticate admin user with valid credentials', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: '12345' }),
        })

        const data = await response.json()
        assert.equal(response.status, 200)
        assert.ok(data.token)
    })

    /**
     * Test 2: Login with valid credentials (normal user)
     */
    it('should authenticate normal user with valid credentials', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'user', password: '12345' }),
        })

        const data = await response.json()
        assert.equal(response.status, 200)
        assert.ok(data.token)
    })

    it('should fail authentication with invalid username', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'nonexistent', password: '12345' }),
        })
        assert.equal(response.status, 404)
    })

    it('should fail authentication with invalid password', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'wrong' }),
        })
        assert.equal(response.status, 404)
    })

    it('should get current user info with valid authentication', async () => {
        const loginRes = await fetch(`${BASE_URL}/api/v1/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: '12345' }),
        })
        const loginData = await loginRes.json()

        const response = await fetch(`${BASE_URL}/api/v1/user`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${loginData.token}` },
        })
        const data = await response.json()
        assert.equal(response.status, 200)
        assert.ok(data.id)
    })

    it('should fail to get user info without authentication', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/user`, { method: 'GET' })
        assert.equal(response.status, 401)
    })

    it('should fail to get user info with invalid token', async () => {
        const response = await fetch(`${BASE_URL}/api/v1/user`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer invalid' },
        })
        assert.equal(response.status, 401)
    })
})
