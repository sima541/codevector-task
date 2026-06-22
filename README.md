# CodeVector Take-Home Task

A backend API to browse 200,000 products with fast, stable cursor-based pagination.

## Live URL
https://codevector-task-jtfe.onrender.com

---

## API Endpoints

### Get products
GET /products

### Query parameters
| Parameter  | Type   | Description                              |
|------------|--------|------------------------------------------|
| cursor     | string | Cursor from previous response (optional) |
| category   | string | Filter by category (optional)            |
| limit      | number | Products per page, max 100 (default 20)  |

### Example requests
# First page
GET /products

# Filter by category
GET /products?category=Electronics

# Next page
GET /products?cursor=eyJ0cyI6...

# Custom page size
GET /products?limit=50&category=Books

### Example response
{
  "data": [
    {
      "id": "221a049e-...",
      "name": "Product 197161",
      "category": "Toys",
      "price": "483.35",
      "created_at": "2026-06-22T07:28:09.937Z",
      "updated_at": "2026-06-22T07:28:09.937Z"
    }
  ],
  "next_cursor": "eyJ0cyI6IjIwMjYt...",
  "count": 20
}

---

## Tech Stack
- Node.js + Express
- PostgreSQL (Neon free tier)
- Hosted on Render (free tier)

---

## Why cursor pagination?

Offset pagination (`LIMIT 20 OFFSET 400`) breaks when new rows are
inserted while someone is browsing — the page shifts, causing
duplicates or skipped items.

Cursor pagination anchors each page to the last item seen using
`(created_at, id)`. If 50 new products are inserted at the top,
your position is completely unaffected.

### The SQL query
```sql
SELECT * FROM products
WHERE (created_at, id) < ($cursor_time, $cursor_id)
ORDER BY created_at DESC, id DESC
LIMIT 20
```

---

## Database indexes

Two composite indexes make queries fast at 200,000 rows:

```sql
-- For unfiltered pagination
CREATE INDEX idx_cursor ON products (created_at DESC, id DESC);

-- For category filter + pagination
CREATE INDEX idx_cat_cursor ON products (category, created_at DESC, id DESC);
```

Without indexes, every request scans all 200k rows.
With indexes, the WHERE clause is O(log n) — jumps directly to
the right position like a bookmark.

---

## Seed script

Generates 200,000 products in batches of 5,000 (not one by one).
Takes ~15 seconds total.

```bash
npm run seed
```

---

## Run locally

```bash
# Clone the repo
git clone https://github.com/sima541/codevector-task.git
cd codevector-task

# Install dependencies
npm install

# Add your database URL
echo "DATABASE_URL=your_neon_connection_string" > .env

# Seed the database
npm run seed

# Start the server
npm start
```

---

## What I'd improve with more time
- Cursor signing — currently plain base64, a user could tamper with it
- Rate limiting on the API
- Search by product name (`AND name ILIKE $search`)
- Database migrations with a proper tool like Flyway
- Unit tests for the pagination logic

---

## Categories
Electronics, Clothing, Books, Home, Sports, Toys, Food
