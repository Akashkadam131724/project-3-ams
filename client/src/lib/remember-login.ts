const STORAGE_KEY = "ams_remember_login";

export type RememberedLogin = {
  email: string;
  password: string;
};

export function loadRememberedLogin(): RememberedLogin | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RememberedLogin;
    if (
      typeof parsed.email === "string" &&
      typeof parsed.password === "string"
    ) {
      return { email: parsed.email, password: parsed.password };
    }
  } catch {
    /* ignore corrupt storage */
  }
  return null;
}

export function saveRememberedLogin(email: string, password: string) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ email: email.trim(), password })
  );
}

export function clearRememberedLogin() {
  localStorage.removeItem(STORAGE_KEY);
}
