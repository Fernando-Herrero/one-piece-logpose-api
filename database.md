# One Piece LogPose v3 - Diseño de API

## Descripción

One Piece LogPose v3 es una aplicación web para fans de One Piece donde los usuarios pueden:

- Seguir su progreso viendo episodios de la serie.
- Desbloquear y coleccionar cartas de personajes, frutas, espadas, barcos e ítems.
- Interactuar con otros fans a través de posts, likes y comentarios.
- Competir en rankings y obtener logros.

---

## Convenciones de la API

### Base URL

- Desarrollo: `http://localhost:3000/api`
- El frontend (`One-piece-LogPose-ts`) consume rutas relativas bajo `/api`.

### Formato de respuesta estándar

La mayoría de endpoints usan el envelope definido en `src/utils/response.utils.ts`:

**Éxito:**

```json
{
    "status": "success",
    "message": "Operación exitosa",
    "data": {}
}
```

**Error:**

```json
{
    "status": "error",
    "message": "Descripción del error",
    "code": 400
}
```

> **Excepción temporal — Auth:** Módulo documentado en Fase 2. No implementar hasta completar el resto. Cuando se implemente, auth también usará el envelope: `data: { token, user }`.

### Autenticación

- JWT en header: `Authorization: Bearer <token>`
- El token **no** se almacena en MongoDB.
- **⏸️ Fase posterior** — rutas `/api/auth/*` documentadas al final, sin carpeta en código aún.

### IDs (estándar enterprise)

| Capa | Regla |
|------|-------|
| MongoDB | `_id` (ObjectId) internamente |
| Respuestas JSON | Solo `id` (string). **Nunca** exponer `_id` ni `__v` |
| Requests | Referencias por `id` string en URLs y body |
| Comentarios | Campo interno `author`; respuesta API expone `userId` (autor poblado) |

### Nombres de usuario

- Siempre `firstName` + `lastName` + `displayName` (opcional).
- **No usar `name`** en el contrato API.

### Privacidad

- Si el perfil es privado para un campo (`showLikes`, etc.) → **403** con mensaje claro, no array vacío.

### Borrado

- Posts y comentarios: **soft delete** (`isDeleted: true`).
- Borrado físico solo en cascada al eliminar cuenta.

### Notificaciones

- Generadas **solo en servidor** al like, bookmark, comment o follow. Sin `POST /notifications` desde el cliente.

---

## Roadmap de implementación

| Fase | Módulo | Carpeta | Estado |
|------|--------|---------|--------|
| 1 | Infra (serializers, validación) | `src/utils/` | 🔜 Siguiente |
| 1 | Progreso de serie | `src/api/progress/` | 📁 Carpeta creada |
| 1 | Cartas | `src/api/cards/` | 📁 Carpeta creada |
| 2 | Usuarios (PATCH, stats, follow) | `src/api/users/` | ⚠️ Parcial |
| 2 | Posts (like, bookmark) | `src/api/posts/` | ⚠️ Parcial |
| 2 | Comentarios (like) | `src/api/comments/` | ⚠️ Parcial |
| 3 | Notificaciones | `src/api/notifications/` | 📁 Carpeta creada |
| 4 | Autenticación | `src/api/auth/` | ⏸️ Pendiente (clase no dada) |

---

## Estructura de carpetas (`src/api/`)

```
src/api/
├── users/          ✅ users.routes | controller | model | types
├── posts/          ✅ posts.routes | controller | model | types
├── comments/       ✅ comments.routes | controller | model | types
├── progress/       📁 progreso de serie + experiencia
├── cards/          📁 catálogo + colección del usuario
├── notifications/  📁 notificaciones (generadas en servidor)
└── auth/           ⏸️ se creará en Fase 4
```

Datos estáticos del catálogo de cartas (futuro):

```
src/data/catalog/
├── characters.json
├── items.json
├── fruits.json
├── swords.json
└── boats.json
```

> El catálogo es **read-only**. La colección del usuario son solo **IDs** en MongoDB; la API enriquece con datos del catálogo al responder.

---

## Funcionalidades por módulo

### 1. Autenticación

- Registrarse
- Iniciar sesión
- Cerrar sesión
- Ver perfil propio
- Editar perfil (nombre, avatar, bio, privacidad)
- Eliminar cuenta
- Actualizar configuración de privacidad

### 2. Progreso de Serie

- Marcar episodios como vistos
- Ver progreso actual (saga, arco, episodio)
- Resetear progreso
- Ganar experiencia al ver episodios
- Subir de nivel

### 3. Sistema de Cards

- Desbloquear cards al completar episodios
- Ver colección de cards
- Filtrar cards por tipo:
    - Personajes
    - Frutas
    - Espadas
    - Barcos
    - Ítems
- Ver detalles de cada card

### 4. Social / Posts

