# 🎉 Welcome to DOMROV Development!

This guide helps you get started adding features to the DOMROV LMS project.

---

## 📚 Documentation Files

We've created three guides to help you:

### 🚀 **QUICK_FEATURE_TEMPLATE.md** ← **START HERE!**

- Copy-paste ready code templates
- 8-step feature development process
- Perfect for quick reference while coding
- Just replace `[FEATURE]` with your feature name
- **Use this if you want fast, practical guidance**

### 📖 **FEATURE_DEVELOPMENT_GUIDE.md**

- Comprehensive step-by-step walkthrough
- Detailed explanations of each step
- Real-world examples (notifications feature)
- Best practices and styling guidelines
- **Use this if you want to understand the "why" behind each step**

### ⚡ **.instructions.md**

- AI agent/Copilot instructions
- Architecture overview
- Complete checklist and rules
- Common mistakes to avoid
- **Use this for AI-assisted development**

---

## 🎯 Quick Start (5 Minutes)

### Step 1: Pick Your Feature

Let's say you want to add a **Grades** feature.

### Step 2: Open QUICK_FEATURE_TEMPLATE.md

Copy the template sections and follow along.

### Step 3: Replace Placeholders

- `[FEATURE]` → `Grades`
- `[feature]` → `grades`
- `[resource]` → `grade`

### Step 4: Create Files in Order

1. `app/api/grade/dto.ts` - Define data types
2. `app/api/grade/service.ts` - Business logic
3. `app/api/grade/route.ts` - API endpoints
4. `lib/api/grades.ts` - Client API wrapper
5. Update `lib/apiClient.ts` - Export API
6. `types/grade.ts` - TypeScript types
7. `ui/hooks/useGrades.ts` - Custom hook
8. `ui/features/grades/components/` - React components
9. `app/(portal)/grades/page.tsx` - Page

### Step 5: Test & Deploy

- Check terminal for errors
- Test in browser (http://localhost:3000)
- Make sure data displays

---

## 🏗️ Project Structure at a Glance

```
📂 apps/client_next/
├── 📁 app/                    ← Pages & API routes
│   ├── api/                   ← Internal Next.js API
│   │   └── [resource]/        ← Each resource has:
│   │       ├── dto.ts          - Type definitions
│   │       ├── service.ts      - Backend logic
│   │       └── route.ts        - API endpoints
│   └── (portal)/              ← User pages
│
├── 📁 ui/                     ← Components & hooks
│   ├── features/              ← Feature folders
│   │   └── [feature]/
│   │       └── components/    - React components
│   └── hooks/                 - Custom React hooks
│
└── 📁 lib/                    ← Utilities
    ├── api/                   - Client API calls
    └── apiClient.ts           - Central API config
```

---

## 🔄 Data Flow (How It Works)

When a user clicks a button:

```
User Action (Button Click)
          ↓
React Component (ui/features/[feature]/components/)
          ↓
Custom Hook (ui/hooks/use[Feature].ts)
          ↓
API Wrapper (lib/api/[feature].ts)
          ↓
API Client (lib/apiClient.ts)
          ↓
Internal API Route (app/api/[resource]/route.ts)
          ↓
Service Layer (app/api/[resource]/service.ts)
          ↓
External Backend API (via axios)
          ↓
Response Back → Component Displays Data
```

---

## 💡 Real Example: Adding a "Grades" Feature

### File 1: `app/api/grade/dto.ts`

```typescript
export interface GradeDto {
  id: number;
  studentId: number;
  assignmentId: number;
  score: number;
  feedback: string;
}
```

### File 2: `app/api/grade/service.ts`

```typescript
export async function getGrades(token?: string) {
  const axios = createAuthorizedAxios(token);
  const response = await axios.get(`/grade`);
  return response.data;
}
```

### File 3: `app/api/grade/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  const result = await gradeService.getGrades(token);
  return NextResponse.json({ success: true, data: result });
}
```

### File 4: `lib/api/grades.ts`

```typescript
export async function fetchGrades() {
  const response = await gradesAPI.getAll();
  return response.data;
}
```

### File 5: Update `lib/apiClient.ts`

```typescript
export const gradesAPI = {
  getAll: () => fetchAPI<ApiResponse<GradeDto[]>>("/grade?action=all"),
};
```

### File 6: `types/grade.ts`

```typescript
export interface Grade {
  id: number;
  studentId: number;
  assignmentId: number;
  score: number;
  feedback: string;
}
```

### File 7: `ui/hooks/useGrades.ts`

```typescript
export function useGrades() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGrades()
      .then(setGrades)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  return { grades, isLoading, error };
}
```

### File 8: `ui/features/grades/components/GradesClient.tsx`

```typescript
'use client';

