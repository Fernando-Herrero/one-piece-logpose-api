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

Cada recurso bajo `src/api/` sigue el orden: **tipos** → **modelo Mongoose** → **controlador** → **rutas**.

```
src/
├── index.ts              # Express, CORS, rutas montadas
├── config/
│   └── db.ts             # Conexión y transformación global toJSON (id, sin __v)
└── api/
    ├── users/
    ├── posts/
    └── comments/
```

### `config/db.ts`

Tras conectar, se aplica a todos los modelos una transformación al serializar a JSON:

- `id` como string derivado de `_id`
- se omiten `_id` y `__v`

### Relaciones y `populate`

Las referencias (`ref`) entre colecciones se resuelven con `.populate()` en los controladores, limitando campos cuando haga falta (por ejemplo `username` y `avatar` del autor) para no exponer contraseñas ni datos innecesarios.

### Contraseña y email en usuario (buenas prácticas del proyecto)

- `password` con `select: false` en consultas habituales.
- `email` marcado como inmutable en el esquema para evitar cambios accidentales por `PUT` genérico.

### Virtual `fullName` (usuario actual del repo)

En el modelo de usuario implementado se expone un virtual que combina `name` y `surname` (con fallback a `username`), activo en `toJSON` / `toObject` con `virtuals: true`. La especificación amplia de `database.md` usa `firstName` / `lastName`; al migrar el esquema habrá que alinear nombres de campo y virtual.

---

## Endpoints implementados actualmente en este repositorio

La especificación anterior describe el **objetivo** de LogPose v3. En el código **de momento** existen sobre todo CRUD y lecturas al estilo “recurso + relaciones”, sin auth JWT ni likes/bookmarks en post tal como en la spec.

| Área | Estado |
|------|--------|
| `/api/auth/*` | No implementado |
| `/api/users` CRUD básico | Implementado (`GET`, `GET/:id`, `POST`, `PUT/:id`, `DELETE/:id`) |
| `/api/users/:id/posts`, stats, privacy, liked/bookmarked/commented-posts | No implementado (figuran solo en la spec anterior) |
| `/api/posts` listado público, por usuario, mis posts, share, CRUD | Implementado |
| Likes, bookmarks, `POST .../comments` bajo el post | No implementado; comentarios vía `/api/comments` |
| `/api/comments` por `postId`, crear, borrar con hilo | Implementado |
| Progreso serie, cards, notificaciones, rankings | No implementado (solo descritos arriba como producto) |

### Rutas montadas hoy

| Método | Ruta |
|--------|------|
| GET | `/` |
| GET | `/api/users` |
| GET | `/api/users/:id` |
| POST | `/api/users` |
| PUT | `/api/users/:id` |
| DELETE | `/api/users/:id` |
| GET | `/api/posts` |
| GET | `/api/posts/user/:userId` |
| GET | `/api/posts/my-posts/:userId` |
| GET | `/api/posts/share/:shareToken` |
| GET | `/api/posts/:id` |
| POST | `/api/posts` |
| PUT | `/api/posts/:id` |
| DELETE | `/api/posts/:id` |
| GET | `/api/comments/post/:postId` |
| POST | `/api/comments` |
| DELETE | `/api/comments/:id` |

**Comentarios:** el body de `POST /api/comments` debe incluir `postId`, `author` y `text` (y opcionalmente `parentComment`). Cuando exista auth, `author` podrá inferirse del token.

**Cascadas actuales:** borrar un post elimina comentarios con ese `postId`; borrar un usuario elimina sus posts y comentarios relacionados según la lógica del controlador.

---

## Flujos recomendados (hasta completar la spec)

1. Crear usuario: `POST /api/users` con los campos del modelo actual del repo.
2. Crear post: `POST /api/posts` con `userId`, `text`, opcional `images` y `visibility`.
3. Listar feed público: `GET /api/posts`.
4. Comentar: `POST /api/comments` con `postId`, `author`, `text`.
5. Listar comentarios: `GET /api/comments/post/:postId`.

Cuando `/api/auth` y el resto de rutas de `database.md` estén implementadas, este apartado se sustituirá por flujos basados en JWT y en las rutas de usuario ampliadas.

---

## Scripts npm

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Vigila `src`, compila y ejecuta |
| `npm run build` | Genera `dist/` |
| `npm start` | Ejecuta `node dist/index.js` |

---

## Licencia

ISC (según `package.json`).
