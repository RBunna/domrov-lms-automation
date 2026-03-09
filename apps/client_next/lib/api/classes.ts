export async function joinClassByCode(joinCode: string): Promise<{ classId: number; className: string; joinedAt: string }> {
    const res = await fetch("https://api.domrov.app/class/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ joinCode }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
        throw new Error(json?.error ?? "Failed to join class");
    }
    return json.data;
}
import type { ClassCard } from "@/types/classCard";

export interface CreateClassClientInput {
    name: string;
    group: string;
    generation: string;
    status?: string;
}

export async function fetchClasses(): Promise<ClassCard[]> {
    const res = await fetch("https://api.domrov.app/class/my-classes");
    const json = await res.json();
    if (json?.success && json.data) {
        // If the API returns a single class, wrap it in an array
        const data = Array.isArray(json.data) ? json.data : [json.data];
        return data as ClassCard[];
    }
    throw new Error(json?.error ?? "Failed to fetch classes");
}

export async function createClass(input: { name: string; description: string; group?: string }): Promise<ClassCard> {
    // Only include name, description, and group
    const { name, description, group } = input;
    const payload = { name, description, group };
    const res = await fetch("https://api.domrov.app/class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
        throw new Error(json?.error ?? "Failed to create class");
    }
    return json.data as ClassCard;
}

export async function deleteClass(id: string): Promise<ClassCard[]> {
    const res = await fetch(`/api/classes/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (res.ok && json?.ok) {
        return json.data as ClassCard[];
    }
    throw new Error(json?.details ?? json?.error ?? "Failed to delete class");
}

export function findClassByJoinCode(
    classes: ClassCard[],
    code: string,
): ClassCard | undefined {
    return classes.find((c) => c.joinCode === code);
}
