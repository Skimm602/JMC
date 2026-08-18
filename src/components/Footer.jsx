import Logo from './Logo.jsx'
import { Rule } from './ui.jsx'

export default function Footer() {
  return (
    <footer id="footer" className="band-pit rail">
      <div className="rail-inner py-20 lg:py-24 xl:py-28">
        <div className="flex flex-col items-center text-center">
          <Logo tone="shade" />
          <p className="text-glint-soft mt-6 max-w-xs text-sm leading-relaxed">
            Grid-tie, hybrid and storage inverters for residential and commercial solar. Engineered for the people who
            have to service them.
          </p>
          <dl className="mt-7 space-y-2">
            <div className="flex justify-center gap-3 text-xs">
              <dt className="text-glint-soft w-20 shrink-0 font-mono tracking-wide">Trade desk</dt>
              <dd className="text-glint space-y-1 font-mono">
                <span className="block">0917 508 8220</span>
                <span className="block">0949 954 8439</span>
                <span className="block">(053) 520-2459</span>
              </dd>
            </div>
            <div className="flex justify-center gap-3 text-xs">
              <dt className="text-glint-soft w-20 shrink-0 font-mono tracking-wide">Email</dt>
              <dd className="text-glint font-mono">jmcsolarph@gmail.com</dd>
            </div>
          </dl>
        </div>

        <Rule tone="shade" className="my-12" />

        <div className="text-glint-soft flex flex-col gap-4 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} VIP Solar. All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {['Privacy', 'Terms of sale', 'Cookies', 'Compliance'].map((l) => (
              <li key={l}>
                <a href="/" className="hover:text-glint-soft transition-colors">
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
