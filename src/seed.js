import { pool } from './db.js'

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Toys', 'Food']
const TOTAL = 200_000
const BATCH = 5_000

console.log('Starting seed...')

for (let i = 0; i < TOTAL; i += BATCH) {
  const values = []
  const params = []
  let paramIndex = 1

  for (let j = 0; j < BATCH; j++) {
    const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
    const price = (Math.random() * 999 + 1).toFixed(2)
    const daysAgo = Math.random() * 365
    const date = new Date(Date.now() - daysAgo * 86400000).toISOString()

    values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`)
    params.push(`Product ${i + j + 1}`, cat, price, date, date)
  }

  await pool.query(
    `INSERT INTO products (name, category, price, created_at, updated_at) VALUES ${values.join(',')}`,
    params
  )

  console.log(`✅ Inserted ${i + BATCH} / ${TOTAL}`)
}

await pool.end()
console.log('🎉 Seeding complete! 200,000 products inserted.')