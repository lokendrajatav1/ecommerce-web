# eCommerce Platform

⚠️ **Current Status:** Development Complete - Production Hardening Required  
✅ **Core Features:** 100% Complete  
🔒 **Security:** Needs Production Configuration  
📊 **Production Ready:** 85%

---

A single-vendor eCommerce application built with Next.js 14+, TypeScript, Prisma, and PostgreSQL.

## 🚀 Quick Links

- 📋 [Production Checklist](./PRODUCTION_CHECKLIST.md) - Complete guide to production readiness
- 🚢 [Deployment Guide](./DEPLOYMENT.md) - Step-by-step deployment instructions
- 📊 [Project Status](./PROJECT_STATUS.md) - Detailed project status report
- 🔒 Run Security Audit: `npm run security:audit`

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Custom JWT (no NextAuth)
- **Password Hashing**: bcrypt
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ecommerce
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce"
JWT_SECRET="your-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-in-production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. Run Prisma migrations:
```bash
npx prisma migrate dev --name init
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### Customer Features
- User registration and login with JWT authentication
- Product browsing and filtering by category
- Shopping cart with persistent storage
- Checkout process
- Order management and tracking
- Secure authentication with HTTP-only cookies

### Admin Features
- Product management (create, read, update, delete)
- Category management
- Order management with status tracking
- Dashboard with statistics
- Role-based access control

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Products
- `GET /api/products` - List products (public)
- `GET /api/products/[id]` - Get product details (public)
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/[id]` - Update product (admin only)
- `DELETE /api/products/[id]` - Delete product (admin only)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add to cart
- `PUT /api/cart/items` - Update cart item quantity

### Orders
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create order from cart
- `GET /api/orders/[id]` - Get order details
- `PUT /api/orders/[id]` - Update order status (admin only)

### Admin
- `GET /api/admin/categories` - List categories (admin only)
- `POST /api/admin/categories` - Create category (admin only)

## Database Schema

The application uses the following main entities:

- **User** - Registered users with roles (ADMIN, CUSTOMER)
- **RefreshToken** - Hashed refresh tokens for secure authentication
- **Category** - Product categories
- **Product** - Store products with pricing and stock
- **ProductImage** - Product images
- **Cart** - Shopping carts (one per user)
- **CartItem** - Items in cart
- **Order** - Customer orders
- **OrderItem** - Items in orders (with locked prices)

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt with salt rounds of 12
- **JWT Tokens**: 
  - Access tokens expire in 15 minutes
  - Refresh tokens expire in 7 days
  - Refresh tokens are hashed before storage
- **Role-Based Access Control**: Admin APIs are protected and only accessible to ADMIN role users
- **Secure Cookies**: Refresh tokens are stored in HTTP-only, Secure, SameSite cookies
- **Input Validation**: All API inputs are validated before processing
- **SQL Injection Prevention**: Prisma parameterized queries prevent SQL injection
- **CORS Headers**: Security headers are set on all responses

## Deployment

### Vercel

This application is configured for deployment on Vercel.

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Set environment variables in Vercel
4. Deploy

### Production Checklist

Before deploying to production:

1. Change `JWT_SECRET` and `JWT_REFRESH_SECRET` to strong, random values
2. Update `NEXT_PUBLIC_APP_URL` to your production domain
3. Ensure your PostgreSQL database is in production
4. Enable HTTPS
5. Set `secure: true` for cookies in production

## Database Migrations

### Create Migration

```bash
npx prisma migrate dev --name <migration-name>
```

### Apply Migrations

```bash
npx prisma migrate deploy
```

### Reset Database (Development Only)

```bash
npx prisma migrate reset
```

## Development

### Generate Prisma Client

```bash
npx prisma generate
```

### Prisma Studio (Database GUI)

```bash
npx prisma studio
```

## Error Handling

The application includes comprehensive error handling:

- Input validation errors return 400 Bad Request
- Authentication errors return 401 Unauthorized
- Authorization errors return 403 Forbidden
- Not found errors return 404 Not Found
- Server errors return 500 Internal Server Error

## Future Enhancements

- Payment processing integration (Stripe)
- Email notifications
- Product reviews and ratings
- Wishlist functionality
- Advanced search and filtering
- Inventory management
- Analytics dashboard

## Support

For support, open an issue in the repository.

## License

This project is licensed under the MIT License.
