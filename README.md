# One Piece LogPose v3 — API

API REST con **Node.js**, **Express 5**, **TypeScript**, **MongoDB** y **Mongoose** para fans de One Piece: progreso de la serie, colección de cards, interacción social y gamificación.

Este documento recoge la **especificación completa** del producto (modelo de datos y contrato de API). Al final incluye una sección sobre **lo que está implementado hoy en este repositorio** frente a esa especificación.

---

## Descripción

One Piece LogPose v3 es una aplicación web para fans de One Piece donde los usuarios pueden:

- Seguir su progreso viendo episodios de la serie.
- Desbloquear y coleccionar cartas de personajes, frutas, espadas, barcos e ítems.
- Interactuar con otros fans a través de posts, likes y comentarios.
- Competir en rankings y obtener logros.

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

### 2. Progreso de serie

- Marcar episodios como vistos
- Ver progreso actual (saga, arco, episodio)
- Resetear progreso
- Ganar experiencia al ver episodios
- Subir de nivel

### 3. Sistema de cards

- Desbloquear cards al completar episodios
- Ver colección de cards
- Filtrar cards por tipo:
  - Personajes
  - Frutas
  - Espadas
  - Barcos
  - Ítems
- Ver detalles de cada card

### 4. Social / posts

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

---

## Modelo de usuario (MongoDB) — especificación

El token JWT se entrega en el flujo de autenticación; en el documento persistido en base de datos no se guarda como campo del usuario.

