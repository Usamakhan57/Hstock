import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Calendar, Clock, Globe, Twitter, Instagram, Facebook, Linkedin, Youtube } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import BlogPostCard from '../components/blog/BlogPostCard';
import {
  getPublishedPostBySlug, getRelatedPosts, getActiveBlogCategories,
  getPublicBlogSettings, getAllBlogAuthors, categoryName, authorById,
} from '../services/blog/blogService';
import { buildBlogPostingSchema, buildRobotsContent } from '../services/blog/seoUtils';
import { getBlogPosts } from '../admin/api/blogPosts';
import { SITE } from '../constants';

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const SOCIAL_ICONS = { website: Globe, twitter: Twitter, instagram: Instagram, facebook: Facebook, linkedin: Linkedin, youtube: Youtube };

const BlogPostPage = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';

  const [post, setPost] = useState(undefined); // undefined = loading, null = not found
  const [related, setRelated] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Preview mode (used by the admin "Preview" button) can render a
      // draft/scheduled post by slug regardless of status; the public
      // route always goes through the published-only lookup.
      const found = isPreview
        ? (await getBlogPosts()).find((p) => p.slug === slug) || null
        : await getPublishedPostBySlug(slug);

      const [cats, s, auth] = await Promise.all([getActiveBlogCategories(), getPublicBlogSettings(), getAllBlogAuthors()]);
      if (cancelled) return;
      setCategories(cats);
      setSettings(s);
      setAuthors(auth);
      setPost(found);
      if (found && s.enableRelatedPosts) {
        const rel = await getRelatedPosts(found, 3);
        if (!cancelled) setRelated(rel);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, isPreview]);

  const author = useMemo(() => (post ? authorById(authors, post.authorId) : null), [post, authors]);

  const schema = useMemo(() => {
    if (!post) return null;
    return buildBlogPostingSchema(post, {
      authorName: author?.name,
      categoryLabel: categoryName(categories, post.categoryId),
      url: `${SITE.url}/blog/${post.slug}`,
    });
  }, [post, author, categories]);

  if (post === undefined || !settings) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 grid place-items-center px-5 py-24 text-center text-sm text-muted-foreground">Loading…</div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 grid place-items-center px-5 py-24 text-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Post not found</h1>
            <p className="text-muted-foreground mb-6">This article may have been moved, unpublished, or the link is incorrect.</p>
            <Link to="/blog" className="inline-flex items-center justify-center px-6 py-3 rounded-full brand-gradient text-white font-semibold">Back to Blog</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const initials = (author?.name || 'ApnaStore Team').split(' ').map((w) => w[0]).slice(0, 2).join('');
  const paragraphs = post.content.split('\n\n').filter(Boolean);

  return (
    <div className="min-h-screen">
      <Seo
        title={post.seoTitle || post.title}
        description={post.metaDescription || post.excerpt}
        image={post.ogImage || post.featuredImage}
        type="article"
        canonical={post.canonicalUrl || undefined}
        robotsContent={isPreview ? 'noindex,nofollow' : buildRobotsContent(post)}
        ogTitle={post.ogTitle}
        ogDescription={post.ogDescription}
        twitterCard={post.twitterCard}
        twitterTitle={post.twitterTitle}
        twitterDescription={post.twitterDescription}
        twitterImage={post.twitterImage}
        jsonLd={schema}
      />
      <Header />
      {isPreview && (
        <div className="bg-amber-100 text-amber-800 text-sm font-medium text-center py-2">
          Preview mode — status: {post.status}{post.status !== 'published' && ' (not visible to the public yet)'}
        </div>
      )}
      <div className="mx-auto max-w-3xl px-5 lg:px-8 pt-8">
        <Breadcrumbs className="mb-6" items={[{ name: 'Blog', to: '/blog' }, { name: post.title }]} />

        <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full brand-gradient text-white mb-4">{categoryName(categories, post.categoryId)}</span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">{post.title}</h1>

        <div className="flex items-center gap-3 mt-5">
          {author?.avatar ? (
            <img src={author.avatar} alt={author.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
          ) : (
            <span className="w-10 h-10 rounded-full brand-gradient text-white grid place-items-center text-xs font-bold shrink-0">{initials}</span>
          )}
          <div className="text-sm">
            <p className="font-semibold">{author?.name || 'ApnaStore Team'}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(post.publishedAt || post.createdAt)}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.readingTime}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl overflow-hidden bg-secondary aspect-[16/9]">
          <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
        </div>

        <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-foreground/85 pb-12">
          {paragraphs.map((para, i) => <p key={i}>{para}</p>)}
        </div>

        {author && (author.bio || author.socialLinks?.length > 0) && (
          <div className="mb-16 bg-white rounded-3xl border border-border p-6 flex items-start gap-4">
            {author.avatar ? (
              <img src={author.avatar} alt={author.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
            ) : (
              <span className="w-14 h-14 rounded-full brand-gradient text-white grid place-items-center text-sm font-bold shrink-0">{initials}</span>
            )}
            <div>
              <p className="font-semibold">{author.name}</p>
              {author.bio && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{author.bio}</p>}
              {author.socialLinks?.length > 0 && (
                <div className="flex items-center gap-3 mt-3">
                  {author.socialLinks.map((link) => {
                    const Icon = SOCIAL_ICONS[link.platform] || Globe;
                    return (
                      <a key={link.platform + link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label={link.platform}>
                        <Icon className="w-4 h-4" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {settings.enableRelatedPosts && related.length > 0 && (
          <div className="pb-24 border-t border-border pt-10">
            <h2 className="text-xl font-bold mb-5">More in {categoryName(categories, post.categoryId)}</h2>
            <div className="space-y-4">
              {related.map((p) => (
                <BlogPostCard key={p.slug} post={p} categoryLabel={categoryName(categories, p.categoryId)} variant="related" />
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default BlogPostPage;
