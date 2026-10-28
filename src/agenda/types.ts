import type { FieldErrors } from "@/lib/booking-rules";

export type Result<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };
