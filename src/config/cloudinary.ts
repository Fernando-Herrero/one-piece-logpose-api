import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createImageUploader = (folder: string) =>
    multer({
        storage: new CloudinaryStorage({ cloudinary, params: { folder } as { folder: string } }),
        fileFilter: (_req, file, callback) => {
            if (file.mimetype.includes("pdf")) return callback(new Error("No se pueden subir PDF's"));
            if (file.mimetype.startsWith("image/")) return callback(null, true);
            callback(new Error("Solo se permiten archivos de imagen"));
        },
        limits: { fileSize: 10 * 1024 * 1024 },
    });

const createPdfUploader = (folder: string) =>
    multer({
        storage: new CloudinaryStorage({ cloudinary, params: { folder } as { folder: string } }),
        fileFilter: (_req, file, callback) => {
            if (file.mimetype === "application/pdf") return callback(null, true);
            callback(new Error("Solo se permiten archivos PDF"));
        },
        limits: { fileSize: 10 * 1024 * 1024 },
    });

export const deleteFromCloudinary = async (url?: string) => {
    if (!url || !url.includes("res.cloudinary.com")) return;

    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^./]+$/);
    if (!match) return;

    const publicId = match[1];
    const resourceType = url.includes("/raw/upload/") ? "raw" : "image";

    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error) {
        console.error("No se pudo borrar el asset de Cloudinary:", publicId, error);
    }
};

const createPostMediaUploader = () =>
    multer({
        storage: new CloudinaryStorage({
            cloudinary,
            params: async (_req, file) =>
                ({
                    folder: file.mimetype === "application/pdf" ? "onepiece/pdfs" : "onepiece/posts",
                }) as { folder: string },
        }),
        fileFilter: (_req, file, callback) => {
            if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/")) {
                return callback(null, true);
            }
            callback(new Error("Solo se permiten imágenes o archivos PDF"));
        },
        limits: { fileSize: 10 * 1024 * 1024 },
    });

export const uploadAvatar = createImageUploader("onepiece/avatars");
export const uploadPdf = createPdfUploader("onepiece/pdfs");
export const uploadPostMedia = createPostMediaUploader();
