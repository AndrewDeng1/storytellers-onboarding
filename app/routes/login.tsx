import { json, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { createSupabaseServerClient } from "~/utils/supabase.server";

type ActionData = {
  error?: string;
  message?: string;
};

export async function action({ request }: ActionFunctionArgs) {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });

  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const action = formData.get("_action");

  if (action === "login") {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return json<ActionData>({ error: error.message });
    }

    if (data.session) {
      return redirect("/", {
        headers: response.headers,
      });
    }
  }

  if (action === "signup") {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NODE_ENV === "production" 
           ? "https://storytellers-onboarding.vercel.app/auth/callback"
           : `${new URL(request.url).origin}/auth/callback`,
        data: {
          site_name: "TaskMaster",
        }
      },
    });

    if (error) {
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        return json<ActionData>({ error: "An account with this email already exists" });
      }
      return json<ActionData>({ error: error.message });
    }

    if (data.user && !data.user.identities?.length) {
      return json<ActionData>({ error: "An account with this email already exists" });
    }

    if (data.user) {
      return json<ActionData>({ 
        message: "Please check your email for a confirmation link to get started with TaskMaster"
      });
    }
  }

  return json<ActionData>({ error: "Invalid action" });
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-indigo-100 transform transition-all hover:shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent mb-3">Welcome Back</h1>
            <p className="text-gray-500 text-lg">Sign in to manage your tasks</p>
          </div>

          <Form className="space-y-6" method="post">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Email address"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-black placeholder-gray-400"
                required
              />
            </div>

            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-black placeholder-gray-400"
                required
              />
            </div>

            {actionData?.error && (
              <div className="text-red-500 text-sm text-center bg-red-50/50 backdrop-blur-sm py-2 px-4 rounded-lg border border-red-100">
                {actionData.error}
              </div>
            )}

            {actionData?.message && (
              <div className="text-green-500 text-sm text-center bg-green-50/50 backdrop-blur-sm py-2 px-4 rounded-lg border border-green-100">
                {actionData.message}
              </div>
            )}

            <div className="space-y-4">
              <button
                type="submit"
                name="_action"
                value="login"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
              <button
                type="submit"
                name="_action"
                value="signup"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-xl font-medium transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                {isSubmitting ? "Signing up..." : "Create account"}
              </button>
            </div>
          </Form>

          <div className="mt-8 text-center">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-indigo-600 transition-all hover:scale-105"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 