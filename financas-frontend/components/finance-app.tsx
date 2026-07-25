"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Baby,
  BadgeDollarSign,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Car,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Calculator,
  HandCoins,
  Heart,
  Home,
  House,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Menu,
  MailCheck,
  PiggyBank,
  Percent,
  Plus,
  ReceiptText,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  UserPlus,
  LogOut,
  WalletCards,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  accounts as initialAccounts,
  assets,
  familyChildren as initialChildren,
  financings,
  goals,
  investments as initialInvestments,
  loans as initialLoans,
  rentalProperties,
  transactions as initialTransactions,
  users,
} from "@/lib/demo-data";
import type {
  AccessMode,
  Account,
  ChildProfile,
  FamilyInvitation,
  Investment,
  Loan,
  Transaction,
  UserId,
  ViewMode,
} from "@/lib/types";
import { apiUrl } from "@/lib/api";
import { currency, cn, shortCurrency } from "@/lib/utils";
import { validateOwnership, visibleRecords } from "@/lib/visibility";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { LoginScreen } from "./login-screen";

type Section =
  | "dashboard"
  | "expenses"
  | "family"
  | "investments"
  | "assets"
  | "loans"
  | "rentals"
  | "goals";

const navigation: Array<{
  key: Section;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { key: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { key: "expenses", label: "Despesas", icon: ReceiptText },
  { key: "family", label: "Minha família", icon: Users },
  { key: "investments", label: "Investimentos", icon: TrendingUp },
  { key: "assets", label: "Bens", icon: House },
  { key: "loans", label: "Empréstimos", icon: HandCoins },
  { key: "rentals", label: "Imóveis alugados", icon: KeyRound },
  { key: "goals", label: "Metas do casal", icon: Target },
];

const sectionTitles: Record<Section, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Nosso panorama",
    subtitle: "Tudo que importa para as escolhas de vocês, em um só lugar.",
  },
  expenses: {
    title: "Despesas",
    subtitle: "Pessoais, familiares, recorrentes ou visíveis para quem você escolher.",
  },
  family: {
    title: "Minha família",
    subtitle: "Adultos entram por convite; filhos ganham perfil e caixinha próprios.",
  },
  investments: {
    title: "Investimentos",
    subtitle: "O que é seu permanece seu. O que é do casal cresce junto.",
  },
  assets: {
    title: "Patrimônio e bens",
    subtitle: "Acompanhe o valor do que vocês construíram.",
  },
  loans: {
    title: "Empréstimos e financiamentos",
    subtitle: "Parcelas, juros por período e a data para comemorar a quitação.",
  },
  rentals: {
    title: "Imóveis alugados",
    subtitle: "Receita líquida, ocupação e gestão dos contratos.",
  },
  goals: {
    title: "Planos que unem",
    subtitle: "Metas afetivas ganham força quando viram um plano.",
  },
};

const accessLabels: Record<AccessMode, string> = {
  INDIVIDUAL: "Individual",
  JOINT: "Do casal",
  PARTIAL: "Parcial",
};

const accessStyles: Record<AccessMode, string> = {
  INDIVIDUAL: "bg-[#f0edf4] text-[#62526b]",
  JOINT: "bg-[#fae9e8] text-[#923b48]",
  PARTIAL: "bg-[#e6f0eb] text-[#376654]",
};

function AccessBadge({
  mode,
  ownerShare,
}: {
  mode: AccessMode;
  ownerShare?: number;
}) {
  return (
    <Badge className={accessStyles[mode]}>
      {mode === "JOINT" && <Heart className="mr-1 h-3 w-3 fill-current" />}
      {accessLabels[mode]}
      {mode === "PARTIAL" && ownerShare ? ` ${ownerShare}/${100 - ownerShare}` : ""}
    </Badge>
  );
}

function ExpenseAccessBadge({ item }: { item: Transaction }) {
  if (item.expenseScope === "FAMILY") {
    return (
      <Badge className="bg-[#fae9e8] text-[#923b48]">
        <Users className="mr-1 h-3 w-3" />
        Familiar
      </Badge>
    );
  }
  if (item.sharedWithFamily) {
    return (
      <Badge className="bg-[#e6f0eb] text-[#376654]">
        <ShieldCheck className="mr-1 h-3 w-3" />
        Pessoal · visível
      </Badge>
    );
  }
  return (
    <Badge className="bg-[#f0edf4] text-[#62526b]">
      <ShieldCheck className="mr-1 h-3 w-3" />
      Pessoal privada
    </Badge>
  );
}

function Avatar({
  userId,
  size = "md",
}: {
  userId: UserId;
  size?: "sm" | "md" | "lg";
}) {
  const user = users.find((item) => item.id === userId)!;
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-semibold text-white shadow-sm ring-2 ring-white",
        user.avatarTone,
        size === "sm" && "h-8 w-8 text-[10px]",
        size === "md" && "h-10 w-10 text-xs",
        size === "lg" && "h-12 w-12 text-sm",
      )}
      aria-label={user.name}
    >
      {user.initials}
    </div>
  );
}

function Sidebar({
  section,
  setSection,
  currentUserId,
  mobileOpen,
  closeMobile,
}: {
  section: Section;
  setSection: (section: Section) => void;
  currentUserId: UserId;
  mobileOpen: boolean;
  closeMobile: () => void;
}) {
  const currentUser = users.find((user) => user.id === currentUserId)!;
  return (
    <>
      {mobileOpen && (
        <button
          className="fixed inset-0 z-40 bg-[#2b2023]/35 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
          aria-label="Fechar menu"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r border-[#eadfdd] bg-[#fffdfb] px-4 pb-5 pt-6 transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          className="absolute right-4 top-5 rounded-lg p-2 text-muted-foreground hover:bg-secondary lg:hidden"
          onClick={closeMobile}
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mb-7 flex items-center gap-3 px-3">
          <div className="relative grid h-11 w-11 place-items-center rounded-[15px] bg-[#963344] text-white shadow-[0_8px_18px_rgba(128,40,53,0.25)]">
            <Heart className="h-5 w-5 fill-white" />
            <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-[#d9a968] text-[9px]">
              $
            </span>
          </div>
          <div>
            <div className="text-lg font-bold tracking-[-0.04em] text-[#48272d]">
              Nós Dois
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#aa8589]">
              vida & finanças
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1" aria-label="Menu principal">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = item.key === section;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setSection(item.key);
                  closeMobile();
                }}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-colors",
                  active
                    ? "bg-[#f8e9e7] text-[#8d3340]"
                    : "text-[#746a6b] hover:bg-[#f7f2ef] hover:text-[#3f3638]",
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px]",
                    active ? "text-[#963344]" : "text-[#99908f]",
                  )}
                />
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#963344]" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="mb-4 rounded-[18px] bg-[#f1f5f1] p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#365d51]">
            <ShieldCheck className="h-4 w-4" />
            Privacidade ativa
          </div>
          <p className="text-[11px] leading-relaxed text-[#6d7772]">
            Os registros individuais de {currentUser.firstName} só aparecem nesta
            sessão.
          </p>
        </div>

        <button className="flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-secondary">
          <Avatar userId={currentUserId} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold">{currentUser.name}</div>
            <div className="truncate text-[10px] text-muted-foreground">
              Perfil do casal
            </div>
          </div>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </button>
      </aside>
    </>
  );
}

