import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, ChevronDown, Search, Bell, ExternalLink, Plus } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '../../components/ui/sheet';
import { AdminSidebarContent } from './AdminSidebar';
import { adminNavSections } from './nav';
import './pva-header.css';
import logo from '../assets/hstock-icon.png';
import { useAdminAuth } from '../AdminAuthContext';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/notifications';

const allNavItems = adminNavSections.flatMap((section) => section.items);

const quickLinks = allNavItems.filter((item) =>
  ['/admin', '/admin/products', '/admin/orders', '/admin/customers', '/admin/inventory'].includes(item.to),
);

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

const AdminHeader = () => {
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const categoriesRef = useRef(null);
  const notifRef = useRef(null);
  const accountRef = useRef(null);

  const closeAll = () => { setCategoriesOpen(false); setNotifOpen(false); setAccountOpen(false); };

  const loadNotifications = useCallback(async () => {
    try {
      const [items, count] = await Promise.all([
        getNotifications({ limit: 10 }),
        getUnreadCount(),
      ]);
      setNotifications(items);
      setUnreadCount(typeof count === 'number' ? count : items.filter((n) => !n.read).length);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

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

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await markNotificationRead(notification.id);
      } catch {
        // keep UI responsive even if API fails
      }
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (notification.link) {
      setNotifOpen(false);
      if (notification.link.startsWith('http')) {
        window.open(notification.link, '_blank', 'noopener,noreferrer');
      } else {
        navigate(notification.link);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
    } catch {
      // ignore
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const submitSearch = (e) => {
    e.preventDefault();
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
            <img src={logo} alt="ApnaStore" />
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
              {unreadCount > 0 && <span className="pva-cart-badge">{unreadCount}</span>}
            </button>

            <div className={`pva-panel${notifOpen ? ' is-open' : ''}`}>
              <div className="pva-panel-head">
                <span>Notifications</span>
                <button type="button" aria-label="Close" onClick={() => setNotifOpen(false)}>&times;</button>
              </div>
              {notifications.length === 0 ? (
                <p className="pva-panel-empty">You're all caught up.</p>
              ) : (
                <>
                  <ul className="pva-notif-list">
                    {notifications.map((n) => (
                      <li key={n.id}>
                        <button type="button" className="w-full text-left" onClick={() => handleNotificationClick(n)}>
                          <span className={`pva-notif-dot${n.read ? ' opacity-30' : ''}`} />
                          <span>
                            {n.title || n.body}
                            <span className="pva-notif-meta">{timeAgo(n.date)}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {unreadCount > 0 && (
                    <div className="pva-panel-foot">
                      <button type="button" onClick={handleMarkAllRead}>Mark all read</button>
                    </div>
                  )}
                </>
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
