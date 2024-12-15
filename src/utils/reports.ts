import { Product, Transaction } from '../types';

export const generateStorageReport = (products: Product[], startDate: string, endDate: string): string => {
  const headers = ['Date', 'SKU', 'Name', 'Quantity', 'CBM'];
  const rows = products.map(product => [
    new Date().toISOString().split('T')[0],
    product.sku,
    product.name,
    product.quantity,
    product.cbm
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
};

export const generateInventoryReport = (products: Product[], startDate: string, endDate: string): string => {
  const headers = ['SKU', 'Name', 'Quantity', 'Min Stock Level', 'Location', 'Vendor Number', 'CBM', 'Status'];
  const rows = products.map(product => [
    product.sku,
    product.name,
    product.quantity,
    product.minStockLevel,
    product.location,
    product.vendorNumber,
    product.cbm,
    product.quantity <= product.minStockLevel ? 'Low Stock' : 'Normal'
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
};

export const generateTransactionReport = (
  transactions: Transaction[], 
  products: Product[], 
  startDate: string, 
  endDate: string
): string => {
  const startDateTime = new Date(startDate);
  const endDateTime = new Date(endDate);
  endDateTime.setHours(23, 59, 59, 999);

  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.createdAt);
    return transactionDate >= startDateTime && transactionDate <= endDateTime;
  });

  const headers = ['Date', 'Type', 'SKU', 'Product Name', 'Quantity', 'Reference Number', 'Handler', 'Status'];
  const rows = filteredTransactions.map(transaction => {
    const product = products.find(p => p.id === transaction.productId);
    return [
      new Date(transaction.createdAt).toLocaleDateString(),
      transaction.type,
      product?.sku || 'N/A',
      product?.name || 'Unknown Product',
      transaction.quantity,
      transaction.referenceNumber,
      transaction.handlerName,
      transaction.status
    ];
  });

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
};