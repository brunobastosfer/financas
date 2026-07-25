export type AccessMode = "INDIVIDUAL" | "JOINT" | "PARTIAL";
export type ViewMode = "ALL" | "MINE" | "JOINT";
export type UserId = "helena" | "gabriel";

export interface CoupleUser {
  id: UserId;
  name: string;
  firstName: string;
  email: string;
  initials: string;
  avatarTone: string;
}

export interface OwnedRecord {
  id: string;
  accessMode: AccessMode;
  ownerId: UserId;
  ownerShare: number;
  partnerShare: number;
  sharedWithFamily?: boolean;
}

export interface Account extends OwnedRecord {
  name: string;
  institution: string;
  type: string;
  balance: number;
  color: string;
}

export interface Transaction extends OwnedRecord {
  description: string;
  category: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  recurrence: "ONE_TIME" | "RECURRING";
  date: string;
  dueLabel: string;
  icon: "home" | "cart" | "heart" | "wallet" | "briefcase" | "car";
  expenseScope?: "PERSONAL" | "FAMILY";
}

export interface Investment extends OwnedRecord {
  name: string;
  category: string;
  value: number;
  yieldPercent: number;
  institution: string;
}

export interface Asset extends OwnedRecord {
  name: string;
  category: string;
  estimatedValue: number;
  detail: string;
}

export interface Financing extends OwnedRecord {
  name: string;
  category: string;
  originalValue: number;
  outstanding: number;
  monthlyPayment: number;
  payoffDate: string;
  paidInstallments: number;
  totalInstallments: number;
}

export interface RentalProperty extends OwnedRecord {
  name: string;
  address: string;
  rent: number;
  expenses: number;
  status: "OCCUPIED" | "VACANT" | "MAINTENANCE";
  tenant: string;
}

export interface Goal extends OwnedRecord {
  name: string;
  current: number;
  target: number;
  targetDate: string;
  emoji: string;
}

export interface Loan extends OwnedRecord {
  name: string;
  type: "LOAN" | "FINANCING";
  institution: string;
  principalValue: number;
  outstanding: number;
  monthlyPayment: number;
  hasInterest: boolean;
  interestRate?: number;
  interestPeriod?: "ao dia" | "ao mês" | "ao ano" | "total";
  paidInstallments: number;
  totalInstallments?: number;
  payoffDate?: string;
}

export interface ChildSavings {
  id: string;
  name: string;
  kind: "SAVINGS" | "INVESTMENT";
  currentBalance: number;
  monthlyContribution: number;
  annualReturnRate: number;
  quoteSymbol?: string;
  currentQuote?: number;
}

export interface ChildProfile {
  id: string;
  name: string;
  birthDate: string;
  avatarColor: string;
  monthlyAllowance: number;
  savings: ChildSavings[];
}

export interface FamilyInvitation {
  id: string;
  name: string;
  email: string;
  status: "PENDING";
  expiresAt: string;
}
