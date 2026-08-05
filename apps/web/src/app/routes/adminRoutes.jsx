import React, { Suspense, lazy } from 'react';
import { Route } from 'react-router-dom';
import RequireAdminAuth from '../../admin/RequireAdminAuth';
import AdminLoginPage from '../../admin/pages/AdminLoginPage';
import AdminLayout from '../../admin/layout/AdminLayout';

const Dashboard = lazy(() => import('../../admin/pages/dashboard/Dashboard'));
const ProductsList = lazy(() => import('../../admin/pages/products/ProductsList'));
const ProductForm = lazy(() => import('../../admin/pages/products/ProductForm'));
const CategoriesList = lazy(() => import('../../admin/pages/categories/CategoriesList'));
const BrandsList = lazy(() => import('../../admin/pages/brands/BrandsList'));
const InventoryList = lazy(() => import('../../admin/pages/inventory/InventoryList'));
const OrdersList = lazy(() => import('../../admin/pages/orders/OrdersList'));
const OrderDetail = lazy(() => import('../../admin/pages/orders/OrderDetail'));
const CustomersList = lazy(() => import('../../admin/pages/customers/CustomersList'));
const CustomerDetail = lazy(() => import('../../admin/pages/customers/CustomerDetail'));
const SellersList = lazy(() => import('../../admin/pages/sellers/SellersList'));
const CouponsList = lazy(() => import('../../admin/pages/coupons/CouponsList'));
const ReviewsList = lazy(() => import('../../admin/pages/reviews/ReviewsList'));
const MediaLibrary = lazy(() => import('../../admin/pages/media/MediaLibrary'));
const BannersList = lazy(() => import('../../admin/pages/banners/BannersList'));
const SettingsPage = lazy(() => import('../../admin/pages/settings/Settings'));
const UsersList = lazy(() => import('../../admin/pages/users/UsersList'));
const Analytics = lazy(() => import('../../admin/pages/analytics/Analytics'));
const BlogPostsList = lazy(() => import('../../admin/pages/blog/BlogPostsList'));
const BlogPostForm = lazy(() => import('../../admin/pages/blog/BlogPostForm'));
const BlogCategoriesList = lazy(() => import('../../admin/pages/blog/BlogCategoriesList'));
const BlogTagsList = lazy(() => import('../../admin/pages/blog/BlogTagsList'));
const BlogComments = lazy(() => import('../../admin/pages/blog/BlogComments'));
const BlogTrash = lazy(() => import('../../admin/pages/blog/BlogTrash'));
const BlogAuthorsList = lazy(() => import('../../admin/pages/blog/BlogAuthorsList'));
const BlogSettings = lazy(() => import('../../admin/pages/blog/BlogSettings'));
const HomepageCms = lazy(() => import('../../admin/pages/cms/HomepageCms'));
const HeaderCms = lazy(() => import('../../admin/pages/cms/HeaderCms'));
const FooterCms = lazy(() => import('../../admin/pages/cms/FooterCms'));
const NavMenusList = lazy(() => import('../../admin/pages/cms/NavMenusList'));
const NavMenuEditor = lazy(() => import('../../admin/pages/cms/NavMenuEditor'));
const HeroSliderList = lazy(() => import('../../admin/pages/cms/HeroSliderList'));
const StaticPagesList = lazy(() => import('../../admin/pages/cms/StaticPagesList'));
const StaticPageForm = lazy(() => import('../../admin/pages/cms/StaticPageForm'));
const FaqList = lazy(() => import('../../admin/pages/cms/FaqList'));
const TestimonialsList = lazy(() => import('../../admin/pages/cms/TestimonialsList'));
const NewsletterCms = lazy(() => import('../../admin/pages/cms/NewsletterCms'));
const PopupManagerList = lazy(() => import('../../admin/pages/cms/PopupManagerList'));
const SeoManagerList = lazy(() => import('../../admin/pages/cms/SeoManagerList'));
const EmailTemplatesList = lazy(() => import('../../admin/pages/cms/EmailTemplatesList'));
const EmailTemplateForm = lazy(() => import('../../admin/pages/cms/EmailTemplateForm'));
const GlobalSettingsCms = lazy(() => import('../../admin/pages/cms/GlobalSettingsCms'));
const SocialSettingsCms = lazy(() => import('../../admin/pages/cms/SocialSettingsCms'));
const PopularTagsCms = lazy(() => import('../../admin/pages/cms/PopularTagsCms'));
const ContactSettingsCms = lazy(() => import('../../admin/pages/cms/ContactSettingsCms'));
const PaymentsList = lazy(() => import('../../admin/pages/payments/PaymentsList'));
const EscrowList = lazy(() => import('../../admin/pages/escrow/EscrowList'));
const WalletsList = lazy(() => import('../../admin/pages/wallets/WalletsList'));
const WithdrawalsList = lazy(() => import('../../admin/pages/withdrawals/WithdrawalsList'));
const DisputesList = lazy(() => import('../../admin/pages/disputes/DisputesList'));
const DisputeDetail = lazy(() => import('../../admin/pages/disputes/DisputeDetail'));
const OcrReviewQueue = lazy(() => import('../../admin/pages/ocr/OcrReviewQueue'));
const ReplacementsList = lazy(() => import('../../admin/pages/replacements/ReplacementsList'));
const SystemHealth = lazy(() => import('../../admin/pages/system/SystemHealth'));
const TelegramAdmin = lazy(() => import('../../admin/pages/telegram/TelegramAdmin'));
const PromotionsList = lazy(() => import('../../admin/pages/promotions/PromotionsList'));
const SellerVerificationList = lazy(() => import('../../admin/pages/sellers/SellerVerificationList'));

