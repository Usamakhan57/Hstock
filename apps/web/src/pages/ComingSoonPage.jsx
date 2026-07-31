import React, { useState } from 'react';
import { Sparkles, Mail } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { useToast } from '../hooks/use-toast';

/** Generic "coming soon" placeholder for a not-yet-launched section/feature, with an optional notify-me capture. */
const ComingSoonPage = ({ title = 'Something new is coming', description = "We're building this feature — check back soon." }) => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  const notify = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast({ title: "You're on the list!", description: `We'll email ${email} when this launches.` });
    setEmail('');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Seo title={title} description={description} noIndex />
      <Header />
      <div className="flex-1 grid place-items-center px-5 py-24 text-center">
        <div className="max-w-md">
          <span className="grid place-items-center w-20 h-20 rounded-full brand-gradient text-white mx-auto mb-6">
            <Sparkles className="w-9 h-9" />
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">{description}</p>
          <form onSubmit={notify} className="flex items-center gap-2 bg-white rounded-full px-2 py-2 border border-border mt-8 max-w-sm mx-auto">
            <Mail className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
              className="bg-transparent outline-none text-sm w-full"
            />
            <button type="submit" className="shrink-0 px-5 py-2 rounded-full brand-gradient text-white text-sm font-semibold hover:opacity-95 transition-opacity">
              Notify Me
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ComingSoonPage;
