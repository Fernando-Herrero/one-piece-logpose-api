import mongoose from "mongoose";
import { randomUUID } from "crypto";
import db from "../../config/db.js";
import { User } from "../users/users.model.js";
import { Post } from "./posts.model.js";

const postData = [
    {
        authorUsername: "luffy",
        text: "¡Ya tengo el LogPose actualizado! Próximo arco: aventura épica en el Grand Line.",
        visibility: "public" as const,
        hashtags: ["onepiece", "grandline"],
        mentions: [] as string[],
    },
    {
        authorUsername: "nami",
        text: "Quien quiera el mapa al All Blue que pague su parte del tesoro. Negocios son negocios.",
        visibility: "public" as const,
        hashtags: ["navegacion"],
        mentions: [] as string[],
    },
    {
        authorUsername: "zoro",
        text: "Entrenamiento de 10.000 espadazos. No molestar.",
        visibility: "public" as const,
        hashtags: ["espadachin"],
        mentions: [] as string[],
    },
    {
        authorUsername: "luffy",
        text: "Post solo para la tripulación (followers).",
        visibility: "followers" as const,
        hashtags: [] as string[],
        mentions: [] as string[],
    },
];

mongoose
    .connect(db.DB_URL)
    .then(async () => {
        const allPosts = await Post.find();

        if (allPosts.length) {
            console.log("Deleting posts collection...");
            await Post.collection.drop();
            console.log("Posts collection deleted successfully.");
        } else {
            console.log("No existing posts found, preparing to seed...");
        }
    })
    .catch((error: unknown) => console.log("There was an error when deleting posts.", error))
    .then(async () => {
        const users = await User.find();
        const byUsername = (name: string) => users.find((u) => u.username === name);

        const payload = postData.map((row) => {
            const user = byUsername(row.authorUsername);
            if (!user) {
                throw new Error(`Usuario "${row.authorUsername}" no encontrado. Ejecuta antes: npm run usersSeed`);
            }
            return {
                text: row.text,
                visibility: row.visibility,
                hashtags: row.hashtags,
                mentions: row.mentions,
                userId: user._id,
                shareToken: randomUUID(),
            };
        });

        await Post.insertMany(payload);
        console.log("Posts added successfully!");
    })
    .catch((error: unknown) => console.log("Error adding posts to database", error))
    .finally(() => {
        mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    });
