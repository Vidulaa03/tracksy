'use client';

import { useState } from 'react';
import { ArrowRight, Github, Linkedin, Mail, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';

const footerLinks = {
  product: [
    { label: 'Features', href: '/#features' },
    { label: 'Kanban', href: '/#kanban' },
    { label: 'AI Insights', href: '/#ai' },
    { label: 'Pricing', href: '/#pricing' },
  ],
  resources: [
    { label: 'Blog', href: '/blog' },
    { label: 'Guides', href: '/guides' },
    { label: 'Support', href: '/support' },
    { label: 'API Docs', href: '/docs' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
  ],
};

export function Footer() {
  const [email, setEmail] = useState('');

  return (
    <footer className="relative overflow-hidden bg-slate-950 text-slate-200">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-8 top-24 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.8fr_1fr] xl:grid-cols-[1.8fr_1fr_1fr_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/90">Tracksy</p>
                <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                  Build career momentum with precision.
                </h2>
                <p className="mt-4 max-w-xl text-slate-400 sm:text-lg">
                  A premium job application workspace with smart tracking, AI-powered resume feedback, and polished workflow controls for modern professionals.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-800/80 bg-slate-950/90 p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Grow faster</p>
                  <p className="mt-3 text-lg font-semibold text-white">Stay ahead of every opportunity.</p>
                </div>
                <div className="rounded-3xl border border-slate-800/80 bg-slate-950/90 p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Stay connected</p>
                  <p className="mt-3 text-lg font-semibold text-white">One dashboard for every job search detail.</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/90">Follow us</p>
                <div className="flex items-center gap-4">
                  <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" className="rounded-full border border-slate-700/80 bg-slate-900/80 p-3 text-slate-300 transition hover:border-cyan-400/70 hover:text-cyan-300">
                    <Github className="h-5 w-5" />
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" className="rounded-full border border-slate-700/80 bg-slate-900/80 p-3 text-slate-300 transition hover:border-sky-400/70 hover:text-sky-300">
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="rounded-full border border-slate-700/80 bg-slate-900/80 p-3 text-slate-300 transition hover:border-cyan-300/70 hover:text-cyan-300">
                    <Linkedin className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 xl:grid-cols-1 xl:gap-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Product</h3>
              <ul className="mt-6 space-y-4 text-sm text-slate-300">
                {footerLinks.product.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="transition hover:text-white">{item.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Resources</h3>
              <ul className="mt-6 space-y-4 text-sm text-slate-300">
                {footerLinks.resources.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="transition hover:text-white">{item.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Company</h3>
              <ul className="mt-6 space-y-4 text-sm text-slate-300">
                {footerLinks.company.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="transition hover:text-white">{item.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/90">Newsletter</p>
                  <h3 className="mt-3 text-3xl font-semibold text-white">Stay in the loop with every hiring move.</h3>
                  <p className="mt-3 max-w-2xl text-slate-400">
                    Receive resume tips, job search updates, and product news from Tracksy.
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-800/80 bg-slate-950/90 p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Launch faster</p>
                  <p className="mt-3 text-lg font-semibold text-white">Designed for job seekers who move quickly.</p>
                </div>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                }}
                className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto]"
              >
                <label htmlFor="newsletter" className="sr-only">
                  Email address
                </label>
                <div className="relative rounded-3xl border border-slate-800/90 bg-slate-950/90 p-2 shadow-inner shadow-slate-950/10">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Mail className="h-5 w-5 text-cyan-300" />
                    <input
                      id="newsletter"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@workmail.com"
                      className="w-full border-0 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <Button type="submit" className="h-14 rounded-3xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-lg shadow-cyan-500/20 hover:scale-[1.01] focus:ring-2 focus:ring-cyan-300/50">
                  Subscribe
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800/70 pt-8 text-sm text-slate-500 sm:flex sm:items-center sm:justify-between">
          <p>© 2026 Tracksy. Crafted for modern career moves.</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 sm:mt-0">
            <a href="/privacy" className="transition hover:text-white">Privacy</a>
            <a href="/terms" className="transition hover:text-white">Terms</a>
            <a href="/contact" className="transition hover:text-white">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
