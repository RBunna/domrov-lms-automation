// ---------------------------------------------------------------------------
// Custom error types shared across the service and transport layers
// ---------------------------------------------------------------------------

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NotFoundError";
    }
}

export class ValidationError extends Error {
    public readonly fields: Record<string, string>;
    constructor(fields: Record<string, string>) {
        const messages = Object.values(fields).join("; ");
        super(messages);
        this.name = "ValidationError";
        this.fields = fields;
    }
}