function LazyPage({ children }) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      {children}
    </Suspense>
  );
}

/**
 * Returns <Route> elements for the admin panel.
 * Admin pages are code-split via React.lazy for production bundle size.
 */
export function adminRoutes() {
  return (
    <>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<RequireAdminAuth><AdminLayout /></RequireAdminAuth>}>
        <Route index element={<LazyPage><Dashboard /></LazyPage>} />
        <Route path="analytics" element={<LazyPage><Analytics /></LazyPage>} />
        <Route path="products" element={<LazyPage><ProductsList /></LazyPage>} />
        <Route path="products/new" element={<LazyPage><ProductForm /></LazyPage>} />
        <Route path="products/:id/edit" element={<LazyPage><ProductForm /></LazyPage>} />
        <Route path="categories" element={<LazyPage><CategoriesList /></LazyPage>} />
        <Route path="brands" element={<LazyPage><BrandsList /></LazyPage>} />
        <Route path="inventory" element={<LazyPage><InventoryList /></LazyPage>} />
        <Route path="orders" element={<LazyPage><OrdersList /></LazyPage>} />
        <Route path="orders/:id" element={<LazyPage><OrderDetail /></LazyPage>} />
        <Route path="customers" element={<LazyPage><CustomersList /></LazyPage>} />
        <Route path="customers/:id" element={<LazyPage><CustomerDetail /></LazyPage>} />
        <Route path="sellers" element={<LazyPage><SellersList /></LazyPage>} />
        <Route path="seller-verification" element={<LazyPage><SellerVerificationList /></LazyPage>} />
        <Route path="promotions" element={<LazyPage><PromotionsList /></LazyPage>} />
        <Route path="coupons" element={<LazyPage><CouponsList /></LazyPage>} />
        <Route path="payments" element={<LazyPage><PaymentsList /></LazyPage>} />
        <Route path="escrow" element={<LazyPage><EscrowList /></LazyPage>} />
        <Route path="wallets" element={<LazyPage><WalletsList /></LazyPage>} />
        <Route path="withdrawals" element={<LazyPage><WithdrawalsList /></LazyPage>} />
        <Route path="disputes" element={<LazyPage><DisputesList /></LazyPage>} />
        <Route path="disputes/:id" element={<LazyPage><DisputeDetail /></LazyPage>} />
        <Route path="ocr-review" element={<LazyPage><OcrReviewQueue /></LazyPage>} />
        <Route path="replacements" element={<LazyPage><ReplacementsList /></LazyPage>} />
        <Route path="system-health" element={<LazyPage><SystemHealth /></LazyPage>} />
        <Route path="telegram" element={<LazyPage><TelegramAdmin /></LazyPage>} />
        <Route path="reviews" element={<LazyPage><ReviewsList /></LazyPage>} />
        <Route path="media" element={<LazyPage><MediaLibrary /></LazyPage>} />
        <Route path="banners" element={<LazyPage><BannersList /></LazyPage>} />
        <Route path="settings" element={<LazyPage><SettingsPage /></LazyPage>} />
        <Route path="users" element={<LazyPage><UsersList /></LazyPage>} />
        <Route path="blog" element={<LazyPage><BlogPostsList /></LazyPage>} />
        <Route path="blog/new" element={<LazyPage><BlogPostForm /></LazyPage>} />
        <Route path="blog/edit/:id" element={<LazyPage><BlogPostForm /></LazyPage>} />
        <Route path="blog/categories" element={<LazyPage><BlogCategoriesList /></LazyPage>} />
        <Route path="blog/tags" element={<LazyPage><BlogTagsList /></LazyPage>} />
        <Route path="blog/comments" element={<LazyPage><BlogComments /></LazyPage>} />
        <Route path="blog/trash" element={<LazyPage><BlogTrash /></LazyPage>} />
        <Route path="blog/authors" element={<LazyPage><BlogAuthorsList /></LazyPage>} />
        <Route path="blog/settings" element={<LazyPage><BlogSettings /></LazyPage>} />
        <Route path="cms/homepage" element={<LazyPage><HomepageCms /></LazyPage>} />
        <Route path="cms/popular-tags" element={<LazyPage><PopularTagsCms /></LazyPage>} />
        <Route path="cms/header" element={<LazyPage><HeaderCms /></LazyPage>} />
        <Route path="cms/footer" element={<LazyPage><FooterCms /></LazyPage>} />
        <Route path="cms/menus" element={<LazyPage><NavMenusList /></LazyPage>} />
        <Route path="cms/menus/:id" element={<LazyPage><NavMenuEditor /></LazyPage>} />
        <Route path="cms/hero-slider" element={<LazyPage><HeroSliderList /></LazyPage>} />
        <Route path="cms/pages" element={<LazyPage><StaticPagesList /></LazyPage>} />
        <Route path="cms/pages/:id/edit" element={<LazyPage><StaticPageForm /></LazyPage>} />
        <Route path="cms/faq" element={<LazyPage><FaqList /></LazyPage>} />
        <Route path="cms/testimonials" element={<LazyPage><TestimonialsList /></LazyPage>} />
        <Route path="cms/newsletter" element={<LazyPage><NewsletterCms /></LazyPage>} />
        <Route path="cms/popups" element={<LazyPage><PopupManagerList /></LazyPage>} />
        <Route path="cms/seo" element={<LazyPage><SeoManagerList /></LazyPage>} />
        <Route path="cms/email-templates" element={<LazyPage><EmailTemplatesList /></LazyPage>} />
        <Route path="cms/email-templates/:id/edit" element={<LazyPage><EmailTemplateForm /></LazyPage>} />
        <Route path="cms/global-settings" element={<LazyPage><GlobalSettingsCms /></LazyPage>} />
        <Route path="cms/social-settings" element={<LazyPage><SocialSettingsCms /></LazyPage>} />
        <Route path="cms/contact-settings" element={<LazyPage><ContactSettingsCms /></LazyPage>} />
      </Route>
    </>
  );
}