- Crear posts (texto e imágenes)
- Ver posts de otros usuarios
- Dar like a posts
- Comentar en posts
- Dar like a comentarios
- Guardar posts en favoritos (bookmarks)
- Eliminar posts propios
- Eliminar comentarios propios

### 5. Usuarios

- Ver lista de todos los usuarios
- Ver perfil de otros usuarios
- Seguir / dejar de seguir usuarios
- Ver posts de un usuario específico
- Ver likes de un usuario (si es público)
- Ver bookmarks de un usuario (si es público)
- Ver comentarios de un usuario (si es público)
- Ver estadísticas de un usuario (posts, seguidores, siguiendo)

### 6. Notificaciones

- Ver notificaciones
- Marcar notificaciones como leídas
- Ver contador de notificaciones sin leer
- Eliminar notificaciones

## Modelo de Usuario (MongoDB)

```json
interface User {
_id: ObjectId;
id: string; // virtual: _id.toString()

// Información básica
username: string; // único
firstName: string;
lastName: string;
email: string; // único
password: string; // hasheada con bcrypt

// Información adicional
displayName?: string;
bio?: string;
phoneNumber?: string;
avatar?: string; // URL
coverImage?: string; // URL
address?: string;

// Roles y estado
role: 'user' | 'admin';
verified: boolean; // si tiene cuenta premium
isActive: boolean; // si la cuenta está activa

// Gamificación
experience: number; // puntos de experiencia (default: 0)

// Progreso de la serie
serieProgress: {
saga: number; // default: 0
arc: number; // default: 0
episode: number; // default: 0
};

// Cards desbloqueadas — solo IDs (referencia al catálogo estático)
unlockedCards: {
characters: number[]; // character_id del catálogo
items: number[];      // item_id
fruits: number[];     // fruit_id
swords: number[];     // sword_id
boats: number[];      // boat_id
};

// Configuración de privacidad
privacy: {
showPosts: boolean; // default: true
showLikes: boolean; // default: true
showBookmarked: boolean; // default: true
showComments: boolean; // default: true
};

// Relaciones sociales
followers: ObjectId[]; // default: []
following: ObjectId[]; // default: []

// Relaciones futuras / opcionales
orders?: ObjectId[]; // default: []
bookings?: ObjectId[]; // default: []

// Metadata
createdAt: Date;
updatedAt: Date;
\_\_v: number; // versión de Mongoose
}
```

## Modelo de Post (MongoDB)

```json
interface Post {
    _id: ObjectId;
    id: string;

    userId: ObjectId; // ref users — en respuesta API: autor poblado (UserPost)
    text: string;
    images: string[]; // default: []

    visibility: "public" | "private" | "followers"; // default: "public"
    isDeleted: boolean; // default: false (soft delete)
    shareToken?: string; // UUID para enlaces compartidos

    isRetweet: boolean; // default: false — reservado, sin endpoint aún
    isReply: boolean; // default: false
    isPinned: boolean; // default: false
    language: string; // default: "es"

    likes: ObjectId[]; // ref users
    bookmarks: ObjectId[]; // ref users
    retweets: ObjectId[]; // ref posts — reservado

    likesCount: number; // default: 0
    bookmarksCount: number; // default: 0
    commentsCount: number; // default: 0
    retweetsCount: number; // default: 0

    hashtags: string[]; // default: []
    mentions: string[]; // default: []

    // Campos calculados en respuesta (no persistidos)
    userLiked?: boolean;
    userBookmarked?: boolean;
    comments?: Comment[];

    createdAt: Date;
    updatedAt: Date;
    __v: number;
}
```

## Modelo de Comment (MongoDB)

```json
interface Comment {
    _id: ObjectId;
    id: string;

    postId: ObjectId; // ref posts
    author: ObjectId; // ref users — en respuesta API expuesto como userId (autor poblado)

    text: string;
    images: string[]; // default: []

    likes: ObjectId[]; // ref users
    likesCount: number; // default: 0
    repliesCount: number; // default: 0

    isReply: boolean; // default: false
    parentComment?: ObjectId; // ref comments — para respuestas anidadas

    hashtags: string[]; // default: []
    mentions: string[]; // default: []
    isDeleted: boolean; // default: false
    source: string; // default: "web"
    language: string; // default: "es"

  // Campo calculado en respuesta
    liked?: boolean;

    createdAt: Date;
    updatedAt: Date;
    __v: number;
}
```

## Modelo de Notification (MongoDB)

```json
interface Notification {
    _id: ObjectId;
    id: string;

    type: "like" | "bookmark" | "comment" | "follow";

    to: ObjectId; // ref users — destinatario
    from: ObjectId; // ref users — quien genera la acción

    postId?: ObjectId; // ref posts — nullable
    commentId?: ObjectId; // ref comments — nullable

    read: boolean; // default: false

    createdAt: Date;
    updatedAt: Date;
    __v: number;
}
```

