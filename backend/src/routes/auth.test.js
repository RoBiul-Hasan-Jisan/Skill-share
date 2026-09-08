const request = require('supertest')
const express = require('express')

const mockVerifyToken = jest.fn()
const mockGetUser = jest.fn()

jest.mock('@clerk/backend', () => ({
  createClerkClient: jest.fn(() => ({
    verifyToken: mockVerifyToken,
    users: { getUser: mockGetUser },
  })),
}))

jest.mock('../prisma/client', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}))

const prisma = require('../prisma/client')
const authMiddleware = require('../middleware/auth')

describe('Auth Middleware', () => {
  let app

  beforeAll(() => {
    app = express()
    app.get('/test-protected', authMiddleware, (req, res) => {
      res.json({ userId: req.userId, clerkId: req.clerkId })
    })
  })

  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.ALLOW_DEV_AUTH
  })

  describe('without authorization header', () => {
    it('should return 401 when ALLOW_DEV_AUTH is not set', async () => {
      const res = await request(app).get('/test-protected')
      expect(res.status).toBe(401)
      expect(res.body.error).toBe('Unauthorized')
    })

    it('should return 401 when ALLOW_DEV_AUTH is false', async () => {
      process.env.ALLOW_DEV_AUTH = 'false'
      const res = await request(app).get('/test-protected')
      expect(res.status).toBe(401)
      expect(res.body.error).toBe('Unauthorized')
    })

    it('should use existing demo user when ALLOW_DEV_AUTH=true', async () => {
      process.env.ALLOW_DEV_AUTH = 'true'
      prisma.user.findUnique.mockResolvedValue({
        id: 'demo-user-id',
        clerkId: 'demo-clerk-id',
        email: 'demo@example.com',
        name: 'Demo User',
      })

      const res = await request(app).get('/test-protected')
      expect(res.status).toBe(200)
      expect(res.body.userId).toBe('demo-user-id')
      expect(res.body.clerkId).toBe('demo-clerk-id')
    })

    it('should create demo user when ALLOW_DEV_AUTH=true and no user exists', async () => {
      process.env.ALLOW_DEV_AUTH = 'true'
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockResolvedValue({
        id: 'new-demo-id',
        clerkId: 'demo-clerk-id',
        email: 'demo@example.com',
        name: 'Demo User',
      })

      const res = await request(app).get('/test-protected')
      expect(res.status).toBe(200)
      expect(res.body.userId).toBe('new-demo-id')
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          clerkId: 'demo-clerk-id',
          email: 'demo@example.com',
          name: 'Demo User',
          avatarUrl: null,
        },
      })
    })
  })

  describe('with Bearer token', () => {
    const validToken = 'clerk-jwt-test-token'

    it('should find existing user by clerkId', async () => {
      mockVerifyToken.mockResolvedValue({ sub: 'clerk-user-1' })
      prisma.user.findUnique.mockResolvedValue({
        id: 'db-user-1',
        clerkId: 'clerk-user-1',
        email: 'test@example.com',
        name: 'Test User',
      })

      const res = await request(app)
        .get('/test-protected')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(res.body.userId).toBe('db-user-1')
      expect(res.body.clerkId).toBe('clerk-user-1')
      expect(mockVerifyToken).toHaveBeenCalledWith(validToken)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: 'clerk-user-1' },
      })
    })

    it('should create user from Clerk data if clerkId not found in DB', async () => {
      mockVerifyToken.mockResolvedValue({ sub: 'clerk-new-user' })
      mockGetUser.mockResolvedValue({
        firstName: 'New',
        lastName: 'User',
        emailAddresses: [{ emailAddress: 'new@example.com' }],
        imageUrl: 'https://example.com/avatar.png',
      })
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockResolvedValue({
        id: 'db-new-id',
        clerkId: 'clerk-new-user',
        email: 'new@example.com',
        name: 'New User',
        avatarUrl: 'https://example.com/avatar.png',
      })

      const res = await request(app)
        .get('/test-protected')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(res.body.userId).toBe('db-new-id')
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          clerkId: 'clerk-new-user',
          email: 'new@example.com',
          name: 'New User',
          avatarUrl: 'https://example.com/avatar.png',
        },
      })
    })

    it('should return 401 when token verification fails', async () => {
      mockVerifyToken.mockRejectedValue(new Error('Invalid token'))

      const res = await request(app)
        .get('/test-protected')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(401)
      expect(res.body.error).toBe('Unauthorized')
    })
  })

  describe('malformed authorization header', () => {
    it('should return 401 with non-Bearer scheme', async () => {
      const res = await request(app)
        .get('/test-protected')
        .set('Authorization', 'Basic somecreds')

      expect(res.status).toBe(401)
      expect(res.body.error).toBe('Unauthorized')
    })
  })
})
