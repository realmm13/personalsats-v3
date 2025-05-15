import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// This file uses fs+gray-matter to load MDX posts. Contentlayer is not used here.

export interface Post {
  _meta: { path: string };
  title: string;
  description?: string;
  date: string;
  published: boolean;
  tags?: string[];
  image?: string;
  mdx?: string;
}

const postsDir = path.join(process.cwd(), 'posts');

export function getAllPosts(): Post[] {
  return fs
    .readdirSync(postsDir)
    .filter((file) => file.endsWith('.mdx'))
    .map((fileName) => {
      const source = fs.readFileSync(path.join(postsDir, fileName), 'utf8');
      const { data, content } = matter(source);
      return {
        _meta: { path: `/posts/${fileName.replace(/\.mdx?$/, '')}` },
        title: data.title,
        description: data.description,
        date: data.date,
        published: data.published,
        tags: data.tags,
        image: data.image,
        mdx: content,
      };
    })
    .filter((post) => post.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((post) => post._meta.path === slug);
}
