/**
 * The back office.
 *
 * It sits outside `(site)`, so it inherits the fonts and the palette and
 * nothing else — no header, no footer, no link back into the marketing pages.
 * Nothing on the public site links here either: the way in is to type /admin.
 *
 * That is obscurity, not security, and it is treated as such. `robots` keeps
 * the route out of search results, but every page below this one re-reads the
 * session on the server and the database refuses to hand an ordinary account
 * an admin's rows no matter what reaches it.
 */
export const metadata = {
  title: 'Back office',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default function AdminLayout({ children }) {
  return <div className="min-h-dvh">{children}</div>
}