function Topbar({
  section,
  currentUserId,
  setCurrentUserId,
  onMenu,
  onAdd,
  onLogout,
}: {
  section: Section;
  currentUserId: UserId;
  setCurrentUserId: (id: UserId) => void;
  onMenu: () => void;
  onAdd: () => void;
  onLogout: () => void;
}) {
  const currentUser = users.find((user) => user.id === currentUserId)!;
  return (
    <header className="sticky top-0 z-30 border-b border-[#ece4e1] bg-[#fbf8f5]/90 px-4 py-3 backdrop-blur-xl sm:px-7 lg:px-9">
      <div className="mx-auto flex max-w-[1480px] items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenu}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden min-w-0 flex-1 md:block">
          <h1 className="truncate text-base font-semibold text-[#3d3033]">
            {sectionTitles[section].title}
          </h1>
        </div>
        <button className="hidden h-10 w-full max-w-[265px] items-center gap-2 rounded-xl border border-[#e8dfdc] bg-white px-3 text-left text-xs text-muted-foreground transition-shadow hover:shadow-sm xl:flex">
          <Search className="h-4 w-4" />
          Buscar em nossas finanças
          <span className="ml-auto rounded-md bg-[#f5f1ef] px-1.5 py-0.5 text-[9px]">
            ⌘ K
          </span>
        </button>
        <Button
          className="hidden sm:inline-flex"
          size="sm"
          onClick={onAdd}
        >
          <Plus className="h-4 w-4" />
          Novo registro
        </Button>
        <Button
          size="icon"
          className="sm:hidden"
          onClick={onAdd}
          aria-label="Novo registro"
        >
          <Plus className="h-5 w-5" />
        </Button>
        <button
          className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#e8dfdc] bg-white text-muted-foreground hover:bg-secondary"
          aria-label="Notificações"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full bg-[#ba4b58] ring-2 ring-white" />
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 rounded-xl border border-transparent p-1.5 pr-2 hover:border-[#e8dfdc] hover:bg-white">
              <Avatar userId={currentUserId} size="sm" />
              <div className="hidden text-left sm:block">
                <div className="text-[11px] font-semibold">
                  {currentUser.firstName}
                </div>
                <div className="text-[9px] text-muted-foreground">
                  Visualizando como
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              className="z-[80] w-64 rounded-2xl border border-[#e7deda] bg-white p-2 shadow-xl"
              sideOffset={8}
            >
              <div className="px-3 pb-2 pt-1">
                <p className="text-xs font-semibold">Trocar usuário do seed</p>
                <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                  Use para validar que dados individuais não vazam entre o casal.
                </p>
              </div>
              {users.map((user) => (
                <DropdownMenu.Item
                  key={user.id}
                  onSelect={() => setCurrentUserId(user.id)}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 outline-none hover:bg-secondary"
                >
                  <Avatar userId={user.id} size="sm" />
                  <div className="flex-1">
                    <div className="text-xs font-semibold">{user.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                  {currentUserId === user.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Separator className="my-1 h-px bg-[#eee5e2]" />
              <DropdownMenu.Item
                onSelect={onLogout}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#9a3f49] outline-none hover:bg-[#fff0ef]"
              >
                <LogOut className="h-4 w-4" />
                Sair da família
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}

function ScopeSwitcher({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}) {
  const options: Array<{
    value: ViewMode;
    label: string;
    icon: typeof Users;
  }> = [
    { value: "ALL", label: "Minha visão", icon: Sparkles },
    { value: "MINE", label: "Só individual", icon: ShieldCheck },
    { value: "JOINT", label: "Só do casal", icon: Users },
  ];
  return (
    <div className="inline-flex w-full gap-1 rounded-xl border border-[#e7dedb] bg-white p-1 sm:w-auto">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors sm:flex-none",
              value === option.value
                ? "bg-[#f6e5e3] text-[#8f3541]"
                : "text-muted-foreground hover:bg-secondary",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  trend,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof WalletCards;
  trend?: string;
  tone: "rose" | "green" | "gold" | "plum";
}) {
  const tones = {
    rose: "bg-[#fae7e5] text-[#963344]",
    green: "bg-[#e5f0ea] text-[#356453]",
    gold: "bg-[#f7eddc] text-[#9b6a2d]",
    plum: "bg-[#eee8f1] text-[#6b4c72]",
  };
  return (
    <Card className="animate-fade-up p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-[22px] font-bold tracking-[-0.04em] text-[#33272a]">
            {value}
          </p>
        </div>
        <div className={cn("grid h-10 w-10 place-items-center rounded-xl", tones[tone])}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px]">
        {trend && (
          <span className="rounded-full bg-[#e8f2eb] px-2 py-1 font-semibold text-[#3e725d]">
            {trend}
          </span>
        )}
        <span className="text-muted-foreground">{detail}</span>
      </div>
    </Card>
  );
}

function MonthlyChart() {
  const data = [
    { month: "Fev", income: 68, expense: 48 },
    { month: "Mar", income: 78, expense: 56 },
    { month: "Abr", income: 72, expense: 50 },
    { month: "Mai", income: 88, expense: 62 },
    { month: "Jun", income: 82, expense: 58 },
    { month: "Jul", income: 94, expense: 54 },
  ];
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Fluxo do casal</h3>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Receitas e despesas compartilhadas
          </p>
        </div>
        <div className="flex gap-3 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#355f53]" />
            Receitas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#d88b87]" />
            Despesas
          </span>
        </div>
      </div>
      <div className="relative flex h-[190px] items-end justify-between gap-3 border-b border-[#e9e2df] px-1">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between pb-5">
          {[1, 2, 3, 4].map((line) => (
            <div key={line} className="border-t border-dashed border-[#ece5e2]" />
          ))}
        </div>
        {data.map((item) => (
          <div
            key={item.month}
            className="relative z-10 flex h-full flex-1 flex-col items-center justify-end"
          >
            <div className="flex h-[150px] items-end gap-1 sm:gap-1.5">
              <div
                className="w-2.5 rounded-t-md bg-[#355f53] transition-all hover:bg-[#254d42] sm:w-4"
                style={{ height: `${item.income}%` }}
                title={`${item.month}: receitas`}
              />
              <div
                className="w-2.5 rounded-t-md bg-[#d88b87] transition-all hover:bg-[#c66f6a] sm:w-4"
                style={{ height: `${item.expense}%` }}
                title={`${item.month}: despesas`}
              />
            </div>
            <span className="mt-2 text-[9px] text-muted-foreground">
              {item.month}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function WealthRing({
  invested,
  assetsValue,
  debt,
}: {
  invested: number;
  assetsValue: number;
  debt: number;
}) {
  const net = invested + assetsValue - debt;
  return (
    <Card className="p-5 sm:p-6">
      <div>
        <h3 className="text-sm font-semibold">Patrimônio líquido</h3>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Bens + investimentos − dívidas
        </p>
      </div>
      <div className="mt-5 flex items-center gap-5">
        <div
          className="relative grid h-32 w-32 shrink-0 place-items-center rounded-full"
          style={{
            background:
              "conic-gradient(#963344 0 58%, #d3a061 58% 74%, #dfe9e3 74% 100%)",
          }}
        >
          <div className="grid h-[94px] w-[94px] place-items-center rounded-full bg-white text-center shadow-inner">
            <div>
              <div className="text-[9px] text-muted-foreground">Líquido</div>
              <div className="text-sm font-bold tracking-[-0.03em]">
                {shortCurrency(net)}
              </div>
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <LegendLine color="bg-[#963344]" label="Bens" value={assetsValue} />
          <LegendLine color="bg-[#d3a061]" label="Investimentos" value={invested} />
          <LegendLine color="bg-[#dfe9e3]" label="Dívidas" value={debt} />
        </div>
      </div>
    </Card>
  );
}

function LegendLine({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
      <span className="flex-1 text-[10px] text-muted-foreground">{label}</span>
      <span className="text-[10px] font-semibold">{shortCurrency(value)}</span>
    </div>
  );
}

const transactionIcons = {
  home: Home,
  cart: ShoppingCart,
  heart: Heart,
  wallet: WalletCards,
  briefcase: BriefcaseBusiness,
  car: Car,
};

function RecentTransactions({
  items,
  title = "Despesas recentes",
}: {
  items: Transaction[];
  title?: string;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Somente o que você tem permissão para ver
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-[10px]">
          Ver todas <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="divide-y divide-[#eee7e4]">
        {items.slice(0, 5).map((item) => {
          const Icon = transactionIcons[item.icon];
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 py-3.5 first:pt-1"
            >
              <div
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                  item.type === "INCOME"
                    ? "bg-[#e6f1eb] text-[#326450]"
                    : "bg-[#faecea] text-[#a14752]",
                )}
              >
                <Icon className="h-[17px] w-[17px]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold">{item.description}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-[9px] text-muted-foreground">
                    {item.category} · {item.dueLabel}
                  </span>
                  <ExpenseAccessBadge item={item} />
                </div>
              </div>
              <div className="text-right">
                <div
                  className={cn(
                    "text-xs font-semibold",
                    item.type === "INCOME" ? "text-[#326450]" : "text-[#44383a]",
                  )}
                >
                  {item.type === "INCOME" ? "+" : "−"} {currency(item.amount)}
                </div>
                <div className="mt-1 text-[9px] text-muted-foreground">
                  {item.recurrence === "RECURRING" ? "Recorrente" : "Única"}
                </div>
              </div>
            </div>
          );
        })}
        {items.length === 0 && <EmptyState />}
      </div>
    </Card>
  );
}

function ExpensesView({
  items,
  onAdd,
}: {
  items: Transaction[];
  onAdd: () => void;
}) {
  const expenses = items.filter((item) => item.type === "EXPENSE");
  const recurringTotal = expenses
    .filter((item) => item.recurrence === "RECURRING")
    .reduce((total, item) => total + item.amount, 0);
  const familyTotal = expenses
    .filter((item) => item.expenseScope === "FAMILY")
    .reduce((total, item) => total + item.amount, 0);
  const sharedPersonal = expenses.filter((item) => item.sharedWithFamily).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Recorrentes"
          value={currency(recurringTotal)}
          detail="previstas todo mês"
          icon={CalendarDays}
          tone="rose"
        />
        <MetricCard
          label="Despesas familiares"
          value={currency(familyTotal)}
          detail="responsabilidade compartilhada"
          icon={Users}
          tone="green"
        />
        <MetricCard
          label="Pessoais visíveis"
          value={String(sharedPersonal)}
          detail="sem dividir a responsabilidade"
          icon={ShieldCheck}
          tone="plum"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-[#eee7e4] p-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h3 className="text-sm font-semibold">Agenda de despesas</h3>
            <p className="mt-1 text-[10px] text-muted-foreground">
              O compartilhamento altera apenas a visibilidade, não a titularidade.
            </p>
          </div>
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Nova despesa
          </Button>
        </div>
        <div className="divide-y divide-[#eee7e4]">
          {expenses.map((item) => {
            const Icon = transactionIcons[item.icon];
            return (
              <div
                key={item.id}
                className="grid gap-3 p-5 sm:grid-cols-[1.3fr_auto_auto] sm:items-center sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#faecea] text-[#a14752]">
                    <Icon className="h-[17px] w-[17px]" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">
                      {item.description}
                    </p>
                    <p className="mt-1 text-[9px] text-muted-foreground">
                      {item.category} · {item.dueLabel}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ExpenseAccessBadge item={item} />
                  {item.recurrence === "RECURRING" && (
                    <Badge className="bg-[#f7eddc] text-[#936221]">
                      <CalendarDays className="mr-1 h-3 w-3" />
                      Recorrente
                    </Badge>
                  )}
                </div>
                <div className="text-left sm:min-w-28 sm:text-right">
                  <p className="text-xs font-semibold">{currency(item.amount)}</p>
                  <p className="mt-1 text-[9px] text-muted-foreground">
                    {item.ownerId === "helena" ? "Helena" : "Gabriel"}
                  </p>
                </div>
              </div>
            );
          })}
          {expenses.length === 0 && <EmptyState />}
        </div>
      </Card>
    </div>
  );
}

function GoalsPreview() {
  return (
    <Card className="overflow-hidden">
      <div className="romantic-grid bg-[#74313d] p-5 text-white sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[9px]">
              <Heart className="h-3 w-3 fill-current" />
              Nosso próximo sonho
            </div>
            <h3 className="text-lg font-semibold">Itália, abril de 2027</h3>
            <p className="mt-1 text-[10px] text-white/65">
              Faltam 9 meses para brindar em Roma.
            </p>
          </div>
          <span className="text-2xl">✈️</span>
        </div>
        <div className="mt-6 flex items-end justify-between">
          <div>
            <span className="text-[10px] text-white/65">Já guardamos</span>
            <div className="mt-1 text-lg font-semibold">{currency(18500)}</div>
          </div>
          <div className="text-right text-[10px] text-white/65">
            meta {currency(30000)}
          </div>
        </div>
        <Progress
          value={61.7}
          className="mt-3 bg-white/15"
          indicatorClassName="bg-[#e9c6a1]"
        />
      </div>
      <div className="flex items-center justify-between bg-white px-5 py-4">
        <div className="flex -space-x-2">
          <Avatar userId="helena" size="sm" />
          <Avatar userId="gabriel" size="sm" />
        </div>
        <span className="text-[10px] font-semibold text-[#8b3743]">
          61,7% do caminho
        </span>
      </div>
    </Card>
  );
}

function Overview({
  userId,
  view,
  transactions,
  investments,
  accounts,
}: {
  userId: UserId;
  view: ViewMode;
  transactions: Transaction[];
  investments: Investment[];
  accounts: Account[];
}) {
  const visibleTransactions = visibleRecords(transactions, userId, view);
  const visibleInvestments = visibleRecords(investments, userId, view);
  const visibleAccounts = visibleRecords(accounts, userId, view);
  const visibleAssets = visibleRecords(assets, userId, view);
  const visibleFinancing = visibleRecords(financings, userId, view);

  const balance = visibleAccounts.reduce((sum, item) => sum + item.balance, 0);
  const invested = visibleInvestments.reduce((sum, item) => sum + item.value, 0);
  const assetsValue = visibleAssets.reduce(
    (sum, item) => sum + item.estimatedValue,
    0,
  );
  const debt = visibleFinancing.reduce((sum, item) => sum + item.outstanding, 0);
  const monthExpenses = visibleTransactions
    .filter((item) => item.type === "EXPENSE")
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Saldo disponível"
          value={currency(balance)}
          detail={`${visibleAccounts.length} fontes financeiras`}
          icon={WalletCards}
          trend="+4,8%"
          tone="rose"
        />
        <MetricCard
          label="Investimentos"
          value={currency(invested)}
          detail="na seleção atual"
          icon={TrendingUp}
          trend="+R$ 1,2 mil"
          tone="green"
        />
        <MetricCard
          label="Despesas do mês"
          value={currency(monthExpenses)}
          detail="12% abaixo do planejado"
          icon={ArrowDownLeft}
          tone="gold"
        />
        <MetricCard
          label="Patrimônio bruto"
          value={shortCurrency(assetsValue + invested)}
          detail="atualizado hoje"
          icon={Landmark}
          trend="+2,1%"
          tone="plum"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <MonthlyChart />
        <WealthRing invested={invested} assetsValue={assetsValue} debt={debt} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <RecentTransactions items={visibleTransactions} />
        <GoalsPreview />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid min-h-36 place-items-center py-8 text-center">
      <div>
        <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-secondary">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-xs font-semibold">Nenhum registro nesta visão</p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          A privacidade do casal está funcionando como definida.
        </p>
      </div>
    </div>
  );
}

function InvestmentsView({ items }: { items: Investment[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total investido"
          value={currency(total)}
          detail="na visão selecionada"
          icon={PiggyBank}
          trend="+7,4%"
          tone="green"
        />
        <MetricCard
          label="Rentabilidade"
          value="+8,1%"
          detail="média ponderada no ano"
          icon={ArrowUpRight}
          tone="rose"
        />
        <MetricCard
          label="Aportes do mês"
          value={currency(2800)}
          detail="87% da meta mensal"
          icon={CircleDollarSign}
          tone="gold"
        />
      </div>
      <Card className="overflow-hidden">
        <div className="border-b border-[#eee7e4] p-5 sm:p-6">
          <h3 className="text-sm font-semibold">Carteira</h3>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Investimentos individuais nunca são exibidos ao outro parceiro.
          </p>
        </div>
        <div className="divide-y divide-[#eee7e4]">
          {items.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 p-5 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-6"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e6f0eb] text-[#356453]">
                  <TrendingUp className="h-[17px] w-[17px]" />
                </div>
                <div>
                  <p className="text-xs font-semibold">{item.name}</p>
                  <p className="mt-1 text-[9px] text-muted-foreground">
                    {item.category} · {item.institution}
                  </p>
                </div>
              </div>
              <AccessBadge mode={item.accessMode} ownerShare={item.ownerShare} />
              <div className="text-left sm:min-w-28 sm:text-right">
                <p className="text-xs font-semibold">{currency(item.value)}</p>
                <p className="mt-1 text-[9px] font-semibold text-[#3c745c]">
                  +{item.yieldPercent}% no ano
                </p>
              </div>
            </div>
          ))}
          {items.length === 0 && <EmptyState />}
        </div>
      </Card>
    </div>
  );
}

function AssetsView({ items }: { items: typeof assets }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {items.map((item) => (
        <Card key={item.id} className="p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#eee8f1] text-[#6b4c72]">
              {item.category === "Veículo" ? (
                <Car className="h-5 w-5" />
              ) : (
                <Building2 className="h-5 w-5" />
              )}
            </div>
            <AccessBadge mode={item.accessMode} ownerShare={item.ownerShare} />
          </div>
          <p className="mt-5 text-[10px] font-medium text-muted-foreground">
            {item.category}
          </p>
          <h3 className="mt-1 text-sm font-semibold">{item.name}</h3>
          <p className="mt-1 text-[10px] text-muted-foreground">{item.detail}</p>
          <div className="mt-5 border-t border-[#eee7e4] pt-4">
            <p className="text-[9px] text-muted-foreground">Valor estimado</p>
            <p className="mt-1 text-lg font-bold tracking-[-0.04em]">
              {currency(item.estimatedValue)}
            </p>
          </div>
        </Card>
      ))}
      {items.length === 0 && (
        <Card className="md:col-span-2">
          <EmptyState />
        </Card>
      )}
    </div>
  );
}

function FinancingView({ items }: { items: typeof financings }) {
  return (
    <div className="space-y-5">
      {items.map((item) => {
        const paidPercent = (item.paidInstallments / item.totalInstallments) * 100;
        return (
          <Card key={item.id} className="p-5 sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#f7eddc] text-[#946324]">
                    <HandCoins className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground">{item.category}</p>
                    <h3 className="mt-1 text-sm font-semibold">{item.name}</h3>
                  </div>
                </div>
                <div className="mt-4">
                  <AccessBadge mode={item.accessMode} ownerShare={item.ownerShare} />
                </div>
              </div>
              <div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <DataPoint label="Saldo devedor" value={currency(item.outstanding)} />
                  <DataPoint label="Parcela mensal" value={currency(item.monthlyPayment)} />
                  <DataPoint
                    label="Parcelas pagas"
                    value={`${item.paidInstallments}/${item.totalInstallments}`}
                  />
                  <DataPoint
                    label="Quitação prevista"
                    value={new Date(item.payoffDate).toLocaleDateString("pt-BR", {
                      month: "short",
                      year: "numeric",
                    })}
                  />
                </div>
                <Progress value={paidPercent} className="mt-4" />
                <p className="mt-2 text-right text-[9px] text-muted-foreground">
                  {paidPercent.toFixed(1)}% das parcelas concluídas
                </p>
              </div>
            </div>
          </Card>
        );
      })}
      {items.length === 0 && (
        <Card>
          <EmptyState />
        </Card>
      )}
    </div>
  );
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xs font-semibold">{value}</p>
    </div>
  );
}

function RentalsView({ items }: { items: typeof rentalProperties }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <div className="h-24 bg-gradient-to-br from-[#325f53] to-[#6d8c7e] p-5 text-white">
            <div className="flex items-start justify-between">
              <Building2 className="h-6 w-6" />
              <Badge className="bg-white/15 text-white">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-[#b8e2c8]" />
                Ocupado
              </Badge>
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">{item.name}</h3>
                <p className="mt-1 text-[9px] text-muted-foreground">{item.address}</p>
              </div>
              <AccessBadge mode={item.accessMode} ownerShare={item.ownerShare} />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-[#f8f5f2] p-4">
              <DataPoint label="Aluguel" value={currency(item.rent)} />
              <DataPoint label="Despesas" value={currency(item.expenses)} />
              <DataPoint label="Líquido" value={currency(item.rent - item.expenses)} />
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground">
              <KeyRound className="h-3.5 w-3.5" />
              Inquilina: <strong className="font-semibold text-foreground">{item.tenant}</strong>
            </div>
          </div>
        </Card>
      ))}
      {items.length === 0 && (
        <Card className="lg:col-span-2">
          <EmptyState />
        </Card>
      )}
    </div>
  );
}

function GoalsView({ items }: { items: typeof goals }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => {
        const progress = (item.current / item.target) * 100;
        return (
          <Card key={item.id} className="overflow-hidden">
            <div
              className={cn(
                "h-2",
                index % 3 === 0
                  ? "bg-[#963344]"
                  : index % 3 === 1
                    ? "bg-[#3d6b5d]"
                    : "bg-[#bf8b4e]",
              )}
            />
            <div className="p-5">
              <div className="flex items-start justify-between">
                <span className="text-2xl">{item.emoji}</span>
                <AccessBadge mode={item.accessMode} ownerShare={item.ownerShare} />
              </div>
              <h3 className="mt-4 text-sm font-semibold">{item.name}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-[9px] text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                até{" "}
                {new Date(item.targetDate).toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <div className="mt-5 flex items-end justify-between">
                <span className="text-sm font-bold">{currency(item.current)}</span>
                <span className="text-[9px] text-muted-foreground">
                  de {currency(item.target)}
                </span>
              </div>
              <Progress value={progress} className="mt-2" />
              <p className="mt-2 text-right text-[9px] font-semibold text-primary">
                {progress.toFixed(1)}%
              </p>
            </div>
          </Card>
        );
      })}
      {items.length === 0 && (
        <Card className="md:col-span-2 xl:col-span-3">
          <EmptyState />
        </Card>
      )}
    </div>
  );
}

