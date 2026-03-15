import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

export function GET() {
  const posts = getAllPosts();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${siteConfig.name}</title>
    <description>${siteConfig.description}</description>
    <link>${siteConfig.url}</link>
    ${posts
      .map(
        (post) => `<item>
      <title>${escapeXml(post.title)}</title>
      <description>${escapeXml(post.summary)}</description>
      <link>${siteConfig.url}/posts/${post.slug}</link>
      <guid>${siteConfig.url}/posts/${post.slug}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>`,
      )
      .join("\n")}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
