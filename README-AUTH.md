# CityScroll Auth Flow (Postman + Automated Test)

This README explains how to run the authentication flow (Register → Signin → Refresh → Signout) against the local dev server or an Atlas-backed server.

Prerequisites

- Node.js (v18+ recommended)
- The app's dev server running: `npx next dev --port 3000`
- MongoDB Atlas configured in `.env.local` (MONGODB_URI) and your current IP allowed in Atlas Network Access

Using Postman

1. Open Postman and import `postman_collection.json` from this repo root.
2. Ensure the dev server is running on `http://localhost:3000`.
3. In Postman preferences enable "Automatically follow redirects" and enable cookie jar.
4. Run requests in order: Register → Signin → Refresh → Signout.

Automated test script

- There is a Node script under `scripts/run-auth-flow.test.js` that runs the same flow and asserts expected responses.

Run it locally (from repo root):

```powershell
node scripts/run-auth-flow.test.js
```

It will print a Pass/Fail summary and exit with code 0 on success, non-zero on failure.

Notes

- The refresh token is stored in an HttpOnly cookie named `refreshToken`; browser clients will not be able to read it via JS (intended behavior).
- After signout the server clears the refresh token cookie and removes the refresh token from the DB, so refresh should return 401.

Security

- Remove or restrict test helpers after verification. This script assumes a development environment.
