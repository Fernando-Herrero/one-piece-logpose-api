import mongoose from "mongoose";
import { randomUUID } from "crypto";
import db from "../config/db.js";
import { User } from "./users/users.model.js";
import { Post } from "./posts/posts.model.js";
import { Comment } from "./comments/comments.model.js";
import { createNotification } from "./notifications/notifications.model.js";

const SAMPLE_IMAGES = [
    "https://picsum.photos/seed/onepiece1/800/600",
    "https://picsum.photos/seed/onepiece2/800/600",
    "https://picsum.photos/seed/onepiece3/800/600",
    "https://picsum.photos/seed/grandline/800/600",
    "https://picsum.photos/seed/thousand-sunny/800/600",
    "https://picsum.photos/seed/going-merry/800/600",
];

const SAMPLE_PDF = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

const POST_TEXTS = [
    "¡Hoy entrené con Rayleigh! El haki de rey no sale solo.",
    "Mapa del Nuevo Mundo actualizado. Quien robe un trazo, paga.",
    "Tres espadas, cero dirección. ¿Alguien sabe dónde está el barco?",
    "Cociné un festín para toda la tripulación. Sanji estaría orgulloso.",
    "Nuevo arco, nueva aventura. ¡A por el One Piece!",
    "¿Alguien más cree que este arco es el mejor de la saga?",
    "LogPose apunta al siguiente destino. Preparad las velas.",
    "Revisando teorías del Void Century en mi cuaderno.",
    "Acabo de desbloquear una carta legendaria en LogPose.",
    "Episodio 1000 revisitado. Sigue dando escalofríos.",
    "Solo para seguidores: planificación de la próxima isla.",
    "Post privado — notas de entrenamiento personales.",
    "El All Blue existe. Lo sentiré en mis huesos.",
    "¿Fruta del diablo o espadachín? El debate nunca termina.",
    "Wano quedó atrás, pero los recuerdos permanecen.",
    "Hoy vi 5 episodios seguidos. Progreso +500 XP.",
    "Mi colección de cartas de personajes ya supera las 50.",
    "¿Cuál es vuestra tripulación soñada de 10 miembros?",
    "Receta secreta del takoyaki de Wano adjunta en PDF.",
    "Fotos del último cosplay en la convención.",
    "Sin spoilers, pero el capítulo de esta semana... wow.",
    "Buscando tripulantes para raid de teorías este viernes.",
    "El sombrero de paja nunca se rinde. Nunca.",
    "Ranking personal de arcos: impugnadme en comentarios.",
];

const COMMENT_TEXTS = [
    "Totalmente de acuerdo.",
    "Yo lo veo distinto, pero respeto tu opinión.",
    "¡Gomu Gomu no mi!",
    "Esto merece más likes.",
    "¿Fuente?",
    "Acabo de guardarlo en favoritos.",
    "Gran post, capitán.",
    "Nami-san tiene razón como siempre.",
    "Zoro se habría perdido leyendo esto.",
    "Siguiente episodio cuando?",
    "Te sigo por contenido así.",
    "Jajaja me parto.",
    "Spoiler alert en el siguiente comentario...",
    "Llevo 3 relecturas y sigue siendo oro.",
    "Alguien tiene el PDF?",
];

type UserDoc = mongoose.Document & { _id: mongoose.Types.ObjectId; username: string };

const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)]!;

const pickOthers = (users: UserDoc[], exclude: UserDoc, count: number): UserDoc[] => {
    const pool = users.filter((u) => !u._id.equals(exclude._id));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
};

const chance = (probability: number) => Math.random() < probability;

const stats = {
    posts: 0,
    follows: 0,
    unfollows: 0,
    likes: 0,
    unlikes: 0,
    bookmarks: 0,
    comments: 0,
    replies: 0,
    commentLikes: 0,
    notifications: 0,
};

async function followUser(viewer: UserDoc, target: UserDoc) {
    if (viewer._id.equals(target._id)) return false;

    const freshViewer = await User.findById(viewer._id);
    const freshTarget = await User.findById(target._id);
    if (!freshViewer || !freshTarget) return false;
    if (freshViewer.following.some((id) => id.equals(target._id))) return false;

    await User.findByIdAndUpdate(viewer._id, { $addToSet: { following: target._id } });
    await User.findByIdAndUpdate(target._id, { $addToSet: { followers: viewer._id } });
    await createNotification({ type: "follow", to: target._id.toString(), from: viewer._id.toString() });
    stats.follows++;
    stats.notifications++;
    return true;
}

