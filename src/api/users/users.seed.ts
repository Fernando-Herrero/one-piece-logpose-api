import mongoose from "mongoose";
import db from "../../config/db.js";
import { User } from "./users.model.js";
import bcrypt from "bcrypt";

const userData = [
    {
        username: "luffy",
        firstName: "Monkey D.",
        lastName: "Luffy",
        email: "luffy@piratas.com",
        password: "GomuGomu123!",
        avatar: "https://i.pravatar.cc/150?u=luffy",
        bio: "Capitán de los Sombrero de Pase. Voy a ser el Rey de los Piratas.",
        role: "user" as const,
        verified: true,
    },
    {
        username: "nami",
        firstName: "Nami",
        lastName: "Navegante",
        email: "nami@piratas.com",
        password: "Clima123!",
        avatar: "https://i.pravatar.cc/150?u=nami",
        bio: "Navegante del Going Merry y del Thousand Sunny. Amo los beris y los mapas.",
        role: "user" as const,
        verified: false,
    },
    {
        username: "zoro",
        firstName: "Roronoa",
        lastName: "Zoro",
        email: "zoro@piratas.com",
        password: "Santoryu456!",
        avatar: "https://i.pravatar.cc/150?u=zoro",
        bio: "Espadachín de tres espadas. A veces me pierdo, pero nunca en un duelo.",
        role: "user" as const,
        verified: false,
    },
];

mongoose
    .connect(db.DB_URL)
    .then(async () => {
        const allUsers = await User.find();

        if (allUsers.length) {
            console.log("Deleting users collection...");
            await User.collection.drop();
            console.log("Users collection deleted successfully.");
        } else {
            console.log("No existing users found, preparing to seed...");
        }
    })
    .catch((error: unknown) => console.log("There was an error when deleting users.", error))
    .then(async () => {
        const hashedUsers = await Promise.all(
            userData.map(async (user) => ({
                ...user,
                password: await bcrypt.hash(user.password, 10),
            }))
        );
        await User.insertMany(hashedUsers);
        console.log("Users added successfully!");
    })
    .catch((error: unknown) => console.log("Error adding users to database", error))
    .finally(() => {
        mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    });
