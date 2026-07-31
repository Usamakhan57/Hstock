import {
  LayoutDashboard, Package, FolderTree, Layers, Tag, Boxes, ShoppingCart,
  Users, Store, TicketPercent, Star, Image as ImageIcon, GalleryHorizontal,
  Settings as SettingsIcon, ShieldCheck, BarChart3, Newspaper, FileText,
  FilePlus2, FolderOpen, Tags, MessageSquare, Sliders, Trash2, UserSquare2,
  LayoutTemplate, PanelTop, PanelBottom, ListTree, Megaphone, FileStack,
  HelpCircle, Quote, Mail, Bell, Search, MailPlus, Palette,
  CreditCard, Wallet, ArrowDownToLine, AlertTriangle, Replace, ScanLine, Activity,
} from 'lucide-react';

export const adminNavSections = [
  {
    items: [
      { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
      { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Products', to: '/admin/products', icon: Package },
      { label: 'Categories', to: '/admin/categories', icon: FolderTree },
      { label: 'Collections', to: '/admin/collections', icon: Layers },
      { label: 'Brands', to: '/admin/brands', icon: Tag },
      { label: 'Inventory', to: '/admin/inventory', icon: Boxes },
    ],
  },
  {
    label: 'Sales',
    items: [
      { label: 'Orders', to: '/admin/orders', icon: ShoppingCart },
      { label: 'Customers', to: '/admin/customers', icon: Users },
      { label: 'Sellers', to: '/admin/sellers', icon: Store },
      { label: 'Coupons', to: '/admin/coupons', icon: TicketPercent },
    ],
  },
  {
    label: 'Marketplace Ops',
    items: [
      { label: 'Payments', to: '/admin/payments', icon: CreditCard },
      { label: 'Escrow', to: '/admin/escrow', icon: ShieldCheck },
      { label: 'Wallets', to: '/admin/wallets', icon: Wallet },
      { label: 'Withdrawals', to: '/admin/withdrawals', icon: ArrowDownToLine },
      { label: 'Disputes', to: '/admin/disputes', icon: AlertTriangle },
      { label: 'Replacement Reviews', to: '/admin/replacements', icon: Replace },
      { label: 'OCR Review', to: '/admin/ocr-review', icon: ScanLine },
      { label: 'System Health', to: '/admin/system-health', icon: Activity },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Reviews', to: '/admin/reviews', icon: Star },
      { label: 'Media Library', to: '/admin/media', icon: ImageIcon },
      {
        label: 'Blog', icon: Newspaper, to: '/admin/blog',
        children: [
          { label: 'All Posts', to: '/admin/blog', icon: FileText, end: true },
          { label: 'Add New Post', to: '/admin/blog/new', icon: FilePlus2 },
          { label: 'Categories', to: '/admin/blog/categories', icon: FolderOpen },
          { label: 'Tags', to: '/admin/blog/tags', icon: Tags },
          { label: 'Authors', to: '/admin/blog/authors', icon: UserSquare2 },
          { label: 'Comments', to: '/admin/blog/comments', icon: MessageSquare },
          { label: 'Trash', to: '/admin/blog/trash', icon: Trash2 },
          { label: 'Settings', to: '/admin/blog/settings', icon: Sliders },
        ],
      },
    ],
  },
  {
    label: 'CMS',
    items: [
      { label: 'Homepage', to: '/admin/cms/homepage', icon: LayoutTemplate },
      { label: 'Header', to: '/admin/cms/header', icon: PanelTop },
      { label: 'Footer', to: '/admin/cms/footer', icon: PanelBottom },
      { label: 'Navigation Menus', to: '/admin/cms/menus', icon: ListTree },
      { label: 'Hero Slider', to: '/admin/cms/hero-slider', icon: GalleryHorizontal },
      { label: 'Promotional Banners', to: '/admin/banners', icon: Megaphone },
      { label: 'Static Pages', to: '/admin/cms/pages', icon: FileStack },
      { label: 'FAQ', to: '/admin/cms/faq', icon: HelpCircle },
      { label: 'Testimonials', to: '/admin/cms/testimonials', icon: Quote },
      { label: 'Newsletter', to: '/admin/cms/newsletter', icon: Mail },
      { label: 'Popup Manager', to: '/admin/cms/popups', icon: Bell },
      { label: 'SEO Manager', to: '/admin/cms/seo', icon: Search },
      { label: 'Email Templates', to: '/admin/cms/email-templates', icon: MailPlus },
      {
        label: 'Site Settings', icon: Palette, to: '/admin/cms/global-settings',
        children: [
          { label: 'Global', to: '/admin/cms/global-settings', icon: Palette, end: true },
          { label: 'Social', to: '/admin/cms/social-settings', icon: Mail },
          { label: 'Contact', to: '/admin/cms/contact-settings', icon: Mail },
        ],
      },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings', to: '/admin/settings', icon: SettingsIcon },
      { label: 'User Management', to: '/admin/users', icon: ShieldCheck },
    ],
  },
];
