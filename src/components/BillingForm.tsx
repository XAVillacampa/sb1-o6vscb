import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { BillingItem, BillingType, Transaction } from '../types';

interface BillingFormProps {
  items: BillingItem[];
  onItemsChange: (items: BillingItem[]) => void;
  transactions: Transaction[];
}

function BillingForm({ items, onItemsChange, transactions }: BillingFormProps) {
  const [selectedType, setSelectedType] = useState<BillingType>('storage');

  const addItem = () => {
    const newItem: BillingItem = {
      id: crypto.randomUUID(),
      description: '',
      type: selectedType,
      quantity: 0,
      rate: 0,
      amount: 0,
    };
    onItemsChange([...items, newItem]);
  };

  const removeItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<BillingItem>) => {
    onItemsChange(
      items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, ...updates };
          // Recalculate amount when quantity or rate changes
          if ('quantity' in updates || 'rate' in updates) {
            updatedItem.amount = updatedItem.quantity * updatedItem.rate;
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as BillingType)}
          className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
        >
          <option value="storage">Storage Fee</option>
          <option value="handling">Handling Fee</option>
          <option value="transportation">Transportation Fee</option>
          <option value="other">Other Fee</option>
        </select>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                  </label>
                  <select
                    value={item.type}
                    onChange={(e) => updateItem(item.id, { type: e.target.value as BillingType })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  >
                    <option value="storage">Storage Fee</option>
                    <option value="handling">Handling Fee</option>
                    <option value="transportation">Transportation Fee</option>
                    <option value="other">Other Fee</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Rate
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => updateItem(item.id, { rate: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={item.amount}
                    disabled
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:text-gray-400 sm:text-sm"
                  />
                </div>
              </div>
              {item.type !== 'other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Related Workflow
                  </label>
                  <select
                    value={item.workflowNumber || ''}
                    onChange={(e) => updateItem(item.id, { workflowNumber: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  >
                    <option value="">Select a workflow</option>
                    {transactions.map(transaction => (
                      <option key={transaction.id} value={transaction.workflowNumber}>
                        {transaction.workflowNumber}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="p-1 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <div className="flex justify-end space-x-4 text-sm">
          <div className="text-gray-500 dark:text-gray-400">
            Subtotal: ${items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}

export default BillingForm;