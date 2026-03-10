# React Structure Migration Guide

## Current Structure → New Structure

### Phase 1: Move Auth-Related Files

#### 1. Move Login Page

```bash
# From: src/ui/features/login/
# To: src/pages/auth/

# Move and rename
mv src/ui/features/login/index.tsx src/pages/auth/LoginPage.tsx
```

#### 2. Create Auth Feature Structure

```bash
# Create subdirectories
mkdir -p src/features/auth/{components,hooks,types}

# Move auth-specific components
mv src/ui/features/login/LoginForm.tsx src/features/auth/components/
mv src/ui/features/login/LoginButton.tsx src/features/auth/components/

# Move auth-specific hooks
mv src/ui/hooks/useAuth.ts src/features/auth/hooks/
mv src/ui/hooks/useLogin.ts src/features/auth/hooks/

# Move auth context
mv src/domains/auth/AuthContext.tsx src/contexts/
```

#### 3. Update Auth Feature Index

```typescript
// src/features/auth/index.ts
export { LoginForm } from "./components/LoginForm";
export { useAuth } from "./hooks/useAuth";
export type { AuthUser, LoginCredentials } from "./types";
```

### Phase 2: Move Dashboard Files

#### 1. Move Dashboard Page

```bash
# From: src/ui/features/dashboard/
# To: src/pages/dashboard/

mv src/ui/features/dashboard/index.tsx src/pages/dashboard/DashboardPage.tsx
```

#### 2. Create Dashboard Feature

```bash
mkdir -p src/features/dashboard/{components,hooks,types}

# Move dashboard-specific components
mv src/ui/features/dashboard/DashboardFilters.tsx src/features/dashboard/components/
mv src/ui/features/dashboard/DashboardStats.tsx src/features/dashboard/components/

# Move dashboard-specific hooks
mv src/ui/hooks/useDashboardFilters.ts src/features/dashboard/hooks/
```

### Phase 3: Move Shared Components

#### 1. UI Primitives

```bash
# From: src/ui/components/forms/ and src/ui/components/data-display/
# To: src/components/ui/

mv src/ui/components/forms/Button.tsx src/components/ui/
mv src/ui/components/forms/Input.tsx src/components/ui/
mv src/ui/components/data-display/Badge.tsx src/components/ui/
mv src/ui/components/data-display/Icon.tsx src/components/ui/
```

#### 2. Layout Components

```bash
# From: src/ui/components/layout/
# To: src/components/layout/

mv src/ui/components/layout/Header.tsx src/components/layout/
mv src/ui/components/layout/Sidebar.tsx src/components/layout/
mv src/ui/components/layout/ProtectedRoute.tsx src/components/layout/
```

#### 3. Common Components

```bash
# From: src/ui/components/landing/ and others
# To: src/components/common/

mv src/ui/components/landing/HeroSection.tsx src/components/common/
mv src/ui/components/EmptyState.tsx src/components/common/
```

### Phase 4: Move Hooks

#### 1. Shared Hooks

```bash
# From: src/ui/hooks/
# To: src/hooks/

mv src/ui/hooks/useLocalStorage.ts src/hooks/
mv src/ui/hooks/useDebounce.ts src/hooks/
mv src/ui/hooks/useToggle.ts src/hooks/
```

#### 2. Feature-Specific Hooks (Already moved above)

### Phase 5: Create Layouts

#### 1. Auth Layout

```typescript
// src/layouts/AuthLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
```

#### 2. Dashboard Layout

```typescript
// src/layouts/DashboardLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';

export const DashboardLayout: React.FC = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
```

### Phase 6: Update App.tsx

#### Before (Current)

```typescript
// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login'; // Old path
import Dashboard from './pages/Dashboard'; // Old path

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}
```

