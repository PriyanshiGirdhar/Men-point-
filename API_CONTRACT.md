# Clothify API Contract

Backend: NestJS, base URL `http://localhost:4000/api`. All responses are JSON. Authenticated routes expect
`Authorization: Bearer <accessToken>`. Access token lives in memory/localStorage on the frontend; refresh token
is stored as an httpOnly cookie (`refresh_token`) set by the backend.

## Auth
- `POST /auth/register` body `{ name, email, password }` -> `{ user, accessToken }` (sets refresh cookie). New users have `role: CUSTOMER`, `onboarded: false`.
- `POST /auth/login` body `{ email, password }` -> `{ user, accessToken }` (sets refresh cookie)
- `POST /auth/refresh` (reads refresh cookie) -> `{ accessToken }`
- `POST /auth/logout` -> clears refresh cookie
- `GET /auth/me` (auth) -> current `user`
- `POST /auth/onboarding` (auth) body `{ gender: MEN|WOMEN|KIDS|UNISEX, phone? }` -> marks `onboarded: true`, used for the post-signup "what do you shop for" step. Stored preference only influences default home filter client-side (no schema field needed beyond phone update); return updated `user`.

`user` shape: `{ id, name, email, phone, role, onboarded }`

## Categories
- `GET /categories` -> top-level categories with nested `children` (tree), each `{ id, name, slug, imageUrl, gender, children: [...] }`. Used for nav + onboarding + home category grid.
- `GET /categories/:slug` -> single category with children

## Products (public catalog)
- `GET /products` query params:
  - `category` (slug, includes descendants)
  - `gender` (MEN|WOMEN|KIDS|UNISEX)
  - `size` (repeatable, e.g. `size=M&size=L`)
  - `color` (repeatable)
  - `minPrice`, `maxPrice`
  - `sort` = `newest` | `price_asc` | `price_desc`
  - `q` free text search (title/brand)
  - `page` (default 1), `limit` (default 20)
  - Response: `{ items: ProductCard[], total, page, limit }`
  - `ProductCard`: `{ id, title, slug, brand, gender, basePrice, discountPrice, image, sizes: string[], colors: string[] }` (image = first ProductImage url)
- `GET /products/:slug` -> full product `{ id, title, slug, description, brand, gender, basePrice, discountPrice, category: {id,name,slug}, images: [{id,url,sortOrder}], variants: [{id,size,color,colorHex,stock,sku}] }`
- `GET /products/filters?category=slug` -> `{ sizes: string[], colors: {name,hex}[], minPrice, maxPrice }` available facets for the filter sidebar

## Cart (auth required)
- `GET /cart` -> `{ items: [{ id, variantId, quantity, variant: { id, size, color, stock, product: {id,title,slug,basePrice,discountPrice,image} } }], subtotal }`
- `POST /cart/items` body `{ variantId, quantity }` -> adds or increments -> cart
- `PATCH /cart/items/:id` body `{ quantity }` -> cart
- `DELETE /cart/items/:id` -> cart

## Addresses (auth required)
- `GET /addresses` -> `Address[]`
- `POST /addresses` body address fields -> `Address`
- `PATCH /addresses/:id` -> `Address`
- `DELETE /addresses/:id`

## Checkout / Orders (auth required)
- `POST /orders/checkout` body `{ addressId, paymentMethod: COD|CARD }` -> creates order from current cart, clears cart, decrements stock -> `Order` (full, with items). CARD is accepted but settles immediately as `paymentStatus: PAID` in this build (no live gateway wired yet); COD stays `PENDING` until delivery.
- `GET /orders` -> list of the user's orders (summary): `{ id, orderNumber, status, paymentStatus, total, createdAt, items: [{productTitle, size, color, quantity}] }`
- `GET /orders/:id` -> full order detail

## Profile / Settings (auth required)
- `PATCH /users/me` body `{ name?, phone? }` -> updated user
- `PATCH /users/me/password` body `{ currentPassword, newPassword }` -> `{ success: true }`

## Uploads (auth required, ADMIN only)
- `POST /uploads/presign` body `{ fileName, contentType }` -> `{ uploadUrl, publicUrl, key }`. Frontend PUTs the file directly to `uploadUrl` (R2 presigned URL), then uses `publicUrl` + `key` when creating/updating product images.

## Admin (auth required, ADMIN only, prefix `/admin`)
- `GET /admin/stats` -> `{ totalOrders, totalRevenue, totalUsers, totalProducts, recentOrders: OrderSummary[] }`
- `GET /admin/products?page&limit&q` -> `{ items, total, page, limit }` (all products incl. inactive)
- `POST /admin/products` body `{ title, description, brand, gender, basePrice, discountPrice, categoryId, variants: [{size,color,colorHex,sku,stock}], images: [{url,key,sortOrder}] }` -> `Product`
- `PATCH /admin/products/:id` same shape (partial) -> `Product`
- `DELETE /admin/products/:id`
- `GET /admin/categories` -> flat list for select inputs
- `POST /admin/categories` body `{ name, slug, parentId?, gender?, imageUrl? }`
- `GET /admin/orders?status&page&limit` -> `{ items, total, page, limit }`
- `PATCH /admin/orders/:id/status` body `{ status }` -> `Order`
- `GET /admin/users?page&limit&q` -> `{ items, total, page, limit }` (`User` without passwordHash)

## Conventions
- All list endpoints are paginated the same way: `{ items, total, page, limit }`.
- Errors: `{ statusCode, message, error }` (Nest default `HttpException` shape).
- Money fields are numbers (not strings) when serialized to JSON (Decimal -> Number in interceptors/DTOs).
- CORS: backend allows `http://localhost:3000` with credentials for the refresh cookie.
- Env vars backend needs: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`, `PORT` (4000).
- Env var frontend needs: `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:4000/api`).
