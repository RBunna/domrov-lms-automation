# 🚀 DOMROV Feature Development Guide

This guide helps you add new features to DOMROV while following the established project structure and best practices.

---

## 📁 Project Structure Overview

```
apps/client_next/
├── app/                          # Next.js pages & API routes
│   ├── (portal)/                 # Authenticated user pages
│   ├── (public)/                 # Public pages
│   ├── (auth)/                   # Auth pages (login, signup)
│   └── api/                      # Internal API routes
│       ├── [resource]/
│       │   ├── route.ts          # API endpoint handlers
│       │   ├── service.ts        # Business logic
│       │   ├── dto.ts            # Data Transfer Objects
│       │   └── ...
│
├── ui/                           # UI component & feature logic
│   ├── features/                 # Feature-specific components
│   │   └── [feature-name]/
│   │       └── components/       # Feature components
│   ├── hooks/                    # Custom React hooks
│   ├── components/               # Shared UI components
│   │   ├── data-display/         # Grids, tables, cards
│   │   ├── forms/                # Form components
│   │   ├── layout/               # Layout components
│   │   └── primitives/           # Basic building blocks
│   └── design-system/            # Design system components
│
├── lib/                          # Utilities & helpers
│   ├── api/                      # API client functions
│   ├── enums/                    # Enumerations
│   └── axiosInstance.ts          # Axios configuration
│
├── types/                        # TypeScript type definitions
│   └── [resource].ts
│
└── config/                       # Configuration files
```

---

## 🎯 Step-by-Step: Adding a New Feature

### **Step 1: Plan Your Feature Structure**

Before coding, identify:

- **Feature Name**: e.g., `notifications`, `analytics`, `reports`
- **Resources Involved**: e.g., notif, user, class
- **Components Needed**: List all UI components
- **API Endpoints**: Required backend calls
- **Database Models**: If needed

### **Step 2: Create Backend API Routes & DTOs**

#### A. Define Data Transfer Objects (DTOs)

**File**: `app/api/[resource]/dto.ts`

```typescript
// Example: app/api/notification/dto.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface NotificationDto {
  id: number;
  userId: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface GetNotificationsResponseDto {
  notifications: NotificationDto[];
  unreadCount: number;
}

export interface CreateNotificationDto {
  title: string;
  message: string;
  userId: number;
}

export interface UpdateNotificationDto {
  read?: boolean;
}
```

#### B. Create API Service Layer

**File**: `app/api/[resource]/service.ts`

```typescript
// Example: app/api/notification/service.ts
import { createAuthorizedAxios } from "@/lib/axiosInstance";
import type {
  NotificationDto,
  GetNotificationsResponseDto,
  CreateNotificationDto,
  ApiResponse,
} from "./dto";

export async function getNotifications(
  token?: string,
): Promise<GetNotificationsResponseDto> {
  try {
    const axios = createAuthorizedAxios(token);
    const response =
      await axios.get<GetNotificationsResponseDto>(`/notification`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch notifications",
    );
  }
}

export async function markAsRead(
  notificationId: number,
  token?: string,
): Promise<NotificationDto> {
  try {
    const axios = createAuthorizedAxios(token);
    const response = await axios.patch<NotificationDto>(
      `/notification/${notificationId}`,
      { read: true },
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to update notification",
    );
  }
}
```

#### C. Create API Route Handler

**File**: `app/api/[resource]/route.ts`

```typescript
// Example: app/api/notification/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as notificationService from "./service";

export async function GET(request: NextRequest) {
  try {
    const action = new URL(request.url).searchParams.get("action");
    const notificationId = new URL(request.url).searchParams.get(
      "notificationId",
    );
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");

    switch (action) {
      case "all": {
        const result = await notificationService.getNotifications(token);
        return NextResponse.json({ success: true, data: result });
      }

      case "mark-read": {
        if (!notificationId) {
          return NextResponse.json(
            { success: false, error: "notificationId required" },
            { status: 400 },
          );
        }
        const result = await notificationService.markAsRead(
          parseInt(notificationId),
          token,
        );
        return NextResponse.json({ success: true, data: result });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
```

### **Step 3: Create Client-Side API Client**

**File**: `lib/api/[resource].ts`

