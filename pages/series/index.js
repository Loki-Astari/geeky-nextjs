import config from "@config/config.json";
import Base from "@layouts/Baseof";
import { getTaxonomy } from "@lib/taxonomyParser";
import { humanize, markdownify } from "@lib/utils/textConverter";
import Link from "next/link";
const { blog_folder } = config.settings;
import { getSinglePage } from "@lib/contentParser";
import { sortByDate } from "@lib/utils/sortFunctions";
import { FaFolder } from "react-icons/fa";
import { slugify } from "@lib/utils/textConverter";

const Categories = ({ series }) => {
  return (
    <Base title={"series"}>
      <section className="section pt-0">
        {markdownify(
          "Series",
          "h1",
          "h2 mb-16 bg-theme-light dark:bg-darkmode-theme-dark py-12 text-center lg:text-[55px]"
        )}
        <div className="container pt-12">
          {series.map(aSeries => (
            <div key="{aSeries.name}">
                <div className="row">
                  <span className="col mt-4 block flex w-full rounded-lg bg-theme-light px-4 py-4 font-bold text-dark transition dark:bg-darkmode-theme-dark dark:text-darkmode-light">
                      {humanize(aSeries.name)}
                  </span>
                </div>
                {aSeries.posts.map(post => (
                  <div key="{post.frontmatter.title}" className="row">
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
          ))}
        </div>
      </section>
    </Base>
  );
};

export default Categories;

export const getStaticProps = () => {
  const posts = getSinglePage(`content/${blog_folder}`);
  const series = getTaxonomy(`content/${blog_folder}`, "series");
  const seriesWithPosts = series.map((seriesName) => {
    const filteredPosts = sortByDate(posts).filter(post =>
      slugify(post.frontmatter.series) == seriesName
    );
    return {
      name: seriesName,
      posts: filteredPosts.reverse(),
    };
  });
  return {
    props: {
      series: seriesWithPosts,
    },
  };
};
