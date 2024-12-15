import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AlertType, Product, Transaction } from '../types';
import { calculateUnitCBM, calculateTotalCBM } from '../utils/calculations';

interface AlertState {
  message: string | null;
  type: AlertType;
  showAlert: boolean;
  setAlert: (message: string, type: AlertType) => void;
  clearAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  message: null,
  type: 'info',
  showAlert: false,
  setAlert: (message, type) => set({ message, type, showAlert: true }),
  clearAlert: () => set({ message: null, showAlert: false }),
}));

interface InventoryState {
  products: Product[];
  transactions: Transaction[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transaction: Transaction) => void;
  completeTransaction: (transaction: Transaction) => void;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      products: [],
      transactions: [],
      addProduct: (product) => {
        const totalCbm = product.quantity * product.unitCbm;
        set((state) => ({
          products: [...state.products, { ...product, cbm: totalCbm }],
        }));
      },
      updateProduct: (product) => {
        const totalCbm = product.quantity * product.unitCbm;
        set((state) => ({
          products: state.products.map((p) =>
            p.id === product.id ? { ...product, cbm: totalCbm } : p
          ),
        }));
      },
      deleteProduct: (productId) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== productId),
        })),
      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [...state.transactions, transaction],
        })),
      updateTransaction: (transaction) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === transaction.id ? { ...transaction } : t
          ),
        })),
      completeTransaction: (transaction) => {
        const { products } = get();
        const product = products.find(p => p.id === transaction.productId);
        
        if (!product) return;

        let newQuantity;
        if (transaction.type === 'inbound') {
          newQuantity = Number(product.quantity) + Number(transaction.quantity);
        } else {
          newQuantity = Number(product.quantity) - Number(transaction.quantity);
        }

        const totalCbm = newQuantity * product.unitCbm;

        const updatedProduct = {
          ...product,
          quantity: newQuantity,
          cbm: totalCbm,
          updatedAt: new Date()
        };

        const updatedTransaction = {
          ...transaction,
          status: 'completed',
          updatedAt: new Date()
        };

        set((state) => ({
          products: state.products.map((p) =>
            p.id === product.id ? updatedProduct : p
          ),
          transactions: state.transactions.map((t) =>
            t.id === transaction.id ? updatedTransaction : t
          ),
        }));
      },
    }),
    {
      name: 'inventory-storage',
    }
  )
);