import { createClient } from "@supabase/supabase-js";
import { getServerEnvironment } from "@/lib/server-supabase";

export interface RequestCustomer {
  userId: string | null;
  error: string | null;
  status?: number;
}

export async function getRequestCustomer(request: Request): Promise<RequestCustomer> {
  const authorization = request.headers.get("authorization");
  if (!authorization) return { userId: null, error: null };

  const match = /^Bearer ([A-Za-z0-9._~-]{1,4096})$/i.exec(authorization);
  if (!match) {
    return { userId: null, error: "The sign-in session is invalid. Please sign in again.", status: 401 };
  }

  const env = await getServerEnvironment();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { userId: null, error: "Customer account verification is not configured.", status: 503 };
  }

  try {
    const authClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await authClient.auth.getUser(match[1]);
    if (error || !data.user) {
      return { userId: null, error: "Your sign-in session has expired. Please sign in again.", status: 401 };
    }
    return { userId: data.user.id, error: null };
  } catch {
    return { userId: null, error: "We could not verify your account. Please try again.", status: 503 };
  }
}
