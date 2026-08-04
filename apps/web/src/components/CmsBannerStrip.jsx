import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useCms } from '../hooks/useCms';
import { CMS_KEYS } from '../services/cmsApi';

function isLive(banner, now = Date.now()) {
  if (!banner || (banner.status !== 'active' && banner.status !== 'published')) return false;
  const start = banner.startAt ? new Date(banner.startAt).getTime() : null;
  const end = banner.endAt ? new Date(banner.endAt).getTime() : null;
  if (start && Number.isFinite(start) && now < start) return false;
  if (end && Number.isFinite(end) && now > end) return false;
  return true;
}

/**
 * Renders active promotional banners from Mongo CMS (not localStorage).
 */
export default function CmsBannerStrip({ position = 'homepage' }) {
  const { data } = useCms(CMS_KEYS.BANNERS);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return new Set(JSON.parse(sessionStorage.getItem('cms_banners_dismissed') || '[]'));
    } catch {
      return new Set();
    }
  });

  const banners = useMemo(() => {
    const items = Array.isArray(data?.items) ? data.items : [];
    return items.filter((b) => isLive(b) && (!position || b.position === position) && !dismissed.has(b.id));
  }, [data, position, dismissed]);

  if (!banners.length) return null;

  const dismiss = (id) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        sessionStorage.setItem('cms_banners_dismissed', JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-[90rem] px-5 lg:px-8 mt-6 space-y-3">
      {banners.map((banner) => (
        <div
          key={banner.id}
          className="relative overflow-hidden rounded-[1.75rem] border border-border bg-white soft-shadow"
        >
          <button
            type="button"
            onClick={() => dismiss(banner.id)}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 hover:bg-secondary"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="grid sm:grid-cols-[1.2fr_1fr] gap-0">
            {(banner.image || banner.mobileImage) && (
              <img
                src={banner.image || banner.mobileImage}
                alt=""
                className="w-full h-40 sm:h-full object-cover"
              />
            )}
            <div className="p-6 sm:p-8 flex flex-col justify-center">
              {banner.title && <h3 className="text-xl font-extrabold tracking-tight">{banner.title}</h3>}
              {banner.buttonText && banner.link && (
                <Link
                  to={banner.link}
                  className="mt-4 inline-flex w-fit items-center rounded-full brand-gradient text-white text-sm font-semibold px-5 py-2.5"
                >
                  {banner.buttonText}
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
