import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/** Published posts, newest first. Drafts are visible only in `astro dev`. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const postUrl = (post: Post) => `/posts/${post.id}/`;

/** ISO date, e.g. 2026-10-14. */
export const formatDate = (date: Date) => date.toISOString().slice(0, 10);

export const formatTags = (tags: string[]) => tags.map((tag) => `#${tag}`).join(' ');

/** Minutes to read at ~200 words per minute. */
export function readingTime(markdown = '') {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
