import { json } from "@remix-run/node";
import { useLoaderData, Link, Outlet } from "@remix-run/react";

import { getPostListings } from "~/models/post.server";
import { requireAdminUser } from "~/session.server";

import type { LoaderArgs } from "@remix-run/node";

export async function loader({ request }: LoaderArgs) {
  await requireAdminUser(request);
  return json({ posts: await getPostListings() });
}

export default function AdminRoute() {
  const { posts } = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="my-6 mb-2 border-b-2 text-center text-3xl">Blog Admin</h1>
      <div className="grid grid-cols-4 gap-6">
        <nav className="col-span-4 md:col-span-1">
          <ul>
            {posts.map((post) => (
              <li key={post.slug}>
                <Link to={post.slug} className="text-blue-600 underline">
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main className="col-span-4 md:col-span-3">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="text-red-500">
      Oh no, something went wrong!
      <pre>{error.message}</pre>
    </div>
  );
}
