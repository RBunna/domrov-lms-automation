You are an AI developer assistant. I have a folder `/api`
in my old project with multiple API functions written for my backend.
I want to **refactor all API functionality into Next.js 14+ style**
inside the `frontend_next` project. 

Please do the following:

1. Move all APIs from `app/api` into `app/client_next/app/api` as **Next.js API routes**.
2. Create **one folder per feature** with `route.ts`, `service.ts`, and `dto.ts`.
3. In `service.ts`, implement external API calls using a **shared axios instance** (`/lib/axiosInstance.ts`).
4. DTOs (`dto.ts`) must define TypeScript interfaces for request and response payloads.
5. All API calls in frontend components must be refactored to call these **internal Next.js API routes**.
6. Use **Promise.all** or **Promise.allSettled** in services if multiple API calls are needed.
7. Ensure **error handling**, server-side only API calls, and proper TypeScript typing.
8. Keep feature names consistent with the original project and avoid slug conflicts.
9. Generate the **full `/app/api` folder structure** with routes, services, and DTOs ready to use.