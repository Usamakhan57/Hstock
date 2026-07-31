import React, { useEffect, useMemo, useState } from 'react';
import { Search, Mail } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import BlogPostCard from '../components/blog/BlogPostCard';
import {
  getPublishedPosts, getFeaturedPosts, getActiveBlogCategories,
  getPublicBlogSettings, categoryName,
} from '../services/blog/blogService';

/**
 * Every section here — hero, labels, categories, posts — reads from the
 * Blog CMS (admin/blog) via blogService. No titles, descriptions,
 * categories, posts, or button labels are hardcoded: editing a post or
 * a setting in Admin > Blog updates this page with no frontend code
 * changes.
 */
const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    Promise.all([getPublishedPosts(), getFeaturedPosts(), getActiveBlogCategories(), getPublicBlogSettings()]).then(
      ([p, featured, c, s]) => {
        setPosts(p);
        setFeaturedPosts(featured);
        setCategories(c);
        setSettings(s);
        setVisibleCount(s.postsPerPage || 9);
        setLoading(false);
      }
    );
  }, []);

  const featuredCategoryPills = useMemo(
    () => categories.filter((c) => settings?.featuredCategoryIds?.includes(c.id)),
    [categories, settings]
  );

  const filtered = useMemo(() => {
    let list = posts;
    if (activeCategory !== 'All') {
      const cat = categories.find((c) => c.name === activeCategory);
      if (cat) list = list.filter((p) => p.categoryId === cat.id);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q));
    }
    return list;
  }, [posts, activeCategory, query, categories]);

  const visiblePosts = useMemo(() => filtered.slice(0, visibleCount || 9), [filtered, visibleCount]);
  const hasMore = filtered.length > visiblePosts.length;

  const heroMain = featuredPosts[0];
  const heroSide = featuredPosts.slice(1, 3);

  if (loading || !settings) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-[90rem] px-5 lg:px-8 pt-10 pb-24 text-center text-sm text-muted-foreground">Loading…</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Seo title={settings.defaultSeoTitle || settings.pageTitle} description={settings.defaultMetaDescription} image={settings.defaultOgImage} />
      <Header />
      <div className="mx-auto max-w-[90rem] px-5 lg:px-8 pt-10">
        <Breadcrumbs items={[{ name: 'Blog' }]} />
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">{settings.heroHeading}</h1>
        <p className="text-muted-foreground mt-3 max-w-lg">{settings.heroDescription}</p>

        {heroMain && (
          <div className="mt-10">
            {settings.featuredSectionHeading && (
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">{settings.featuredSectionHeading}</h2>
            )}
            <div className="grid lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <BlogPostCard post={heroMain} categoryLabel={categoryName(categories, heroMain.categoryId)} variant="featured" />
              </div>
              {heroSide.length > 0 && (
                <div className="grid grid-rows-2 gap-5">
                  {heroSide.map((p) => (
                    <BlogPostCard key={p.slug} post={p} categoryLabel={categoryName(categories, p.categoryId)} variant="grid" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {settings.enableSearch && (
          <div className="flex items-center gap-2 bg-white rounded-full border border-border px-4 py-2.5 mt-10 max-w-md">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={settings.searchPlaceholder}
              className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground"
            />
          </div>
        )}

        {settings.enableCategories && featuredCategoryPills.length > 0 && (
          <div className="flex gap-2 mt-6 overflow-x-auto pb-1">
            {[settings.allCategoriesLabel, ...featuredCategoryPills.map((c) => c.name)].map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === c ? 'brand-gradient text-white' : 'bg-white border border-border hover:bg-secondary'}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-border p-16 text-center mt-8">
            <p className="text-lg font-semibold">{settings.noResultsTitle}</p>
            <p className="text-sm text-muted-foreground mt-1">{settings.noResultsDescription}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {visiblePosts.map((p) => (
                <BlogPostCard key={p.slug} post={p} categoryLabel={categoryName(categories, p.categoryId)} variant="grid" />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount((c) => c + (settings.postsPerPage || 9))}
                  className="px-6 py-3 rounded-full border border-border text-sm font-semibold hover:bg-secondary transition-colors"
                >
                  {settings.loadMoreButtonLabel}
                </button>
              </div>
            )}
          </>
        )}

        {settings.enableNewsletter ? (
          <div className="mt-16 mb-24 bg-white rounded-3xl border border-border p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 justify-between soft-shadow">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">{settings.newsletterHeading}</h2>
              <p className="text-sm text-muted-foreground mt-1">{settings.newsletterDescription}</p>
            </div>
            <form onSubmit={(e) => e.preventDefault()} className="flex w-full md:w-auto gap-2">
              <div className="flex items-center gap-2 bg-secondary/60 rounded-full px-4 py-2.5 flex-1 md:w-72">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <input type="email" required placeholder={settings.newsletterPlaceholder} className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground" />
              </div>
              <button type="submit" className="px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow shrink-0">
                {settings.newsletterButtonLabel}
              </button>
            </form>
          </div>
        ) : (
          <div className="pb-16" />
        )}
      </div>
      <Footer />
    </div>
  );
};

export default BlogPage;
