import { http, setAccessToken } from "./http";

export type User = {
  id: string;
  email: string;
  fullName: string;
  currency?: string;
  monthlyIncome?: number | null;
  cycleStartDay?: number | null;
  onboardingCompleted?: boolean;
};

export type WalletType = "cash" | "bank" | "e_wallet";

export type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
  setup?: {
    wallet: { name: string; type: WalletType; balance: number };
    monthlyIncome?: number;
    cycleStartDay?: number;
    currency?: "VND" | "USD" | "EUR";
  };
};

type AuthResult = {
  accessToken: string;
  expiresIn: number;
  user: User;
  wallet: {
    id: string;
    name: string;
    type: WalletType;
    balance: number;
  } | null;
};

export async function login(email: string, password: string) {
  const r = await http<AuthResult>("/auth/login", {
    method: "POST",
    body: { email, password },
    skipRefresh: true,
  });
  setAccessToken(r.accessToken);
  return r.user;
}

export async function register(input: RegisterInput) {
  const r = await http<AuthResult>("/auth/register", {
    method: "POST",
    body: input,
    skipRefresh: true,
  });
  setAccessToken(r.accessToken);
  return r.user;
}

export async function logout() {
  try {
    await http("/auth/logout", { method: "POST", skipRefresh: true });
  } finally {
    setAccessToken(null);
  }
}

export async function fetchMe(): Promise<User | null> {
  try {
    // Vừa tải lại trang thì chưa có access token: 401 -> http tự refresh bằng cookie rồi gọi lại
    return await http<User>("/users/me");
  } catch {
    return null;
  }
}