> **Nota:** Hoy el frontend crea notificaciones con `POST /notifications` tras like/bookmark/comment/follow. En esta API se recomienda **generarlas en servidor** al ejecutar esas acciones, para evitar duplicados y falsificación. Mantener `POST /notifications` por compatibilidad hasta actualizar el frontend.

---

## 🔐 1. AUTENTICACIÓN (/api/auth)

### POST /api/auth/register

Registrar un nuevo usuario.

**Request Body (frontend actual):**

```json
{
    "name": "Test3",
    "username": "testuser3",
    "email": "test3@example.com",
    "password": "123456",
    "lastName": "User3",
    "role": "user",
    "avatar": "/pictures/user/custom-avatar.jpg"
}
```

> **Mapeo pendiente:** el frontend envía `name` en lugar de `firstName`. Confirmar si `name` → `firstName` en el backend.

**Request Body (modelo MongoDB):**

```json
{
    "username": "testuser3",
    "firstName": "Test3",
    "lastName": "User3",
    "email": "test3@example.com",
    "password": "123456",
    "avatar": "/pictures/user/custom-avatar.jpg",
    "role": "user"
}
```

**Response Success (201 Created):**

```json
{
  "user": { "...usuario creado sin password..." },
  "token": "<JWT_GENERADO>",
  "message": "Usuario registrado con exito"
}
```

**Response Error (400 Bad Request):**

```json
{ "error": "Email already exists" }
{ "error": "Username already exists" }
{ "error": "Password must be at least 6 characters" }
```

### POST /api/auth/login

Iniciar sesión con email y contraseña.
**Request Body:**

```json
{
    "email": "test3@example.com",
    "password": "123456"
}
```

**Response Success (200 OK):**

```json
{
  "user": { "...usuario completo..." },
  "token": "<JWT_GENERADO>"
}
```

**Response Error:**

```json
401 Unauthorized:
{ "error": "Invalid email or password" }
403 Forbidden:
{ "error": "Account is not active" }
```

### POST /api/auth/logout

Cerrar sesión del usuario actual.
Auth requerida: ✅ Sí (Bearer Token)
**Response Success (200 OK):**

```json
{ "message": "Logout successful" }
```

**Response Error (401 Unauthorized):**

```json
{ "error": "No token provided" }
{ "error": "Invalid token" }
```

### GET /api/auth/me

Auth requerida: ✅ Sí

**Response Success (200 OK):**

```json
{ "user": { "...usuario completo sin password..." } }
```

**Response Error:**

```json
401 Unauthorized:
{ "error": "No token provided" } / { "error": "Invalid token" }

404 Not Found:
{ "error": "User not found" }
```

## 👤 2. USUARIOS (/api/users)

> Rutas de **datos del usuario**: perfil, relaciones sociales, listados de actividad.

### GET /api/users

Listar todos los usuarios (sin password).

**Auth requerida:** ✅ Sí

**Response Success (200 OK):**

```json
{
    "status": "success",
    "message": "Operación exitosa",
    "data": [{ "...usuario sin password..." }]
}
```

---

### GET /api/users/:userId

Obtener un usuario por ID.

**Auth requerida:** ✅ Sí

**Response Success (200 OK):** usuario en `data` (sin password).

**Response Error (404):** `{ "status": "error", "message": "Usuario no encontrado", "code": 404 }`

---

### PATCH /api/users/:userId

Actualizar perfil del usuario (propio o admin).

**Auth requerida:** ✅ Sí

**Request Body (parcial):**

```json
{
    "firstName": "Luffy",
    "lastName": "Monkey",
    "displayName": "Straw Hat",
    "bio": "...",
    "avatar": "/pictures/user/avatar.jpg",
    "coverImage": "/pictures/user/cover.jpg",
    "privacy": {
        "showPosts": true,
        "showLikes": false,
        "showBookmarked": false,
        "showComments": true
    },
    "verified": true
}
```

> Perfil, privacidad y premium. **Progreso y cartas** van en `/api/progress` y `/api/cards`, no aquí.

**Response Success (200 OK):** usuario actualizado en `data`.

---

### DELETE /api/users/:userId

Eliminar cuenta (cascada: posts del usuario, comentarios en esos posts, comentarios del usuario como autor).

**Auth requerida:** ✅ Sí

**Response Success (200 OK):**

```json
{
    "status": "success",
    "message": "Usuario eliminado",
    "data": {
        "ok": "true",
        "removed": { "...usuario eliminado..." }
    }
}
```

> El frontend espera `{ ok, removed }` en el body de respuesta (puede ir dentro de `data` del envelope).

---

### GET /api/users/me/stats

Estadísticas del usuario autenticado.

**Auth requerida:** ✅ Sí

**Response Success (200 OK):**