```typescript
// Example: lib/api/notifications.ts
import { notificationAPI } from "@/lib/apiClient";
import type {
  NotificationDto,
  GetNotificationsResponseDto,
} from "@/app/api/notification/dto";

/**
 * Fetch all notifications for current user
 * @returns Notifications with unread count
 */
export async function fetchNotifications(): Promise<GetNotificationsResponseDto> {
  try {
    const response = await notificationAPI.getAll();
    return response.data;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch notifications";
    throw new Error(errorMessage);
  }
}

/**
 * Mark a notification as read
 * @param notificationId - ID of notification
 */
export async function markNotificationAsRead(
  notificationId: number,
): Promise<NotificationDto> {
  try {
    const response = await notificationAPI.markAsRead(notificationId);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to update notification",
    );
  }
}
```

**Then, add to `lib/apiClient.ts`:**

```typescript
// In the NOTIFICATION API section
export const notificationAPI = {
  getAll: () =>
    fetchAPI<ApiResponse<GetNotificationsResponseDto>>(
      "/notification?action=all",
    ),

  markAsRead: (notificationId: number) =>
    fetchAPI<ApiResponse<NotificationDto>>(
      `/notification?action=mark-read&notificationId=${notificationId}`,
      { method: "PATCH" },
    ),
};
```

### **Step 4: Define TypeScript Types**

**File**: `types/[resource].ts`

```typescript
// Example: types/notification.ts
export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}
```

### **Step 5: Create Custom Hooks**

**File**: `ui/hooks/use[Feature].ts`

```typescript
// Example: ui/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from "react";
import {
  fetchNotifications,
  markNotificationAsRead,
} from "@/lib/api/notifications";
import type { Notification } from "@/types/notification";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  useEffect(() => {
    let mounted = true;

    fetchNotifications()
      .then((data) => {
        if (mounted) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Mark as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  }, []);

  return { notifications, unreadCount, isLoading, error, markAsRead };
}
```

Don't forget to export it from `ui/hooks/index.ts`:

```typescript
export { useNotifications } from "./useNotifications";
```

### **Step 6: Create Feature Components**

**File**: `ui/features/[feature-name]/components/[Component].tsx`

```typescript
// Example: ui/features/notifications/components/NotificationCard.tsx
'use client';

import type { Notification } from '@/types/notification';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead?: (id: number) => void;
}

export default function NotificationCard({
  notification,
  onMarkAsRead,
}: NotificationCardProps) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        notification.read
          ? 'bg-gray-50 border-gray-200'
          : 'bg-blue-50 border-blue-200'
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          <time className="text-xs text-gray-500 mt-2">
            {new Date(notification.createdAt).toLocaleDateString()}
          </time>
        </div>
        {!notification.read && (
          <button
            onClick={() => onMarkAsRead?.(notification.id)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Mark as Read
          </button>
        )}
      </div>
    </div>
  );
}
```

**File**: `ui/features/[feature-name]/components/[FeatureName]Client.tsx`

```typescript
// Example: ui/features/notifications/components/NotificationsClient.tsx
'use client';

import { useNotifications } from '@/ui/hooks';
import NotificationCard from './NotificationCard';
import { EmptyState } from '@/ui/components/data-display';

export default function NotificationsClient() {
  const { notifications, unreadCount, isLoading, error, markAsRead } =
    useNotifications();

  if (isLoading) return <div>Loading notifications...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  if (notifications.length === 0) {
    return <EmptyState message="No notifications yet" icon="bell" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Notifications</h2>
        {unreadCount > 0 && (
          <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm">
            {unreadCount} unread
          </span>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onMarkAsRead={markAsRead}
          />
        ))}
      </div>
    </div>
  );
}
```

**File**: `ui/features/[feature-name]/components/index.ts`

```typescript
// Example: ui/features/notifications/components/index.ts
export { default as NotificationCard } from "./NotificationCard";
export { default as NotificationsClient } from "./NotificationsClient";
```

### **Step 7: Create the Page**

**File**: `app/(portal)/[feature]/page.tsx`

```typescript
// Example: app/(portal)/notifications/page.tsx
import { NotificationsClient } from '@/ui/features/notifications/components';

export default function NotificationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <NotificationsClient />
    </div>
  );
}
```

---

## 📋 Checklist: Before Submitting Your Feature

