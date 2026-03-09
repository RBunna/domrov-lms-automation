// ---------------------------------------------------------------------------
// Volatile in-memory class store (development fallback when file writes fail)
// ---------------------------------------------------------------------------

import type { ClassCard } from "@/types/classCard";

function classKey(item: ClassCard): string {
    return String(item.id ?? item.class_id ?? JSON.stringify(item));
}

let store: ClassCard[] = [];

export function readAllVolatile(): ClassCard[] {
    return [...store];
}

export function addVolatile(item: ClassCard): void {
    store.push(item);
}

export function cleanupVolatile(persistedData: ClassCard[]): void {
    const persistedKeys = new Set(persistedData.map(classKey));
    store = store.filter((vc) => !persistedKeys.has(classKey(vc)));
}

export function deduplicate(items: ClassCard[]): ClassCard[] {
    const seen = new Set<string>();
    const result: ClassCard[] = [];
    for (const item of items) {
        const key = classKey(item);
        if (!seen.has(key)) {
            seen.add(key);
            result.push(item);
        }
    }
    return result;
}
