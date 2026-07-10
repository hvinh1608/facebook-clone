# Deploy with Vercel, Railway, and Neon

## Architecture

- `Vercel`: `apps/frontend`
- `Railway`: `apps/backend`
- `Neon`: PostgreSQL database

## 1. Create Neon database

1. Create a Neon project.
2. Copy the pooled connection string.
3. Set `DATABASE_URL` in Railway with that value.
4. After backend deploy, run Prisma sync once:

```bash
npm run db:push
```

Use the Railway shell or run it locally against the Neon `DATABASE_URL`.

## 2. Deploy backend to Railway

Create a Railway project from this repository root.

Railway uses `railway.toml`:

- build: installs packages and builds `packages/database` + `apps/backend`
- start: runs `apps/backend`

### Railway environment variables

Set these in Railway:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=replace_with_long_random_value
JWT_REFRESH_SECRET=replace_with_long_random_value
FRONTEND_URL=https://your-vercel-domain.vercel.app
ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app,https://your-custom-domain.com
GOOGLE_CLIENT_ID=your_google_client_id
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM=your_email@gmail.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Important backend notes

- Refresh-token cookie is configured for cross-site production usage:
  - `secure=true`
  - `sameSite=none`
- CORS accepts comma-separated origins from `ALLOWED_ORIGINS`.
- If Cloudinary env vars are set, uploads automatically go to Cloudinary.
- If Cloudinary env vars are empty, backend falls back to local `/uploads`, which is not durable on Railway.

## 3. Deploy frontend to Vercel

Create a Vercel project and set:

- **Root Directory**: `apps/frontend`
- **Framework Preset**: Next.js

### Vercel environment variables

```env
NEXT_PUBLIC_API_URL=https://your-railway-backend.up.railway.app/api
NEXT_PUBLIC_SOCKET_URL=https://your-railway-backend.up.railway.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

If you use a custom frontend domain, redeploy after adding it.

## 4. Google OAuth configuration

In Google Cloud Console, add your deployed frontend domain to:

### Authorized JavaScript origins

```text
https://your-vercel-domain.vercel.app
https://your-custom-domain.com
```

If the OAuth app is in testing mode, also add your test accounts under **Test users**.

## 5. SMTP / email verification

Signup and password reset emails are sent by the backend. In production:

- use Gmail App Password or another SMTP provider
- verify `EMAIL_FROM`
- test `signup`, `verify-email`, and `forgot-password`

## 6. Production checklist

1. Deploy Railway backend
2. Set Railway env vars
3. Run Prisma `db:push`
4. Deploy Vercel frontend
5. Set Vercel env vars
6. Add Vercel domain to Google OAuth origins
7. Test:
   - email/password signup + verify email
   - login
   - Google login
   - feed
   - chat/socket
   - image loading

## 7. Media storage

This project already supports both modes:

- **Local mode**: no Cloudinary env vars, files saved to `/uploads`
- **Production mode**: add Cloudinary env vars, files saved to Cloudinary automatically

For Railway production, use Cloudinary.
