import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

/**
 * Reusable post preview card for the public Blog page. `variant` controls
 * layout: 'featured' (large hero card), 'grid' (standard card), or
 * 'related' (compact horizontal row). All variants take the same
 * `post` + `categoryLabel` shape, so BlogPage/BlogPostPage never build
 * post markup inline — only this component needs to change if the
 * design evolves.
 */
const BlogPostCard = React.memo(({ post, categoryLabel, variant = 'grid' }) => {
  if (variant === 'featured') {
    return (
      <Link to={`/blog/${post.slug}`} className="group grid md:grid-cols-2 gap-6 bg-white rounded-3xl border border-border soft-shadow hover:soft-shadow-lg transition-all duration-300 overflow-hidden">
        <div className="h-64 md:h-full overflow-hidden bg-secondary">
          <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
        <div className="p-7 flex flex-col justify-center">
          <span className="inline-block w-fit text-[11px] font-semibold px-2.5 py-1 rounded-full brand-gradient text-white mb-3">{categoryLabel}</span>
          <h2 className="text-2xl md:text-3xl font-bold leading-snug">{post.title}</h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{post.excerpt}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-5">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(post.publishedAt || post.createdAt)}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.readingTime}</span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'related') {
    return (
      <Link to={`/blog/${post.slug}`} className="group flex items-center gap-4 bg-white rounded-2xl border border-border p-3 hover:soft-shadow transition-all">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-secondary shrink-0">
          <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
        </div>
        <div>
          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{formatDate(post.publishedAt || post.createdAt)}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/blog/${post.slug}`} className="group bg-white rounded-3xl border border-border soft-shadow hover:soft-shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      <div className="h-44 overflow-hidden bg-secondary">
        <img src={post.featuredImage} alt={post.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="p-5">
        <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground mb-2.5">{categoryLabel}</span>
        <h3 className="font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h3>
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{post.excerpt}</p>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-4">
          <span>{formatDate(post.publishedAt || post.createdAt)}</span>
          <span>·</span>
          <span>{post.readingTime}</span>
        </div>
      </div>
    </Link>
  );
});

export default BlogPostCard;
