import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Billing, BillingStatus } from '../types';

interface BillingState {
  billings: Billing[];
  addBilling: (billing: Billing) => void;
  updateBilling: (billing: Billing) => void;
  deleteBilling: (billingId: string) => void;
  markAsPaid: (billingId: string) => void;
}

export const useBillingStore = create<BillingState>()(
  persist(
    (set) => ({
      billings: [],

      addBilling: (billing) =>
        set((state) => ({
          billings: [...state.billings, {
            ...billing,
            amount: Number(billing.amount)
          }],
        })),

      updateBilling: (billing) =>
        set((state) => ({
          billings: state.billings.map((b) =>
            b.id === billing.id ? {
              ...billing,
              amount: Number(billing.amount),
              updatedAt: new Date()
            } : b
          ),
        })),

      deleteBilling: (billingId) =>
        set((state) => ({
          billings: state.billings.filter((b) => b.id !== billingId),
        })),

      markAsPaid: (billingId) =>
        set((state) => ({
          billings: state.billings.map((b) =>
            b.id === billingId
              ? { ...b, status: 'paid' as BillingStatus, paidAt: new Date(), updatedAt: new Date() }
              : b
          ),
        })),
    }),
    {
      name: 'billing-storage',
      onRehydrateStorage: () => (state) => {
        // Convert date strings back to Date objects and ensure amounts are numbers
        if (state?.billings) {
          state.billings = state.billings.map(billing => ({
            ...billing,
            amount: Number(billing.amount),
            createdAt: new Date(billing.createdAt),
            updatedAt: new Date(billing.updatedAt),
            dueDate: new Date(billing.dueDate),
            paidAt: billing.paidAt ? new Date(billing.paidAt) : undefined
          }));
        }
      },
    }
  )
);