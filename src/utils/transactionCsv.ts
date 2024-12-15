import { Transaction, Product } from '../types';

export const parseTransactionCSV = (csvText: string, type: 'inbound' | 'outbound', products: Product[]): Transaction[] => {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',').map(v => v.trim());
      const transaction: Partial<Transaction> = {
        type,
        status: 'pending'
      };
      
      headers.forEach((header, index) => {
        const value = values[index];
        switch (header.toLowerCase()) {
          case 'sku':
            // Find product by SKU and set the productId
            const product = products.find(p => p.sku.toLowerCase() === value.toLowerCase());
            if (product) {
              transaction.productId = product.id;
            }
            break;
          case 'quantity':
            transaction.quantity = Number(value);
            break;
          case 'referencenumber':
          case 'reference number':
            transaction.referenceNumber = value;
            break;
          case 'handlername':
          case 'handler name':
            transaction.handlerName = value;
            break;
          case 'notes':
            transaction.notes = value;
            break;
        }
      });

      return {
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...transaction
      } as Transaction;
    });
};

export const validateTransactions = (transactions: Transaction[], products: Product[], type: 'inbound' | 'outbound'): string[] => {
  const errors: string[] = [];
  
  transactions.forEach((transaction, index) => {
    const lineNumber = index + 2; // +2 because we skip header and 0-based index
    
    if (!transaction.productId) errors.push(`Line ${lineNumber}: SKU not found in inventory`);
    if (!transaction.quantity || transaction.quantity <= 0) errors.push(`Line ${lineNumber}: Quantity must be greater than 0`);
    if (!transaction.referenceNumber) errors.push(`Line ${lineNumber}: Reference Number is required`);
    if (!transaction.handlerName) errors.push(`Line ${lineNumber}: Handler Name is required`);

    if (transaction.productId) {
      const product = products.find(p => p.id === transaction.productId);
      if (type === 'outbound' && product && product.quantity < transaction.quantity) {
        errors.push(
          `Line ${lineNumber}: Insufficient quantity for SKU ${product.sku} (available: ${product.quantity})`
        );
      }
    }
  });

  return errors;
};