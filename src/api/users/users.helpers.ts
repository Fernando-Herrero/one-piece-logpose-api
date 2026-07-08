import { User } from "./users.model.js";
import type { PrivacySettings } from "./users.types.js";

export type PrivacyKey = keyof PrivacySettings;

/** Campos de usuario expuestos en listas públicas (sin password). */
export const USER_PUBLIC_SELECT =
    "username firstName lastName avatar displayName verified bio privacy role isActive";

/** Resumen del autor embebido en posts (forma UserPost del frontend). */
export const POST_AUTHOR_SELECT = "username firstName lastName avatar displayName verified";

export async function findUserById(id: string) {
    return User.findById(id);
}

export function isPrivacyDenied(user: { privacy?: PrivacySettings }, key: PrivacyKey): boolean {
    return user.privacy?.[key] === false;
}

export function serializeUserSummary(user: { toJSON: () => Record<string, unknown> }) {
    return user.toJSON();
}
