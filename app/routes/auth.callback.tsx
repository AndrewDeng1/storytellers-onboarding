import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { createSupabaseServerClient } from "~/utils/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  return redirect("/auth/confirmation", {
    headers: response.headers,
  });
} 