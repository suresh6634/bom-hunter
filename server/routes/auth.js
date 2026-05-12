import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function signTokens(user) {
  const payload = { id: user.id, email: user.email, role: user.role, username: user.username }
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' })
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' })
  return { accessToken, refreshToken }
}

function setCookies(res, accessToken, refreshToken) {
  res.cookie('accessToken', accessToken, { httpOnly: true, sameSite: 'lax', maxAge: 15 * 60 * 1000 })
  res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 })
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    const { accessToken, refreshToken } = signTokens(user)
    setCookies(res, accessToken, refreshToken)
    res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role } })
  } catch (err) {
    next(err)
  }
})

router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken
    if (!token) return res.status(401).json({ error: 'No refresh token' })
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
    const user = await prisma.user.findUnique({ where: { id: payload.id } })
    if (!user) return res.status(401).json({ error: 'User not found' })
    const { accessToken, refreshToken } = signTokens(user)
    setCookies(res, accessToken, refreshToken)
    res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role } })
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('accessToken')
  res.clearCookie('refreshToken')
  res.json({ success: true })
})

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, username: true, email: true, role: true },
  })
  res.json({ user })
})

export default router
