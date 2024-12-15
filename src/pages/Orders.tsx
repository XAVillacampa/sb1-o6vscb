import React, { useState, useMemo } from 'react';
import { Plus, Search, Upload } from 'lucide-react';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import { useForm, Controller } from 'react-hook-form';
import { Transaction } from '../types';
import { useInventoryStore, useAlertStore } from '../store';
import { useAuthStore } from '../store/auth';
import { generateWorkflowNumber } from '../utils/workflow';
import BulkOrderModal from '../components/BulkOrderModal';

interface OrderFormData {
  type: 'inbound' | 'outbound';
  productId: string;
  quantity: number;
  notes?: string;
}

function Orders() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');

  const { register, handleSubmit, reset, control } = useForm<OrderFormData>();
  const { products, transactions, addTransaction } = useInventoryStore();
  const { setAlert } = useAlertStore();
  const { user } = useAuthStore();

  const isVendor = user?.role === 'vendor';

  // Filter products based on user role
  const availableProducts = useMemo(() => 
    isVendor ? products.filter(p => p.vendorNumber === user?.vendorNumber) : products,
    [products, user?.vendorNumber, isVendor]
  );

  const productOptions = useMemo(() => 
    availableProducts.map(product => ({
      value: product.id,
      label: `[${product.sku}] ${product.name}`,
      description: `Stock: ${product.quantity} | Location: ${product.location}`
    })),
    [availableProducts]
  );

  // Filter transactions based on user role
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const product = products.find(p => p.id === transaction.productId);
      if (isVendor && (!product || product.vendorNumber !== user?.vendorNumber)) return false;

      const searchString = `${product?.sku} ${product?.name} ${transaction.workflowNumber}`.toLowerCase();
      const statusMatch = selectedStatus === 'all' || transaction.status === selectedStatus;
      
      return searchString.includes(searchTerm.toLowerCase()) && statusMatch;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [transactions, products, user?.vendorNumber, searchTerm, selectedStatus, isVendor]);

  const onSubmit = async (data: OrderFormData) => {
    const product = products.find(p => p.id === data.productId);
    
    if (!product) {
      setAlert('Product not found', 'error');
      return;
    }

    if (data.type === 'outbound' && product.quantity < data.quantity) {
      setAlert('Insufficient inventory quantity', 'error');
      return;
    }

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type: data.type,
      productId: data.productId,
      quantity: data.quantity,
      status: 'pending',
      workflowNumber: generateWorkflowNumber(transactions),
      notes: data.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    addTransaction(transaction);
    setAlert(`${data.type === 'inbound' ? 'Inbound' : 'Outbound'} request sent successfully`, 'success');
    closeModal();
  };

  const handleBulkImport = (newTransactions: Transaction[]) => {
    newTransactions.forEach(transaction => addTransaction(transaction));
    setAlert(`Successfully sent ${newTransactions.length} requests`, 'success');
    setIsBulkModalOpen(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Orders</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <Plus className="h-5 w-5 mr-2" />
            Send Request
          </button>
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <Upload className="h-5 w-5 mr-2" />
            Send Bulk Request
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search orders by SKU or workflow number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
          className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Send Order Request"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Request Type</label>
            <select
              {...register('type', { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            >
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product</label>
            <Controller
              name="productId"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <SearchableSelect
                  options={productOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Search and select a product..."
                  className="mt-1"
                />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
            <input
              type="number"
              {...register('quantity', { required: true, min: 1 })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-md"
            >
              Send Request
            </button>
          </div>
        </form>
      </Modal>

      <BulkOrderModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImport={handleBulkImport}
        products={availableProducts}
      />

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Workflow Number
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Product
                  </th>
                  {!isVendor && (
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vendor
                    </th>
                  )}
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={isVendor ? 6 : 7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No orders found. Send a new request to get started.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const product = products.find(p => p.id === transaction.productId);
                    return (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.type === 'inbound' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {transaction.workflowNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          [{product?.sku}] {product?.name}
                        </td>
                        {!isVendor && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {product?.vendorNumber}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {transaction.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : transaction.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Orders;