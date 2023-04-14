import { serialize } from "next-mdx-remote/serialize";
//import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
//import rehypeHighlight from "react-syntax-highlighter";
//import HighlightedCode from "@layouts/shortcodes/Code";
import remarkGfm from "remark-gfm";

// mdx content parser
const parseMDX = async (content) => {
  const options = {
    mdxOptions: {
      rehypePlugins: [rehypeHighlight], // [rehypeSlug],
      remarkPlugins: [remarkGfm],
    },
  };
  return await serialize(content, options);
};

export default parseMDX;
