import "dotenv/config";
import mongoose from "mongoose";

const DB_URL: string = process.env.MONGO_URI || "";

const cleanModels = (): void => {
    mongoose.modelNames().forEach((modelName: string) => {
        mongoose.model(modelName).schema.set("toJSON", {
            virtuals: true,
            transform: (_doc: mongoose.Document, ret: Record<string, unknown>) => {
                ret.id = (ret._id as mongoose.Types.ObjectId).toString();
                delete ret.__v;
                delete ret._id;
            },
        });
    });
};

const connect = async (): Promise<void> => {
    try {
        const db = await mongoose.connect(DB_URL);
        const { name, host } = db.connection;
        console.log(`DB Connected: ${name} in ${host}`);
        cleanModels();
    } catch (error) {
        console.log("Error conectando a la base de datos", error);
    }
};

export default {
    DB_URL,
    connect,
};