async function unfollowUser(viewer: UserDoc, target: UserDoc) {
    if (viewer._id.equals(target._id)) return false;

    const freshViewer = await User.findById(viewer._id);
    if (!freshViewer?.following.some((id) => id.equals(target._id))) return false;

    await User.findByIdAndUpdate(viewer._id, { $pull: { following: target._id } });
    await User.findByIdAndUpdate(target._id, { $pull: { followers: viewer._id } });
    stats.unfollows++;
    return true;
}

async function likePost(user: UserDoc, postId: mongoose.Types.ObjectId, ownerId: mongoose.Types.ObjectId) {
    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post || post.likes.some((id) => id.equals(user._id))) return false;

    await Post.findByIdAndUpdate(postId, { $addToSet: { likes: user._id }, $inc: { likesCount: 1 } });
    await createNotification({ type: "like", to: ownerId.toString(), from: user._id.toString(), postId: postId.toString() });
    stats.likes++;
    stats.notifications++;
    return true;
}

async function unlikePost(user: UserDoc, postId: mongoose.Types.ObjectId) {
    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post || !post.likes.some((id) => id.equals(user._id))) return false;

    await Post.findByIdAndUpdate(postId, { $pull: { likes: user._id }, $inc: { likesCount: -1 } });
    stats.unlikes++;
    return true;
}

async function bookmarkPost(user: UserDoc, postId: mongoose.Types.ObjectId, ownerId: mongoose.Types.ObjectId) {
    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post || post.bookmarks.some((id) => id.equals(user._id))) return false;

    await Post.findByIdAndUpdate(postId, { $addToSet: { bookmarks: user._id }, $inc: { bookmarksCount: 1 } });
    await createNotification({ type: "bookmark", to: ownerId.toString(), from: user._id.toString(), postId: postId.toString() });
    stats.bookmarks++;
    stats.notifications++;
    return true;
}

async function createCommentOnPost(
    author: UserDoc,
    postId: mongoose.Types.ObjectId,
    ownerId: mongoose.Types.ObjectId,
    parentCommentId?: mongoose.Types.ObjectId
) {
    const comment = await Comment.create({
        postId,
        author: author._id,
        text: pick(COMMENT_TEXTS),
        images: chance(0.15) ? [pick(SAMPLE_IMAGES)] : [],
        parentComment: parentCommentId,
        isReply: Boolean(parentCommentId),
        hashtags: chance(0.3) ? [pick(["onepiece", "piratas", "haki", "wano"])] : [],
        mentions: chance(0.2) ? [pick(["luffy", "nami", "zoro"])] : [],
    });

    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
    if (parentCommentId) {
        await Comment.findByIdAndUpdate(parentCommentId, { $inc: { repliesCount: 1 } });
        stats.replies++;
    } else {
        stats.comments++;
    }

    await createNotification({
        type: "comment",
        to: ownerId.toString(),
        from: author._id.toString(),
        postId: postId.toString(),
        commentId: comment._id.toString(),
    });
    stats.notifications++;

    return comment;
}

async function likeComment(user: UserDoc, commentId: mongoose.Types.ObjectId) {
    const comment = await Comment.findOne({ _id: commentId, isDeleted: false });
    if (!comment || comment.likes.some((id) => id.equals(user._id))) return false;

    await Comment.findByIdAndUpdate(commentId, { $addToSet: { likes: user._id }, $inc: { likesCount: 1 } });
    stats.commentLikes++;
    return true;
}

async function createVariedPost(author: UserDoc, users: UserDoc[]) {
    const variant = Math.floor(Math.random() * 6);
    const visibility = pick(["public", "public", "public", "followers", "private"] as const);
    const mentionTargets = pickOthers(users, author, Math.floor(Math.random() * 3));

    const base = {
        text: pick(POST_TEXTS),
        userId: author._id,
        visibility,
        shareToken: randomUUID(),
        hashtags: chance(0.5) ? [pick(["onepiece", "grandline", "piratas", "nakama", "haki"])] : [],
        mentions: mentionTargets.map((u) => u.username),
        language: "es",
    };

    switch (variant) {
        case 0:
            return Post.create(base);
        case 1:
            return Post.create({ ...base, images: [pick(SAMPLE_IMAGES)] });
        case 2:
            return Post.create({
                ...base,
                images: chance(0.5)
                    ? [pick(SAMPLE_IMAGES), pick(SAMPLE_IMAGES)]
                    : [pick(SAMPLE_IMAGES)],
            });
        case 3:
            return Post.create({ ...base, pdf: SAMPLE_PDF });
        case 4:
            return Post.create({ ...base, images: [pick(SAMPLE_IMAGES), pick(SAMPLE_IMAGES)], pdf: SAMPLE_PDF });
        case 5:
        default:
            return Post.create({ ...base, images: [pick(SAMPLE_IMAGES), pick(SAMPLE_IMAGES), pick(SAMPLE_IMAGES)] });
    }
}