export default function GradesClient() {
  const { grades, isLoading, error } = useGrades();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {grades.map(grade => (
        <div key={grade.id}>{grade.score}</div>
      ))}
    </div>
  );
}
```

### File 9: `app/(portal)/grades/page.tsx`

```typescript
import { GradesClient } from '@/ui/features/grades/components';

export default function GradesPage() {
  return <GradesClient />;
}
```

---

## ✅ Checklist Before Starting

- [ ] You have access to the codebase
- [ ] You can run `npm install` and `npm run dev`
- [ ] You understand the data you need from the backend
- [ ] You've read QUICK_FEATURE_TEMPLATE.md
- [ ] You know your feature name (will use consistently)

---

## 🆘 Troubleshooting

### "Module not found"

- Files might be in wrong location
- Check folder structure matches documentation
- Remember to export from `index.ts` files

### "Cannot read property of undefined"

- Add null checks: `item?.name ?? 'default'`
- Check component receives correct props
- Verify API returns expected data structure

### "Hook is not working"

- Did you export it from `ui/hooks/index.ts`?
- Is component marked with `'use client'`?
- Check for missing `axios` or API call issues

### "API call failing"

- Check backend is running (if not in Next.js)
- Verify token is being passed correctly
- Check network tab in browser DevTools
- Look at console for error messages

---

## 🚀 Next Steps

1. **Pick a small feature** to build (e.g., a simple list display)
2. **Open QUICK_FEATURE_TEMPLATE.md** in your favorite editor
3. **Create files in order**: DTO → Service → Route → API → Types → Hook → Components → Page
4. **Test as you go**: Check console, browser network tab, and UI
5. **Reference existing features** if you get stuck (e.g., dashboard)

---

## 📞 Need Help?

### Resources

- **Concept unclear?** → Read FEATURE_DEVELOPMENT_GUIDE.md
- **Need code template?** → Check QUICK_FEATURE_TEMPLATE.md
- **AI helper (Copilot)?** → Reference .instructions.md
- **Can't find pattern?** → Look at similar feature (dashboard, assignment)

### Common Files to Reference

- Dashboard feature: `ui/features/dashboard/`
- Class feature: `ui/features/classDashboard/`
- Auth hooks: `ui/hooks/auth` related

---

## 🎓 Learning Path

**If you're new to the project:**

1. Read this file (you are here!) ✅
2. Open FEATURE_DEVELOPMENT_GUIDE.md (full walkthrough)
3. Look at existing feature (e.g., `dashboard`)
4. Try adding a simple feature using QUICK_FEATURE_TEMPLATE.md
5. Ask questions or pair program with team member

**If you're experienced:**

1. Use QUICK_FEATURE_TEMPLATE.md (copy-paste ready)
2. Reference .instructions.md for quick checklist
3. Build feature, test, done!

---

## 💪 You Got This!

DOMROV is a well-structured project. Follow the patterns, use the templates, and ask questions when stuck. Good luck! 🚀

---

**Questions?** Ask your team or refer to the main README.md for project overview.
