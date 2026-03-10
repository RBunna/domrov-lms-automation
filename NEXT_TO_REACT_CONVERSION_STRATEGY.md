# Next.js to React Conversion Strategy

## Current Stack Analysis

- **Framework**: Next.js 16.1.6 (App Router)
- **React**: 19.2.3
- **Build Tool**: Next.js (built-in)
- **Styling**: Tailwind CSS 4
- **HTTP Client**: Axios
- **Editor**: Monaco Editor for code viewing
- **Package Manager**: PNPM

---

## Phase 1: Strategic Planning & Tool Selection

### Why Convert from Next.js?

- Team expertise is React-focused
- Simpler mental model for the team
- No server-side rendering complexity needed (looks like a client-heavy SPA)
- More control over tooling

### Recommended React SPA Framework: **Vite + React Router**

**Why Vite?**

- ⚡ Lightning-fast development server (10-100x faster than Webpack)
- 📦 Minimal configuration
- 🔄 Hot Module Replacement (HMR) works great with React
- 📝 TypeScript support out of the box
- 🎯 Perfect for SPAs (Single Page Applications)

**Why React Router v6+?**

- Industry standard for React routing
- Replaces Next.js file-based routing
- Feature-rich with outlet-based nested routing
- Good TypeScript support
- Large community support

---

## Phase 2: Conversion Roadmap

### Step 1: Setup New React + Vite Project (1-2 hours)

```bash
npm create vite@latest client_next -- --template react-ts
# or
pnpm create vite client_next --template react-ts
```

### Step 2: Install Dependencies (30 mins)

```bash
cd client_next
pnpm install
pnpm add react-router-dom axios
pnpm add -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 3: Core Folder Structure Mapping

```
Next.js Structure        →  React + Vite Structure
└── app/                →  └── src/
    ├── (auth)/         →      ├── pages/
    ├── (portal)/       →      ├── pages/
    ├── (public)/       →      ├── pages/
    ├── api/            →      └── api/  (remove - use backend instead)
    ├── layout.tsx      →      └── App.tsx (with Router)
    └── globals.css     →      └── index.css