```json
{
    "status": "success",
    "message": "Operación exitosa",
    "data": {
        "myPosts": 12,
        "likedPosts": 34,
        "bookmarkedPosts": 8,
        "commentedPosts": 5,
        "totalComments": 45
    }
}
```

---

### GET /api/users/me/my-posts

**Auth requerida:** ✅ Sí

**Response Success (200 OK):** array de `Post` en `data`.

---

### GET /api/users/me/liked-posts

**Auth requerida:** ✅ Sí

**Response Success (200 OK):** array de `Post` en `data`.

---

### GET /api/users/me/bookmarked-posts

**Auth requerida:** ✅ Sí

**Response Success (200 OK):** array de `Post` en `data`.

---

### GET /api/users/me/commented-posts

**Auth requerida:** ✅ Sí

**Response Success (200 OK):** array de posts donde el usuario ha comentado, en `data`.

---

### GET /api/users/:userId/posts

Posts públicos de un usuario (respetar `privacy.showPosts`).

**Auth requerida:** ✅ Sí

**Response Success (200 OK):**

```json
{
    "status": "success",
    "message": "Operación exitosa",
    "data": [{ "...POST..." }]
}
```

---

### GET /api/users/:userId/liked-posts

**Auth requerida:** ✅ Sí (respetar `privacy.showLikes`)

**Response Success (200 OK):** array de `Post` en `data`.

---

### GET /api/users/:userId/bookmarked-posts

**Auth requerida:** ✅ Sí (respetar `privacy.showBookmarked`)

**Response Success (200 OK):** array de `Post` en `data`.

---

### GET /api/users/:userId/commented-posts

**Auth requerida:** ✅ Sí (respetar `privacy.showComments`)

**Response Success (200 OK):** array de `Post` en `data`.

---

### GET /api/users/:userId/stats

**Auth requerida:** ✅ Sí

**Response Success (200 OK):**

```json
{
    "status": "success",
    "message": "Operación exitosa",
    "data": {
        "myPosts": 12,
        "likedPosts": 34,
        "bookmarkedPosts": 8,
        "commentedPosts": 5,
        "totalComments": 45
    }
}
```

---

### GET /api/users/:userId/followers

**Auth requerida:** ✅ Sí

**Response Success (200 OK):** array de usuarios (resumen, sin password) en `data`.

---

### GET /api/users/:userId/following

**Auth requerida:** ✅ Sí

**Response Success (200 OK):** array de usuarios en `data`.

---

### POST /api/users/:userId/follow

Seguir a un usuario.

**Auth requerida:** ✅ Sí

**Response Success (200 OK):**

```json
{
    "status": "success",
    "message": "Operación exitosa",
    "data": {
        "message": "Ahora sigues a @username",
        "following": true,
        "followersCount": 35,
        "followingCount": 21
    }
}
```

---

### POST /api/users/:userId/unfollow

Dejar de seguir a un usuario.

**Auth requerida:** ✅ Sí

**Response Success (200 OK):** misma forma que follow, con `following: false`.

---

## 📝 3. POSTS (/api/posts)

### GET /api/posts/id

**Response Success (200 OK):**

```json
 {
        "id": "postId",
        "userId": {USER},
        "text": "string",
        "isRetweet": boolean,
        "isReply": boolean,
        "isPublic": boolean,
        "isPinned": boolean,
        "isDeleted": boolean,
        "language": "string",
        "createdAt": "2026-01-21T11:47:31.576Z",
        "updatedAt": "2026-01-21T13:23:37.586Z",
        "__v": number,
        "userLiked": boolean,
        "userBookmarked": boolean,
        "likesCount": Number,
        "bookmarksCount": Number,
        "commentsCount": Number,
        "retweetsCount": Number,
        "likes": [],
        "bookmarks": [],
        "comments": [
            {
                "id": "commentId",
                "postId": "postId",
                "userId": {USER},
                "text": "string",
                "images": [],
                "likes": [],
                "likesCount": number,
                "repliesCount": number,
                "isReply": boolean,
                "hashtags": [],
                "mentions": [],
                "isDeleted": boolean,
                "source": "string",
                "language": "string",
                "createdAt": "2026-01-21T13:23:37.228Z",
                "updatedAt": "2026-01-21T13:23:37.228Z",
                "__v": number,
            }
        ],
        "images": [],
        "hashtags": [],
        "mentions": [],
        "retweets": [],
    },
```

**Response Error:**

```json
{ "error": "Post not found" }
```

### GET /api/posts

**Response Success (200 OK):**

```json
[
  {POST},
  {POST}...
]
```

**Response Error (500 Internal Server Error):**

```json
{ "error": "Unable to fetch posts" }
```

### POST /api/posts

Crear un nuevo post.

**Auth requerida:** ✅ Sí (Bearer Token)

**Request Body:**

```json
{
    "text": "Mi nuevo post sobre One Piece!",
    "images": ["/uploads/my-image.jpg"],
    "visibility": "public"
}
```

