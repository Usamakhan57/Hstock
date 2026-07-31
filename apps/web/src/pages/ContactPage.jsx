import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import { useToast } from '../hooks/use-toast';

const info = [
  { icon: Mail, title: 'Email', text: 'support@hstock.store' },
  { icon: Phone, title: 'Phone', text: '+1 (555) 012-3456' },
  { icon: MapPin, title: 'Studio', text: 'Austin, Texas, USA' },
];

const ContactPage = () => {
  const { toast } = useToast();
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

  return (
    <div className="min-h-screen">
      <Seo title="Contact Us" description="Get in touch with the HStock support team — we usually reply within one business day." />
    <Header />
      <div className="mx-auto max-w-[90rem] px-5 lg:px-8 pt-10 pb-24">
        <Breadcrumbs items={[{ name: 'Contact' }]} />
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">Get in <span className="brand-text">touch</span></h1>
        <p className="text-muted-foreground mt-3 max-w-lg">Questions about an order, a license, or becoming a seller? We'd love to hear from you.</p>

        <div className="mt-10 grid lg:grid-cols-[1fr_1.4fr] gap-8">
          <div className="space-y-4">
            {info.map((i) => (
              <div key={i.title} className="bg-white rounded-3xl border border-border p-6 flex items-center gap-4">
                <span className="grid place-items-center w-12 h-12 rounded-2xl brand-gradient text-white shrink-0">
                  <i.icon className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{i.title}</p>
                  <p className="text-sm text-muted-foreground">{i.text}</p>
                </div>
              </div>
            ))}
            <div className="bg-white rounded-3xl border border-border p-6">
              <p className="text-sm font-semibold mb-1">Support hours</p>
              <p className="text-sm text-muted-foreground">Monday–Friday, 9am–6pm CST. We typically reply within one business day.</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-border soft-shadow p-8">
            {sent ? (
              <div className="text-center py-8">
                <h2 className="text-lg font-bold">Thanks for reaching out!</h2>
                <p className="text-sm text-muted-foreground mt-1.5">We've received your message and will respond soon.</p>
                <button onClick={() => setSent(false)} className="mt-6 px-6 py-3 rounded-full border-2 border-foreground font-semibold hover:bg-foreground hover:text-white transition-colors">Send another message</button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
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
      </div>
      <Footer />
    </div>
  );
};

export default ContactPage;
