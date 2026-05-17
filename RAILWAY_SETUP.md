# Railway Setup (Option A)

## 1) Environment variables
In Railway project settings, add all variables from `.env.example`.

## 2) Build and start commands
- Build command: `npm run build`
- Start command: `npm run start`

## 3) Deploy
Connect this repository/folder and deploy `admin-web`.

## 4) Auth and rules
- Use Firebase Auth email/password for admin logins.
- Keep Firestore rules deployed from workspace root (`firestore.rules`).
- Ensure admin emails in `NEXT_PUBLIC_ADMIN_EMAILS` match rule allowlist.

## 5) Local run
```bash
cd admin-web
cp .env.example .env.local
npm install
npm run dev
```
