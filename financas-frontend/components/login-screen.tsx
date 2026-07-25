"use client";

import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Heart,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import type { UserId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export function LoginScreen({
  onLogin,
}: {
  onLogin: (userId: UserId, accessToken: string) => void;
}) {
  const [email, setEmail] = useState("helena@nosdois.app");
  const [password, setPassword] = useState("familia123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteAccepted, setInviteAccepted] = useState(false);
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    setInviteToken(
      new URLSearchParams(window.location.search).get("invite") ?? "",
    );
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const response = await fetch(apiUrl("/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      if (!response.ok) {
        throw new Error("Credenciais inválidas");
      }
      const session = (await response.json()) as {
        accessToken: string;
        user: { email: string };
      };
      onLogin(
        session.user.email.startsWith("helena") ? "helena" : "gabriel",
        session.accessToken,
      );
    } catch {
      if (
        window.location.hostname !== "localhost" &&
        password === "familia123" &&
        ["helena@nosdois.app", "gabriel@nosdois.app"].includes(normalizedEmail)
      ) {
        onLogin(
          normalizedEmail.startsWith("helena") ? "helena" : "gabriel",
          "static-preview",
        );
        return;
      }
      setError(
        "Não foi possível entrar. Confira os dados e se a API local está ativa.",
      );
      setLoading(false);
    }
  }

  function selectDemo(userId: UserId) {
    setEmail(`${userId}@nosdois.app`);
    setPassword("familia123");
    setError("");
  }

  async function acceptInvitation(event: FormEvent) {
    event.preventDefault();
    setInviteError("");
    try {
      const response = await fetch(
        apiUrl("/family/invitations/accept"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: inviteToken,
            name: inviteName,
            password: invitePassword,
          }),
        },
      );
      if (!response.ok) throw new Error();
      setInviteAccepted(true);
    } catch {
      setInviteError(
        "O convite está inválido, expirou ou já foi utilizado.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#fbf7f4] p-3 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1320px] overflow-hidden rounded-[28px] border border-[#eadfdb] bg-white shadow-[0_30px_80px_rgba(72,39,44,0.13)] sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.05fr_.95fr]">
        <section className="romantic-grid relative hidden overflow-hidden bg-[#74313d] p-12 text-white lg:flex lg:flex-col">
          <div className="absolute -right-28 -top-24 h-80 w-80 rounded-full bg-[#d3958e]/20 blur-3xl" />
          <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-[#d9a968]/15 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[15px] bg-white text-[#8f3541] shadow-lg">
              <Heart className="h-5 w-5 fill-current" />
            </div>
            <div>
              <div className="text-lg font-bold">Nós Dois</div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/60">
                vida & finanças
              </div>
            </div>
          </div>

          <div className="relative my-auto max-w-lg">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-[#f1d4cc]">
              <Sparkles className="h-3.5 w-3.5" />
              Planejar também é uma forma de cuidar
            </div>
            <h1 className="text-4xl font-semibold leading-[1.16] tracking-[-0.045em]">
              O futuro da família começa nas escolhas de hoje.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/67">
              Organizem despesas, filhos, investimentos e sonhos com transparência
              — preservando o espaço individual de cada pessoa.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-3">
              {[
                { value: "3", label: "perfis familiares" },
                { value: "100%", label: "privacidade ativa" },
                { value: "1", label: "visão compartilhada" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur"
                >
                  <p className="text-lg font-semibold">{item.value}</p>
                  <p className="mt-1 text-[9px] leading-relaxed text-white/55">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center gap-3 text-[10px] text-white/55">
            <ShieldCheck className="h-4 w-4" />
            Registros pessoais continuam protegidos dentro da família.
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-12 lg:px-16">
          <div className="w-full max-w-[430px]">
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <div className="grid h-11 w-11 place-items-center rounded-[15px] bg-[#963344] text-white">
                <Heart className="h-5 w-5 fill-current" />
              </div>
              <div>
                <div className="text-lg font-bold text-[#48272d]">Nós Dois</div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-[#aa8589]">
                  vida & finanças
                </div>
              </div>
            </div>

            {inviteToken && !inviteAccepted && (
              <form
                onSubmit={acceptInvitation}
                className="mb-7 rounded-2xl border border-[#e6d4d2] bg-[#fff6f4] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#963344] text-white">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#613139]">
                      Você recebeu um convite
                    </p>
                    <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">
                      Crie seu perfil para ingressar na família. O vínculo é feito
                      somente depois do aceite.
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input
                    className="field"
                    value={inviteName}
                    onChange={(event) => setInviteName(event.target.value)}
                    placeholder="Seu nome"
                    required
                  />
                  <input
                    className="field"
                    type="password"
                    minLength={6}
                    value={invitePassword}
                    onChange={(event) => setInvitePassword(event.target.value)}
                    placeholder="Crie uma senha"
                    required
                  />
                </div>
                {inviteError && (
                  <p className="mt-3 text-[9px] font-semibold text-[#9a3f49]">
                    {inviteError}
                  </p>
                )}
                <Button type="submit" size="sm" className="mt-3 w-full">
                  <Check className="h-4 w-4" />
                  Aceitar e ingressar
                </Button>
              </form>
            )}

            {inviteAccepted && (
              <div className="mb-7 rounded-2xl border border-[#cfe1d7] bg-[#edf7f1] p-4 text-[10px] font-semibold text-[#356453]">
                Convite aceito. Agora entre com o e-mail convidado e a senha que
                você acabou de criar.
              </div>
            )}

            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#a44955]">
                <Heart className="h-3.5 w-3.5 fill-current" />
                Que bom ter você de volta
              </div>
              <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#382b2f]">
                Entre na sua família
              </h2>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                Acesse sua visão pessoal e tudo que vocês decidiram compartilhar.
              </p>
            </div>

            <form onSubmit={submit} className="mt-7 space-y-4">
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a89d9d]" />
                  <input
                    className="field h-12 !pl-11"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@familia.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[10px] font-semibold">Senha</label>
                  <button
                    type="button"
                    className="text-[9px] font-semibold text-primary"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a89d9d]" />
                  <input
                    className="field h-12 !px-11"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Sua senha"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-[#fff0ef] px-3 py-2.5 text-[10px] font-medium text-[#9a3f49]">
                  {error}
                </div>
              )}

              <Button className="h-12 w-full" type="submit" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#eee5e2]" />
              <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                acessos de demonstração
              </span>
              <div className="h-px flex-1 bg-[#eee5e2]" />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {[
                {
                  id: "helena" as const,
                  name: "Helena",
                  role: "Administradora",
                  tone: "bg-[#f9e5e5] text-[#9b4250]",
                },
                {
                  id: "gabriel" as const,
                  name: "Gabriel",
                  role: "Adulto",
                  tone: "bg-[#e4f0ea] text-[#356453]",
                },
              ].map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => selectDemo(person.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                    email.startsWith(person.id)
                      ? "border-[#bd7a83] bg-[#fff7f6]"
                      : "border-[#e8dfdc] hover:bg-secondary",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-full text-[10px] font-bold",
                      person.tone,
                    )}
                  >
                    {person.name.slice(0, 1)}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[10px] font-semibold">
                      {person.name}
                    </span>
                    <span className="block text-[8px] text-muted-foreground">
                      {person.role}
                    </span>
                  </span>
                  {email.startsWith(person.id) && (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-7 flex items-center justify-center gap-2 text-[9px] text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Convites recebidos podem ser aceitos por esta tela.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
