"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuthState } from "./providers/app-state-provider";

type LoginResponse = {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    created_at: string;
    updated_at: string;
  };
};

const LOGIN_ENDPOINT = "/api/auth/login";

export default function Home() {
  const router = useRouter();
  const { login } = useAuthState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LoginResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as LoginResponse | { message?: string };

      if (!response.ok) {
        const message =
          "message" in data && data.message
            ? data.message
            : "Identifiants invalides. Veuillez reessayer.";
        throw new Error(message);
      }

      setResult(data as LoginResponse);
      login((data as LoginResponse).token, (data as LoginResponse).user);
      router.push("/notes");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de la connexion.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
            My App
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Connexion</h1>
          <p className="mt-2 text-sm text-slate-500">
            Entrez vos identifiants pour acceder a votre espace.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vous@exemple.com"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Votre mot de passe"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Vous n&apos;avez pas de compte ?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-600 transition hover:text-blue-700"
          >
            Creer un compte
          </Link>
        </p>

        {error && (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-5 space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-semibold">Connexion reussie.</p>
            <p>
              <span className="font-medium">Utilisateur :</span> {result.user.name}
            </p>
            <p>
              <span className="font-medium">Email :</span> {result.user.email}
            </p>
            <p className="break-all">
              <span className="font-medium">Token :</span> {result.token}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
