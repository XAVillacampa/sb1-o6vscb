import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Upload, MoreVertical, History } from 'lucide-react';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import { Product } from '../types';
import { useInventoryStore, useAlertStore } from '../store';
import { useAuthStore } from '../store/auth';
import BulkImportModal from '../components/BulkImportModal';
import LogChangesModal from '../components/LogChangesModal';
import { validateSku } from '../utils/validation';

interface ProductFormData {
  sku: string;
  name: string;
  quantity: number;
  minStockLevel: number;
  location: string;
  vendorNumber: string;
  weight: number;
  height: number;
  length: number;
  width: number;
  unitCbm: number;
}

function Products() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [isLogChangesModalOpen, setIsLogChangesModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNames, setExpandedNames] = useState<Set<string>>(new Set());
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, setValue, watch } = useForm<ProductFormData>();
  const { products, addProduct, updateProduct, deleteProduct } = useInventoryStore();
  const { user, getAllowedVendorNumbers } = useAuthStore();
  const { setAlert } = useAlertStore();

  const allowedVendorNumbers = getAllowedVendorNumbers(user);
  const canEdit = user?.role !== 'vendor';

  // Watch quantity and unit CBM for total CBM calculation
  const quantity = watch('quantity') || 0;
  const unitCbm = watch('unitCbm') || 0;
  const totalCBM = quantity * unitCbm;

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Filter by vendor number for vendor users
      if (user?.role === 'vendor' && !allowedVendorNumbers.includes('ALL')) {
        if (!allowedVendorNumbers.includes(product.vendorNumber)) {
          return false;
        }
      }

      const searchString = `${product.sku} ${product.name} ${product.location} ${product.vendorNumber}`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    });
  }, [products, searchTerm, user, allowedVendorNumbers]);

  const onSubmit = (data: ProductFormData) => {
    // Validate SKU uniqueness
    const skuError = validateSku(data.sku, products, editingProduct?.id);
    if (skuError) {
      setAlert(skuError, 'error');
      return;
    }

    // Validate vendor number
    if (!allowedVendorNumbers.includes('ALL') && !allowedVendorNumbers.includes(data.vendorNumber)) {
      setAlert('Invalid vendor number for your account', 'error');
      return;
    }

    if (editingProduct) {
      const updatedProduct: Product = {
        ...editingProduct,
        ...data,
        unitCbm: Number(data.unitCbm),
        cbm: Number(data.unitCbm) * data.quantity,
        updatedAt: new Date()
      };
      updateProduct(updatedProduct);
      setAlert('Product updated successfully', 'success');
    } else {
      const newProduct: Product = {
        id: crypto.randomUUID(),
        ...data,
        unitCbm: Number(data.unitCbm),
        cbm: Number(data.unitCbm) * data.quantity,
        unitOfMeasurement: 'units',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      addProduct(newProduct);
      setAlert('Product added successfully', 'success');
    }
    closeModal();
  };

  const handleBulkImport = (products: Product[], isUpdate: boolean) => {
    if (isUpdate) {
      products.forEach(product => updateProduct(product));
      setAlert(`Successfully updated ${products.length} products`, 'success');
    } else {
      products.forEach(product => addProduct(product));
      setAlert(`Successfully imported ${products.length} new products`, 'success');
    }
    setIsBulkImportModalOpen(false);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    Object.keys(product).forEach(key => {
      if (key in product) {
        setValue(key as keyof ProductFormData, product[key as keyof Product]);
      }
    });
    setIsModalOpen(true);
  };

  const openLogChanges = (product: Product) => {
    setSelectedProduct(product);
    setIsLogChangesModalOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    deleteProduct(productId);
    setAlert('Product deleted successfully', 'success');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    reset();
  };

  const toggleNameExpansion = (productId: string) => {
    const newExpanded = new Set(expandedNames);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedNames(newExpanded);
  };

  const truncateName = (name: string, productId: string) => {
    if (!name) return '';
    if (expandedNames.has(productId)) return name;
    return name.length > 30 ? `${name.substring(0, 30)}...` : name;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Inventory</h1>
        {canEdit && (
          <div className="flex space-x-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Product
            </button>
            <button
              onClick={() => setIsBulkImportModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Upload className="h-5 w-5 mr-2" />
              Bulk Import
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Search products by SKU, name, location, or vendor number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingProduct ? "Edit Product" : "Add New Product"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SKU</label>
            <input
              type="text"
              {...register('sku', { required: true })}
              disabled={!!editingProduct}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <input
              type="text"
              {...register('name', { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
              <input
                type="number"
                {...register('quantity', { required: true, min: 0 })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Min Stock Level</label>
              <input
                type="number"
                {...register('minStockLevel', { required: true, min: 0 })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
            <input
              type="text"
              {...register('location', { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vendor Number</label>
            <input
              type="text"
              {...register('vendorNumber', { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weight (lbs)</label>
            <input
              type="number"
              step="0.01"
              {...register('weight', { required: true, min: 0 })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Length (in)</label>
              <input
                type="number"
                step="0.1"
                {...register('length', { required: true, min: 0 })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Width (in)</label>
              <input
                type="number"
                step="0.1"
                {...register('width', { required: true, min: 0 })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Height (in)</label>
              <input
                type="number"
                step="0.1"
                {...register('height', { required: true, min: 0 })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unit CBM</label>
            <input
              type="number"
              step="0.001"
              {...register('unitCbm', { required: true, min: 0 })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Total CBM: <span className="font-medium">{totalCBM.toFixed(3)}</span> m³
            </p>
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
              {editingProduct ? 'Update' : 'Add'} Product
            </button>
          </div>
        </form>
      </Modal>

      {canEdit && (
        <Modal
          isOpen={isBulkImportModalOpen}
          onClose={() => setIsBulkImportModalOpen(false)}
          title="Bulk Import Products"
        >
          <BulkImportModal
            onClose={() => setIsBulkImportModalOpen(false)}
            onImport={handleBulkImport}
            existingProducts={products}
            allowedVendorNumbers={allowedVendorNumbers}
          />
        </Modal>
      )}

      <LogChangesModal
        isOpen={isLogChangesModalOpen}
        onClose={() => {
          setIsLogChangesModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Vendor Number
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No products found. {canEdit && 'Click "Add Product" to create one.'}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <button
                          onClick={() => toggleNameExpansion(product.id)}
                          className="text-left hover:text-gray-900 dark:hover:text-white"
                        >
                          {truncateName(product.name, product.id)}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {product.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {product.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {product.vendorNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setOpenActionMenu(openActionMenu === product.id ? null : product.id)}
                            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>

                          {openActionMenu === product.id && (
                            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-10">
                              <div className="py-1" role="menu">
                                <button
                                  onClick={() => {
                                    openLogChanges(product);
                                    setOpenActionMenu(null);
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                                >
                                  <History className="h-4 w-4 mr-2" />
                                  View Log Changes
                                </button>
                                {canEdit && (
                                  <>
                                    <button
                                      onClick={() => {
                                        openEditModal(product);
                                        setOpenActionMenu(null);
                                      }}
                                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                                    >
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleDeleteProduct(product.id);
                                        setOpenActionMenu(null);
                                      }}
                                      className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Products;