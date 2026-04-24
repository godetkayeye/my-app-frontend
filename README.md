# Frontend Tasks App

Ce projet est un frontend en `Next.js` + `TailwindCSS` qui permet :

- la connexion utilisateur
- l'inscription utilisateur
- la gestion des taches (creer, afficher, modifier, supprimer)

## Ce que fait le frontend

### 1) Connexion (`/`)
- L'utilisateur entre son email et son mot de passe.
- Le frontend appelle `POST /api/auth/login` (proxy Next.js).
- En cas de succes, le token est stocke dans le navigateur, puis redirection vers `/notes`.

### 2) Inscription (`/register`)
- L'utilisateur cree un compte (`name`, `email`, `password`).
- Le frontend appelle `POST /api/auth/register`.
- En cas de succes, token stocke puis redirection vers `/notes`.

### 3) Taches (`/notes`)
- Page accessible apres authentification.
- Utilise le token Bearer pour appeler les endpoints proteges.
- Permet :
  - creer une tache (`POST`)
  - afficher une tache par id (`GET`)
  - modifier une tache (`PUT` ou `PATCH`)
  - supprimer une tache (`DELETE`)
  - lister les taches deja creees (chargement auto au refresh)

## Architecture des appels API

Le navigateur appelle les routes API Next.js locales, puis Next.js appelle le backend Laravel.

- Cela evite les problemes CORS cote navigateur.
- Les routes proxy transmettent le header `Authorization: Bearer <token>`.

## Backend attendu

Le backend API Laravel doit tourner sur :

- `http://127.0.0.1:8000`

Endpoints utilises :

- `/api/login`
- `/api/register`
- `/api/tasks`
- `/api/tasks/:id`

## Lancer le frontend

```bash
npm install
npm run dev
```

Puis ouvrir :

- [http://localhost:3000](http://localhost:3000)