async function syncCounts() {
    const posts = await Post.find({ isDeleted: false });
    for (const post of posts) {
        post.likesCount = post.likes.length;
        post.bookmarksCount = post.bookmarks.length;
        await post.save();
    }

    const comments = await Comment.find({ isDeleted: false });
    for (const comment of comments) {
        comment.likesCount = comment.likes.length;
        await comment.save();
    }
}

mongoose
    .connect(db.DB_URL)
    .then(async () => {
        const users = (await User.find()) as UserDoc[];

        if (users.length < 2) {
            throw new Error("Se necesitan al menos 2 usuarios. Ejecuta antes: npm run usersSeed");
        }

        console.log(`Usuarios encontrados: ${users.length}`);
        console.log("Generando actividad variada (sin borrar datos existentes)...\n");

        const newPosts: (mongoose.Document & { _id: mongoose.Types.ObjectId; userId: mongoose.Types.ObjectId })[] = [];

        for (let i = 0; i < 90; i++) {
            const author = pick(users);
            const post = await createVariedPost(author, users);
            newPosts.push(post);
            stats.posts++;
        }

        const allPosts = await Post.find({ isDeleted: false });
        console.log(`Posts totales activos: ${allPosts.length}`);

        for (const user of users) {
            const targets = pickOthers(users, user, Math.floor(Math.random() * 4) + 1);
            for (const target of targets) {
                if (chance(0.85)) await followUser(user, target);
            }
        }

        for (let i = 0; i < 40; i++) {
            const viewer = pick(users);
            const target = pick(users);
            if (!viewer._id.equals(target._id) && chance(0.4)) {
                await unfollowUser(viewer, target);
            }
        }

        const likedPairs: { user: UserDoc; postId: mongoose.Types.ObjectId }[] = [];

        for (let i = 0; i < 200; i++) {
            const user = pick(users);
            const post = pick(allPosts);
            const ownerId = post.userId as mongoose.Types.ObjectId;
            if (await likePost(user, post._id, ownerId)) {
                likedPairs.push({ user, postId: post._id });
            }
        }

        for (let i = 0; i < 45; i++) {
            const pair = pick(likedPairs);
            if (pair) await unlikePost(pair.user, pair.postId);
        }

        for (let i = 0; i < 120; i++) {
            const user = pick(users);
            const post = pick(allPosts);
            const ownerId = post.userId as mongoose.Types.ObjectId;
            await bookmarkPost(user, post._id, ownerId);
        }

        const createdComments: (mongoose.Document & { _id: mongoose.Types.ObjectId })[] = [];

        for (let i = 0; i < 130; i++) {
            const author = pick(users);
            const post = pick(allPosts);
            const ownerId = post.userId as mongoose.Types.ObjectId;
            const comment = await createCommentOnPost(author, post._id, ownerId);
            createdComments.push(comment);
        }

        for (let i = 0; i < 35; i++) {
            const author = pick(users);
            const parent = pick(createdComments);
            const post = await Post.findById((parent as mongoose.Document & { postId: mongoose.Types.ObjectId }).postId);
            if (!post) continue;
            const ownerId = post.userId as mongoose.Types.ObjectId;
            await createCommentOnPost(author, post._id, ownerId, parent._id);
        }

        for (let i = 0; i < 80; i++) {
            const user = pick(users);
            const comment = pick(createdComments);
            if (comment) await likeComment(user, comment._id);
        }

        await syncCounts();

        console.log("\n--- Resumen de actividad generada ---");
        console.log(`Posts nuevos:        ${stats.posts}`);
        console.log(`Follows:             ${stats.follows}`);
        console.log(`Unfollows:           ${stats.unfollows}`);
        console.log(`Likes:               ${stats.likes}`);
        console.log(`Unlikes (quitar like): ${stats.unlikes}`);
        console.log(`Bookmarks:           ${stats.bookmarks}`);
        console.log(`Comentarios:         ${stats.comments}`);
        console.log(`Respuestas:          ${stats.replies}`);
        console.log(`Likes en comentarios: ${stats.commentLikes}`);
        console.log(`Notificaciones:      ${stats.notifications}`);
        console.log("\n¡Actividad generada con éxito!");
    })
    .catch((error: unknown) => {
        console.error("Error generando actividad:", error);
        process.exitCode = 1;
    })
    .finally(() => {
        mongoose.disconnect();
        console.log("Desconectado de MongoDB.");
    });
