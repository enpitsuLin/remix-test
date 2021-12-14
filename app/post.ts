import path from "path";
import fs from "fs/promises";
import parseFrontMatter from "front-matter";
import invariant from "tiny-invariant";
import { marked } from "marked";

export interface Post {
  slug: string;
  title: string;
  markdown: string;
  html: string;
  frontmatter: PostMarkdownAttributes;
}

export interface PostMarkdownAttributes {
  title: string;
  date?: string;
}

const postsPath = path.join(__dirname, "..", "posts");

function isValidPostsAttributes(attributes: any): attributes is PostMarkdownAttributes {
  return attributes?.title;
}

export async function createPost(post: Pick<Post, "title"> & Pick<Post, "slug"> & Partial<Post>) {
  const md = `---\ntitle: ${post.title}\n---\n\n${post.markdown}`;
  await fs.writeFile(path.join(postsPath, post.slug + ".md"), md);
  return getPost(post.slug);
}

export async function getPosts() {
  const dir = await fs.readdir(postsPath);
  return Promise.all(
    dir.map(async (filename) => {
      const file = await fs.readFile(path.join(postsPath, filename));
      const { attributes } = parseFrontMatter(file.toString());
      invariant(isValidPostsAttributes(attributes), `${filename} has bad meta data!`);
      return { slug: filename.replace(/\.md$/, ""), title: attributes.title, frontmatter: attributes };
    })
  );
}

export async function getPost(slug: string) {
  const filepath = path.join(postsPath, slug + ".md");
  const file = await fs.readFile(filepath);
  const { attributes, body } = parseFrontMatter(file.toString());
  invariant(isValidPostsAttributes(attributes), `Post ${filepath} is missing attributes`);
  const html = marked(body);
  return { slug, html, title: attributes.title, frontmatter: attributes };
}
