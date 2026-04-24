"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Note = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

type NoteResponse = {
  data: Note;
};

type NotesListResponse = {
  data: Note[];
};

function readErrorMessage(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }
  return fallback;
}

export default function NotesPage() {
  const router = useRouter();
  const [token, setToken] = useState<string>("");
  const [noteId, setNoteId] = useState("1");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Note | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (!storedToken) {
      router.replace("/");
      return;
    }
    setToken(storedToken);
  }, [router]);

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  async function fetchNotes(currentToken: string) {
    const response = await fetch("/api/notes", {
      method: "GET",
      headers: { Authorization: `Bearer ${currentToken}` },
    });

    const data = (await response.json()) as
      | NotesListResponse
      | { data: Note }
      | { message?: string };

    if (!response.ok) {
      throw new Error(readErrorMessage(data, "Impossible de charger les notes."));
    }

    if ("data" in data && Array.isArray(data.data)) {
      setNotes(data.data);
      return;
    }

    if ("data" in data && data.data && typeof data.data === "object") {
      setNotes([data.data as Note]);
      return;
    }

    setNotes([]);
  }

  useEffect(() => {
    if (!token) return;

    fetchNotes(token).catch((err) => {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    });
  }, [token]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ title, content }),
      });

      const data = (await response.json()) as NoteResponse | { message?: string };
      if (!response.ok) {
        throw new Error(readErrorMessage(data, "Echec de creation de note."));
      }

      setResult((data as NoteResponse).data);
      setNoteId(String((data as NoteResponse).data.id));
      await fetchNotes(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  async function handleShowNote() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await response.json()) as NoteResponse | { message?: string };

      if (!response.ok) {
        throw new Error(readErrorMessage(data, "Note introuvable."));
      }

      setResult((data as NoteResponse).data);
      setTitle((data as NoteResponse).data.title);
      setContent((data as NoteResponse).data.content);
      await fetchNotes(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePutNote() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ title, content }),
      });
      const data = (await response.json()) as NoteResponse | { message?: string };
      if (!response.ok) {
        throw new Error(readErrorMessage(data, "Echec de modification (PUT)."));
      }

      setResult((data as NoteResponse).data);
      await fetchNotes(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePatchNote() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ title }),
      });
      const data = (await response.json()) as NoteResponse | { message?: string };
      if (!response.ok) {
        throw new Error(readErrorMessage(data, "Echec de modification (PATCH)."));
      }

      setResult((data as NoteResponse).data);
      setTitle((data as NoteResponse).data.title);
      setContent((data as NoteResponse).data.content);
      await fetchNotes(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteNote() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        throw new Error(readErrorMessage(data, "Echec de suppression."));
      }

      setResult(null);
      setTitle("");
      setContent("");
      await fetchNotes(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    router.replace("/");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-10">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
              My App
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              Gestion des notes
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Deconnexion
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4 rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Nouvelle note</h2>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Titre de la note"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            required
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Contenu de la note"
            className="min-h-32 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            required
          />
          <button
            type="submit"
            disabled={loading || !token}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Creer la note
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Actions sur une note</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              type="number"
              min="1"
              value={noteId}
              onChange={(event) => setNoteId(event.target.value)}
              placeholder="ID note"
              className="w-32 rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <button
              onClick={handleShowNote}
              disabled={loading || !token}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Afficher une Note
            </button>
            <button
              onClick={handlePutNote}
              disabled={loading || !token}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Modifier complètement une note
            </button>
            <button
              onClick={handlePatchNote}
              disabled={loading || !token}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Modifier partiellement une note
            </button>
            <button
              onClick={handleDeleteNote}
              disabled={loading || !token}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Supprimer une note
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-5 space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-semibold">Note courante</p>
            <p>
              <span className="font-medium">ID :</span> {result.id}
            </p>
            <p>
              <span className="font-medium">Titre :</span> {result.title}
            </p>
            <p>
              <span className="font-medium">Contenu :</span> {result.content}
            </p>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-slate-200 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Notes deja creees
            </h2>
            <button
              onClick={() => {
                if (!token) return;
                setLoading(true);
                setError(null);
                fetchNotes(token)
                  .catch((err) => {
                    setError(
                      err instanceof Error ? err.message : "Une erreur est survenue.",
                    );
                  })
                  .finally(() => setLoading(false));
              }}
              disabled={loading || !token}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Rafraichir
            </button>
          </div>

          {notes.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucune note trouvee pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => {
                    setResult(note);
                    setNoteId(String(note.id));
                    setTitle(note.title);
                    setContent(note.content);
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left transition hover:bg-slate-100"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    #{note.id} - {note.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {note.content}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