```json
{
  "id": "ObjectId",

  "username": "string, único",
  "firstName": "string",
  "lastName": "string",
  "email": "string, único",
  "password": "string, hasheada con bcrypt",

  "displayName": "string, opcional",
  "bio": "string, opcional",
  "phoneNumber": "string, opcional",
  "avatar": "string, URL, opcional",
  "coverImage": "string, URL, opcional",
  "address": "string, opcional",

  "role": "user | admin",
  "verified": "boolean, cuenta premium",
  "isActive": "boolean",

  "experience": "number, default 0",

  "serieProgress": {
    "saga": "number, default 0",
    "arc": "number, default 0",
    "episode": "number, default 0"
  },

  "unlockedCards": {
    "characters": "number[], default []",
    "items": "number[], default []",
    "fruits": "number[], default []",
    "swords": "number[], default []",
    "boats": "number[], default []"
  },

  "privacy": {
    "showPosts": "boolean, default true",
    "showLikes": "boolean, default true",
    "showBookmarked": "boolean, default true",
    "showComments": "boolean, default true"
  },

  "followers": "ObjectId[], default []",
  "following": "ObjectId[], default []",

  "orders": "ObjectId[], opcional",
  "bookings": "ObjectId[], opcional",

  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## Autenticación — `/api/auth`

### POST `/api/auth/register`

Registrar un nuevo usuario.

**Request body:**

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

**Respuesta 201 Created:**

```json
{
  "user": { "...usuario creado sin password..." },
  "token": "<JWT_GENERADO>",
  "message": "Usuario registrado con exito"
}
```

**Errores 400 Bad Request:**

```json
{ "error": "Email already exists" }
```

```json
{ "error": "Username already exists" }
```

```json
{ "error": "Password must be at least 6 characters" }
```

---

### POST `/api/auth/login`

Iniciar sesión con email y contraseña.

**Request body:**

```json
{
  "email": "test3@example.com",
  "password": "123456"
}
```

**Respuesta 200 OK:**

```json
{
  "user": { "...usuario completo..." },
  "token": "<JWT_GENERADO>"
}
```

**Errores:**

```json
{ "error": "Invalid email or password" }
```

```json
{ "error": "Account is not active" }
```

---

### POST `/api/auth/logout`

Cerrar sesión del usuario actual.

- **Auth:** Bearer token obligatorio.

**Respuesta 200 OK:**

```json
{ "message": "Logout successful" }
```

**Errores 401:**

```json
{ "error": "No token provided" }
```

```json
{ "error": "Invalid token" }
```

---

### GET `/api/auth/me`

- **Auth:** Bearer token obligatorio.

**Respuesta 200 OK:**

```json
{ "user": { "...usuario completo sin password..." } }
```

**Errores:**

- 401: `No token provided` / `Invalid token`
- 404: `User not found`

---

## Usuarios — `/api/users`

Rutas orientadas a **datos del usuario**: perfil, actividad y privacidad.

En todas las rutas siguientes, sustituir `id` por el identificador del usuario.

### GET `/api/users/:id/posts`

- **Auth:** sí.

**Respuesta 200:** array de objetos post.

**Error 401:** token inválido o ausente.

---

### GET `/api/users/:id/liked-posts`

- **Auth:** sí.

**Respuesta 200:** array de posts que el usuario ha marcado con like.

**Error 401:** token inválido o ausente.

---

### GET `/api/users/:id/bookmarked-posts`

- **Auth:** sí.

**Respuesta 200:** array de posts guardados en favoritos.

**Error 401:** token inválido o ausente.

---

### GET `/api/users/:id/commented-posts`

- **Auth:** sí.

**Respuesta 200:** array de posts en los que el usuario ha comentado.

**Error 401:** token inválido o ausente.

---

### GET `/api/users/:id/stats`

- **Auth:** sí.

**Respuesta 200:**

```json
{
  "postsCount": 12,
  "followersCount": 34,
  "followingCount": 20,
  "likesCount": 100,
  "bookmarksCount": 8,
  "commentsCount": 45
}
```

**Error 401:** token inválido o ausente.

---

### POST `/api/users/:id/privacy`

- **Auth:** sí.

**Request body:**

```json
{
  "showPosts": true,
  "showLikes": false,
  "showBookmarked": false,
  "showComments": true
}
```

**Respuesta 200:**

```json
{
  "privacy": {
    "showPosts": true,
    "showLikes": false,
    "showBookmarked": false,
    "showComments": true
  }
}
```

**Errores:**

- 401: token
- 400: `Invalid privacy settings`

---

## Posts — `/api/posts`

### GET `/api/posts/:id`

**Respuesta 200:** documento post enriquecido (autor populado, contadores, flags `userLiked` / `userBookmarked`, comentarios anidados o referenciados según implementación).

Ejemplo de forma esperada:

```json
{
  "id": "postId",
  "userId": { "USER": "..." },
  "text": "string",
  "isRetweet": false,
  "isReply": false,
  "isPublic": true,
  "isPinned": false,
  "isDeleted": false,
  "language": "string",
  "createdAt": "2026-01-21T11:47:31.576Z",
  "updatedAt": "2026-01-21T13:23:37.586Z",
  "userLiked": false,
  "userBookmarked": false,
  "likesCount": 0,
  "bookmarksCount": 0,
  "commentsCount": 0,
  "retweetsCount": 0,
  "likes": [],
  "bookmarks": [],
  "comments": [
    {
      "id": "commentId",
      "postId": "postId",
      "userId": { "USER": "..." },
      "text": "string",
      "images": [],
      "likes": [],
      "likesCount": 0,
      "repliesCount": 0,
      "isReply": false,
      "hashtags": [],
      "mentions": [],
      "isDeleted": false,
      "source": "string",
      "language": "string",
      "createdAt": "2026-01-21T13:23:37.228Z",
      "updatedAt": "2026-01-21T13:23:37.228Z",
      "__v": 0
    }
  ],
  "images": [],
  "hashtags": [],
  "mentions": [],
  "retweets": []
}
```

**Error:** `Post not found`.

---

### GET `/api/posts`

**Respuesta 200:** array de posts.

**Error 500:**

```json
{ "error": "Unable to fetch posts" }
```

---

### POST `/api/posts`

Crear un nuevo post.

- **Auth:** Bearer token obligatorio.

**Request body:**

```json
{
  "text": "Mi nuevo post sobre One Piece!",
  "images": ["/uploads/my-image.jpg"],
  "visibility": "public"
}
```

**Reglas:**

- `text`: obligatorio; longitud máxima **600** si el usuario está `verified`, **280** si no.
- `images`: opcional, array de URLs.

**Respuesta 201:** el post creado.

**Errores 400:**

```json
{ "error": "Text is required" }
```

```json
{ "error": "Text exceeds maximum length (280 characters)" }
```

**Error 401:** `No token provided`.

---

### POST `/api/posts/:id/like`

Toggle de like en el post.

- **Auth:** sí.

**Respuesta 200:**

```json
{
  "liked": true,
  "likesCount": 26,
  "userLiked": true
}
```

**Lógica:**

- Si el usuario ya dio like → quitar like.
- Si no → añadir like.
- Actualizar `likesCount` y el array `likes` con el `userId`.

**Errores:** 404 `Post not found`, 401 sin token.

---

### POST `/api/posts/:id/bookmark`

Toggle de favorito.

- **Auth:** sí.

**Respuesta 200:**

```json
{
  "bookmarked": true,
  "bookmarksCount": 9
}
```

**Lógica:** igual que like, sobre `bookmarks` y `bookmarksCount`.

---

### POST `/api/posts/:id/comments`

Crear un comentario en el post.

- **Auth:** sí.

**Request body:**

```json
{
  "text": "Excelente post!",
  "images": []
}
```

- `text`: obligatorio (mínimo 1 carácter).
- `images`: opcional.

**Respuesta 201 Created** (ejemplo):

```json
{
  "id": "newCommentId",
  "postId": "postId",
  "userId": {
    "_id": "userId1",
    "username": "testuser",
    "firstName": "Test",
    "lastName": "User",
    "avatar": "/avatars/user.jpg"
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
```

**Lógica:**

- Incrementar `commentsCount` del post.
- Asociar el comentario al post (array embebido o colección aparte, según implementación).
- Opcional: notificación al autor del post.

**Errores:** 404 post, 400 texto vacío, 401 sin token.

---

### DELETE `/api/posts/:id`

Eliminar un post.

- **Auth:** sí.
- Solo el **autor** del post puede borrarlo.

**Respuesta 200:**

```json
{ "message": "Post deleted successfully" }
```

**Errores:** 404, 403 `You are not authorized to delete this post`, 401.

---

## Tecnologías (este repositorio)

- Node.js (ver `engines` y Volta en `package.json`)
- Express 5
- TypeScript
- MongoDB + Mongoose
- CORS, dotenv
- ESLint (flat config), Prettier, Nodemon

---

## Instalación y entorno

```bash
npm install
```

Archivo `.env` en la raíz:

```env
PORT=3000
MONGO_URI=mongodb+srv://tu-conexion-a-mongo
```

Desarrollo:

```bash
npm run dev
```

Compilar y ejecutar build:

```bash
npm run build
npm start
```

---

## Estructura del código fuente

Cada recurso bajo `src/api/` sigue: **tipos** → **modelo** → **schemas (Zod)** → **controlador** → **rutas**.

```
src/
├── index.ts
├── config/           # db, cloudinary
├── data/             # catálogo de cartas y datos de serie (JSON read-only)
└── api/
    ├── auth/
    ├── users/
    ├── posts/
    ├── comments/
    ├── notifications/
    ├── progress/
    ├── cards/
    └── serie/
```

### Convenciones

- Respuestas con envelope: `{ status, message, data }` (errores: `{ status, message, code }`).
- JWT Bearer en rutas protegidas; `optionalAuth` en lecturas que enriquecen flags (`userLiked`, etc.).
- IDs en JSON como `id` string (transform global en `config/db.ts`).
- Validación con Zod antes de llegar al controlador.
- Referencia funcional alineada con el monorepo LogPose (`MASTER-PROGRAMACION/logpose`).

---

## Endpoints implementados

Base URL: `http://localhost:3000/api`

### Health

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/api` | No |

### Auth — `/api/auth`

| Método | Ruta | Auth |
|--------|------|------|
| POST | `/register` | No |
| POST | `/login` | No |
| GET | `/me` | Sí |
| PATCH | `/change-password` | Sí |
| POST | `/logout` | Sí |

### Users — `/api/users`

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/` | Admin |
| GET | `/ranking` | Sí |
| GET | `/:id` | No |
| PATCH | `/:id` | Sí (propio/admin) |
| DELETE | `/:id` | Sí (propio/admin) |
| PATCH | `/:id/avatar` | Sí (multipart) |
| GET | `/:id/stats` | No |
| GET | `/:id/followers` | No |
| GET | `/:id/following` | No |
| GET | `/:id/posts` | Opcional |
| GET | `/:id/liked-posts` | Opcional |
| GET | `/:id/bookmarked-posts` | Opcional |
| GET | `/:id/commented-posts` | Opcional |
| POST | `/:id/follow` | Sí |
| POST | `/:id/unfollow` | Sí |

Rutas con privacidad: 403 si `privacy.show*` es `false` (excepto dueño/admin).

### Posts — `/api/posts`

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/` | Opcional |
| GET | `/share/:shareToken` | Opcional |
| GET | `/:id` | Opcional |
| POST | `/` | Sí (JSON o multipart: `images`, `pdf`) |
| PATCH | `/:id` | Sí (autor) |
| DELETE | `/:id` | Sí (autor, soft delete) |
| POST | `/:id/like` | Sí |
| POST | `/:id/bookmark` | Sí |
| PATCH | `/:id/pdf` | Sí (multipart) |

### Comments — `/api/comments`

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/post/:postId` | Opcional |
| POST | `/` | Sí |
| DELETE | `/:id` | Sí (autor) |
| POST | `/:id/like` | Sí |

### Notifications — `/api/notifications`

Generadas en servidor (like, bookmark, comment, follow). Sin `POST` desde cliente.

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/` | Sí |
| GET | `/unread-count` | Sí |
| PUT | `/:id/read` | Sí |
| PUT | `/mark-all-read` | Sí |
| DELETE | `/:id` | Sí |
| DELETE | `/` | Sí |

### Progress — `/api/progress`

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/me` | Sí |
| PATCH | `/me` | Sí |
| DELETE | `/me` | Sí |
| POST | `/me/episodes/:episodeId/complete` | Sí |

### Cards — `/api/cards`

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/catalog` | No |
| GET | `/catalog/:type` | No |
| GET | `/me` | Sí |
| GET | `/me/:type` | Sí |
| GET | `/users/:userId` | Sí |

### Serie — `/api/serie`

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/sagas` | No |
| GET | `/sagas/:sagaId/arcs` | No |
| GET | `/arcs/:arcId/episodes` | No |
| GET | `/episodes/:episodeId` | No |

### Pendiente / fuera de alcance

- Retweets, búsqueda de posts, feed `followers|private` avanzado.
- Cards v2 (`/cards/v2/*`).
- Rutas legacy del Postman: `products`, `carts`, `orders`, `users/me/*`, `GET /users/username/:username`.

---

## Variables de entorno

```env
PORT=3000
MONGO_URI=mongodb+srv://...
JWT_SECRET=tu-secreto
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## Scripts npm

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Vigila `src`, compila y ejecuta |
| `npm run build` | Genera `dist/` y copia `src/data` |
| `npm start` | Ejecuta `node dist/index.js` |
| `npm run seed` | Usuarios + posts de prueba |

---

## Licencia

ISC (según `package.json`).
