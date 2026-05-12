import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '../lib/prisma.js'

const router = Router()

// Returns whether an admin exists — used by frontend to decide whether to show Setup screen
router.get('/status', async (req, res) => {
  const count = await prisma.user.count({ where: { role: 'ADMIN' } })
  res.json({ setupRequired: count === 0 })
})

const setupSchema = z.object({
  username: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

router.post('/', async (req, res, next) => {
  try {
    const count = await prisma.user.count({ where: { role: 'ADMIN' } })
    if (count > 0) return res.status(403).json({ error: 'Setup already completed' })

    const { username, email, password } = setupSchema.parse(req.body)
    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { username, email, passwordHash, role: 'ADMIN' },
      select: { id: true, username: true, email: true, role: true },
    })

    res.status(201).json({ user })
  } catch (err) {
    next(err)
  }
})

export default router
