import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts().map((post) => ({
    url: `${siteConfig.url}/posts/${post.slug}`,
    lastModified: post.date,
  }));

  return [
    {
      url: siteConfig.url,
      lastModified: new Date().toISOString(),
    },
    {
      url: `${siteConfig.url}/about`,
      lastModified: new Date().toISOString(),
    },
    ...posts,
  ];
}
