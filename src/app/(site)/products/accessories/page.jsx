import CategoryStorefront from '@/components/CategoryStorefront.jsx'
import { categoryBySlug } from '@/utils/product-categories'

/**
 * /products/accessories
 *
 * A static segment rather than a slug caught by [id]: Next resolves static
 * routes before dynamic ones, so this wins over /products/<uuid> without the
 * product page ever having to know that "accessories" is not an id.
 */
const category = categoryBySlug('accessories')

export const metadata = {
  title: 'Accessories — VIP Solar',
  description: category.lede,
}

export default function AccessoriesPage() {
  return <CategoryStorefront category={category} />
}