**Campos requeridos:**

- `text` - string (mínimo 1 carácter, máximo 600 si verified, 280 si no)

**Campos opcionales:**

- `images` - array de strings (URLs)

**Response Success (201 Created):**

```json
{
   POST
}
```

**Response Error (400 Bad Request):**

```json
{ "error": "Text is required" }
```

```json
{ "error": "Text exceeds maximum length (280 characters)" }
```

**Response Error (401 Unauthorized):**

```json
{ "error": "No token provided" }
```

---

### POST /api/posts/:id/like

Dar o quitar like a un post.

**Auth requerida:** ✅ Sí (Bearer Token)

**Response Success (200 OK):**

```json
{
    "liked": true,
    "likesCount": 26,
    "userLiked": true
}
```

**Response Error (404 Not Found):**

```json
{ "error": "Post not found" }
```

**Response Error (401 Unauthorized):**

```json
{ "error": "No token provided" }
```

**Lógica:**

- Si el usuario ya dio like → quitar like (toggle)
- Si el usuario no ha dado like → añadir like
- Actualizar `likesCount` del post
- Añadir/quitar el userId del array `likes`

---

### POST /api/posts/:id/bookmark

Guardar o quitar de favoritos un post.

**Endpoint:** `POST /api/posts/:id/bookmark`
**Auth requerida:** ✅ Sí (Bearer Token)

**Response Success (200 OK):**

```json
{
    "bookmarked": true,
    "bookmarksCount": 9
}
```

```json
{
    "bookmarked": false,
    "bookmarksCount": 8
}
```

**Response Error (404 Not Found):**

```json
{ "error": "Post not found" }
```

**Response Error (401 Unauthorized):**

```json
{ "error": "No token provided" }
```

**Lógica:**

- Si el usuario ya guardó el post → quitar bookmark (toggle)
- Si el usuario no ha guardado → añadir bookmark
- Actualizar `bookmarksCount` del post
- Añadir/quitar el userId del array `bookmarks`

---

### PUT /api/posts/:id

Editar un post (solo autor).

**Auth requerida:** ✅ Sí

**Request Body (parcial):** `text`, `images`, `visibility`, etc.

**Response Success (200 OK):** post actualizado en `data`.

---

### DELETE /api/posts/:id

Eliminar un post.

**Endpoint:** `DELETE /api/posts/:id`
**Auth requerida:** ✅ Sí (Bearer Token)
**Permiso:** Solo el autor del post puede eliminarlo

**Response Success (200 OK):**

```json
{ "message": "Post deleted successfully" }
```

**Response Error (404 Not Found):**

```json
{ "error": "Post not found" }
```

**Response Error (403 Forbidden):**

```json
{ "error": "You are not authorized to delete this post" }
```

**Response Error (401 Unauthorized):**

```json
{ "error": "No token provided" }
```

---

## 💬 4. COMENTARIOS (/api/comments)

> El frontend usa **`POST /api/comments`** (no `/api/posts/:id/comments`). El modelo MongoDB guarda `author`; la respuesta API expone `userId` poblado.

### GET /api/comments/post/:postId

Listar comentarios de un post (con autor y respuestas anidadas si aplica).

**Auth requerida:** ❌ No (puede requerirse según visibilidad del post)

**Response Success (200 OK):**

```json
{
    "status": "success",
    "message": "Operación exitosa",
    "data": [
        {
            "id": "commentId",
            "postId": "postId",
            "userId": {
                "id": "userId",
                "username": "testuser",
                "firstName": "Test",
                "lastName": "User",
                "displayName": "Test User",
                "avatar": "/pictures/user/default-avatar.png",
                "verified": false
            },
            "text": "Excelente post!",
            "images": [],
            "likes": [],
            "likesCount": 0,
            "repliesCount": 0,
            "isReply": false,
            "hashtags": [],
            "mentions": [],
            "isDeleted": false,
            "source": "web",
            "language": "es",
            "createdAt": "2026-03-09T16:05:00.000Z",
            "updatedAt": "2026-03-09T16:05:00.000Z",
            "__v": 0
        }
    ]
}
```

---

### POST /api/comments

Crear comentario en un post.

**Auth requerida:** ✅ Sí

**Request Body:**

```json
{
    "postId": "postId",
    "text": "Excelente post!",
    "images": []
}
```

**Campos requeridos:** `postId`, `text`

**Campos opcionales:** `images`, `parentComment` (para respuestas)

**Lógica:**

- Resolver `author` desde el JWT
- Si hay `parentComment`, marcar `isReply: true`
- Incrementar `commentsCount` del post
- Crear notificación al autor del post (recomendado en servidor)

**Response Success (201 Created):** comentario creado en `data` (misma forma que GET).

---

### POST /api/comments/:id/like

Toggle like en comentario.

