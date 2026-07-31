/**
 * Shared JSDoc "interfaces" for the Blog CMS. The project is plain JS
 * (see jsconfig.json / vite.config resolve.extensions — no .ts pipeline
 * is configured), so these typedefs stand in for TypeScript interfaces:
 * editors that support JSDoc (VS Code, WebStorm) get full autocomplete
 * and inline docs from them in both admin and frontend code without
 * introducing a second toolchain. If this project migrates to
 * TypeScript later, each typedef below maps 1:1 to an `interface`.
 *
 * @typedef {Object} BlogPost
 * @property {string} id
 * @property {string} title
 * @property {string} slug
 * @property {string} excerpt
 * @property {string} content - Rich text body. Currently plain text with
 *   blank-line paragraph breaks; swap for HTML/Markdown once a real rich
 *   text editor is wired in — consuming pages already just render it.
 * @property {string} categoryId - References BlogCategory.id
 * @property {string[]} tags - References BlogTag.id[]
 * @property {string} author
 * @property {string} featuredImage - Data URL or hosted image URL
 * @property {string[]} gallery
 * @property {'draft'|'published'|'scheduled'} status
 * @property {boolean} featured
 * @property {boolean} trending
 * @property {boolean} editorsPick
 * @property {string} readingTime - e.g. "5 min read"
 * @property {string} seoTitle
 * @property {string} metaDescription
 * @property {string} focusKeyword
 * @property {string} ogImage
 * @property {string} createdAt - ISO date string
 * @property {string} updatedAt - ISO date string
 * @property {string|null} publishedAt - ISO date string; null until published/scheduled
 * @property {number} views
 *
 * @typedef {Object} BlogCategory
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {string} description
 * @property {string} [icon] - lucide-react icon name, optional
 * @property {string} [image] - optional cover image
 * @property {'active'|'inactive'} status
 * @property {number} order
 * @property {number} postCount
 *
 * @typedef {Object} BlogTag
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {number} postCount
 *
 * @typedef {Object} BlogComment
 * @property {string} id
 * @property {string} postId - References BlogPost.id
 * @property {string} authorName
 * @property {string} authorEmail
 * @property {string} content
 * @property {'pending'|'approved'|'rejected'} status
 * @property {string} createdAt - ISO date string
 *
 * @typedef {Object} BlogSettings
 * @property {string} pageTitle
 * @property {string} heroHeading
 * @property {string} heroDescription
 * @property {string[]} featuredCategoryIds - References BlogCategory.id[]
 * @property {number} postsPerPage
 * @property {boolean} enableSearch
 * @property {boolean} enableCategories
 * @property {boolean} enableRelatedPosts
 * @property {boolean} enableNewsletter
 * @property {string} defaultAuthor
 * @property {string} defaultOgImage
 * @property {string} defaultSeoTitle
 * @property {string} defaultMetaDescription
 */

export {};
