import CategoryStorefront from '@/components/CategoryStorefront.jsx'
import { categoryBySlug } from '@/utils/product-categories'

/**
 * /products/batteries
 *
 * A static segment rather than a slug caught by [id]: Next resolves static
 * routes before dynamic ones, so this wins over /products/<uuid> without the
 * product page ever having to know that "batteries" is not an id.
 */
const category = categoryBySlug('batteries')

export const metadata = {
  title: 'Batteries — VIP Solar',
  description: category.lede,
}

export default function BatteriesPage() {
  return <CategoryStorefront category={category} />
}
