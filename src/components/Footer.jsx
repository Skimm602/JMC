import Logo from './Logo.jsx'
import { Rule } from './ui.jsx'

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
    links: ['About VIP', 'Manufacturing', 'Careers', 'Newsroom', 'Contact'],
  },
  {
    title: 'Support',
    links: ['Documentation', 'Grid codes', 'Troubleshooting', 'RMA process', 'Report a fault'],
  },
]

export default function Footer() {
  return (
    <footer id="footer" className="band-pit rail">
      <div className="rail-inner py-20 lg:py-24 xl:py-28">
        <div className="grid gap-14 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo tone="shade" />
            <p className="text-glint-soft mt-6 max-w-xs text-sm leading-relaxed">
              Grid-tie, hybrid and storage inverters for residential and commercial solar. Engineered for the
              people who have to service them.
            </p>
            <dl className="mt-7 space-y-2">
              <div className="flex gap-3 text-xs">
                <dt className="text-glint-soft w-20 shrink-0 font-mono tracking-wide">Trade desk</dt>
                <dd className="text-glint font-mono">+63 32 000 0000</dd>
              </div>
              <div className="flex gap-3 text-xs">
                <dt className="text-glint-soft w-20 shrink-0 font-mono tracking-wide">Email</dt>
                <dd className="text-glint font-mono">installers@vipsolar.example</dd>
              </div>
            </dl>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h3 className="label text-glint-soft">{col.title}</h3>
                <ul className="mt-5 space-y-3">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a
                        href="#top"
                        className="text-glint-soft hover:text-glint text-sm transition-colors"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <Rule tone="shade" className="my-12" />

        <div className="text-glint-soft flex flex-col gap-4 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} VIP Solar. All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {['Privacy', 'Terms of sale', 'Cookies', 'Compliance'].map((l) => (
              <li key={l}>
                <a href="#top" className="hover:text-glint-soft transition-colors">
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
