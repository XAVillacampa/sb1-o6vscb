import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, Download } from 'lucide-react';
import Modal from './Modal';
import { Billing } from '../types';

interface BulkBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (billings: Billing[]) => void;
  allowedVendorNumbers: string[];
}

function BulkBillingModal({ isOpen, onClose, onImport, allowedVendorNumbers }: BulkBillingModalProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      
      const billings: Billing[] = [];
      const errors: string[] = [];

      lines.slice(1).forEach((line, index) => {
        if (!line.trim()) return;

        const values = line.split(',').map(v => v.trim());
        const lineNumber = index + 2;

        const data: any = {};
        headers.forEach((header, i) => {
          data[header] = values[i];
        });

        // Validate required fields
        if (!data.invoicenumber) {
          errors.push(`Line ${lineNumber}: Invoice number is required`);
          return;
        }
        if (!data.vendornumber) {
          errors.push(`Line ${lineNumber}: Vendor number is required`);
          return;
        }
        if (!data.amount || isNaN(data.amount) || Number(data.amount) <= 0) {
          errors.push(`Line ${lineNumber}: Amount must be a positive number`);
          return;
        }
        if (!data.duedate || isNaN(new Date(data.duedate).getTime())) {
          errors.push(`Line ${lineNumber}: Due date is invalid or missing`);
          return;
        }

        // Validate vendor number access
        if (!allowedVendorNumbers.includes('ALL') && !allowedVendorNumbers.includes(data.vendornumber)) {
          errors.push(`Line ${lineNumber}: Unauthorized vendor number "${data.vendornumber}"`);
          return;
        }

        billings.push({
          id: crypto.randomUUID(),
          invoiceNumber: data.invoicenumber,
          vendorNumber: data.vendornumber,
          amount: Number(data.amount),
          dueDate: new Date(data.duedate),
          status: 'pending',
          notes: data.notes || '',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      if (errors.length > 0) {
        setErrors(errors);
        return;
      }

      onImport(billings);
    } catch (error) {
      setErrors(['Failed to parse CSV file. Please check the format and try again.']);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      handleFile(file);
    } else {
      setErrors(['Please upload a CSV file']);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const downloadTemplate = () => {
    const headers = ['InvoiceNumber', 'VendorNumber', 'Amount', 'DueDate', 'Notes'].join(',');
    const exampleData = [
      'INV-001,V001,1000.00,2024-12-31,Sample billing 1',
      'INV-002,V002,2500.50,2024-12-31,Sample billing 2'
    ].join('\n');

    const content = `${headers}\n${exampleData}`;
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bulk_billing_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Import Billings">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a CSV file with your billing records
          </p>
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
          >
            <Download className="h-4 w-4 mr-1" />
            Download Template
          </button>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            isDragging 
              ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/50' 
              : 'border-gray-300 dark:border-gray-600'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            accept=".csv"
            className="hidden"
          />
          <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Drag and drop your CSV file here, or click to select a file
          </p>
        </div>

        {errors.length > 0 && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-300" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Import failed with the following errors:
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <ul className="list-disc pl-5 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default BulkBillingModal;