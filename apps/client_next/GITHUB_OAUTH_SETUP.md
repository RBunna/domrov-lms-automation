# GitHub OAuth Setup Guide

## 1. Create a GitHub App
- Go to https://github.com/settings/developers
- Register a new OAuth app
- Set callback URL to `http://localhost:3000/login/github-login-callback`

## 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and fill in:
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_REDIRECT_URI`
- `BACKEND_API_URL`

## 3. Flow Diagram
1. User clicks GitHub login
2. Redirects to GitHub auth
3. GitHub redirects to `/login/github-login-callback` with code
4. Callback handler exchanges code for token via `/api/auth/github/callback`
5. Backend validates and returns user info
6. Auth context updates, user redirected

## 4. Troubleshooting
- Ensure callback URL matches GitHub app
- Check environment variables
- Inspect network requests for errors
