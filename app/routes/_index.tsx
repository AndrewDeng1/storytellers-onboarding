import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useFetcher } from "@remix-run/react";
import { createSupabaseServerClient } from "~/utils/supabase.server";
import { useState } from "react";
import React from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return json({ user: null, tasks: [] });
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

  if (action === "edit") {
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const { error } = await supabase
      .from('tasks')
      .update({ title })
      .eq('id', id)
      .eq('user_id', session.user.id);
    
    if (error) {
      return json({ error: error.message }, { status: 400 });
    }
  }

  return json({ success: true }, {
    headers: response.headers,
  });
}

export default function Index() {
  const { user, tasks } = useLoaderData<typeof loader>();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const addTaskFetcher = useFetcher();
  const editTaskFetcher = useFetcher();

  // Clear input after successful submission
  React.useEffect(() => {
    if (addTaskFetcher.state === "idle" && addTaskFetcher.data) {
      const form = document.querySelector('form[action*="addTask"]') as HTMLFormElement;
      const input = form?.querySelector('input[name="title"]') as HTMLInputElement;
      if (input) {
        input.value = '';
      }
    }
  }, [addTaskFetcher.state, addTaskFetcher.data]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-indigo-600">
                TaskMaster
              </Link>
            </div>
            <div className="flex items-center">
              {user ? (
                <Form method="post">
                  <button
                    type="submit"
                    name="_action"
                    value="logout"
                    className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                  >
                    Sign out
                  </button>
                </Form>
              ) : (
                <Link
                  to="/login"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {user ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <addTaskFetcher.Form 
                method="post" 
                className="flex gap-4"
                onSubmit={(e) => {
                  const form = e.currentTarget;
                  const input = form.querySelector('input[name="title"]') as HTMLInputElement;
                  if (input && input.value.trim()) {
                    setTimeout(() => {
                      input.value = '';
                    }, 0);
                  }
                }}
              >
                <input
                  type="text"
                  name="title"
                  placeholder="What needs to be done?"
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors bg-white text-black placeholder-gray-400"
                  required
                />
                <button
                  type="submit"
                  name="_action"
                  value="create"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  Add Task
                </button>
              </addTaskFetcher.Form>
            </div>

            <div className="bg-white rounded-2xl shadow-xl divide-y divide-gray-100">
              {tasks?.map((task) => (
                <div key={task.id} className="p-6 flex items-center justify-between group">
                  <div className="flex items-center gap-4 flex-1">
                    <Form method="post" className="flex-shrink-0">
                      <input type="hidden" name="id" value={task.id} />
                      <input type="hidden" name="completed" value={task.completed.toString()} />
                      <button
                        type="submit"
                        name="_action"
                        value="toggle"
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.completed
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'border-gray-300 hover:border-indigo-600'
                        }`}
                      >
                        {task.completed && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </Form>
                    {editingTaskId === task.id ? (
                      <div className="flex-1 flex gap-2">
                        <div className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-colors bg-white">
                          <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="w-full bg-transparent focus:outline-none text-black break-all whitespace-normal"
                            autoFocus
                          />
                        </div>
                        <editTaskFetcher.Form 
                          method="post"
                          onSubmit={(e) => {
                            setEditingTaskId(null);
                            setEditedTitle("");
                          }}
                        >
                          <input type="hidden" name="id" value={task.id} />
                          <input type="hidden" name="title" value={editedTitle} />
                          <input type="hidden" name="_action" value="edit" />
                          <button
                            type="submit"
                            className="w-20 h-10 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center"
                          >
                            Save
                          </button>
                        </editTaskFetcher.Form>
                        <button
                          type="button"
                          className="w-20 h-10 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm flex items-center justify-center"
                          onClick={() => {
                            setEditingTaskId(null);
                            setEditedTitle("");
                          }}
                        >
                          Cancel
                        </button>
                        <div className="w-8"></div>
                      </div>
                    ) : (
                      <span
                        className={`text-lg flex-1 break-all whitespace-normal pl-6 ${
                          task.completed ? 'text-gray-400 line-through' : 'text-gray-900'
                        }`}
                      >
                        {task.title}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    {editingTaskId !== task.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTaskId(task.id);
                          setEditedTitle(task.title);
                        }}
                        className="text-gray-400 hover:text-indigo-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                    <Form method="post">
                      <input type="hidden" name="id" value={task.id} />
                      <button
                        type="submit"
                        name="_action"
                        value="delete"
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </Form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to TaskMaster
            </h1>
            <p className="text-gray-500 mb-8">
              Sign in to manage your tasks
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
