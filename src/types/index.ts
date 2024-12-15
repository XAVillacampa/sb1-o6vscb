// Update the Billing interface to remove items
export interface Billing {
  id: string;
  invoiceNumber: string;
  vendorNumber: string;
  status: BillingStatus;
  amount: number;
  dueDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
}

// Remove BillingItem interface as it's no longer needed