function childProjection(child: ChildProfile) {
  const eighteenthBirthday = new Date(child.birthDate);
  eighteenthBirthday.setFullYear(eighteenthBirthday.getFullYear() + 18);
  const months = Math.max(
    0,
    Math.ceil(
      (eighteenthBirthday.getTime() - Date.now()) /
        (1000 * 60 * 60 * 24 * 30.4375),
    ),
  );
  return child.savings.reduce((total, saving) => {
    const monthlyRate = Math.pow(1 + saving.annualReturnRate / 100, 1 / 12) - 1;
    const balance = saving.currentBalance * Math.pow(1 + monthlyRate, months);
    const contributions =
      monthlyRate === 0
        ? saving.monthlyContribution * months
        : saving.monthlyContribution *
          ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    return total + balance + contributions;
  }, 0);
}

function FamilyView({
  children,
  invitations,
  onInvite,
  onAddChild,
  onAddSavings,
}: {
  children: ChildProfile[];
  invitations: FamilyInvitation[];
  onInvite: () => void;
  onAddChild: () => void;
  onAddSavings: (childId: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-sm font-semibold">Adultos da família</h3>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Um convite seguro é enviado por e-mail e expira em sete dias.
              </p>
            </div>
            <Button size="sm" onClick={onInvite}>
              <UserPlus className="h-4 w-4" />
              Convidar pessoa
            </Button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {users.map((user, index) => (
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-2xl border border-[#eee5e2] bg-[#fffdfb] p-4"
              >
                <Avatar userId={user.id} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{user.name}</p>
                  <p className="mt-1 truncate text-[9px] text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <Badge className={index === 0 ? "bg-[#fae9e8] text-[#923b48]" : "bg-[#e6f0eb] text-[#376654]"}>
                  {index === 0 ? "Responsável" : "Adulto"}
                </Badge>
              </div>
            ))}
          </div>
          {invitations.length > 0 && (
            <div className="mt-4 rounded-2xl bg-[#f7f2ef] p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.08em] text-muted-foreground">
                Convites aguardando aceite
              </p>
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center gap-3">
                  <MailCheck className="h-4 w-4 text-[#3f6d5e]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold">
                      {invitation.name}
                    </p>
                    <p className="truncate text-[9px] text-muted-foreground">
                      {invitation.email}
                    </p>
                  </div>
                  <Badge className="bg-[#f7eddc] text-[#936221]">Pendente</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="romantic-grid overflow-hidden bg-[#74313d] p-5 text-white sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <Badge className="bg-white/12 text-white">
                <Baby className="mr-1 h-3 w-3" />
                Futuro em família
              </Badge>
              <h3 className="mt-4 text-lg font-semibold">Educação financeira começa cedo</h3>
              <p className="mt-2 text-[10px] leading-relaxed text-white/70">
                Mesada, caixinhas e projeções ajudam a transformar sonhos em hábitos.
              </p>
            </div>
            <PiggyBank className="h-9 w-9 text-[#e9c6a1]" />
          </div>
          <Button
            onClick={onAddChild}
            className="mt-6 bg-white text-[#74313d] hover:bg-[#fff3f1]"
          >
            <Plus className="h-4 w-4" />
            Adicionar filho
          </Button>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {children.map((child) => (
          <Card key={child.id} className="overflow-hidden">
            <div className="flex items-center gap-4 border-b border-[#eee5e2] p-5 sm:px-6">
              <div
                className="grid h-12 w-12 place-items-center rounded-2xl text-sm font-bold text-white shadow-sm"
                style={{ backgroundColor: child.avatarColor }}
              >
                {child.name
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold">{child.name}</h3>
                <p className="mt-1 text-[9px] text-muted-foreground">
                  Perfil infantil · mesada de {currency(child.monthlyAllowance)}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => onAddSavings(child.id)}>
                <Plus className="h-3.5 w-3.5" />
                Caixinha
              </Button>
            </div>
            <div className="p-5 sm:p-6">
              <div className="rounded-2xl bg-[#f1f6f3] p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-[#577266]">
                  Projeção total aos 18 anos
                </p>
                <p className="mt-1 text-xl font-bold tracking-[-.04em] text-[#305849]">
                  {currency(childProjection(child))}
                </p>
                <p className="mt-1 text-[9px] text-muted-foreground">
                  Estimativa com aportes e rentabilidade informados, sem garantia de retorno.
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {child.savings.map((saving) => (
                  <div key={saving.id} className="flex items-center gap-3 rounded-xl border border-[#eee5e2] p-3">
                    <div className={cn(
                      "grid h-9 w-9 place-items-center rounded-xl",
                      saving.kind === "INVESTMENT"
                        ? "bg-[#e6f0eb] text-[#376654]"
                        : "bg-[#fae9e8] text-[#923b48]",
                    )}>
                      {saving.kind === "INVESTMENT" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <PiggyBank className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold">{saving.name}</p>
                      <p className="mt-1 text-[9px] text-muted-foreground">
                        {saving.kind === "INVESTMENT" ? "Investimento" : "Poupança"} · aporte {currency(saving.monthlyContribution)}/mês
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-semibold">{currency(saving.currentBalance)}</p>
                      <p className="mt-1 text-[9px] text-muted-foreground">
                        {saving.quoteSymbol
                          ? `${saving.quoteSymbol} · ${currency(saving.currentQuote ?? 0)}`
                          : `${saving.annualReturnRate}% a.a.`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function LoansView({ items, onAdd }: { items: Loan[]; onAdd: () => void }) {
  const outstanding = items.reduce((sum, item) => sum + item.outstanding, 0);
  const installments = items.reduce((sum, item) => sum + item.monthlyPayment, 0);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Saldo devedor" value={currency(outstanding)} detail="em contratos visíveis" icon={HandCoins} tone="rose" />
        <MetricCard label="Parcelas mensais" value={currency(installments)} detail="comprometimento mensal" icon={CalendarDays} tone="gold" />
        <MetricCard label="Contratos sem juros" value={String(items.filter((item) => !item.hasInterest).length)} detail="registrados separadamente" icon={Percent} tone="green" />
      </div>
      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-[#eee7e4] p-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h3 className="text-sm font-semibold">Contratos e quitação</h3>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Juros podem ser diários, mensais, anuais ou informados como total.
            </p>
          </div>
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Novo empréstimo
          </Button>
        </div>
        <div className="divide-y divide-[#eee7e4]">
          {items.map((item) => {
            const progress = item.totalInstallments
              ? (item.paidInstallments / item.totalInstallments) * 100
              : 0;
            return (
              <div key={item.id} className="grid gap-4 p-5 sm:px-6 lg:grid-cols-[1.4fr_.8fr_.8fr] lg:items-center">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fae9e8] text-[#923b48]">
                    {item.type === "FINANCING" ? <Building2 className="h-4 w-4" /> : <HandCoins className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{item.name}</p>
                    <p className="mt-1 text-[9px] text-muted-foreground">
                      {item.institution} · {item.type === "FINANCING" ? "Financiamento" : "Empréstimo"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <AccessBadge mode={item.accessMode} ownerShare={item.ownerShare} />
                      <Badge className={item.hasInterest ? "bg-[#f7eddc] text-[#936221]" : "bg-[#e6f0eb] text-[#376654]"}>
                        {item.hasInterest
                          ? `${item.interestRate}% ${item.interestPeriod}`
                          : "Sem juros"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[9px] text-muted-foreground">
                    <span>{item.paidInstallments} pagas</span>
                    <span>{item.totalInstallments ?? "—"} parcelas</span>
                  </div>
                  <Progress value={progress} className="mt-2" />
                  <p className="mt-2 text-[9px] text-muted-foreground">
                    Quitação: {item.payoffDate ? new Date(item.payoffDate).toLocaleDateString("pt-BR") : "a definir"}
                  </p>
                </div>
                <div className="lg:text-right">
                  <p className="text-sm font-bold">{currency(item.outstanding)}</p>
                  <p className="mt-1 text-[9px] text-muted-foreground">
                    parcela de {currency(item.monthlyPayment)}
                  </p>
                </div>
              </div>
            );
          })}
          {items.length === 0 && <EmptyState />}
        </div>
      </Card>
    </div>
  );
}

type RecordKind = "EXPENSE" | "INVESTMENT" | "LOAN";

function NewRecordDialog({
  open,
  onOpenChange,
  initialKind,
  userId,
  onCreateTransaction,
  onCreateInvestment,
  onCreateLoan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialKind: RecordKind;
  userId: UserId;
  onCreateTransaction: (transaction: Transaction) => void;
  onCreateInvestment: (investment: Investment) => void;
  onCreateLoan: (loan: Loan) => void;
}) {
  const [kind, setKind] = useState<RecordKind>(initialKind);
  const [mode, setMode] = useState<AccessMode>("JOINT");
  const [partialShare, setPartialShare] = useState(60);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [loanType, setLoanType] = useState<Loan["type"]>("LOAN");
  const [hasInterest, setHasInterest] = useState(false);
  const [interestRate, setInterestRate] = useState("");
  const [interestPeriod, setInterestPeriod] = useState<NonNullable<Loan["interestPeriod"]>>("ao ano");
  const [installments, setInstallments] = useState("12");
  const [monthlyPayment, setMonthlyPayment] = useState("");

  useEffect(() => {
    if (open) setKind(initialKind);
  }, [initialKind, open]);

  function reset() {
    setName("");
    setCategory("");
    setAmount("");
    setRecurring(false);
    setMode("JOINT");
    setPartialShare(60);
    setLoanType("LOAN");
    setHasInterest(false);
    setInterestRate("");
    setInterestPeriod("ao ano");
    setInstallments("12");
    setMonthlyPayment("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const numericAmount = Number(amount.replace(",", "."));
    if (!name.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) return;
    const shares = validateOwnership(mode, partialShare);
    const ownership = {
      accessMode: mode,
      ownerId: userId,
      ownerShare: shares.ownerShare,
      partnerShare: shares.partnerShare,
    };
    const id = `${kind.toLowerCase()}-${Date.now()}`;

    if (kind === "EXPENSE") {
      const isSharedPersonal = mode === "PARTIAL";
      onCreateTransaction({
        id,
        description: name,
        category: category || "Outros",
        amount: numericAmount,
        type: "EXPENSE",
        recurrence: recurring ? "RECURRING" : "ONE_TIME",
        date: new Date().toISOString().slice(0, 10),
        dueLabel: recurring ? "Todo mês" : "Hoje",
        icon: "wallet",
        expenseScope: mode === "JOINT" ? "FAMILY" : "PERSONAL",
        sharedWithFamily: isSharedPersonal,
        ...ownership,
        ...(isSharedPersonal
          ? { accessMode: "INDIVIDUAL" as const, ownerShare: 100, partnerShare: 0 }
          : {}),
      });
    } else if (kind === "INVESTMENT") {
      onCreateInvestment({
        id,
        name,
        category: category || "Outros",
        value: numericAmount,
        yieldPercent: 0,
        institution: "A definir",
        ...ownership,
      });
    } else {
      const totalInstallments = Math.max(1, Number(installments) || 1);
      const payment = Number(monthlyPayment.replace(",", ".")) || numericAmount / totalInstallments;
      onCreateLoan({
        id,
        name,
        type: loanType,
        institution: category || "A definir",
        principalValue: numericAmount,
        outstanding: numericAmount,
        monthlyPayment: payment,
        hasInterest,
        interestRate: hasInterest ? Number(interestRate.replace(",", ".")) || 0 : undefined,
        interestPeriod: hasInterest ? interestPeriod : undefined,
        paidInstallments: 0,
        totalInstallments,
        payoffDate: undefined,
        ...ownership,
      });
    }
    reset();
    onOpenChange(false);
  }

  const copy = {
    EXPENSE: ["Nova despesa", "Descrição", "Ex.: Escola das crianças", "Categoria", "Ex.: Educação", "Valor"],
    INVESTMENT: ["Novo investimento", "Nome do investimento", "Ex.: Tesouro IPCA", "Categoria", "Ex.: Renda fixa", "Valor atual"],
    LOAN: ["Novo empréstimo", "Nome do contrato", "Ex.: Reforma da casa", "Instituição ou pessoa", "Ex.: Banco ou familiar", "Valor principal"],
  }[kind];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-[#2a1e21]/45 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] max-h-[92vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[24px] border border-white/50 bg-[#fffdfb] p-5 shadow-2xl outline-none sm:p-7">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold tracking-[-0.03em]">{copy[0]}</Dialog.Title>
              <Dialog.Description className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Defina a titularidade e exatamente quem poderá visualizar.
              </Dialog.Description>
            </div>
            <Dialog.Close className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></Dialog.Close>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-[#f5f0ed] p-1">
            {[
              { value: "EXPENSE", label: "Despesa", icon: ReceiptText },
              { value: "INVESTMENT", label: "Investimento", icon: TrendingUp },
              { value: "LOAN", label: "Empréstimo", icon: HandCoins },
            ].map((option) => {
              const Icon = option.icon;
              return (
                <button key={option.value} type="button" onClick={() => setKind(option.value as RecordKind)} className={cn("flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[10px] font-semibold", kind === option.value ? "bg-white text-primary shadow-sm" : "text-muted-foreground")}>
                  <Icon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{option.label}</span>
                </button>
              );
            })}
          </div>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {kind === "LOAN" && (
              <div className="grid grid-cols-2 gap-2">
                {(["LOAN", "FINANCING"] as const).map((value) => (
                  <button key={value} type="button" onClick={() => setLoanType(value)} className={cn("rounded-xl border p-3 text-[10px] font-semibold", loanType === value ? "border-[#b66e77] bg-[#fff4f3] text-primary" : "border-[#e6ddda] bg-white")}>
                    {value === "LOAN" ? "Empréstimo" : "Financiamento"}
                  </button>
                ))}
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold">{copy[1]}</label>
              <input className="field" value={name} onChange={(event) => setName(event.target.value)} placeholder={copy[2]} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold">{copy[3]}</label>
                <input className="field" value={category} onChange={(event) => setCategory(event.target.value)} placeholder={copy[4]} />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold">{copy[5]}</label>
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span><input className="field pl-10" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="0,00" required /></div>
              </div>
            </div>
            {kind === "LOAN" && (
              <div className="space-y-3 rounded-2xl border border-[#e6ddda] bg-white p-4">
                <label className="flex items-center justify-between gap-3">
                  <div><p className="text-[10px] font-semibold">Este contrato possui juros?</p><p className="mt-0.5 text-[9px] text-muted-foreground">Desative para acordos sem juros.</p></div>
                  <input type="checkbox" checked={hasInterest} onChange={(event) => setHasInterest(event.target.checked)} className="h-4 w-4 accent-[#963344]" />
                </label>
                {hasInterest && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label className="mb-1.5 block text-[10px] font-semibold">Taxa de juros (%)</label><input className="field" value={interestRate} onChange={(event) => setInterestRate(event.target.value)} inputMode="decimal" placeholder="Ex.: 11,9" required /></div>
                    <div><label className="mb-1.5 block text-[10px] font-semibold">Período da taxa</label><select className="field" value={interestPeriod} onChange={(event) => setInterestPeriod(event.target.value as NonNullable<Loan["interestPeriod"]>)}><option>ao dia</option><option>ao mês</option><option>ao ano</option><option>total</option></select></div>
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="mb-1.5 block text-[10px] font-semibold">Quantidade de parcelas</label><input className="field" type="number" min="1" value={installments} onChange={(event) => setInstallments(event.target.value)} required={loanType === "FINANCING"} /></div>
                  <div><label className="mb-1.5 block text-[10px] font-semibold">Valor da parcela</label><input className="field" value={monthlyPayment} onChange={(event) => setMonthlyPayment(event.target.value)} inputMode="decimal" placeholder="Calculado se vazio" /></div>
                </div>
              </div>
            )}
            <fieldset>
              <legend className="mb-2 text-[10px] font-semibold">{kind === "EXPENSE" ? "Titularidade e visibilidade" : "Organização e acesso"}</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { value: "INDIVIDUAL", label: "Pessoal privada", hint: "Só você vê", icon: ShieldCheck },
                  { value: "PARTIAL", label: kind === "EXPENSE" ? "Pessoal visível" : "Parcial", hint: kind === "EXPENSE" ? "Família vê; você paga" : "Divisão flexível", icon: Users },
                  { value: "JOINT", label: "Familiar", hint: "Responsabilidade conjunta", icon: Heart },
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <label key={option.value} className={cn("cursor-pointer rounded-xl border p-3 transition-colors", mode === option.value ? "border-[#b66e77] bg-[#fff4f3]" : "border-[#e6ddda] bg-white hover:bg-secondary")}>
                      <input type="radio" name="mode" checked={mode === option.value} onChange={() => setMode(option.value as AccessMode)} className="sr-only" />
                      <Icon className={cn("h-4 w-4", mode === option.value ? "text-primary" : "text-muted-foreground")} />
                      <p className="mt-2 text-[10px] font-semibold">{option.label}</p><p className="mt-0.5 text-[8px] text-muted-foreground">{option.hint}</p>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            {mode === "PARTIAL" && kind !== "EXPENSE" && (
              <div className="rounded-xl border border-[#dde8e1] bg-[#f2f7f4] p-4">
                <div className="flex items-center justify-between"><p className="text-[10px] font-semibold">Sua participação</p><span className="text-sm font-bold text-[#356453]">{partialShare}% / {100 - partialShare}%</span></div>
                <input type="range" min={5} max={95} step={5} value={partialShare} onChange={(event) => setPartialShare(Number(event.target.value))} className="mt-3 w-full accent-[#356453]" />
              </div>
            )}
            {kind === "EXPENSE" && (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e6ddda] bg-white p-3">
                <input type="checkbox" checked={recurring} onChange={(event) => setRecurring(event.target.checked)} className="h-4 w-4 accent-[#963344]" />
                <div><p className="text-[10px] font-semibold">Despesa recorrente</p><p className="mt-0.5 text-[9px] text-muted-foreground">Repete mensalmente até ser encerrada.</p></div>
              </label>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild><Button type="button" variant="ghost">Cancelar</Button></Dialog.Close>
              <Button type="submit"><Check className="h-4 w-4" />Salvar registro</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type FamilyDialogMode = "INVITE" | "CHILD" | "SAVINGS";

function FamilyDialog({
  mode,
  onClose,
  children,
  selectedChildId,
  onInvitation,
  onChild,
  onSavings,
}: {
  mode: FamilyDialogMode | null;
  onClose: () => void;
  children: ChildProfile[];
  selectedChildId: string | null;
  onInvitation: (invitation: FamilyInvitation) => void;
  onChild: (child: ChildProfile) => void;
  onSavings: (childId: string, saving: ChildProfile["savings"][number]) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [allowance, setAllowance] = useState("");
  const [savingKind, setSavingKind] = useState<"SAVINGS" | "INVESTMENT">("SAVINGS");
  const [balance, setBalance] = useState("");
  const [contribution, setContribution] = useState("");
  const [returnRate, setReturnRate] = useState("");
  const [symbol, setSymbol] = useState("");
  const [quote, setQuote] = useState("");
  const childId = selectedChildId ?? children[0]?.id;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (mode === "INVITE") {
      onInvitation({ id: `invite-${Date.now()}`, name, email, status: "PENDING", expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() });
    } else if (mode === "CHILD") {
      if (!birthDate || Number.isNaN(new Date(birthDate).getTime())) return;
      onChild({ id: `child-${Date.now()}`, name, birthDate, avatarColor: "#8FAFA1", monthlyAllowance: Number(allowance.replace(",", ".")) || 0, savings: [] });
    } else if (mode === "SAVINGS" && childId) {
      onSavings(childId, { id: `saving-${Date.now()}`, name, kind: savingKind, currentBalance: Number(balance.replace(",", ".")) || 0, monthlyContribution: Number(contribution.replace(",", ".")) || 0, annualReturnRate: Number(returnRate.replace(",", ".")) || 0, quoteSymbol: savingKind === "INVESTMENT" ? symbol.toUpperCase() : undefined, currentQuote: savingKind === "INVESTMENT" ? Number(quote.replace(",", ".")) : undefined });
    }
    setName(""); setEmail(""); setBirthDate(""); setAllowance(""); setBalance(""); setContribution(""); setReturnRate(""); setSymbol(""); setQuote(""); setSavingKind("SAVINGS");
    onClose();
  }

  const title = mode === "INVITE" ? "Convidar para a família" : mode === "CHILD" ? "Adicionar filho" : "Nova caixinha";
  return (
    <Dialog.Root open={mode !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-[#2a1e21]/45 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] max-h-[92vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[24px] bg-[#fffdfb] p-6 shadow-2xl outline-none">
          <div className="flex items-start justify-between">
            <div><Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title><Dialog.Description className="mt-1 text-[10px] text-muted-foreground">{mode === "INVITE" ? "A pessoa receberá um e-mail para aceitar o ingresso." : mode === "CHILD" ? "Menores entram diretamente, sem convite por e-mail." : "Escolha entre poupança e investimento e informe os dados atuais."}</Dialog.Description></div>
            <Dialog.Close className="rounded-xl p-2 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></Dialog.Close>
          </div>
          <form onSubmit={submit} className="mt-5 space-y-4">
            {mode === "SAVINGS" && (
              <>
                <div><label className="mb-1.5 block text-[10px] font-semibold">Filho</label><select className="field" value={childId} disabled={Boolean(selectedChildId)}>{children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-2">{(["SAVINGS", "INVESTMENT"] as const).map((kind) => <button key={kind} type="button" onClick={() => setSavingKind(kind)} className={cn("rounded-xl border p-3 text-[10px] font-semibold", savingKind === kind ? "border-[#b66e77] bg-[#fff4f3] text-primary" : "border-[#e6ddda] bg-white")}>{kind === "SAVINGS" ? "Poupança" : "Investimento"}</button>)}</div>
              </>
            )}
            <div><label className="mb-1.5 block text-[10px] font-semibold">{mode === "INVITE" ? "Nome da pessoa" : mode === "CHILD" ? "Nome do filho" : "Nome da caixinha"}</label><input className="field" value={name} onChange={(event) => setName(event.target.value)} required /></div>
            {mode === "INVITE" && <div><label className="mb-1.5 block text-[10px] font-semibold">E-mail</label><input className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="pessoa@email.com" required /></div>}
            {mode === "CHILD" && <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-[10px] font-semibold">Data de nascimento</label><input className="field" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} required /></div><div><label className="mb-1.5 block text-[10px] font-semibold">Mesada mensal</label><input className="field" value={allowance} onChange={(event) => setAllowance(event.target.value)} inputMode="decimal" placeholder="0,00" /></div></div>}
            {mode === "SAVINGS" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-[10px] font-semibold">Saldo atual</label><input className="field" value={balance} onChange={(event) => setBalance(event.target.value)} inputMode="decimal" required /></div><div><label className="mb-1.5 block text-[10px] font-semibold">Aporte mensal</label><input className="field" value={contribution} onChange={(event) => setContribution(event.target.value)} inputMode="decimal" /></div></div>
                <div><label className="mb-1.5 block text-[10px] font-semibold">Rentabilidade estimada (% ao ano)</label><input className="field" value={returnRate} onChange={(event) => setReturnRate(event.target.value)} inputMode="decimal" required /></div>
                {savingKind === "INVESTMENT" && <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-[10px] font-semibold">Ativo / cotação</label><input className="field" value={symbol} onChange={(event) => setSymbol(event.target.value)} placeholder="Ex.: IVVB11" required /></div><div><label className="mb-1.5 block text-[10px] font-semibold">Cotação atual</label><input className="field" value={quote} onChange={(event) => setQuote(event.target.value)} inputMode="decimal" required /></div></div>}
              </>
            )}
            <div className="flex justify-end gap-2 pt-2"><Dialog.Close asChild><Button type="button" variant="ghost">Cancelar</Button></Dialog.Close><Button type="submit">{mode === "INVITE" ? <Send className="h-4 w-4" /> : <Check className="h-4 w-4" />}{mode === "INVITE" ? "Enviar convite" : "Adicionar"}</Button></div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function FinanceDashboard({
  initialUserId,
  accessToken,
  onLogout,
}: {
  initialUserId: UserId;
  accessToken: string;
  onLogout: () => void;
}) {
  const [section, setSection] = useState<Section>("dashboard");
  const [currentUserId, setCurrentUserId] = useState<UserId>(initialUserId);
  const [view, setView] = useState<ViewMode>("ALL");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recordKind, setRecordKind] = useState<RecordKind>("EXPENSE");
  const [familyDialog, setFamilyDialog] = useState<FamilyDialogMode | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [investments, setInvestments] =
    useState<Investment[]>(initialInvestments);
  const [loans, setLoans] = useState<Loan[]>(initialLoans);
  const [children, setChildren] = useState<ChildProfile[]>(initialChildren);
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);

  const currentUser = users.find((user) => user.id === currentUserId)!;
  const visible = useMemo(
    () => ({
      transactions: visibleRecords(transactions, currentUserId, view),
      accounts: visibleRecords(accounts, currentUserId, view),
      investments: visibleRecords(investments, currentUserId, view),
      assets: visibleRecords(assets, currentUserId, view),
      financings: visibleRecords(financings, currentUserId, view),
      loans: visibleRecords(loans, currentUserId, view),
      rentals: visibleRecords(rentalProperties, currentUserId, view),
      goals: visibleRecords(goals, currentUserId, view),
    }),
    [accounts, currentUserId, investments, loans, transactions, view],
  );

  function openRecord(kind: RecordKind) {
    setRecordKind(kind);
    setDialogOpen(true);
  }

  async function postApi(path: string, body: unknown) {
    const response = await fetch(apiUrl(path), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Não foi possível salvar o registro");
    }
    return response.json();
  }

  useEffect(() => {
    let active = true;
    async function loadFamily() {
      try {
        const response = await fetch(apiUrl("/family"), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) return;
        const family = (await response.json()) as {
          invitations: Array<{
            id: string;
            name?: string | null;
            email: string;
            status: string;
            expiresAt: string;
          }>;
          children: Array<{
            id: string;
            name: string;
            birthDate: string;
            avatarColor: string;
            monthlyAllowance: string | number;
            savings: Array<{
              id: string;
              name: string;
              kind: "SAVINGS" | "INVESTMENT";
              currentBalance: string | number;
              monthlyContribution: string | number;
              annualReturnRate: string | number;
              quoteSymbol?: string | null;
              currentQuote?: string | number | null;
            }>;
          }>;
        };
        if (!active) return;
        setInvitations(
          family.invitations
            .filter((item) => item.status === "PENDING")
            .map((item) => ({
              id: item.id,
              name: item.name ?? item.email.split("@")[0],
              email: item.email,
              status: "PENDING" as const,
              expiresAt: item.expiresAt,
            })),
        );
        setChildren(
          family.children.map((child) => ({
            id: child.id,
            name: child.name,
            birthDate: child.birthDate,
            avatarColor: child.avatarColor,
            monthlyAllowance: Number(child.monthlyAllowance),
            savings: child.savings.map((saving) => ({
              id: saving.id,
              name: saving.name,
              kind: saving.kind,
              currentBalance: Number(saving.currentBalance),
              monthlyContribution: Number(saving.monthlyContribution),
              annualReturnRate: Number(saving.annualReturnRate),
              quoteSymbol: saving.quoteSymbol ?? undefined,
              currentQuote:
                saving.currentQuote == null
                  ? undefined
                  : Number(saving.currentQuote),
            })),
          })),
        );
      } catch {
        // A experiência continua com o seed visual se a API ficar indisponível.
      }
    }
    void loadFamily();
    return () => {
      active = false;
    };
  }, [accessToken]);

  function renderSection() {
    switch (section) {
      case "expenses":
        return <ExpensesView items={visible.transactions} onAdd={() => openRecord("EXPENSE")} />;
      case "family":
        return (
          <FamilyView
            children={children}
            invitations={invitations}
            onInvite={() => setFamilyDialog("INVITE")}
            onAddChild={() => setFamilyDialog("CHILD")}
            onAddSavings={(childId) => {
              setSelectedChildId(childId);
              setFamilyDialog("SAVINGS");
            }}
          />
        );
      case "investments":
        return <InvestmentsView items={visible.investments} />;
      case "assets":
        return <AssetsView items={visible.assets} />;
      case "loans":
        return <LoansView items={visible.loans} onAdd={() => openRecord("LOAN")} />;
      case "rentals":
        return <RentalsView items={visible.rentals} />;
      case "goals":
        return <GoalsView items={visible.goals} />;
      default:
        return (
          <Overview
            userId={currentUserId}
            view={view}
            transactions={transactions}
            investments={investments}
            accounts={accounts}
          />
        );
    }
  }

  return (
    <div className="min-h-screen">
      <Sidebar
        section={section}
        setSection={setSection}
        currentUserId={currentUserId}
        mobileOpen={mobileOpen}
        closeMobile={() => setMobileOpen(false)}
      />
      <div className="lg:pl-[268px]">
        <Topbar
          section={section}
          currentUserId={currentUserId}
          setCurrentUserId={(id) => {
            setCurrentUserId(id);
            setView("ALL");
          }}
          onMenu={() => setMobileOpen(true)}
          onAdd={() => openRecord("EXPENSE")}
          onLogout={onLogout}
        />
        <main className="px-4 py-6 sm:px-7 lg:px-9 lg:py-8">
          <div className="mx-auto max-w-[1480px]">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                {section === "dashboard" && (
                  <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#a44955]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Sexta-feira, 24 de julho
                  </div>
                )}
                <h2 className="text-xl font-bold tracking-[-0.045em] text-[#3b2c30] sm:text-2xl">
                  {section === "dashboard"
                    ? `Olá, ${currentUser.firstName}. Tudo bem por aí?`
                    : sectionTitles[section].title}
                </h2>
                <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
                  {sectionTitles[section].subtitle}
                </p>
              </div>
              <ScopeSwitcher value={view} onChange={setView} />
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-[#e5deda] bg-white/70 px-3 py-2 text-[9px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-[#3c6b58]" />
              <span>
                <strong className="font-semibold text-[#3e3436]">
                  Regra aplicada:
                </strong>{" "}
                registros individuais de {currentUser.firstName} + registros
                compartilhados permitidos.
              </span>
              <Badge className="ml-auto bg-[#e8f1ec] text-[#356453]">
                Isolamento validado
              </Badge>
            </div>

            {renderSection()}
          </div>
        </main>
      </div>

      <NewRecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialKind={recordKind}
        userId={currentUserId}
        onCreateTransaction={(transaction) => {
          setTransactions((current) => [transaction, ...current]);
          void postApi("/finance/expenses", {
            description: transaction.description,
            category: transaction.category,
            amount: transaction.amount,
            scope: transaction.expenseScope,
            sharedWithFamily: Boolean(transaction.sharedWithFamily),
            recurrenceType: transaction.recurrence,
            recurrenceInterval:
              transaction.recurrence === "RECURRING" ? "MONTHLY" : undefined,
            dueDate: new Date().toISOString(),
          }).catch(() => undefined);
        }}
        onCreateInvestment={(investment) => {
          setInvestments((current) => [investment, ...current]);
          void postApi("/finance/investments", {
            accessMode: investment.accessMode,
            ownerShare:
              investment.accessMode === "PARTIAL"
                ? investment.ownerShare
                : undefined,
            name: investment.name,
            institution: investment.institution,
            kind: "FIXED_INCOME",
            investedValue: investment.value,
            currentValue: investment.value,
          }).catch(() => undefined);
        }}
        onCreateLoan={(loan) => {
          setLoans((current) => [loan, ...current]);
          const interestPeriodMap = {
            "ao dia": "DAILY",
            "ao mês": "MONTHLY",
            "ao ano": "YEARLY",
            total: "TOTAL",
          } as const;
          void postApi("/finance/loans", {
            accessMode: loan.accessMode,
            ownerShare:
              loan.accessMode === "PARTIAL" ? loan.ownerShare : undefined,
            name: loan.name,
            type: loan.type,
            institution: loan.institution,
            principalValue: loan.principalValue,
            outstandingBalance: loan.outstanding,
            monthlyPayment: loan.monthlyPayment,
            hasInterest: loan.hasInterest,
            interestRate: loan.interestRate,
            interestPeriod: loan.interestPeriod
              ? interestPeriodMap[loan.interestPeriod]
              : undefined,
            paidInstallments: 0,
            totalInstallments: loan.totalInstallments,
            startDate: new Date().toISOString(),
          }).catch(() => undefined);
        }}
      />
      <FamilyDialog
        mode={familyDialog}
        onClose={() => {
          setFamilyDialog(null);
          setSelectedChildId(null);
        }}
        children={children}
        selectedChildId={selectedChildId}
        onInvitation={(invitation) => {
          setInvitations((current) => [invitation, ...current]);
          void postApi("/family/invitations", {
            name: invitation.name,
            email: invitation.email,
          })
            .then((created: { id: string }) =>
              setInvitations((current) =>
                current.map((item) =>
                  item.id === invitation.id ? { ...item, id: created.id } : item,
                ),
              ),
            )
            .catch(() => undefined);
        }}
        onChild={(child) => {
          const parsedBirthDate = new Date(child.birthDate);
          if (Number.isNaN(parsedBirthDate.getTime())) return;
          setChildren((current) => [...current, child]);
          void postApi("/family/children", {
            name: child.name,
            birthDate: parsedBirthDate.toISOString(),
            avatarColor: child.avatarColor,
            monthlyAllowance: child.monthlyAllowance,
          })
            .then((created: { id: string }) =>
              setChildren((current) =>
                current.map((item) =>
                  item.id === child.id ? { ...item, id: created.id } : item,
                ),
              ),
            )
            .catch(() => undefined);
        }}
        onSavings={(childId, saving) => {
          setChildren((current) =>
            current.map((child) =>
              child.id === childId
                ? { ...child, savings: [...child.savings, saving] }
              : child,
            ),
          );
          void postApi(`/family/children/${childId}/savings`, {
            name: saving.name,
            kind: saving.kind,
            currentBalance: saving.currentBalance,
            monthlyContribution: saving.monthlyContribution,
            annualReturnRate: saving.annualReturnRate,
            quoteSymbol: saving.quoteSymbol,
            currentQuote: saving.currentQuote,
            quoteCurrency: "BRL",
          })
            .then((created: { id: string }) =>
              setChildren((current) =>
                current.map((child) =>
                  child.id === childId
                    ? {
                        ...child,
                        savings: child.savings.map((item) =>
                          item.id === saving.id
                            ? { ...item, id: created.id }
                            : item,
                        ),
                      }
                    : child,
                ),
              ),
            )
            .catch(() => undefined);
        }}
      />
    </div>
  );
}

export function FinanceApp() {
  const [session, setSession] = useState<{
    userId: UserId;
    accessToken: string;
  } | null>(null);
  if (!session) {
    return (
      <LoginScreen
        onLogin={(userId, accessToken) => setSession({ userId, accessToken })}
      />
    );
  }
  return (
    <FinanceDashboard
      initialUserId={session.userId}
      accessToken={session.accessToken}
      onLogout={() => setSession(null)}
    />
  );
}
