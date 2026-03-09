import { readAll, writeAllWithRetry } from "@/domains/classes/classes.repository";
import {
    readAllVolatile,
    addVolatile,
    cleanupVolatile,
    deduplicate,
} from "@/infrastructure/storage/volatileStore";
import { NotFoundError, ValidationError } from "@/lib/api/errors";
import { CLASS_GRADIENTS, CLASS_ACCENT_COLORS } from "@/config/class";
import type { ClassCard, CreateClassInput } from "@/types/classCard";

export { NotFoundError, ValidationError } from "@/lib/api/errors";
export type { CreateClassInput } from "@/types/classCard";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateCreateInput(
    input: CreateClassInput,
): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!input.name?.trim()) {
        errors.name = "Class name is required";
    } else if (input.name.trim().length < 3) {
        errors.name = "Class name must be at least 3 characters";
    }

    if (!input.group?.trim()) {
        errors.group = "Group is required";
    }

    if (!input.generation?.trim()) {
        errors.generation = "Generation is required";
    }

    return errors;
}

// ---------------------------------------------------------------------------
// ID & code generation
// ---------------------------------------------------------------------------

function generateClassId(): number {
    return Date.now();
}

function generateJoinCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function randomStyleIndex(): number {
    return Math.floor(Math.random() * CLASS_GRADIENTS.length);
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export function getAllClasses(): ClassCard[] {
    const fileData = readAll();
    return deduplicate([...fileData, ...readAllVolatile()]);
}

export function addClass(
    input: CreateClassInput,
): { data: ClassCard[]; volatile: boolean } {
    const validationErrors = validateCreateInput(input);
    if (Object.keys(validationErrors).length > 0) {
        throw new ValidationError(validationErrors);
    }

    const idx = randomStyleIndex();
    const now = generateClassId();

    const newClass: ClassCard = {
        class_id: now,
        id: now.toString(),
        name: input.name.trim(),
        group: input.group.trim(),
        generation: input.generation.trim(),
        description: input.description?.trim() ?? "",
        join_code: generateJoinCode(),
        owner_id: input.owner_id ?? 1,
        cover_image_url: input.cover_image_url ?? "",
        status: input.status ?? "active",
        track: input.group.trim(),
        term: "Term1",
        accent: CLASS_ACCENT_COLORS[idx],
        gradient: CLASS_GRADIENTS[idx],
    };

    const existing = readAll();
    const updated = [...existing, newClass];

    try {
        writeAllWithRetry(updated);
        cleanupVolatile(updated);
        return {
            data: deduplicate([...updated, ...readAllVolatile()]),
            volatile: false,
        };
    } catch {
        addVolatile(newClass);
        return {
            data: deduplicate([...existing, ...readAllVolatile()]),
            volatile: true,
        };
    }
}

export function removeClassById(id: string): ClassCard[] {
    const data = readAll();
    const filtered = data.filter((c: ClassCard) => {
        const cid = String(c.id || c.class_id || "");
        return cid !== id;
    });

    if (filtered.length === data.length) {
        throw new NotFoundError(`No class with id: ${id}`);
    }

    writeAllWithRetry(filtered);
    return filtered;
}
