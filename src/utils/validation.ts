import { Product } from '../types';

export const isSkuUnique = (sku: string, products: Product[], excludeId?: string): boolean => {
  return !products.some(p => 
    p.sku === sku && // Case sensitive comparison
    (!excludeId || p.id !== excludeId)
  );
};

export const validateSku = (sku: string, products: Product[], excludeId?: string): string | null => {
  if (!sku) return 'SKU is required';
  if (!isSkuUnique(sku, products, excludeId)) {
    return 'SKU must be unique';
  }
  return null;
};