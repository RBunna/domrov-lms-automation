# 🚀 Quick Feature Development Template

Use this template when starting a new feature. Replace `[FEATURE]` with your feature name.

---

## 1️⃣ Define DTOs

**File**: `app/api/[resource]/dto.ts`

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface [Feature]Dto {
  id: number;
  // Add properties here
  createdAt: Date;
}

export interface Get[Features]ResponseDto {
  [features]: [Feature]Dto[];
  // Add other fields
}

export interface Create[Feature]Dto {
  // Input fields
}
```

---

## 2️⃣ Create Service Layer

**File**: `app/api/[resource]/service.ts`

```typescript
import { createAuthorizedAxios } from '@/lib/axiosInstance';
import type {
  [Feature]Dto,
  Get[Features]ResponseDto
} from './dto';

export async function get[Features](token?: string): Promise<Get[Features]ResponseDto> {
  try {
    const axios = createAuthorizedAxios(token);
    const response = await axios.get<Get[Features]ResponseDto>(`/[resource]`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || 'Failed to fetch');
  }
}

export async function create[Feature](
  data: Create[Feature]Dto,
  token?: string
): Promise<[Feature]Dto> {
  try {
    const axios = createAuthorizedAxios(token);
    const response = await axios.post<[Feature]Dto>(`/[resource]`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || 'Failed to create');
  }
}
```

---

## 3️⃣ Create API Route

**File**: `app/api/[resource]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import * as [feature]Service from './service';

export async function GET(request: NextRequest) {
  try {
    const action = new URL(request.url).searchParams.get('action');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    switch (action) {
      case 'all': {
        const result = await [feature]Service.get[Features](token);
        return NextResponse.json({ success: true, data: result });
      }
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const action = new URL(request.url).searchParams.get('action');
    const body = await request.json();
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    switch (action) {
      case 'create': {
        const result = await [feature]Service.create[Feature](body, token);
        return NextResponse.json({ success: true, data: result });
      }
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 4️⃣ Create Client API

**File**: `lib/api/[feature].ts`

```typescript
import { [feature]API } from '@/lib/apiClient';
import type { [Feature]Dto } from '@/app/api/[resource]/dto';

export async function fetch[Features](): Promise<[Feature]Dto[]> {
  try {
    const response = await [feature]API.getAll();
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch'
    );
  }
}

export async function create[Feature](data: any): Promise<[Feature]Dto> {
  try {
    const response = await [feature]API.create(data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to create'
    );
  }
}
```

**Add to `lib/apiClient.ts`:**

```typescript
export const [feature]API = {
  getAll: () =>
    fetchAPI<ApiResponse<[Feature][]>>('/[resource]?action=all'),

  create: (data: any) =>
    fetchAPI<ApiResponse<[Feature]>>('/[resource]?action=create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
```

---

## 5️⃣ Define Types

**File**: `types/[resource].ts`

```typescript
export interface [Feature] {
  id: number;
  // Properties
  createdAt: string;
}

export interface [Feature]State {
  [features]: [Feature][];
  isLoading: boolean;
  error: string | null;
}
```

---

## 6️⃣ Create Custom Hook

**File**: `ui/hooks/use[Feature].ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { fetch[Features], create[Feature] } from '@/lib/api/[feature]';
import type { [Feature] } from '@/types/[resource]';

export function use[Feature]() {
  const [[features], set[Features]] = useState<[Feature][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    fetch[Features]()
      .then((data) => {
        if (mounted) set[Features](data);
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

  const add[Feature] = useCallback(async (data: any) => {
    try {
      const new[Feature] = await create[Feature](data);
      set[Features]((prev) => [...prev, new[Feature]]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add');
    }
  }, []);

  return { [features], isLoading, error, add[Feature] };
}
```

**Export from `ui/hooks/index.ts`:**

```typescript
export { use[Feature] } from './use[Feature]';
```

---

## 7️⃣ Create Components

**File**: `ui/features/[feature]/components/[Feature]Card.tsx`

```typescript
'use client';

import type { [Feature] } from '@/types/[resource]';

interface [Feature]CardProps {
  item: [Feature];
  onAction?: (id: number) => void;
}

export default function [Feature]Card({ item, onAction }: [Feature]CardProps) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <h3 className="font-semibold">{item.name}</h3>
      <button
        onClick={() => onAction?.(item.id)}
        className="mt-4 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        View
      </button>
    </div>
  );
}
```

**File**: `ui/features/[feature]/components/[Feature]Client.tsx`

```typescript
'use client';

import { use[Feature] } from '@/ui/hooks';
import [Feature]Card from './[Feature]Card';
import { EmptyState } from '@/ui/components/data-display';

export default function [Feature]Client() {
  const { [features], isLoading, error } = use[Feature]();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if ([features].length === 0) return <EmptyState message="No items" icon="box" />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[features].map((item) => (
        <[Feature]Card key={item.id} item={item} />
      ))}
    </div>
  );
}
```

**File**: `ui/features/[feature]/components/index.ts`

```typescript
export { default as [Feature]Card } from './[Feature]Card';
export { default as [Feature]Client } from './[Feature]Client';
```

---

## 8️⃣ Create Page

**File**: `app/(portal)/[feature]/page.tsx`

```typescript
import { [Feature]Client } from '@/ui/features/[feature]/components';

export default function [Feature]Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">[Feature]</h1>
      <[Feature]Client />
    </div>
  );
}
```

---

## ✅ Final Checklist

- [ ] DTOs created
- [ ] Service layer created
- [ ] API routes created
- [ ] Client API created and exported
- [ ] Types defined
- [ ] Hook created and exported
- [ ] Components created
- [ ] Page created
- [ ] Error handling added
- [ ] Loading states added
- [ ] Tested with sample data

---

## 📝 Notes

- Replace all `[FEATURE]`, `[Feature]`, `[feature]`, `[resource]` with actual names
- Use camelCase for variables: `[features]`
- Use PascalCase for types/components: `[Feature]`
- Use kebab-case for folders/files: `[feature]`
- Always mark interactive components with `'use client'`
- Always handle errors and loading states
