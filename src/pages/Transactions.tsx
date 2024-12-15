import React, { useState, useMemo } from 'react';
import { ArrowDownCircle, ArrowUpCircle, CheckCircle, XCircle, Search, Upload, Edit, MoreVertical } from 'lucide-react';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import { useForm, Controller } from 'react-hook-form';
import { Transaction, Product } from '../types';
import { useInventoryStore, useAlertStore } from '../store';
import { useAuthStore } from '../store/auth';
import BulkTransactionModal from '../components/BulkTransactionModal';
import { generateWorkflowNumber } from '../utils/workflow';

interface TransactionFormData {
  productId: string;
  quantity: number;
  notes?: string;
}

function Transactions() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'inbound' | 'outbound'>('inbound');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, control } = useForm<TransactionFormData>();
  const { products, transactions, addTransaction, completeTransaction, updateTransaction } = useInventoryStore();
  const { setAlert } = useAlertStore();
  const { user } = useAuthStore();

  const productOptions = useMemo(() => 
    products.map(product => ({
      value: product.id,
      label: `[${product.sku}] ${product.name}`,
      description: `Stock: ${product.quantity} | Location: ${product.location}`
    })),
    [products]
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const product = products.find(p => p.id === transaction.productId);
      const searchString = `${product?.sku} ${product?.name} ${transaction.workflowNumber} ${product?.vendorNumber}`.toLowerCase();
      
      return (
        searchString.includes(searchTerm.toLowerCase()) &&
        (selectedStatus === 'all' || transaction.status === selectedStatus)
      );
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [transactions, products, searchTerm, selectedStatus]);

  const onSubmit = async (data: TransactionFormData) => {
    const workflowNumber = editingTransaction?.workflowNumber || generateWorkflowNumber(transactions);
    const transaction: Transaction = {
      id: editingTransaction?.id || crypto.randomUUID(),
      type: modalType,
      status: 'pending',
      workflowNumber,
      createdAt: editingTransaction?.createdAt || new Date(),
      updatedAt: new Date(),
      ...data
    };

    if (editingTransaction) {
      updateTransaction(transaction);
      setAlert('Workflow updated successfully', 'success');
    } else {
      const product = products.find(p => p.id === data.productId);
      if (modalType === 'outbound' && product && product.quantity < data.quantity) {
        setAlert('Insufficient inventory quantity', 'error');
        return;
      }
      addTransaction(transaction);
      setAlert(`${modalType === 'inbound' ? 'Inbound' : 'Outbound'} workflow created successfully`, 'success');
    }
    closeModal();
  };

  const handleBulkImport = (transactions: Transaction[]) => {
    transactions.forEach(transaction => addTransaction(transaction));
    setAlert(`Successfully imported ${transactions.length} workflows`, 'success');
    setIsBulkImportModalOpen(false);
  };

  const handleCompleteTransaction = (transaction: Transaction) => {
    completeTransaction(transaction);
    setAlert(`${transaction.type === 'inbound' ? 'Inbound' : 'Outbound'} workflow completed`, 'success');
  };

  const handleCancelTransaction = (transaction: Transaction) => {
    updateTransaction({
      ...transaction,
      status: 'cancelled',
      updatedAt: new Date()
    });
    setAlert(`${transaction.type === 'inbound' ? 'Inbound' : 'Outbound'} workflow cancelled`, 'warning');
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setModalType(transaction.type);
    setValue('productId', transaction.productId);
    setValue('quantity', transaction.quantity);
    setValue('notes', transaction.notes || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Workflow</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setModalType('inbound');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
          >
            <ArrowDownCircle className="h-5 w-5 mr-2" />
            New Inbound
          </button>
          <button
            onClick={() => {
              setModalType('outbound');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <ArrowUpCircle className="h-5 w-5 mr-2" />
            New Outbound
          </button>
          <button
            onClick={() => setIsBulkImportModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <Upload className="h-5 w-5 mr-2" />
            Bulk Import
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search workflows by SKU, workflow number, or vendor number..."
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
        title={`${editingTransaction ? 'Edit' : 'New'} ${modalType === 'inbound' ? 'Inbound' : 'Outbound'} Workflow`}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              {editingTransaction ? 'Update' : 'Create'} Workflow
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isBulkImportModalOpen}
        onClose={() => setIsBulkImportModalOpen(false)}
        title="Bulk Import Workflows"
      >
        <BulkTransactionModal
          onClose={() => setIsBulkImportModalOpen(false)}
          onImport={handleBulkImport}
          products={products}
        />
      </Modal>

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
                    SKU
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Vendor Number
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No workflows found. Create a new inbound or outbound workflow to get started.
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
                          {product?.sku || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {product?.vendorNumber || 'N/A'}
                        </td>
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
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() => setOpenActionMenu(openActionMenu === transaction.id ? null : transaction.id)}
                              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>

                            {openActionMenu === transaction.id && transaction.status === 'pending' && (
                              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-10">
                                <div className="py-1" role="menu">
                                  <button
                                    onClick={() => {
                                      openEditModal(transaction);
                                      setOpenActionMenu(null);
                                    }}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleCompleteTransaction(transaction);
                                      setOpenActionMenu(null);
                                    }}
                                    className="flex items-center px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Complete
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleCancelTransaction(transaction);
                                      setOpenActionMenu(null);
                                    }}
                                    className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
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

export default Transactions;