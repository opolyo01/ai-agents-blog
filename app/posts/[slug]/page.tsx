import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Markdown from "@/components/Markdown";
import { getAllPosts, getPostBySlug, postExists } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  if (!postExists(slug)) {
    return {};
  }

  const post = getPostBySlug(slug);
  const postUrl = `${siteConfig.url}/posts/${post.meta.slug}`;

  return {
    title: post.meta.title,
    description: post.meta.summary,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title: post.meta.title,
      description: post.meta.summary,
      url: postUrl,
      type: "article",
      publishedTime: post.meta.date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.meta.title,
      description: post.meta.summary,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;

  if (!postExists(slug)) {
    notFound();
  }

  const post = getPostBySlug(slug);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">{post.meta.title}</h1>
      <p className="mt-2 text-sm text-gray-500">
        <time dateTime={post.meta.date}>{post.meta.date}</time>
      </p>

      <article className="prose prose-lg prose-zinc mt-10 max-w-none">
        <Markdown content={post.content} />
      </article>
    </main>
  );
}
