import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { createSupabaseServerClient } from "~/utils/supabase.server";

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

  return json({ success: true }, {
    headers: response.headers,
  });
}

export default function Index() {
  const { user, tasks } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-xl font-bold text-gray-900">
                  Todo App
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              {user ? (
                <Form method="post">
                  <button
                    type="submit"
                    name="_action"
                    value="logout"
                    className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Logout
                  </button>
                </Form>
              ) : (
                <Link
                  to="/login"
                  className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {user ? (
          <div className="px-4 py-6 sm:px-0">
            <Form method="post" className="mb-6">
              <div className="flex gap-4">
                <input
                  type="text"
                  name="title"
                  placeholder="Add a new task..."
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
                <button
                  type="submit"
                  name="_action"
                  value="create"
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Add Task
                </button>
              </div>
            </Form>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {tasks?.map((task) => (
                  <li key={task.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Form method="post" className="mr-4">
                          <input type="hidden" name="id" value={task.id} />
                          <input type="hidden" name="completed" value={task.completed.toString()} />
                          <button
                            type="submit"
                            name="_action"
                            value="toggle"
                            className={`w-6 h-6 rounded-full border-2 ${
                              task.completed
                                ? 'bg-indigo-600 border-indigo-600'
                                : 'border-gray-300'
                            }`}
                          />
                        </Form>
                        <span
                          className={`text-lg ${
                            task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                      <Form method="post">
                        <input type="hidden" name="id" value={task.id} />
                        <button
                          type="submit"
                          name="_action"
                          value="delete"
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </Form>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to Todo App
            </h2>
            <p className="text-gray-600 mb-8">
              Please login to manage your tasks
            </p>
            <Link
              to="/login"
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Login
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