```

### Step 4: Handling Next.js Specific Features

| Next.js Feature               | React Replacement                                      | Effort  |
| ----------------------------- | ------------------------------------------------------ | ------- |
| **App Router (file-based)**   | React Router v6 with outlet pattern                    | Medium  |
| **API Routes** (`/app/api/*`) | Remove - Call backend directly via Axios               | Low     |
| **Server Components (RSC)**   | Convert to Client Components (use `use client`)        | Medium  |
| **next/image**                | Standard `<img>` or library like `react-image-gallery` | Low     |
| **next/link**                 | React Router `<Link>`                                  | Low     |
| **Layout inheritance**        | Create wrapper components + Context                    | Medium  |
| **Middleware**                | Use React Router middleware/loaders                    | Medium  |
| **Built-in CSS modules**      | Keep Tailwind CSS (already good)                       | Done ✅ |
| **Environment vars**          | Keep `.env` + `import.meta.env.VITE_*`                 | Low     |

---

## Phase 3: Step-by-Step Migration

### Week 1: Foundation Setup

**Goal**: Get basic Vite + React Router running

1. **Create Vite project**
   - Generate new Vite project with React template
   - Copy Tailwind CSS config from current project
   - Setup environment variables (`.env.local`)

2. **Setup React Router**

   ```tsx
   // src/App.tsx
   import { BrowserRouter, Routes, Route } from "react-router-dom";
   import LoginPage from "./pages/login";
   import DashboardLayout from "./pages/dashboard/layout";

   function App() {
     return (
       <BrowserRouter>
         <Routes>
           <Route path="/login" element={<LoginPage />} />
           <Route path="/" element={<DashboardLayout />}>
             <Route path="dashboard" element={<Dashboard />} />
             <Route path="class" element={<ClassPage />} />
           </Route>
           {/* ... other routes */}
         </Routes>
       </BrowserRouter>
     );
   }
   ```

3. **Copy shared resources**
   - `src/components/` (no changes needed)
   - `src/lib/` (no changes needed)
   - `src/types/` (no changes needed)
   - `src/domains/` (no changes needed)
   - `config/` (no changes needed)
   - `public/` (copy as-is)

4. **Update environment variables**

   ```env
   # .env.local
   VITE_BACKEND_API_URL=https://api.domrov.app
   VITE_GOOGLE_AUTH_URL=https://api.domrov.app/auth/google/login
   VITE_APP_URL=http://localhost:5173

   # Access in code: import.meta.env.VITE_BACKEND_API_URL
   ```

### Week 2: Page Conversion

**Goal**: Convert all pages from Next.js to React routing

1. **Identify all routes** from `app/` folder:
   - `/login` → `/src/pages/Login.tsx`
   - `/dashboard` → `/src/pages/Dashboard.tsx`
   - `/class` → `/src/pages/Class.tsx`
   - `/assignment` → `/src/pages/Assignment.tsx`
   - `/` (public) → `/src/pages/Home.tsx`

2. **Convert each page**:
   - Remove `app/api/*` (they become backend API calls)
   - Rename `page.tsx` → `PageName.tsx` and put in `src/pages/`
   - Rename `layout.tsx` → `Layout.tsx` and extract into route wrappers
   - Remove Next.js specific imports (`next/navigation`, `next/link`, etc.)

3. **Example conversion**:

   ```tsx
   // BEFORE: app/(portal)/dashboard/page.tsx (Next.js)
   export default function DashboardPage() {
     return <div>Dashboard</div>;
   }

   // AFTER: src/pages/Dashboard.tsx (React)
   export default function Dashboard() {
     return <div>Dashboard</div>;
   }
   ```

### Week 3: API Integration & Context

**Goal**: Setup API layer and remove Next.js API routes

1. **Create API wrapper** (already have `lib/apiClient.ts`, keep it!)
   - Just update env var references
   - Make sure all axios calls use `import.meta.env.VITE_*`

2. **Setup Auth Context**
   - Already have `domains/auth/AuthContext.tsx` ✅
   - No changes needed (works same in React)

3. **Setup route protection**

   ```tsx
   // src/components/ProtectedRoute.tsx
   import { Navigate } from "react-router-dom";
   import { useAuthContext } from "../domains/auth";

   export function ProtectedRoute({ children }) {
     const { isAuthenticated } = useAuthContext();
     return isAuthenticated ? children : <Navigate to="/login" />;
   }
   ```

4. **Remove API routes** (`app/api/*`)
   - Call backend directly instead
   - Example: Instead of `POST /api/submit`, call `POST /backend/api/submit`

### Week 4: Testing, Polish & Deployment

**Goal**: Test thoroughly and deploy

1. **Testing**
   - Test all auth flows (Login, OAuth callbacks)
   - Test class creation/viewing
   - Test assignment submission
   - Test file uploads/downloads
   - Test payment flows

2. **Performance optimization**
   - Code splitting with React Router lazy loading
   - Image optimization (use `<img>` with proper sizing)
   - Bundle analysis with `vite-plugin-visualizer`

3. **Deployment**
   - Build: `pnpm build` → generates `dist/` folder
   - Deploy to Netlify/Vercel (static files only now)
   - Update environment variables in deployment platform

---

## Phase 4: Detailed Conversion Examples

### Example 1: Layout Conversion

```tsx
// BEFORE: Next.js app/(portal)/layout.tsx
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Navbar />
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}

// AFTER: React src/pages/Portal/Layout.tsx
export default function PortalLayout() {
  return (
    <div>
      <Navbar />
      <Sidebar />
      <Outlet /> {/* Child pages render here */}
    </div>
  );
}

// Use in App.tsx:
<Route path="/portal" element={<PortalLayout />}>
  <Route path="dashboard" element={<Dashboard />} />
  <Route path="class" element={<Class />} />
</Route>;
```

### Example 2: Link Conversion

```tsx
// BEFORE: Next.js
import Link from "next/link";
<Link href="/class/123">Go to class</Link>;

// AFTER: React
import { Link } from "react-router-dom";
<Link to="/class/123">Go to class</Link>;
```

### Example 3: Navigation Conversion

```tsx
// BEFORE: Next.js
import { useRouter } from "next/navigation";
const router = useRouter();
router.push("/dashboard");

