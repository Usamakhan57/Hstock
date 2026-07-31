import React from 'react';
import { Route } from 'react-router-dom';
import RequireAdminAuth from '../../admin/RequireAdminAuth';
import AdminLoginPage from '../../admin/pages/AdminLoginPage';
import AdminLayout from '../../admin/layout/AdminLayout';
import Dashboard from '../../admin/pages/dashboard/Dashboard';
import ProductsList from '../../admin/pages/products/ProductsList';
import ProductForm from '../../admin/pages/products/ProductForm';
import CategoriesList from '../../admin/pages/categories/CategoriesList';
import CollectionsList from '../../admin/pages/collections/CollectionsList';
import BrandsList from '../../admin/pages/brands/BrandsList';
import InventoryList from '../../admin/pages/inventory/InventoryList';
import OrdersList from '../../admin/pages/orders/OrdersList';
import OrderDetail from '../../admin/pages/orders/OrderDetail';
import CustomersList from '../../admin/pages/customers/CustomersList';
import CustomerDetail from '../../admin/pages/customers/CustomerDetail';
import SellersList from '../../admin/pages/sellers/SellersList';
import CouponsList from '../../admin/pages/coupons/CouponsList';
import ReviewsList from '../../admin/pages/reviews/ReviewsList';
import MediaLibrary from '../../admin/pages/media/MediaLibrary';
import BannersList from '../../admin/pages/banners/BannersList';
import SettingsPage from '../../admin/pages/settings/Settings';
import UsersList from '../../admin/pages/users/UsersList';
import Analytics from '../../admin/pages/analytics/Analytics';
import BlogPostsList from '../../admin/pages/blog/BlogPostsList';
import BlogPostForm from '../../admin/pages/blog/BlogPostForm';
import BlogCategoriesList from '../../admin/pages/blog/BlogCategoriesList';
import BlogTagsList from '../../admin/pages/blog/BlogTagsList';
import BlogComments from '../../admin/pages/blog/BlogComments';
import BlogTrash from '../../admin/pages/blog/BlogTrash';
import BlogAuthorsList from '../../admin/pages/blog/BlogAuthorsList';
import BlogSettings from '../../admin/pages/blog/BlogSettings';
import HomepageCms from '../../admin/pages/cms/HomepageCms';
import HeaderCms from '../../admin/pages/cms/HeaderCms';
import FooterCms from '../../admin/pages/cms/FooterCms';
import NavMenusList from '../../admin/pages/cms/NavMenusList';
import NavMenuEditor from '../../admin/pages/cms/NavMenuEditor';
import HeroSliderList from '../../admin/pages/cms/HeroSliderList';
import StaticPagesList from '../../admin/pages/cms/StaticPagesList';
import StaticPageForm from '../../admin/pages/cms/StaticPageForm';
import FaqList from '../../admin/pages/cms/FaqList';
import TestimonialsList from '../../admin/pages/cms/TestimonialsList';
import NewsletterCms from '../../admin/pages/cms/NewsletterCms';
import PopupManagerList from '../../admin/pages/cms/PopupManagerList';
import SeoManagerList from '../../admin/pages/cms/SeoManagerList';
import EmailTemplatesList from '../../admin/pages/cms/EmailTemplatesList';
import EmailTemplateForm from '../../admin/pages/cms/EmailTemplateForm';
import GlobalSettingsCms from '../../admin/pages/cms/GlobalSettingsCms';
import SocialSettingsCms from '../../admin/pages/cms/SocialSettingsCms';
import ContactSettingsCms from '../../admin/pages/cms/ContactSettingsCms';
import PaymentsList from '../../admin/pages/payments/PaymentsList';
import EscrowList from '../../admin/pages/escrow/EscrowList';
import WalletsList from '../../admin/pages/wallets/WalletsList';
import WithdrawalsList from '../../admin/pages/withdrawals/WithdrawalsList';
import DisputesList from '../../admin/pages/disputes/DisputesList';
import DisputeDetail from '../../admin/pages/disputes/DisputeDetail';
import OcrReviewQueue from '../../admin/pages/ocr/OcrReviewQueue';
import ReplacementsList from '../../admin/pages/replacements/ReplacementsList';
import SystemHealth from '../../admin/pages/system/SystemHealth';

/**
 * Returns <Route> elements for the admin panel.
 *
 * This is a plain function (not a component) — it is called inside <Routes>
 * in router.jsx so React Router v7 sees only <Route> / <React.Fragment>
 * children.
 */
export function adminRoutes() {
  return (
    <>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<RequireAdminAuth><AdminLayout /></RequireAdminAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="products" element={<ProductsList />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="categories" element={<CategoriesList />} />
        <Route path="collections" element={<CollectionsList />} />
        <Route path="brands" element={<BrandsList />} />
        <Route path="inventory" element={<InventoryList />} />
        <Route path="orders" element={<OrdersList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="customers" element={<CustomersList />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="sellers" element={<SellersList />} />
        <Route path="coupons" element={<CouponsList />} />
        <Route path="payments" element={<PaymentsList />} />
        <Route path="escrow" element={<EscrowList />} />
        <Route path="wallets" element={<WalletsList />} />
        <Route path="withdrawals" element={<WithdrawalsList />} />
        <Route path="disputes" element={<DisputesList />} />
        <Route path="disputes/:id" element={<DisputeDetail />} />
        <Route path="ocr-review" element={<OcrReviewQueue />} />
        <Route path="replacements" element={<ReplacementsList />} />
        <Route path="system-health" element={<SystemHealth />} />
        <Route path="reviews" element={<ReviewsList />} />
        <Route path="media" element={<MediaLibrary />} />
        <Route path="banners" element={<BannersList />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="users" element={<UsersList />} />
        <Route path="blog" element={<BlogPostsList />} />
        <Route path="blog/new" element={<BlogPostForm />} />
        <Route path="blog/edit/:id" element={<BlogPostForm />} />
        <Route path="blog/categories" element={<BlogCategoriesList />} />
        <Route path="blog/tags" element={<BlogTagsList />} />
        <Route path="blog/comments" element={<BlogComments />} />
        <Route path="blog/trash" element={<BlogTrash />} />
        <Route path="blog/authors" element={<BlogAuthorsList />} />
        <Route path="blog/settings" element={<BlogSettings />} />
        <Route path="cms/homepage" element={<HomepageCms />} />
        <Route path="cms/header" element={<HeaderCms />} />
        <Route path="cms/footer" element={<FooterCms />} />
        <Route path="cms/menus" element={<NavMenusList />} />
        <Route path="cms/menus/:id" element={<NavMenuEditor />} />
        <Route path="cms/hero-slider" element={<HeroSliderList />} />
        <Route path="cms/pages" element={<StaticPagesList />} />
        <Route path="cms/pages/:id/edit" element={<StaticPageForm />} />
        <Route path="cms/faq" element={<FaqList />} />
        <Route path="cms/testimonials" element={<TestimonialsList />} />
        <Route path="cms/newsletter" element={<NewsletterCms />} />
        <Route path="cms/popups" element={<PopupManagerList />} />
        <Route path="cms/seo" element={<SeoManagerList />} />
        <Route path="cms/email-templates" element={<EmailTemplatesList />} />
        <Route path="cms/email-templates/:id/edit" element={<EmailTemplateForm />} />
        <Route path="cms/global-settings" element={<GlobalSettingsCms />} />
        <Route path="cms/social-settings" element={<SocialSettingsCms />} />
        <Route path="cms/contact-settings" element={<ContactSettingsCms />} />
      </Route>
    </>
  );
}