- [ ] **DTOs Created**: All data types defined in `app/api/[resource]/dto.ts`
- [ ] **API Routes**: Route handlers in `app/api/[resource]/route.ts`
- [ ] **Service Layer**: Business logic in `app/api/[resource]/service.ts`
- [ ] **API Client**: Client functions in `lib/api/[resource].ts`
- [ ] **API Client Exported**: Added to `lib/apiClient.ts`
- [ ] **Types Defined**: TypeScript types in `types/[resource].ts`
- [ ] **Custom Hook**: Created in `ui/hooks/use[Feature].ts` and exported
- [ ] **Components Created**: Feature components in proper folder structure
- [ ] **Client Component**: Main client component marked with `'use client'`
- [ ] **Page Created**: Corresponding page in `app/(portal)/`
- [ ] **Error Handling**: All API calls have try-catch & error management
- [ ] **Loading States**: Loading indicators while fetching data
- [ ] **Empty States**: Handled when no data available
- [ ] **Null/Undefined Checks**: All data properly validated
- [ ] **TypeScript**: No `any` types (except when necessary)
- [ ] **Responsive Design**: Mobile-friendly UI
- [ ] **Accessibility**: Proper semantic HTML & ARIA labels

---

## 🎨 Styling Guidelines

- **Framework**: TailwindCSS
- **Color Scheme**: Follow existing palette
  - Primary: `blue-600`
  - Success: `green-600`
  - Error: `red-600`
  - Warning: `yellow-600`
  - Gray: `gray-500`, `gray-600`, `gray-700`, etc.
- **Spacing**: Use Tailwind spacing scale (4px units)
- **Typography**: Use `inter` font (already configured)
- **Shadows**: `shadow`, `shadow-lg` for depth
- **Borders**: `border` with `border-gray-200` or lighter

---

## 📝 Code Style & Best Practices

### Naming Conventions

- **Files**: `kebab-case.tsx` (e.g., `notification-card.tsx`)
- **Components**: `PascalCase` (e.g., `NotificationCard`)
- **Functions**: `camelCase` (e.g., `fetchNotifications`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_TIMEOUT`)
- **Types/Interfaces**: `PascalCase` with `Dto` or interface suffix

### Component Structure

```typescript
'use client'; // Always add for interactive components

import type { TypeName } from '@/types/resource';
import { helper } from '@/lib/api/resource';

interface ComponentProps {
  prop1: string;
  prop2: number;
  onAction?: (value: string) => void;
}

/**
 * Brief component description
 * @param {ComponentProps} props - Component props
 * @returns {JSX.Element}
 */
export default function ComponentName({
  prop1,
  prop2,
  onAction,
}: ComponentProps) {
  // Implementation
  return <div>Component</div>;
}
```

### Hook Structure

```typescript
import { useState, useEffect, useCallback } from "react";
import { apiFunction } from "@/lib/api/resource";

export function useFeature() {
  const [state, setState] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    apiFunction()
      .then((data) => {
        if (mounted) setState(data);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const update = useCallback(async (value) => {
    try {
      const result = await apiFunction(value);
      setState(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error occurred");
    }
  }, []);

  return { state, isLoading, error, update };
}
```

---

## 🔄 API Response Handling

**Always return consistent response format:**

```typescript
// ✅ Correct
return NextResponse.json({
  success: true,
  data: result,
});

// ✅ Correct with error
return NextResponse.json({ success: false, error: "Message" }, { status: 400 });

// ❌ Avoid
return NextResponse.json(result); // Inconsistent
return NextResponse.json({ data: result }); // Missing success flag
```

---

## 🧪 Testing Checklist

- [ ] Test with empty data (no results)
- [ ] Test with error response from backend
- [ ] Test on mobile view (responsive)
- [ ] Test loading states (use network throttling)
- [ ] Test with long text/names (truncation works?)
- [ ] Test keyboard navigation
- [ ] Test with slow internet
- [ ] Check console for warnings/errors

---

## 🚨 Common Mistakes to Avoid

1. **Forgetting `'use client'`** - Required for interactive components
2. **Not handling null/undefined** - Always check before accessing properties
3. **Missing error boundaries** - Wrap async operations with try-catch
4. **No loading states** - Users won't know if data is being fetched
5. **Hardcoded values** - Use constants or environment variables
6. **Not exporting hooks** - Remember to add to `ui/hooks/index.ts`
7. **Inconsistent API responses** - Always use `{ success, data }` format
8. **Missing JSDoc comments** - Document functions and props
9. **Using `any` types** - Use proper TypeScript types
10. **Not testing edge cases** - Test empty, error, and loading states

---

## 📚 Additional Resources

- **Tailwind Docs**: https://tailwindcss.com/docs
- **React Docs**: https://react.dev
- **Next.js Docs**: https://nextjs.org/docs
- **TypeScript Docs**: https://www.typescriptlang.org/docs

---

## ❓ Questions?

If you have questions about the structure or best practices:

1. Check existing similar features
2. Review this guide
3. Ask in team channel

Good luck! 🚀
