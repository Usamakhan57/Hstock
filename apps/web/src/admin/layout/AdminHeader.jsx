import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, ChevronDown, Search, Bell, ExternalLink, Plus } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '../../components/ui/sheet';
import { AdminSidebarContent } from './AdminSidebar';
import { adminNavSections } from './nav';
import './pva-header.css';
import logo from '../assets/hstock-icon.png';
import { useAdminAuth } from '../AdminAuthContext';

// Flattened list of every admin section, powering the "Menu" dropdown —
// a 1:1 replacement for the original header's "Packages" category list
// (13 items in, 13 admin sections out).
const allNavItems = adminNavSections.flatMap((section) => section.items);

// The 5 most-used sections get their own row (row2), mirroring the
// original header's 5-link quick-access bar.
const quickLinks = allNavItems.filter((item) =>
  ['/admin', '/admin/products', '/admin/orders', '/admin/customers', '/admin/inventory'].includes(item.to)
);

const MOCK_NOTIFICATIONS = [
  { id: 1, text: 'New order #1010 placed by Sam Rivera', time: '5 minutes ago' },
  { id: 2, text: '"Championship Sports Badges" is out of stock', time: '2 hours ago' },
  { id: 3, text: 'New review pending approval on "Vintage Sports Tee Graphics"', time: 'Yesterday' },
];

const AdminHeader = () => {
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');

  const categoriesRef = useRef(null);
  const notifRef = useRef(null);
  const accountRef = useRef(null);

  const closeAll = () => { setCategoriesOpen(false); setNotifOpen(false); setAccountOpen(false); };

  // Click-outside-to-close, matching the original header's vanilla JS behavior.
  useEffect(() => {
    const onClick = (e) => {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target)) setCategoriesOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') closeAll(); };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    // Placeholder global search — same scope as the admin's previous
    // topbar search (no wired backend query yet).
  };

  return (
    <header className="pva-header">
      <div className="pva-row1">
        <button
          type="button"
          className="pva-menu-toggle"
          aria-label="Open navigation menu"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <Menu />
        </button>

        <div className="pva-logo">
          <NavLink to="/admin" end>
            <img src={logo} alt="HStock" />
          </NavLink>
        </div>

        <div className="pva-categories" ref={categoriesRef}>
          <button
            type="button"
            className="pva-categories-btn"
            onClick={(e) => { e.stopPropagation(); setCategoriesOpen((v) => !v); }}
            aria-expanded={categoriesOpen}
          >
            <Menu className="icon-menu" strokeWidth={2} />
            <span>Menu</span>
            <ChevronDown className="icon-chevron" strokeWidth={2} />
          </button>
          <div className="pva-categories-drop">
            {allNavItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setCategoriesOpen(false)}>
                <item.icon />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="pva-search">
          <form className="pva-search-pill" onSubmit={submitSearch}>
            <Search className="pva-search-icon" strokeWidth={2} />
            <input
              className="pva-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders, products, customers…"
              aria-label="Search admin"
            />
          </form>
        </div>

        <div className="pva-actions">
          <div className="pva-panel-wrap" ref={accountRef}>
            <button
              type="button"
              className="pva-signin"
              onClick={(e) => { e.stopPropagation(); setNotifOpen(false); setAccountOpen((v) => !v); }}
              aria-expanded={accountOpen}
            >
              <span className="pva-signin-avatar">{(admin?.name || 'A').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
              <span>{admin?.name || 'Admin'}</span>
            </button>
            <div className={`pva-panel${accountOpen ? ' is-open' : ''}`} style={{ width: 240 }}>
              <p className="pva-account-name">{admin?.name || 'Admin'}</p>
              <p className="pva-account-email">{admin?.email || ''}</p>
              <div className="pva-account-links">
                <NavLink to="/admin/settings" onClick={() => setAccountOpen(false)}>Store Settings</NavLink>
                <NavLink to="/admin/users" onClick={() => setAccountOpen(false)}>User Management</NavLink>
                <a href="/" target="_blank" rel="noopener noreferrer">View Store</a>
                <button type="button" className="is-danger" onClick={() => { logout(); navigate('/admin/login'); }}>Sign out</button>
              </div>
            </div>
          </div>

          <a href="/" target="_blank" rel="noopener noreferrer" className="pva-icon-btn" aria-label="View Store">
            <ExternalLink strokeWidth={2} />
          </a>

          <div className="pva-panel-wrap" ref={notifRef}>
            <button
              type="button"
              className="pva-icon-btn"
              aria-label="Notifications"
              onClick={(e) => { e.stopPropagation(); setAccountOpen(false); setNotifOpen((v) => !v); }}
              aria-expanded={notifOpen}
            >
              <Bell strokeWidth={2} />
              {MOCK_NOTIFICATIONS.length > 0 && <span className="pva-cart-badge">{MOCK_NOTIFICATIONS.length}</span>}
            </button>

            <div className={`pva-panel${notifOpen ? ' is-open' : ''}`}>
              <div className="pva-panel-head">
                <span>Notifications</span>
                <button type="button" aria-label="Close" onClick={() => setNotifOpen(false)}>&times;</button>
              </div>
              {MOCK_NOTIFICATIONS.length === 0 ? (
                <p className="pva-panel-empty">You're all caught up.</p>
              ) : (
                <ul className="pva-notif-list">
                  {MOCK_NOTIFICATIONS.map((n) => (
                    <li key={n.id}>
                      <span className="pva-notif-dot" />
                      <span>
                        {n.text}
                        <span className="pva-notif-meta">{n.time}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <button type="button" className="pva-get-btn" onClick={() => navigate('/admin/products/new')}>
            <Plus className="w-4 h-4 inline -mt-0.5 mr-1" strokeWidth={2.5} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="pva-row2">
        <nav className="pva-nav">
          {quickLinks.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'is-active' : '')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <AdminSidebarContent onNavigate={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default AdminHeader;
