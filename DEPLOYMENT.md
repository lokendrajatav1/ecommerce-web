# Deployment Guide

## Quick Start for Production Deployment

### 1. Pre-Deployment Setup (15 minutes)

#### Generate Strong Secrets
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_REFRESH_SECRET (run again for different value)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Set Up Production Database
1. Create a PostgreSQL database (Vercel Postgres, Supabase, or AWS RDS)
2. Get the connection string with SSL enabled
3. Format: `postgresql://user:password@host:5432/dbname?sslmode=require`

### 2. Vercel Deployment (Recommended)

#### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Set Environment Variables
Go to your Vercel project settings and add:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
JWT_SECRET=<your-generated-secret-64-chars>
JWT_REFRESH_SECRET=<your-generated-secret-64-chars>
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
```

#### Step 4: Deploy
```bash
# Deploy to production
vercel --prod
```

#### Step 5: Run Database Migrations
```bash
# After deployment, run migrations
npx prisma migrate deploy
```

### 3. Alternative: Docker Deployment

#### Create Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Build and Run
```bash
# Build Docker image
docker build -t ecommerce-app .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -e JWT_REFRESH_SECRET="..." \
  -e NEXT_PUBLIC_APP_URL="https://yourdomain.com" \
  ecommerce-app
```

### 4. Post-Deployment Checklist

#### Verify Deployment
- [ ] Visit your production URL
- [ ] Test user registration
- [ ] Test user login
- [ ] Test product browsing
- [ ] Test add to cart
- [ ] Test checkout flow
- [ ] Test admin login
- [ ] Test admin product management

#### Database Setup
```bash
# Connect to production database
npx prisma studio --browser none

# Create initial admin user (run in Prisma Studio or SQL)
# Password: "admin123" (change immediately!)
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@yourdomain.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7qXqXqXqXq',
  'Admin User',
  'ADMIN',
  NOW(),
  NOW()
);
```

#### Create Sample Categories
```sql
INSERT INTO "Category" (id, name, slug, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'Electronics', 'electronics', NOW(), NOW()),
  (gen_random_uuid(), 'Clothing', 'clothing', NOW(), NOW()),
  (gen_random_uuid(), 'Books', 'books', NOW(), NOW()),
  (gen_random_uuid(), 'Home & Garden', 'home-garden', NOW(), NOW());
```

### 5. Monitoring Setup

#### Set Up Uptime Monitoring
- UptimeRobot: https://uptimerobot.com
- Pingdom: https://www.pingdom.com
- Better Uptime: https://betteruptime.com

#### Set Up Error Tracking
```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize Sentry
npx @sentry/wizard@latest -i nextjs
```

### 6. Performance Optimization

#### Enable Caching
Add to `next.config.mjs`:
```javascript
experimental: {
  optimizeCss: true,
  optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
}
```

#### Add CDN for Static Assets
- Cloudflare CDN
- AWS CloudFront
- Vercel Edge Network (automatic)

### 7. Security Hardening

#### Update Cookie Settings
In all auth API routes, ensure cookies use:
```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60
}
```

#### Add Rate Limiting
```bash
npm install express-rate-limit
```

### 8. Backup Strategy

#### Database Backups
- Automated daily backups
- Point-in-time recovery enabled
- Test restore procedure monthly

#### Code Backups
- Git repository (GitHub, GitLab, Bitbucket)
- Tagged releases for each deployment
- Maintain staging branch

### 9. Rollback Procedure

#### Vercel Rollback
```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

#### Database Rollback
```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back [migration-name]
```

### 10. Maintenance Mode

Create `app/maintenance/page.tsx`:
```tsx
export default function Maintenance() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Under Maintenance</h1>
        <p>We'll be back soon!</p>
      </div>
    </div>
  )
}
```

## Troubleshooting

### Build Fails
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Database Connection Issues
```bash
# Test database connection
npx prisma db pull

# Check connection string format
# Should include: ?sslmode=require for production
```

### Environment Variables Not Loading
- Verify variables are set in Vercel dashboard
- Check variable names match exactly (case-sensitive)
- Redeploy after adding new variables

## Support

For issues:
1. Check logs: `vercel logs [deployment-url]`
2. Review error tracking (Sentry)
3. Check database logs
4. Review API response times

## Cost Estimation

### Vercel (Hobby Plan - Free)
- Bandwidth: 100GB/month
- Builds: 6000 minutes/month
- Serverless Functions: 100GB-hours

### Vercel (Pro Plan - $20/month)
- Bandwidth: 1TB/month
- Builds: Unlimited
- Team collaboration

### Database
- Vercel Postgres: $0.25/GB
- Supabase: Free tier available
- AWS RDS: ~$15-50/month

### Total Estimated Cost
- Small traffic: $0-20/month
- Medium traffic: $20-100/month
- High traffic: $100-500/month

---

**Ready to deploy?** Follow steps 1-4 above and you'll be live in 30 minutes!
