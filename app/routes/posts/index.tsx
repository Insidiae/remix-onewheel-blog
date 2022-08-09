import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getPostListings } from "~/models/post.server";
import { useOptinalAdminUser } from "~/utils";

export async function loader() {
  const posts = await getPostListings();

  return json({ posts });
}

export default function PostsRoute() {
  const { posts } = useLoaderData<typeof loader>();

  const adminUser = useOptinalAdminUser();

  return (
    <main>
      <h1>Posts</h1>
      {adminUser ? (
        <Link to="admin" className="text-red-600 underline">
          Admin
        </Link>
      ) : null}
      <ul>
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              to={post.slug}
              prefetch="intent"
              className="text-blue-600 underline"
            >
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