**Auth requerida:** ✅ Sí

**Response Success (200 OK):**

```json
{
    "status": "success",
    "message": "Operación exitosa",
    "data": {
        "liked": true,
        "likesCount": 3,
        "message": "Like actualizado"
    }
}
```

---

### DELETE /api/comments/:id

Eliminar comentario (solo autor o admin).

**Auth requerida:** ✅ Sí

**Lógica:**

- Eliminar respuestas hijas (`parentComment`)
- Recalcular `commentsCount` del post
- Soft delete opcional (`isDeleted: true`) vs hard delete

**Response Success (200 OK):** comentario eliminado en `data`.

---

## 🔔 5. NOTIFICACIONES (/api/notifications)

### POST /api/notifications

~~Crear notificación desde el cliente.~~ **Deprecado** — las notificaciones se generan en servidor. Se eliminará del frontend.

---

### GET /api/notifications

Listar notificaciones del usuario autenticado (`to` = userId del token).

**Auth requerida:** ✅ Sí

**Response Success (200 OK):** **array** en `data` (el frontend trata la respuesta como lista).

---

### GET /api/notifications/unread-count

**Auth requerida:** ✅ Sí

**Response Success (200 OK):**

```json
{
    "status": "success",
    "message": "Operación exitosa",
    "data": { "count": 5 }
}
```

---

### PUT /api/notifications/:notifyId/read

Marcar una notificación como leída.

**Auth requerida:** ✅ Sí

**Response Success (200 OK):** notificación actualizada en `data`.

---

### PUT /api/notifications/mark-all-read

**Auth requerida:** ✅ Sí

**Response Success (200 OK):**

```json
{
    "status": "success",
    "message": "Operación exitosa",
    "data": {
        "message": "Notificaciones marcadas como leídas",
        "modifiedCount": 12
    }
}
```

---

### DELETE /api/notifications/:notifyId

**Auth requerida:** ✅ Sí

**Response Success (200 OK):** notificación eliminada en `data`.

---

### DELETE /api/notifications

Eliminar todas las notificaciones del usuario autenticado.

**Auth requerida:** ✅ Sí

**Response Success (200 OK):**

```json
{
    "status": "success",
    "message": "Operación exitosa",
    "data": {
        "ok": true,
        "message": "Notificaciones eliminadas",
        "deletedCount": 12
    }
}
```

---

---

## 🎴 6. PROGRESO DE SERIE (/api/progress)

> Módulo: `src/api/progress/`  
> Reemplaza la persistencia en `localStorage` (`episode_*`, progreso suelto). Auth requerida en todas las rutas (cuando exista el middleware).

### GET /api/progress/me

Obtener progreso y experiencia del usuario autenticado.

**Response Success (200 OK):**

```json
{
    "status": "success",
    "message": "Operación exitosa",
    "data": {
        "serieProgress": { "saga": 1, "arc": 2, "episode": 15 },
        "experience": 120
    }
}
```

---

### PATCH /api/progress/me

Actualizar progreso manualmente (ej. reset parcial desde settings).

**Request Body (parcial):**

```json
{
    "serieProgress": { "saga": 0, "arc": 0, "episode": 0 },
    "experience": 0
}
```

---

### POST /api/progress/me/episodes/:episodeId/complete

Marcar episodio como visto. **Endpoint principal** usado al marcar checkbox en la UI de serie.

**Request Body:**

```json
{
    "sagaId": 1,
    "arcId": 2,
    "experienceGain": 10,
    "cardsToUnlock": {
        "characters": [1, 13],
        "items": [],
        "fruits": [3],
        "swords": [],
        "boats": []
    }
}
```

**Lógica:**

1. Validar que el episodio no estaba ya completado (evitar duplicar XP/cartas).
2. Actualizar `serieProgress` si el nuevo progreso es mayor.
3. Sumar `experienceGain` a `experience`.
4. Añadir IDs nuevos a `unlockedCards` (sin duplicar).
5. Responder con progreso actualizado + cartas recién desbloqueadas.

**Response Success (200 OK):**

```json
{
    "status": "success",
    "message": "Episodio completado",
    "data": {
        "serieProgress": { "saga": 1, "arc": 2, "episode": 15 },
        "experience": 130,
        "newlyUnlocked": {
            "characters": [{ "id": 13, "name": "Roronoa Zoro", "..." }],
            "items": [],
            "fruits": [{ "id": 3, "name": "Gomu Gomu no Mi", "..." }],
            "swords": [],
            "boats": []
        }
    }
}
```

> **Mejora vs frontend actual:** hoy el cliente calcula desbloqueos y guarda objetos completos en `localStorage`. La API centraliza la lógica y solo persiste IDs.

---

### DELETE /api/progress/me

Resetear progreso de serie, experiencia y cartas desbloqueadas.

**Response Success (200 OK):**

