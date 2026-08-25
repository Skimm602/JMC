import CategoryStorefront from '@/components/CategoryStorefront.jsx'
import { categoryBySlug } from '@/utils/product-categories'

/**
 * /products/inverters
 *
 * A static segment rather than a slug caught by [id]: Next resolves static
 * routes before dynamic ones, so this wins over /products/<uuid> without the
 * product page ever having to know that "inverters" is not an id.
 */
const category = categoryBySlug('inverters')

export const metadata = {
  title: 'Inverters — VIP Solar',
  description: category.lede,
}

export default function InvertersPage() {
  return <CategoryStorefront category={category} />
}
