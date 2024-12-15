import { Product } from '../types';

export const parseCSV = (csvText: string): Product[] => {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',').map(v => v.trim());
      const product: Partial<Product> = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        switch (header.toLowerCase()) {
          case 'sku':
            product.sku = value;
            break;
          case 'name':
            product.name = value;
            break;
          case 'quantity':
            product.quantity = Number(value);
            break;
          case 'minstocklevel':
          case 'min stock level':
            product.minStockLevel = Number(value);
            break;
          case 'location':
            product.location = value;
            break;
          case 'vendornumber':
          case 'vendor number':
            product.vendorNumber = value;
            break;
          case 'weight':
            product.weight = Number(value);
            break;
          case 'height':
            product.height = Number(value);
            break;
          case 'length':
            product.length = Number(value);
            break;
          case 'width':
            product.width = Number(value);
            break;
          case 'unitcbm':
          case 'unit cbm':
            product.unitCbm = Number(value);
            break;
        }
      });

      return {
        id: crypto.randomUUID(), // This will be replaced if updating existing product
        unitOfMeasurement: 'units',
        createdAt: new Date(),
        updatedAt: new Date(),
        cbm: (product.unitCbm || 0) * (product.quantity || 0),
        ...product
      } as Product;
    });
};

export const validateProducts = (
  products: Product[], 
  existingProducts: Product[],
  isUpdate: boolean
): string[] => {
  const errors: string[] = [];
  const seenSkus = new Set<string>();
  
  products.forEach((product, index) => {
    const lineNumber = index + 2; // +2 because we skip header and 0-based index
    
    if (!product.sku) {
      errors.push(`Line ${lineNumber}: SKU is required`);
    } else {
      // Check for duplicates within the CSV
      if (seenSkus.has(product.sku)) {
        errors.push(`Line ${lineNumber}: Duplicate SKU "${product.sku}" found in CSV`);
      } else {
        seenSkus.add(product.sku);
        
        // For updates, SKU must exist
        const existingProduct = existingProducts.find(p => p.sku === product.sku);
        if (isUpdate && !existingProduct) {
          errors.push(`Line ${lineNumber}: SKU "${product.sku}" not found in inventory`);
        }
      }
    }
    
    if (!product.name) errors.push(`Line ${lineNumber}: Name is required`);
    if (!product.vendorNumber) errors.push(`Line ${lineNumber}: Vendor Number is required`);
    if (product.quantity < 0) errors.push(`Line ${lineNumber}: Quantity must be positive`);
    if (product.minStockLevel < 0) errors.push(`Line ${lineNumber}: Min Stock Level must be positive`);
    if (product.weight <= 0) errors.push(`Line ${lineNumber}: Weight must be greater than 0`);
    if (product.height <= 0) errors.push(`Line ${lineNumber}: Height must be greater than 0`);
    if (product.length <= 0) errors.push(`Line ${lineNumber}: Length must be greater than 0`);
    if (product.width <= 0) errors.push(`Line ${lineNumber}: Width must be greater than 0`);
    if (product.unitCbm <= 0) errors.push(`Line ${lineNumber}: Unit CBM must be greater than 0`);
  });

  return errors;
};