import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { createSupabaseServerClient } from "./utils/supabase.server";
import { useEffect } from "react";

import "./tailwind.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return json({ user: null });
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  return json({ user: session.user, tasks }, {
    headers: response.headers,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const action = formData.get("_action");

  if (action === "logout") {
    await supabase.auth.signOut();
    return json({ success: true }, {
      headers: response.headers,
    });
  }

  if (action === "create") {
    const title = formData.get("title") as string;
    await supabase
      .from('tasks')
      .insert([{ title, user_id: session.user.id }]);
  }

  if (action === "delete") {
    const id = formData.get("id") as string;
    await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
  }

  if (action === "toggle") {
    const id = formData.get("id") as string;
    const completed = formData.get("completed") === "true";
    await supabase
      .from('tasks')
      .update({ completed: !completed })
      .eq('id', id)
      .eq('user_id', session.user.id);
  }

  return json({ success: true }, {
    headers: response.headers,
  });
}

export default function App() {
  const { user, tasks } = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
