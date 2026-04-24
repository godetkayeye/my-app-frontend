"use client";

import { useAuthState } from "@/app/providers/app-state-provider";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type TaskStatus = "pending" | "in_progress" | "done";

type Task = {
  id: number;
  user_id: number;
  title: string;
  description: string;
  statu: TaskStatus;
  created_at: string;
  updated_at: string;
};

type TaskResponse = {
  data: Task;
};

type TasksListResponse = {
  data: Task[];
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
  const { token, isReady, isAuthenticated, logout } = useAuthState();
  const [taskId, setTaskId] = useState("1");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("pending");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }
  }, [router, isReady, isAuthenticated]);

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const byStatus = statusFilter === "all" ? true : task.statu === statusFilter;
      const query = search.trim().toLowerCase();
      const bySearch =
        query.length === 0
          ? true
          : task.title.toLowerCase().includes(query) ||
            task.description.toLowerCase().includes(query);
      return byStatus && bySearch;
    });
  }, [tasks, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, tasks.length]);

  async function fetchTasks(currentToken: string) {
    const response = await fetch("/api/notes", {
      method: "GET",
      headers: { Authorization: `Bearer ${currentToken}` },
    });

    const data = (await response.json()) as
      | TasksListResponse
      | { data: Task }
      | { message?: string };

    if (!response.ok) {
      throw new Error(readErrorMessage(data, "Impossible de charger les taches."));
    }

    if ("data" in data && Array.isArray(data.data)) {
      setTasks(data.data);
      return;
    }

    if ("data" in data && data.data && typeof data.data === "object") {
      setTasks([data.data as Task]);
      return;
    }

    setTasks([]);
  }

  useEffect(() => {
    if (!token) return;

    fetchTasks(token).catch((err) => {
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
        body: JSON.stringify({ title, description, statu: status }),
      });

      const data = (await response.json()) as TaskResponse | { message?: string };
      if (!response.ok) {
        throw new Error(readErrorMessage(data, "Echec de creation de tache."));
      }

      setResult((data as TaskResponse).data);
      setTaskId(String((data as TaskResponse).data.id));
      await fetchTasks(token);
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
      const response = await fetch(`/api/notes/${taskId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await response.json()) as TaskResponse | { message?: string };

      if (!response.ok) {
        throw new Error(readErrorMessage(data, "Tache introuvable."));
      }

      setResult((data as TaskResponse).data);
      setTitle((data as TaskResponse).data.title);
      setDescription((data as TaskResponse).data.description);
      setStatus((data as TaskResponse).data.statu);
      await fetchTasks(token);
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
      const response = await fetch(`/api/notes/${taskId}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ title, description, statu: status }),
      });
      const data = (await response.json()) as TaskResponse | { message?: string };
      if (!response.ok) {
        throw new Error(readErrorMessage(data, "Echec de modification (PUT)."));
      }

      setResult((data as TaskResponse).data);
      await fetchTasks(token);
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
      const response = await fetch(`/api/notes/${taskId}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ title, description, statu: status }),
      });
      const data = (await response.json()) as TaskResponse | { message?: string };
      if (!response.ok) {
        throw new Error(readErrorMessage(data, "Echec de modification (PATCH)."));
      }

      setResult((data as TaskResponse).data);
      setTitle((data as TaskResponse).data.title);
      setDescription((data as TaskResponse).data.description);
      setStatus((data as TaskResponse).data.statu);
      await fetchTasks(token);
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
      const response = await fetch(`/api/notes/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        throw new Error(readErrorMessage(data, "Echec de suppression."));
      }

      setResult(null);
      setTitle("");
      setDescription("");
      setStatus("pending");
      await fetchTasks(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    router.replace("/");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-10">
      <section className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
              My App
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              Gestion des taches
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Deconnexion
          </button>
        </div>

        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-xl border border-slate-200 p-5"
        >
          <h2 className="text-lg font-semibold text-slate-900">Nouvelle tache</h2>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Titre de la tache"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            required
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description de la tache"
            className="min-h-32 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            required
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as TaskStatus)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="pending">pending</option>
            <option value="in_progress">in_progress</option>
            <option value="done">done</option>
          </select>
          <button
            type="submit"
            disabled={loading || !token}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Creer la tache
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Actions sur une tache
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              type="number"
              min="1"
              value={taskId}
              onChange={(event) => setTaskId(event.target.value)}
              placeholder="ID tache"
              className="w-32 rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <button
              onClick={handleShowNote}
              disabled={loading || !token}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Afficher une tache
            </button>
            <button
              onClick={handlePutNote}
              disabled={loading || !token}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Modifier completement une tache
            </button>
            <button
              onClick={handlePatchNote}
              disabled={loading || !token}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Modifier partiellement une tache
            </button>
            <button
              onClick={handleDeleteNote}
              disabled={loading || !token}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Supprimer une tache
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
            <p className="font-semibold">Tache courante</p>
            <p>
              <span className="font-medium">ID :</span> {result.id}
            </p>
            <p>
              <span className="font-medium">Titre :</span> {result.title}
            </p>
            <p>
              <span className="font-medium">Description :</span> {result.description}
            </p>
            <p>
              <span className="font-medium">Statut :</span> {result.statu}
            </p>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-slate-200 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Taches deja creees
            </h2>
            <button
              onClick={() => {
                if (!token) return;
                setLoading(true);
                setError(null);
                fetchTasks(token)
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

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher par titre ou description"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | TaskStatus)
              }
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">pending</option>
              <option value="in_progress">in_progress</option>
              <option value="done">done</option>
            </select>
          </div>

          {filteredTasks.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucune tache ne correspond au filtre.
            </p>
          ) : (
            <div className="space-y-3">
              {paginatedTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    setResult(task);
                    setTaskId(String(task.id));
                    setTitle(task.title);
                    setDescription(task.description);
                    setStatus(task.statu);
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left transition hover:bg-slate-100"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    #{task.id} - {task.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {task.description}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                    statut: {task.statu}
                  </p>
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-600">
              {filteredTasks.length} resultat(s) - page {currentPage}/{totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Precedent
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
