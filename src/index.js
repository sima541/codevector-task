import express from 'express'
import { pool } from './db.js'
import dotenv from 'dotenv'
dotenv.config()

const app = express()
import { readFileSync } from 'fs'

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.send(readFileSync('./index.html'))
})
const PORT = process.env.PORT || 3000

app.get('/products', async (req, res) => {
  try {
    const { cursor, category, limit = 20 } = req.query
    const pageSize = Math.min(Number(limit), 100)

    // Decode cursor if it exists
    let cursorTs = null
    let cursorId = null
    if (cursor) {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString())
      cursorTs = decoded.ts
      cursorId = decoded.id
    }

    // Build query based on cursor + category combination
    let query, params

    if (!cursorTs && !category) {
      // First page, no filter
      query = `SELECT * FROM products ORDER BY created_at DESC, id DESC LIMIT $1`
      params = [pageSize + 1]

    } else if (!cursorTs && category) {
      // First page, with category filter
      query = `SELECT * FROM products WHERE category = $1 ORDER BY created_at DESC, id DESC LIMIT $2`
      params = [category, pageSize + 1]

    } else if (cursorTs && !category) {
      // Next page, no filter
      query = `SELECT * FROM products WHERE (created_at, id) < ($1::timestamptz, $2::uuid) ORDER BY created_at DESC, id DESC LIMIT $3`
      params = [cursorTs, cursorId, pageSize + 1]

    } else {
      // Next page, with category filter
      query = `SELECT * FROM products WHERE category = $1 AND (created_at, id) < ($2::timestamptz, $3::uuid) ORDER BY created_at DESC, id DESC LIMIT $4`
      params = [category, cursorTs, cursorId, pageSize + 1]
    }

    const { rows } = await pool.query(query, params)

    // We fetched pageSize+1 rows — if we got that extra one, there IS a next page
    const hasMore = rows.length > pageSize
    const data = rows.slice(0, pageSize)

    // Build next cursor from the last row we're returning
    let next_cursor = null
    if (hasMore) {
      const last = data[data.length - 1]
      next_cursor = Buffer.from(JSON.stringify({
        ts: last.created_at,
        id: last.id
      })).toString('base64url')
    }

    res.json({
      data,
      next_cursor,       // null means no more pages
      count: data.length
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))