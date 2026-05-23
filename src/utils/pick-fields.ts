/**
 * Extrae del body solo las claves permitidas.
 * Si el cliente manda { bio: "...", role: "admin" }, role se ignora.
 */

export const pickFields = (
    source: Record<string, unknown>,
    allowedFields: readonly string[]
): Record<string, unknown> => {
    const result: Record<string, unknown> = {};

    for (const field of allowedFields) {
        if (field in source && source[field] !== undefined) {
            result[field] = source[field];
        }
    }

    return result;
};
