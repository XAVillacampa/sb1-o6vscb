import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Upload,
  Download,
  Edit,
  Trash2,
  CheckCircle,
  MoreVertical,
} from "lucide-react";
import Modal from "../components/Modal";
import SearchableSelect from "../components/SearchableSelect";
import { useForm, Controller } from "react-hook-form";
import { Billing, BillingStatus } from "../types";
import { useBillingStore } from "../store/billing";
import { useInventoryStore, useAlertStore } from "../store";
import { useAuthStore } from "../store/auth";
import BulkBillingModal from "../components/BulkBillingModal";

interface BillingFormData {
  invoiceNumber: string;
  vendorNumber: string;
  amount: number;
  dueDate: string;
  notes?: string;
}

function Billings() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [editingBilling, setEditingBilling] = useState<Billing | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<BillingStatus | "all">(
    "all"
  );

  const { register, handleSubmit, reset, control } = useForm<BillingFormData>();
  const { billings, addBilling, updateBilling, deleteBilling, markAsPaid } =
    useBillingStore();
  const { products } = useInventoryStore();
  const { user, getAllowedVendorNumbers } = useAuthStore();
  const { setAlert } = useAlertStore();

  const allowedVendorNumbers = getAllowedVendorNumbers(user);
  const canEdit = user?.role !== "vendor";
  const menuRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpenActionMenu(null);
      }
    };

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenActionMenu(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setOpenActionMenu]);

  // Get unique vendor numbers from products
  const vendorOptions = useMemo(() => {
    const uniqueVendors = new Set(products.map((p) => p.vendorNumber));
    return Array.from(uniqueVendors).map((vendor) => ({
      value: vendor,
      label: vendor,
    }));
  }, [products]);

  const filteredBillings = useMemo(() => {
    return billings
      .filter((billing) => {
        // Filter by vendor access
        if (user?.role === "vendor" && !allowedVendorNumbers.includes("ALL")) {
          if (!allowedVendorNumbers.includes(billing.vendorNumber)) {
            return false;
          }
        }

        // Filter by status
        if (selectedStatus !== "all" && billing.status !== selectedStatus) {
          return false;
        }

        // Filter by search term
        const searchString =
          `${billing.invoiceNumber} ${billing.vendorNumber}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [billings, searchTerm, selectedStatus, user, allowedVendorNumbers]);

  const onSubmit = async (data: BillingFormData) => {
    if (editingBilling) {
      const updatedBilling: Billing = {
        ...editingBilling,
        ...data,
        amount: Number(data.amount),
        dueDate: new Date(data.dueDate),
        updatedAt: new Date(),
      };
      updateBilling(updatedBilling);
      setAlert("Billing updated successfully", "success");
    } else {
      const newBilling: Billing = {
        id: crypto.randomUUID(),
        ...data,
        amount: Number(data.amount),
        status: "pending",
        dueDate: new Date(data.dueDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addBilling(newBilling);
      setAlert("Billing created successfully", "success");
    }
    closeModal();
  };

  const handleBulkImport = (billings: Billing[]) => {
    billings.forEach((billing) => addBilling(billing));
    setAlert(`Successfully imported ${billings.length} billings`, "success");
    setIsBulkImportModalOpen(false);
  };

  const handleDeleteBilling = (billingId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this billing? This action cannot be undone."
      )
    ) {
      deleteBilling(billingId);
      setAlert("Billing deleted successfully", "success");
    }
  };

  const handleMarkAsPaid = (billingId: string) => {
    markAsPaid(billingId);
    setAlert("Billing marked as paid", "success");
  };

  const openEditModal = (billing: Billing) => {
    setEditingBilling(billing);
    reset({
      invoiceNumber: billing.invoiceNumber,
      vendorNumber: billing.vendorNumber,
      amount: billing.amount,
      dueDate: new Date(billing.dueDate).toISOString().split("T")[0],
      notes: billing.notes,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBilling(null);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Billing
        </h1>
        {canEdit && (
          <div className="flex space-x-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Billing
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

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by invoice number or vendor number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) =>
            setSelectedStatus(e.target.value as BillingStatus | "all")
          }
          className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingBilling ? "Edit Billing" : "New Billing"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Invoice Number
            </label>
            <input
              type="text"
              {...register("invoiceNumber", { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>
          {!editingBilling && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Vendor Number
              </label>
              <Controller
                name="vendorNumber"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <SearchableSelect
                    options={vendorOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Search and select a vendor..."
                    className="mt-1"
                  />
                )}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              {...register("amount", { required: true, min: 0 })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Due Date
            </label>
            <input
              type="date"
              {...register("dueDate", { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes
            </label>
            <textarea
              {...register("notes")}
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
              {editingBilling ? "Update" : "Create"} Billing
            </button>
          </div>
        </form>
      </Modal>

      <BulkBillingModal
        isOpen={isBulkImportModalOpen}
        onClose={() => setIsBulkImportModalOpen(false)}
        onImport={handleBulkImport}
        allowedVendorNumbers={allowedVendorNumbers}
      />

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Invoice Number
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Vendor Number
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredBillings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No billings found
                    </td>
                  </tr>
                ) : (
                  filteredBillings.map((billing) => (
                    <tr key={billing.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {billing.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {billing.vendorNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            billing.status === "draft"
                              ? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                              : billing.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : billing.status === "paid"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : billing.status === "overdue"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          }`}
                        >
                          {billing.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(billing.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        ${billing.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() =>
                              setOpenActionMenu(
                                openActionMenu === billing.id
                                  ? null
                                  : billing.id
                              )
                            }
                            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>
                        </div>
                        {openActionMenu === billing.id && (
                          <div
                            ref={menuRef}
                            className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-10"
                          >
                            <div className="py-1" role="menu">
                              <button
                                onClick={() => {
                                  window.open(
                                    `/api/billings/${billing.id}/download`,
                                    "_blank"
                                  );
                                  setOpenActionMenu(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </button>
                              {canEdit &&
                                billing.status !== "paid" &&
                                billing.status !== "cancelled" && (
                                  <>
                                    <button
                                      onClick={() => {
                                        openEditModal(billing);
                                        setOpenActionMenu(null);
                                      }}
                                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleMarkAsPaid(billing.id);
                                        setOpenActionMenu(null);
                                      }}
                                      className="flex items-center px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Mark as Paid
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleDeleteBilling(billing.id);
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

export default Billings;