#### After (New Structure)

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
          </Route>

          {/* Protected routes */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

### Phase 7: Update Import Statements

#### Update Component Imports

```typescript
// BEFORE
import Button from "../ui/components/forms/Button";
import Badge from "../ui/components/data-display/Badge";

// AFTER
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
```

#### Update Hook Imports

```typescript
// BEFORE
import { useAuth } from "../ui/hooks/useAuth";
import { useDashboardFilters } from "../ui/hooks/useDashboardFilters";

// AFTER
import { useAuth } from "../features/auth";
import { useDashboardFilters } from "../features/dashboard/hooks/useDashboardFilters";
```

#### Update Page Imports

```typescript
// BEFORE
import Login from "./ui/features/login";
import Dashboard from "./ui/features/dashboard";

// AFTER
import { LoginPage } from "./pages/auth/LoginPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
```

### Phase 8: Update TypeScript Paths

#### Update tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/features/*": ["src/features/*"],
      "@/pages/*": ["src/pages/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/layouts/*": ["src/layouts/*"],
      "@/contexts/*": ["src/contexts/*"],
      "@/utils/*": ["src/utils/*"]
    }
  }
}
```

#### Update Vite Config

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/features": path.resolve(__dirname, "./src/features"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/layouts": path.resolve(__dirname, "./src/layouts"),
      "@/contexts": path.resolve(__dirname, "./src/contexts"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
    },
  },
});
```

### Phase 9: Create Barrel Exports

#### Component Barrel Exports

```typescript
// src/components/ui/index.ts
export { Button } from "./Button";
export { Input } from "./Input";
export { Badge } from "./Badge";

// src/components/layout/index.ts
export { Header } from "./Header";
export { Sidebar } from "./Sidebar";
export { ProtectedRoute } from "./ProtectedRoute";
```

#### Feature Barrel Exports

```typescript
// src/features/auth/index.ts
export { LoginForm } from "./components/LoginForm";
export { useAuth } from "./hooks/useAuth";
export type { AuthUser } from "./types";

// src/features/dashboard/index.ts
export { DashboardFilters } from "./components/DashboardFilters";
export { useDashboardFilters } from "./hooks/useDashboardFilters";
```

### Phase 10: Testing & Validation

#### 1. Check Build

```bash
npm run build
```

#### 2. Check Imports

```bash
npx tsc --noEmit
```

#### 3. Test Routes

- Visit `/auth/login` → Should show login page
- Visit `/dashboard` → Should show dashboard (if authenticated)

#### 4. Test Components

- All components should render without import errors
- All hooks should work correctly

## Migration Checklist

### Pre-Migration

- [ ] Create backup branch: `git checkout -b restructure-react-app`
- [ ] Document all current file locations
- [ ] Plan new import paths

### File Moves

- [ ] Move all pages to `src/pages/`
- [ ] Move feature components to `src/features/*/components/`
- [ ] Move shared components to `src/components/`
- [ ] Move hooks to appropriate locations
- [ ] Move contexts to `src/contexts/`
- [ ] Create layout components

### Import Updates

- [ ] Update all import statements in moved files
- [ ] Update barrel exports (`index.ts` files)
- [ ] Update path aliases in configs

### Configuration

- [ ] Update `tsconfig.json` paths
- [ ] Update `vite.config.ts` aliases
- [ ] Update any other config files

### Testing

- [ ] Build passes: `npm run build`
- [ ] TypeScript check: `npx tsc --noEmit`
- [ ] All routes work
- [ ] All components render
- [ ] All functionality preserved

## Common Issues & Solutions

### Issue: Import Errors

**Solution**: Update import paths to match new structure

```typescript
// Wrong
import Button from "../../../ui/components/forms/Button";

// Right
import { Button } from "@/components/ui";
```

### Issue: Missing Dependencies

**Solution**: Install required packages

```bash
npm install clsx tailwind-merge
```

### Issue: Path Aliases Not Working

**Solution**: Restart TypeScript language server in VS Code

- `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

## Success Criteria

✅ All files moved to correct locations  
✅ No TypeScript errors  
✅ Build passes successfully  
✅ All routes working  
✅ Components render correctly  
✅ Team can easily find files  
✅ New structure is maintainable

## Next Steps

1. **Start Small**: Begin with one feature (auth)
2. **Test Frequently**: Run build after each major move
3. **Update Gradually**: Don't move everything at once
4. **Document Changes**: Keep track of moved files
5. **Team Communication**: Let team know about new structure

Would you like me to help you start migrating a specific feature?
