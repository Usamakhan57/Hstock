import React from 'react';
import { Route } from 'react-router-dom';
import HomePage from '../../pages/HomePage';
import ShopPage from '../../pages/ShopPage';
import ProductDetailPage from '../../pages/ProductDetailPage';
import CategoriesPage from '../../pages/CategoriesPage';
import CategoryPage from '../../pages/CategoryPage';
import BlogPage from '../../pages/BlogPage';
import BlogPostPage from '../../pages/BlogPostPage';
import AboutPage from '../../pages/AboutPage';
import ComparePage from '../../pages/ComparePage';
import OrderFailedPage from '../../pages/OrderFailedPage';
import OrderSuccessPage from '../../pages/OrderSuccessPage';
import ForbiddenPage from '../../pages/ForbiddenPage';
import MaintenancePage from '../../pages/MaintenancePage';
import ComingSoonPage from '../../pages/ComingSoonPage';
import LoginPage from '../../pages/LoginPage';
import RegisterPage from '../../pages/RegisterPage';
import ForgotPasswordPage from '../../pages/ForgotPasswordPage';
import ResetPasswordPage from '../../pages/ResetPasswordPage';
import VerifyEmailPage from '../../pages/VerifyEmailPage';
import SearchResultsPage from '../../pages/SearchResultsPage';
import SellerProfilePage from '../../pages/SellerProfilePage';
import BecomeASellerPage from '../../pages/BecomeASellerPage';
import SellerLoginPage from '../../pages/SellerLoginPage';
import SellerRegisterPage from '../../pages/SellerRegisterPage';
import SellerDashboard from '../../pages/SellerDashboard';
import SellerProductEditorPage from '../../pages/seller/components/SellerProductEditorPage';
import UploadAccountsPage from '../../pages/seller/components/UploadAccountsPage';
import SellerHubPage from '../../pages/SellerHubPage';
import RequireSellerAuth from '../../components/RequireSellerAuth';
import RequireCustomerAuth from '../../components/RequireCustomerAuth';
import ContactPage from '../../pages/ContactPage';
import PrivacyPolicyPage from '../../pages/PrivacyPolicyPage';
import TermsPage from '../../pages/TermsPage';
import FAQPage from '../../pages/FAQPage';
import RefundPolicyPage from '../../pages/RefundPolicyPage';
import BuyerGuidePage from '../../pages/BuyerGuidePage';
import SellerGuidePage from '../../pages/SellerGuidePage';
import ProfilePage from '../../pages/account/ProfilePage';
import AccountOrdersPage from '../../pages/account/OrdersPage';
import AccountOrderDetailPage from '../../pages/account/OrderDetailPage';
import AccountWalletPage from '../../pages/account/WalletPage';
import AccountDownloadsPage from '../../pages/account/DownloadsPage';
import AccountSettingsPage from '../../pages/account/SettingsPage';
import DashboardPage from '../../pages/account/DashboardPage';
import ReviewsPage from '../../pages/account/ReviewsPage';
import SecurityPage from '../../pages/account/SecurityPage';
import NotificationsPage from '../../pages/account/NotificationsPage';
import AddressesPage from '../../pages/account/AddressesPage';
import PaymentMethodsPage from '../../pages/account/PaymentMethodsPage';
import SupportPage from '../../pages/account/SupportPage';
import InvoicesPage from '../../pages/account/InvoicesPage';
import CouponsPage from '../../pages/account/CouponsPage';
import FollowingPage from '../../pages/account/FollowingPage';
import BrowsingHistoryPage from '../../pages/account/BrowsingHistoryPage';
import DisputesPage from '../../pages/account/DisputesPage';
import DisputeDetailPage from '../../pages/account/DisputeDetailPage';
import OpenDisputePage from '../../pages/account/OpenDisputePage';
import SellerDisputeDetail from '../../pages/seller/components/SellerDisputeDetail';

/**
 * Returns an array of <Route> elements for the storefront.
 *
 * This is NOT a React component — it is a plain function that returns JSX
 * Route elements wrapped in a React.Fragment. It is called (not rendered)
 * inside <Routes> in router.jsx so that React Router v7 sees only valid
 * <Route> / <React.Fragment> children.
 */
