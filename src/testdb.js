import { pool } from './db.js'

const res = await pool.query('SELECT NOW()')
console.log('Connected! Database time:', res.rows[0].now)
await pool.end()