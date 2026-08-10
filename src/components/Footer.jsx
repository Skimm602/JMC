import Logo from './Logo.jsx'
import { CurrentRule } from './ui.jsx'

const columns = [
  {
    title: 'Products',
    links: ['S4 grid-tie', 'H6 hybrid', 'V-Stack storage', 'M1 microinverters', 'Accessories'],
  },
  {
    title: 'Installers',
    links: ['Partner program', 'Training & certification', 'Design tools', 'Firmware library', 'Warranty claims'],
  },
  {
    title: 'Company',
    links: ['About JMC', 'Manufacturing', 'Careers', 'Newsroom', 'Contact'],
  },
  {
    title: 'Support',
    links: ['Documentation', 'Grid codes', 'Troubleshooting', 'RMA process', 'Report a fault'],
  },
]

export default function Footer() {
  return (
    <footer id="footer" className="border-ink-700/70 bg-ink-950 border-t">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo />
            <p className="text-mute mt-5 max-w-xs text-sm leading-relaxed">
              Grid-tie, hybrid and storage inverters for residential and commercial solar. Engineered for the
              people who have to service them.
            </p>
            <dl className="mt-6 space-y-1.5">
              <div className="flex gap-2 text-xs">
                <dt className="text-mute-dim font-mono tracking-wide">Trade desk</dt>
                <dd className="text-chalk">+63 32 000 0000</dd>
              </div>
              <div className="flex gap-2 text-xs">
                <dt className="text-mute-dim font-mono tracking-wide">Email</dt>
                <dd className="text-chalk">installers@jmcsolar.example</dd>
              </div>
            </dl>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h3 className="text-mute-dim font-mono text-[10px] tracking-[0.18em] uppercase">{col.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#top" className="text-mute hover:text-solar-400 text-sm transition-colors">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <CurrentRule className="my-10" />

        <div className="text-mute-dim flex flex-col gap-4 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} JMC Solar. All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {['Privacy', 'Terms of sale', 'Cookies', 'Compliance'].map((l) => (
              <li key={l}>
                <a href="#top" className="hover:text-mute transition-colors">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
