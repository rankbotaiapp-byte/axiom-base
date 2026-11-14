import { Phone } from 'lucide-react';
import RadarLogo from './RadarLogo';
import { nav, site } from './config/site';

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-ink-950 pb-28 pt-14 md:pb-12">
      <div className="hazard absolute inset-x-0 top-0 h-1.5 opacity-80" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <RadarLogo size={44} />
            <span className="leading-none">
              <span className="block font-stencil text-3xl font-black tracking-[0.12em] text-amber">{site.name}</span>
              <span className="mt-1 block font-mono text-[10px] tracking-tactical text-steel-300">{site.tagline}</span>
            </span>
          </div>
          <p className="mt-5 max-w-sm text-steel-400">{site.description}</p>
        </div>
        <nav aria-label="Footer">
          <p className="label mb-4 text-amber">Navigate</p>
          <ul className="grid gap-2.5">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="text-steel-300 transition hover:text-white">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="label mb-4 text-amber">Dispatch</p>
          <a href={site.phoneHref} className="flex items-center gap-2 font-mono text-lg text-white hover:text-amber-glow">
            <Phone className="h-4 w-4 text-amber" /> {site.phoneDisplay}
          </a>
          <a href={`mailto:${site.email}`} className="mt-2 block break-all text-steel-300 hover:text-white">
            {site.email}
          </a>
          <p className="mt-2 text-steel-400">{site.serviceArea}</p>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-wrap justify-between gap-3 border-t border-white/10 px-4 pt-6 font-mono text-[11px] tracking-wider text-steel-500 sm:px-6 lg:px-8">
        <span>
          © {new Date().getFullYear()} {site.legalName.toUpperCase()}
        </span>
        <span>LICENSED · BONDED · INSURED</span>
      </div>
    </footer>
  );
}
