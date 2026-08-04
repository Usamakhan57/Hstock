import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Send, MessageCircle, Building2, Clock, ExternalLink } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import { useToast } from '../hooks/use-toast';
import { useCms } from '../hooks/useCms';
import { CMS_KEYS } from '../services/cmsApi';

const ContactPage = () => {
  const { toast } = useToast();
  const { data: contact, loading } = useCms(CMS_KEYS.CONTACT);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({ title: 'Please fill in your name, email, and message.', variant: 'destructive' });
      return;
    }
    setSent(true);
    toast({ title: 'Message sent!', description: 'Our team will get back to you within 1-2 business days.' });
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  const info = [
    contact?.email ? { icon: Mail, title: 'Email', text: contact.email } : null,
    contact?.phone ? { icon: Phone, title: 'Phone', text: contact.phone } : null,
    contact?.whatsapp ? { icon: MessageCircle, title: 'WhatsApp', text: contact.whatsapp } : null,
    contact?.office ? { icon: Building2, title: 'Office', text: contact.office } : null,
    contact?.address ? { icon: MapPin, title: 'Address', text: contact.address } : null,
  ].filter(Boolean);

  const seoDescription = contact?.formDescription
    || (contact?.email ? `Contact ApnaStore support at ${contact.email}.` : 'Contact ApnaStore support.');

  return (
    <div className="min-h-screen">
      <Seo title="Contact Us" description={seoDescription} />
      <Header />
      <div className="mx-auto max-w-[90rem] px-5 lg:px-8 pt-10 pb-24">
        <Breadcrumbs items={[{ name: 'Contact' }]} />
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          Contact <span className="brand-text">{contact?.companyName || 'ApnaStore'}</span>
        </h1>
        <p className="text-muted-foreground mt-3 max-w-lg">
          {contact?.formDescription || (loading ? 'Loading contact details…' : '')}
        </p>

        <div className="mt-10 grid lg:grid-cols-[1fr_1.4fr] gap-8">
          <div className="space-y-4">
            {loading && !contact ? (
              <div className="bg-white rounded-3xl border border-border p-6 text-sm text-muted-foreground">Loading…</div>
            ) : null}
            {info.map((i) => (
              <div key={i.title} className="bg-white rounded-3xl border border-border p-6 flex items-center gap-4">
                <span className="grid place-items-center w-12 h-12 rounded-2xl brand-gradient text-white shrink-0">
                  <i.icon className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{i.title}</p>
                  <p className="text-sm text-muted-foreground break-words">{i.text}</p>
                </div>
              </div>
            ))}

            {(contact?.supportHours || (contact?.businessHours || []).length > 0) && (
              <div className="bg-white rounded-3xl border border-border p-6 space-y-3">
                <p className="text-sm font-semibold mb-1 inline-flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Support hours
                </p>
                {contact?.supportHours ? (
                  <p className="text-sm text-muted-foreground">{contact.supportHours}</p>
                ) : null}
                {(contact?.businessHours || []).length > 0 && (
                  <ul className="space-y-1.5">
                    {contact.businessHours.map((row) => (
                      <li key={row.id || `${row.day}-${row.hours}`} className="text-sm text-muted-foreground flex justify-between gap-3">
                        <span className="font-medium text-foreground">{row.day}</span>
                        <span>{row.hours}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {contact?.googleMapsUrl ? (
              <a
                href={contact.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-white rounded-3xl border border-border p-6 flex items-center gap-3 text-sm font-semibold text-primary hover:bg-secondary/40 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Google Maps
              </a>
            ) : null}
          </div>

          <div className="bg-white rounded-3xl border border-border soft-shadow p-8">
            {sent ? (
              <div className="text-center py-8">
                <h2 className="text-lg font-bold">Thanks for reaching out!</h2>
                <p className="text-sm text-muted-foreground mt-1.5">We've received your message and will respond soon.</p>
                <button type="button" onClick={() => setSent(false)} className="mt-6 px-6 py-3 rounded-full border-2 border-foreground font-semibold hover:bg-foreground hover:text-white transition-colors">Send another message</button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold">{contact?.formTitle || 'Send us a message'}</h2>
                  {contact?.formDescription ? (
                    <p className="text-sm text-muted-foreground mt-1">{contact.formDescription}</p>
                  ) : null}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="text-sm font-medium block mb-1.5">Name</label>
                    <input id="name" value={form.name} onChange={update('name')} placeholder="Your name" className="w-full bg-secondary/60 rounded-2xl px-4 py-3 text-sm outline-none border border-transparent focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <label htmlFor="email" className="text-sm font-medium block mb-1.5">Email</label>
                    <input id="email" type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" className="w-full bg-secondary/60 rounded-2xl px-4 py-3 text-sm outline-none border border-transparent focus:border-primary transition-colors" />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="text-sm font-medium block mb-1.5">Subject</label>
                  <input id="subject" value={form.subject} onChange={update('subject')} placeholder="How can we help?" className="w-full bg-secondary/60 rounded-2xl px-4 py-3 text-sm outline-none border border-transparent focus:border-primary transition-colors" />
                </div>
                <div>
                  <label htmlFor="message" className="text-sm font-medium block mb-1.5">Message</label>
                  <textarea id="message" rows={6} value={form.message} onChange={update('message')} placeholder="Tell us more…" className="w-full bg-secondary/60 rounded-2xl px-4 py-3 text-sm outline-none border border-transparent focus:border-primary transition-colors resize-none" />
                </div>
                <button type="submit" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full brand-gradient text-white font-semibold soft-shadow hover:soft-shadow-lg transition-shadow">
                  Send Message <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Prefer account help? Visit the <Link to="/support" className="text-primary font-semibold hover:underline">in-app support center</Link>.
        </p>
      </div>
      <Footer />
    </div>
  );
};

export default ContactPage;
