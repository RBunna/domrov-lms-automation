/**
 * Class API wrapper functions
 * 
 * Refactored to use internal Next.js API routes via /lib/apiClient.ts
 * All external API calls now go through /api/class route handlers
 * 
 * DTOs imported from @/app/api/class/dto.ts for proper typing
 */

import { classAPI } from '@/lib/apiClient';
import type { ClassCard } from "@/types/classCard";
import type {
    GetMyClassesResponseDto,
    JoinClassResponseDto,
    ClassResponseDto,
    CreateClassDto,
} from '@/app/api/class/dto';

/**
 * Join a class using a join code
 * Calls: POST /api/class?action=join-by-code
 * 
 * @param joinCode - The class join code
 * @returns Object with classId, className, and joinedAt
 */
export async function joinClassByCode(joinCode: string): Promise<{ classId: number; className: string; joinedAt: string }> {
    try {
        // Call internal Next.js API route
        const response = await classAPI.joinByCode(joinCode);

        // Map JoinClassResponseDto to expected format
        const data = response.data;
        return {
            classId: data.classId,
            className: data.className,
            joinedAt: new Date(data.joinedAt).toISOString(),
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to join class";
        throw new Error(errorMessage);
    }
}

/**
 * Client input for creating a class (legacy interface)
 */
export interface CreateClassClientInput {
    name: string;
    group: string;
    generation: string;
    status?: string;
}

/**
 * Fetch all classes for the current user
 * Calls: GET /api/class?action=my-classes
 * 
 * @returns Array of ClassCard objects
 */
export async function fetchClasses(): Promise<ClassCard[]> {
    try {
        // Call internal Next.js API route
        const response = await classAPI.getMyClasses();

        // Response is already unwrapped by service layer, should be an array
        const data = response.data;

        // Handle both array and wrapped responses
        if (Array.isArray(data)) {
            return data as ClassCard[];
        }

        // If data is an object with a data property (shouldn't happen but fallback)
        if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as any).data)) {
            return (data as any).data as ClassCard[];
        }

        return [];
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch classes";
        throw new Error(errorMessage);
    }
}

/**
 * Create a new class
 * Calls: POST /api/class?action=create
 * 
 * @param input - Object with name, description, and optional group
 * @returns Created ClassCard object
 */
export async function createClass(input: { name: string; description: string; group?: string }): Promise<ClassCard> {
    try {
        // Map input to CreateClassDto
        const payload: CreateClassDto = {
            name: input.name,
            description: input.description,
        };

        // Call internal Next.js API route
        const response = await classAPI.create(payload);

        return response.data as ClassCard;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create class";
        throw new Error(errorMessage);
    }
}

/**
 * Delete a class by ID
 * Calls: DELETE /api/class?action=delete&classId=...
 * 
 * @param id - Class ID to delete (string for backward compatibility)
 * @returns Array of remaining ClassCard objects
 */
export async function deleteClass(id: string): Promise<ClassCard[]> {
    try {
        // Call internal Next.js API route
        const response = await classAPI.delete(parseInt(id, 10));

        // Refresh class list after deletion
        return fetchClasses();
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete class";
        throw new Error(errorMessage);
    }
}

/**
 * Find a class by its join code
 * Client-side helper function (no API call)
 * 
 * @param classes - Array of ClassCard objects to search
 * @param code - Join code to match
 * @returns Matching ClassCard or undefined
 */
export function findClassByJoinCode(
    classes: ClassCard[],
    code: string,
): ClassCard | undefined {
    return classes.find((c) => c.joinCode === code);
}
