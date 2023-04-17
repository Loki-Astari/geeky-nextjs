import config from "@config/config.json";
import Base from "@layouts/Baseof";
import { humanize, markdownify } from "@lib/utils/textConverter";
import Link from "next/link";
const { blog_folder } = config.settings;
import { getSinglePage } from "@lib/contentParser";
import { sortByDate } from "@lib/utils/sortFunctions";

const All = ({ posts }) => {
  return (
    <Base title={"All Posts"}>
      <section className="section pt-0">
        {markdownify(
          "All Posts",
          "h1",
          "h2 mb-16 bg-theme-light dark:bg-darkmode-theme-dark py-12 text-center lg:text-[55px]"
        )}
        <div className="container pt-12">
          {posts.map(post => (
            <div className="row">
              <span className="col block mt-2 block rounded-lg hover:bg-primary hover:text-red">
                <Link
                  href={`${blog_folder}/${post.slug}`}
                >
                  {post.frontmatter.title}
                </Link>
              </span>
            </div>
          ))}
        </div>
      </section>
    </Base>
  );
};

export default All;

export const getStaticProps = () => {
  const posts = getSinglePage(`content/${blog_folder}`);
  const sortedPosts = sortByDate(posts).reverse();
  return {
    props: {
      posts:  sortedPosts,
    },
  };
};
