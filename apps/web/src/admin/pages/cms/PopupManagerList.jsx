import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Bell, Mail, Tag, Megaphone, ShieldAlert } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ImageUploadInput from '../../components/ImageUploadInput';
import { inputClass, textareaClass } from '../../components/FormSheet';
import { Switch } from '../../../components/ui/switch';
import { getPopups, updatePopup } from '../../api/popups';
import { useToast } from '../../../hooks/use-toast';

const ICONS = { newsletter: Mail, discount: Tag, announcement: Megaphone, age_verification: ShieldAlert };

const PopupCard = ({ popup, isOpen, onToggleOpen, onToggleEnabled, onChange }) => {
  const Icon = ICONS[popup.type] || Bell;
  const set = (key) => (e) => onChange({ ...popup, [key]: e?.target ? e.target.value : e });

  return (
    <div className={`bg-white rounded-2xl border transition-colors ${popup.enabled ? 'border-border' : 'border-border/60 opacity-70'}`}>
      <div className="flex items-center gap-3 p-4">
        <button type="button" onClick={onToggleOpen} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <span className="w-9 h-9 rounded-xl bg-secondary grid place-items-center shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </span>
          <span className="min-w-0">
            <p className="font-semibold text-sm truncate">{popup.label}</p>
            <p className="text-xs text-muted-foreground truncate">{popup.headline || 'No headline set'}</p>
          </span>
        </button>
        <Switch checked={popup.enabled} onCheckedChange={onToggleEnabled} aria-label={`Toggle ${popup.label}`} />
        <button type="button" onClick={onToggleOpen} aria-label={isOpen ? 'Collapse' : 'Expand'} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground shrink-0">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="px-4 pb-5 pt-1 space-y-4 border-t border-border">
          <div className="grid sm:grid-cols-2 gap-4 pt-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Headline</label>
              <input value={popup.headline} onChange={set('headline')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Delay (seconds)</label>
              <input type="number" min="0" value={popup.delaySeconds} onChange={(e) => onChange({ ...popup, delaySeconds: Number(e.target.value) })} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Content</label>
            <textarea value={popup.content} onChange={set('content')} className={textareaClass} />
          </div>

          <ImageUploadInput label="Image" value={popup.image} onChange={(v) => onChange({ ...popup, image: v })} />

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Button Text</label>
              <input value={popup.buttonText} onChange={set('buttonText')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Button URL</label>
              <input value={popup.buttonUrl} onChange={set('buttonUrl')} className={inputClass} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Schedule Start</label>
              <input type="date" value={popup.scheduleStart?.slice(0, 10) || ''} onChange={(e) => onChange({ ...popup, scheduleStart: e.target.value ? new Date(e.target.value).toISOString() : '' })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Schedule End</label>
              <input type="date" value={popup.scheduleEnd?.slice(0, 10) || ''} onChange={(e) => onChange({ ...popup, scheduleEnd: e.target.value ? new Date(e.target.value).toISOString() : '' })} className={inputClass} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Leave schedule dates blank to show whenever this popup is enabled.</p>
        </div>
      )}
    </div>
  );
};

const PopupManagerList = () => {
  const { toast } = useToast();
  const [popups, setPopups] = useState(null);
  const [openKeys, setOpenKeys] = useState(() => new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => { getPopups().then(setPopups); }, []);

  const toggleOpen = (id) => setOpenKeys((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const updateLocal = (id, patch) => setPopups((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(popups.map((p) => updatePopup(p.id, p)));
      toast({ title: 'Popups saved' });
    } catch (err) {
      toast({ title: 'Could not save popups', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!popups) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <PageHeader
        title="Popup Manager"
        description="Site-wide popups — enable, schedule, and edit content for each."
        actions={
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        }
      />

      <div className="space-y-3 max-w-3xl">
        {popups.map((popup) => (
          <PopupCard
            key={popup.id}
            popup={popup}
            isOpen={openKeys.has(popup.id)}
            onToggleOpen={() => toggleOpen(popup.id)}
            onToggleEnabled={(v) => updateLocal(popup.id, { enabled: v })}
            onChange={(next) => updateLocal(popup.id, next)}
          />
        ))}
      </div>
    </div>
  );
};

export default PopupManagerList;