// AFTER: React
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();
navigate("/dashboard");
```

### Example 4: Using Environment Variables

```tsx
// BEFORE: Next.js
const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

// AFTER: React + Vite
const apiUrl = import.meta.env.VITE_BACKEND_API_URL;
```

---

## Phase 5: Handling Special Cases

### OAuth Login Callbacks

```tsx
// src/pages/Login/GoogleCallback.tsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "../../domains/auth";

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthContext();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      // Exchange code for token with backend
      login(code);
      navigate("/dashboard");
    }
  }, [searchParams]);

  return <div>Logging in...</div>;
}
```

### File Upload with Monaco Editor

```tsx
// No changes needed! Monaco Editor works same in React
import Editor from "@monaco-editor/react";

export function CodeEditor() {
  return (
    <Editor
      height="90vh"
      defaultLanguage="cpp"
      theme="vs-dark"
      value={code}
      onChange={setCode}
    />
  );
}
```

---

## Migration Timeline

| Phase                | Duration   | Focus                                  |
| -------------------- | ---------- | -------------------------------------- |
| **Setup & Planning** | 2-3 days   | Tool selection, structure planning     |
| **Week 1**           | ~40 hours  | Vite setup, Router config, basic pages |
| **Week 2**           | ~40 hours  | Convert all pages & layouts            |
| **Week 3**           | ~30 hours  | API integration, context setup         |
| **Week 4**           | ~20 hours  | Testing, optimization, deployment      |
| **Buffer**           | ~20 hours  | Unexpected issues, refinements         |
| **TOTAL**            | ~4-5 weeks | Full conversion & testing              |

---

## Checklist for Migration

### Pre-Migration

- [ ] Backup current `client_next` folder
- [ ] Create branches: `feature/next-to-react`
- [ ] Document all custom Next.js features being used
- [ ] Review all API routes in `app/api/*`

### During Migration

- [ ] Setup Vite project
- [ ] Configure React Router
- [ ] Copy components, utils, types (no changes)
- [ ] Convert all pages
- [ ] Setup Auth context
- [ ] Remove API routes dependency
- [ ] Test all major flows
- [ ] Setup CI/CD for new build process

### Post-Migration

- [ ] Performance testing
- [ ] Accessibility audit
- [ ] Security review
- [ ] Team training on new stack
- [ ] Update documentation
- [ ] Deprecate old Next.js `client_next` folder (or keep as backup)

---

## Potential Challenges & Solutions

| Challenge                       | Solution                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| **Server Components (if used)** | Convert all to Client Components with `use client`                                   |
| **API Routes**                  | Create backend endpoints instead of Next.js API routes                               |
| **Image optimization**          | Use standard `<img>` with CSS optimization or consider `next-image-export-optimizer` |
| **Dynamic routing**             | React Router supports path parameters: `/class/:id`                                  |
| **Middleware**                  | Use React Router loaders or create custom middleware                                 |
| **Deployment differences**      | Vite produces static files; deploy like standard SPA                                 |
| **Environment vars**            | Change prefix from `NEXT_PUBLIC_` to `VITE_`                                         |

---

## Tools & Resources

### Essential

- **Vite**: https://vitejs.dev/
- **React Router**: https://reactrouter.com/
- **React Router Migration Guide**: https://reactrouter.com/start/overview

### Helpful Tools

- **Vite plugin visualizer**: `vite-plugin-visualizer` (bundle analysis)
- **React DevTools**: Chrome extension for debugging
- **React Router DevTools**: For route debugging

### Learning Resources

- React Router 6 docs: https://reactrouter.com/
- Vite docs: https://vitejs.dev/guide/
- TypeScript in React: https://www.typescriptlang.org/docs/handbook/react.html

---

## Success Criteria

✅ All pages rendering correctly  
✅ All routes working (auth, portal, public)  
✅ All API calls functioning  
✅ Auth flows working (login, OAuth, logout)  
✅ File upload/download working  
✅ Payment flows working  
✅ Team comfortable with new stack  
✅ Build time < 5 seconds (dev), < 1 minute (prod)  
✅ Bundle size similar or smaller than Next.js  
✅ Zero breaking changes for users