export function storefrontRoutes() {
  return (
    <>
      {/* ── Public pages ─────────────────────────────────────── */}
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/product/:id" element={<ProductDetailPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/category/:slug" element={<CategoryPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/maintenance" element={<MaintenancePage />} />
      <Route path="/coming-soon" element={<ComingSoonPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/search" element={<SearchResultsPage />} />
      <Route path="/order-failed" element={<OrderFailedPage />} />
      <Route path="/order-success" element={<RequireCustomerAuth><OrderSuccessPage /></RequireCustomerAuth>} />

      {/* ── Customer account (auth required) ─────────────────── */}
      <Route path="/profile" element={<RequireCustomerAuth><ProfilePage /></RequireCustomerAuth>} />
      <Route path="/dashboard" element={<RequireCustomerAuth><DashboardPage /></RequireCustomerAuth>} />
      <Route path="/orders" element={<RequireCustomerAuth><AccountOrdersPage /></RequireCustomerAuth>} />
      <Route path="/orders/:id" element={<RequireCustomerAuth><AccountOrderDetailPage /></RequireCustomerAuth>} />
      <Route path="/orders/:orderId/dispute" element={<RequireCustomerAuth><OpenDisputePage /></RequireCustomerAuth>} />
      <Route path="/disputes" element={<RequireCustomerAuth><DisputesPage /></RequireCustomerAuth>} />
      <Route path="/disputes/:id" element={<RequireCustomerAuth><DisputeDetailPage /></RequireCustomerAuth>} />
      <Route path="/wallet" element={<RequireCustomerAuth><AccountWalletPage /></RequireCustomerAuth>} />
      <Route path="/downloads" element={<RequireCustomerAuth><AccountDownloadsPage /></RequireCustomerAuth>} />
      <Route path="/settings" element={<RequireCustomerAuth><AccountSettingsPage /></RequireCustomerAuth>} />
      <Route path="/reviews" element={<RequireCustomerAuth><ReviewsPage /></RequireCustomerAuth>} />
      <Route path="/security" element={<RequireCustomerAuth><SecurityPage /></RequireCustomerAuth>} />
      <Route path="/notifications" element={<RequireCustomerAuth><NotificationsPage /></RequireCustomerAuth>} />
      <Route path="/addresses" element={<RequireCustomerAuth><AddressesPage /></RequireCustomerAuth>} />
      <Route path="/payment-methods" element={<RequireCustomerAuth><PaymentMethodsPage /></RequireCustomerAuth>} />
      <Route path="/support" element={<RequireCustomerAuth><SupportPage /></RequireCustomerAuth>} />
      <Route path="/invoices" element={<RequireCustomerAuth><InvoicesPage /></RequireCustomerAuth>} />
      <Route path="/coupons" element={<RequireCustomerAuth><CouponsPage /></RequireCustomerAuth>} />
      <Route path="/following" element={<RequireCustomerAuth><FollowingPage /></RequireCustomerAuth>} />
      <Route path="/browsing-history" element={<RequireCustomerAuth><BrowsingHistoryPage /></RequireCustomerAuth>} />

      {/* ── Seller pages ─────────────────────────────────────── */}
      <Route path="/become-a-seller" element={<BecomeASellerPage />} />
      <Route path="/seller" element={<SellerHubPage />} />
      <Route path="/seller/login" element={<SellerLoginPage />} />
      <Route path="/seller/register" element={<SellerRegisterPage />} />
      <Route path="/seller/dashboard" element={<RequireSellerAuth><SellerDashboard /></RequireSellerAuth>} />
      <Route path="/seller/overview" element={<RequireSellerAuth><SellerDashboard /></RequireSellerAuth>} />
      <Route path="/seller/products" element={<RequireSellerAuth><SellerDashboard /></RequireSellerAuth>} />
      <Route path="/seller/products/new" element={<RequireSellerAuth><SellerProductEditorPage /></RequireSellerAuth>} />
      <Route path="/seller/products/:id/edit" element={<RequireSellerAuth><SellerProductEditorPage /></RequireSellerAuth>} />
      <Route path="/seller/upload-accounts/:productId" element={<RequireSellerAuth><UploadAccountsPage /></RequireSellerAuth>} />
      <Route path="/seller/orders" element={<RequireSellerAuth><SellerDashboard /></RequireSellerAuth>} />
      <Route path="/seller/escrow" element={<RequireSellerAuth><SellerDashboard /></RequireSellerAuth>} />
      <Route path="/seller/downloads" element={<RequireSellerAuth><SellerDashboard /></RequireSellerAuth>} />
      <Route path="/seller/earnings" element={<RequireSellerAuth><SellerDashboard /></RequireSellerAuth>} />
      <Route path="/seller/analytics" element={<RequireSellerAuth><SellerDashboard /></RequireSellerAuth>} />
      <Route path="/seller/messages" element={<RequireSellerAuth><SellerDashboard /></RequireSellerAuth>} />
      <Route path="/seller/disputes" element={<RequireSellerAuth><SellerDashboard /></RequireSellerAuth>} />
      <Route path="/seller/disputes/:id" element={<RequireSellerAuth><SellerDisputeDetail /></RequireSellerAuth>} />
      <Route path="/seller/reviews" element={<RequireSellerAuth><SellerDashboard /></RequireSellerAuth>} />
      <Route path="/seller/notifications" element={<RequireSellerAuth><SellerDashboard /></RequireSellerAuth>} />
      <Route path="/seller/store" element={<RequireSellerAuth><SellerDashboard /></RequireSellerAuth>} />
      <Route path="/seller/profile" element={<RequireSellerAuth><SellerDashboard /></RequireSellerAuth>} />
      <Route path="/seller/settings" element={<RequireSellerAuth><SellerDashboard /></RequireSellerAuth>} />
      <Route path="/seller/:slug" element={<SellerProfilePage />} />

      {/* ── Static / legal pages ─────────────────────────────── */}
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/refund-policy" element={<RefundPolicyPage />} />
      <Route path="/buyer-guide" element={<BuyerGuidePage />} />
      <Route path="/seller-guide" element={<SellerGuidePage />} />
    </>
  );
}
