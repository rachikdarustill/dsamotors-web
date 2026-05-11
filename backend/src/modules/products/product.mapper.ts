import { Product as PrismaProduct } from '@prisma/client';
import { Product } from './product.types';

export function mapPrismaProduct(product: PrismaProduct): Product {
  return {
    id: product.id,
    title: product.title,
    description: product.description || '',
    category: product.category || '',
    condition: product.condition || '',
    address: product.address || '',
    brand: product.brand || '',
    make: product.make || '',
    oem: product.oem || '',
    price: product.price,
    images: Array.isArray(product.images) ? product.images.map(String) : [],
  };
}
