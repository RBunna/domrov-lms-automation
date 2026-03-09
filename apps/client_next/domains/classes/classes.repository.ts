import fs from "fs";
import path from "path";
import type { ClassCard } from "@/types/classCard";

const CANDIDATE_PATHS = [
    path.join(process.cwd(), "src", "data", "classes.json"),
    path.join(process.cwd(), "data", "classes.json"),
    path.join(process.cwd(), "..", "src", "data", "classes.json"),
];

let resolvedPath: string | null = null;

function getFilePath(): string {
    if (!resolvedPath) {
        resolvedPath =
            CANDIDATE_PATHS.find((p) => fs.existsSync(p)) ?? CANDIDATE_PATHS[0];
    }
    return resolvedPath;
}

export function readAll(): ClassCard[] {
    const filePath = getFilePath();
    if (!fs.existsSync(filePath)) return [];

    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
        throw new Error("classes.json must be an array");
    }
    return parsed;
}

export function writeAll(data: ClassCard[]): void {
    const filePath = getFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const tmpFile = path.join(dir, `classes.${Date.now()}.tmp.json`);
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), { mode: 0o666 });
    fs.renameSync(tmpFile, filePath);
}

export function writeAllWithRetry(data: ClassCard[]): void {
    try {
        writeAll(data);
    } catch {
        const filePath = getFilePath();
        if (fs.existsSync(filePath)) {
            fs.chmodSync(filePath, 0o666);
        }
        writeAll(data);
    }
}