```json
{
    "status": "success",
    "message": "Progreso reseteado",
    "data": {
        "serieProgress": { "saga": 0, "arc": 0, "episode": 0 },
        "experience": 0,
        "unlockedCards": {
            "characters": [],
            "items": [],
            "fruits": [],
            "swords": [],
            "boats": []
        }
    }
}
```

---

## 🃏 7. CARTAS (/api/cards)

> Módulo: `src/api/cards/`  
> Separación clara entre **catálogo** (datos fijos One Piece) y **colección** (IDs del usuario).

### Arquitectura de tres capas

```
┌─────────────────────────────────────────────────────────┐
│  CATÁLOGO (read-only)                                   │
│  src/data/catalog/*.json                                │
│  Mismos datos que frontend/serieData hoy                │
│  IDs: character_id, item_id, fruit_id, sword_id, boat_id│
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ referencia por ID
┌─────────────────────────────────────────────────────────┐
│  COLECCIÓN DEL USUARIO (MongoDB → User.unlockedCards)   │
│  Solo arrays de números, sin duplicados                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ enriquecimiento en respuesta
┌─────────────────────────────────────────────────────────┐
│  RESPUESTA API                                          │
│  Objetos completos de carta para la UI                  │
└─────────────────────────────────────────────────────────┘
```

### Tipos de carta

| Tipo | ID en catálogo | Campos principales |
|------|----------------|-------------------|
| `characters` | `character_id` (number) | name, crew, position, image, type, abilities, bounty |
| `items` | `item_id` (number) | name, type, owner, origin, image |
| `fruits` | `fruit_id` (number) | name, roman_name, type, description, current_user, image |
| `swords` | `sword_id` (number) | name, grade, type, description, current_owner, image |
| `boats` | `boat_id` (number) | name, type, crew, description, image |

### Modelo de referencia — Carta en catálogo (no es documento MongoDB)

```json
{
    "id": 1,
    "type": "character",
    "name": "Monkey D. Luffy",
    "image": "/assets/images/cards/luffy.webp",
    "rarity": ["common", "uncommon", "rare", "legendary"],
    "metadata": { "...campos específicos del tipo..." }
}
```

> En respuestas API, cada carta incluye `id` (estandarizado) además del campo legacy del catálogo si hace falta durante la migración del frontend.

---

### GET /api/cards/catalog

Catálogo completo (todos los tipos). Solo lectura.

**Auth requerida:** ❌ No

**Response Success (200 OK):**

```json
{
    "status": "success",
    "message": "Operación exitosa",
    "data": {
        "characters": [],
        "items": [],
        "fruits": [],
        "swords": [],
        "boats": [],
        "totals": {
            "characters": 50,
            "items": 30,
            "fruits": 20,
            "swords": 15,
            "boats": 10,
            "all": 125
        }
    }
}
```

---

### GET /api/cards/catalog/:type

Filtrar catálogo por tipo: `characters` | `items` | `fruits` | `swords` | `boats`.

**Auth requerida:** ❌ No

---

### GET /api/cards/me

Colección del usuario autenticado — IDs resueltos contra el catálogo.

**Auth requerida:** ✅ Sí

**Response Success (200 OK):**

```json
{
    "status": "success",
    "message": "Operación exitosa",
    "data": {
        "unlocked": {
            "characters": [{ "id": 1, "name": "Monkey D. Luffy", "..." }],
            "items": [],
            "fruits": [],
            "swords": [],
            "boats": []
        },
        "counts": {
            "characters": 1,
            "items": 0,
            "fruits": 0,
            "swords": 0,
            "boats": 0,
            "total": 1
        },
        "progress": {
            "characters": "1/50",
            "items": "0/30",
            "fruits": "0/20",
            "swords": "0/15",
            "boats": "0/10",
            "total": "1/125"
        }
    }
}
```

---

### GET /api/cards/me/:type

Colección filtrada por tipo (`characters`, `items`, etc.).

**Auth requerida:** ✅ Sí

---

### GET /api/cards/users/:userId

Ver colección pública de otro usuario (solo si el perfil lo permite — definir regla en Fase 2).

**Auth requerida:** ✅ Sí

---

### Migración desde localStorage (frontend)

| Antes (frontend) | Después (API) |
|------------------|---------------|
| `localStorage` key `unlockedCards_<userId>` con objetos completos | `User.unlockedCards` con solo IDs |
| `localStorage` key `episode_<id>_<userId>` | Registro de episodios completados en servidor (via `POST .../complete`) |
| Cliente calcula desbloqueos | Servidor valida y persiste en `POST .../complete` |

**No implementado en frontend (reservado en modelos):**

- Retweets (`retweets`, `retweetsCount`) — sin endpoints
- `orders`, `bookings` en User — sin uso en UI

---

## 📋 Resumen de rutas (contrato frontend)

