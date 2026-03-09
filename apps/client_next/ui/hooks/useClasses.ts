import { useState, useEffect, useCallback } from "react";
import { fetchClasses, deleteClass, findClassByJoinCode } from "@/lib/api/classes";
import type { ClassCard } from "@/types/classCard";

export function useClasses() {
    const [classList, setClassList] = useState<ClassCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        fetchClasses()
            .then((data) => {
                if (mounted) setClassList(data);
            })
            .catch((e) => {
                if (mounted) setError(e instanceof Error ? e.message : String(e));
                console.error("Failed to fetch classes:", e);
            })
            .finally(() => {
                if (mounted) setIsLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    const removeClass = useCallback(async (id: string) => {
        await deleteClass(id);
        setClassList((prev) => prev.filter((c) => c.id !== id));
    }, []);

    const findByJoinCode = useCallback(
        (code: string) => findClassByJoinCode(classList, code),
        [classList],
    );

    return { classList, isLoading, error, removeClass, findByJoinCode };
}
