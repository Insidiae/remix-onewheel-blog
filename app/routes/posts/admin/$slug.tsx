import {
  Form,
  useActionData,
  useTransition,
  useLoaderData,
  useCatch,
  useParams,
} from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import invariant from "tiny-invariant";

import {
  createPost,
  deletePost,
  getPost,
  updatePost,
} from "~/models/post.server";
import { requireAdminUser } from "~/session.server";

import type { LoaderArgs, ActionArgs } from "@remix-run/node";
import type { Post } from "~/models/post.server";

type LoaderData = { post?: Post };

export async function loader({ request, params }: LoaderArgs) {
  await requireAdminUser(request);

  invariant(params.slug, "slug is required");

  if (params.slug === "new") {
    return json<LoaderData>({});
  }

  const post = await getPost(params.slug);

  if (!post) {
    throw new Response("404 Not Found", { status: 404 });
  }

  return json<LoaderData>({ post });
}

export async function action({ request, params }: ActionArgs) {
  await requireAdminUser(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  invariant(params.slug, "slug is required");

  if (intent === "delete") {
    await deletePost(params.slug);
    return redirect("/posts/admin");
  }

  const title = formData.get("title");
  const slug = formData.get("slug");
  const markdown = formData.get("markdown");

  const errors = {
    title: title ? null : "Title is required!",
    slug: slug ? null : "Slug is required!",
    markdown: markdown ? null : "Markdown is required!",
  };

  const hasErrors = Object.values(errors).some(Boolean);
  if (hasErrors) {
    return json(errors);
  }

  invariant(typeof title === "string", "Title must be a string!");
  invariant(typeof slug === "string", "Slug must be a string!");
  invariant(typeof markdown === "string", "Markdown must be a string!");

  if (params.slug === "new") {
    await createPost({ title, slug, markdown });
  } else {
    await updatePost(params.slug, { title, slug, markdown });
  }

  return redirect("/posts/admin");
}

const inputClassName = `w-full rounded border border-gray-500 px-2 py-1 text-lg`;

export default function NewPostRoute() {
  const data = useLoaderData<typeof loader>();
  const errors = useActionData<typeof action>();
  const transition = useTransition();

  const isCreating = transition.submission?.formData.get("intent") === "create";
  const isUpdating = transition.submission?.formData.get("intent") === "update";
  const isDeleting = transition.submission?.formData.get("intent") === "delete";

  const isNewPost = !data.post;

  return (
    <Form method="post" key={data.post?.slug ?? "new"}>
      <p>
        <label>
          Post Title:{" "}
          {errors?.title ? (
            <em className="text-red-600">{errors.title}</em>
          ) : null}
          <input
            type="text"
            name="title"
            className={inputClassName}
            defaultValue={data.post?.title}
          />
        </label>
      </p>
      <p>
        <label>
          Post Slug:{" "}
          {errors?.slug ? (
            <em className="text-red-600">{errors.slug}</em>
          ) : null}
          <input
            type="text"
            name="slug"
            className={inputClassName}
            defaultValue={data.post?.slug}
          />
        </label>
      </p>
      <p>
        <label htmlFor="markdown">
          Markdown:{" "}
          {errors?.markdown ? (
            <em className="text-red-600">{errors.markdown}</em>
          ) : null}
        </label>
        <textarea
          id="markdown"
          rows={20}
          name="markdown"
          className={`${inputClassName} font-mono`}
          defaultValue={data.post?.markdown}
        />
      </p>
      <div className="flex justify-end gap-4">
        <button
          type="submit"
          name="intent"
          value={isNewPost ? "create" : "update"}
          disabled={isCreating || isUpdating || isDeleting}
          className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
        >
          {isNewPost ? (isCreating ? "Creating post..." : "Create Post") : null}
          {isNewPost ? null : isUpdating ? "Updating post..." : "Update Post"}
        </button>
        {isNewPost ? null : (
          <button
            type="submit"
            name="intent"
            value="delete"
            disabled={isCreating || isUpdating || isDeleting}
            className="rounded bg-red-500 py-2 px-4 text-white hover:bg-red-600 focus:bg-red-400 disabled:bg-red-300"
          >
            {isDeleting ? "Deleting post..." : "Delete Post"}
          </button>
        )}
      </div>
    </Form>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();

  if (caught.status === 404) {
    return (
      <div>
        Uh oh! This post with the slug{" "}
        <code className="bg-gray-200 font-mono">{params.slug}</code> does not
        exist!
      </div>
    );
  }

  throw new Error(
    `Unsupported thrown response with status code: ${caught.status}`
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  if (error instanceof Error) {
    return (
      <div className="text-red-500">
        Oh no, something went wrong!
        <pre>{error.message}</pre>
      </div>
    );
  }

  return <div className="text-red-500">Oh no, something went wrong!</div>;
}