| Método | Ruta | Estado en api-onepiece |
|--------|------|------------------------|
| POST | `/auth/register` | ❌ Pendiente |
| POST | `/auth/login` | ❌ Pendiente |
| POST | `/auth/logout` | ❌ Pendiente |
| GET | `/auth/me` | ❌ Pendiente |
| GET | `/users` | ✅ Básico |
| GET | `/users/:id` | ✅ Básico |
| POST | `/users` | ✅ Básico (sin auth) |
| PUT | `/users/:id` | ✅ Básico (usar PATCH en spec) |
| PATCH | `/users/:id` | ❌ Pendiente |
| DELETE | `/users/:id` | ✅ Con cascada |
| GET | `/users/me/stats` | ❌ Pendiente |
| GET | `/users/me/my-posts` | ❌ Pendiente |
| GET | `/users/me/liked-posts` | ❌ Pendiente |
| GET | `/users/me/bookmarked-posts` | ❌ Pendiente |
| GET | `/users/me/commented-posts` | ❌ Pendiente |
| GET | `/users/:id/posts` | ⚠️ Parcial (`/posts/user/:userId`) |
| GET | `/users/:id/liked-posts` | ❌ Pendiente |
| GET | `/users/:id/bookmarked-posts` | ❌ Pendiente |
| GET | `/users/:id/commented-posts` | ❌ Pendiente |
| GET | `/users/:id/stats` | ❌ Pendiente |
| GET | `/users/:id/followers` | ❌ Pendiente |
| GET | `/users/:id/following` | ❌ Pendiente |
| POST | `/users/:id/follow` | ❌ Pendiente |
| POST | `/users/:id/unfollow` | ❌ Pendiente |
| GET | `/posts` | ✅ Básico |
| GET | `/posts/:id` | ✅ Básico |
| POST | `/posts` | ✅ Básico |
| PUT | `/posts/:id` | ✅ Básico |
| DELETE | `/posts/:id` | ✅ Básico |
| POST | `/posts/:id/like` | ❌ Pendiente |
| POST | `/posts/:id/bookmark` | ❌ Pendiente |
| GET | `/comments/post/:postId` | ✅ Básico |
| POST | `/comments` | ✅ Básico |
| DELETE | `/comments/:id` | ✅ Básico |
| POST | `/comments/:id/like` | ❌ Pendiente |
| POST | `/notifications` | 🚫 Deprecado (solo servidor) |
| GET | `/notifications` | ❌ Pendiente |
| GET | `/notifications/unread-count` | ❌ Pendiente |
| PUT | `/notifications/:id/read` | ❌ Pendiente |
| PUT | `/notifications/mark-all-read` | ❌ Pendiente |
| DELETE | `/notifications/:id` | ❌ Pendiente |
| DELETE | `/notifications` | ❌ Pendiente |
| GET | `/progress/me` | ❌ Pendiente |
| PATCH | `/progress/me` | ❌ Pendiente |
| POST | `/progress/me/episodes/:episodeId/complete` | ❌ Pendiente |
| DELETE | `/progress/me` | ❌ Pendiente |
| GET | `/cards/catalog` | ❌ Pendiente |
| GET | `/cards/catalog/:type` | ❌ Pendiente |
| GET | `/cards/me` | ❌ Pendiente |
| GET | `/cards/me/:type` | ❌ Pendiente |
| GET | `/cards/users/:userId` | ❌ Pendiente |

---

## ✅ Estándares acordados

| Tema | Decisión |
|------|----------|
| Nombre usuario | `firstName` + `lastName` (no `name`) |
| IDs en JSON | Solo `id` string; nunca `_id` |
| Respuestas | Envelope `{ status, message, data }` en todos los endpoints |
| Privacidad | 403 cuando el contenido es privado |
| Notificaciones | Solo servidor; sin POST desde cliente |
| Borrado | Soft delete en posts/comentarios |
| Cartas | IDs en MongoDB; catálogo estático en `src/data/catalog/` |
| Progreso | Módulo dedicado `/api/progress`; no localStorage |
| Auth | Fase 4 — documentado, no implementar aún |

---

## ⏸️ Fase 4 — Autenticación (documentado, no implementar)

> Rutas `/api/auth/*` existentes en este documento (sección 1) quedan como referencia para cuando des la parte de autenticación. Carpeta `src/api/auth/` se creará entonces.

---

## Referencia frontend

Proyecto consumidor: `MASTER-PROGRAMACION/5-REACT/PROYECTOS/ONE-PIECE-LOGPOSE-FOLDER/One-piece-LogPose-ts`

Archivos clave del contrato:

- `src/core/auth/auth.api.ts`
- `src/core/user/user.api.ts`
- `src/core/posts/posts.api.ts`
- `src/core/notifications/notifications.api.ts`
- `src/core/auth/auth.types.ts`
- `src/core/posts/posts.api.types.ts`
