import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, Download } from 'lucide-react';
import { parseTransactionCSV, validateTransactions } from '../utils/transactionCsv';
import { Transaction, Product } from '../types';

interface BulkTransactionModalProps {
  onClose: () => void;
  onImport: (transactions: Transaction[]) => void;
  products: Product[];
}

function BulkTransactionModal({ onClose, onImport, products }: BulkTransactionModalProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedType, setSelectedType] = useState<'inbound' | 'outbound'>('inbound');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      const transactions = parseTransactionCSV(text, selectedType, products);
      
      // Validate transactions
      const validationErrors = validateTransactions(transactions, products, selectedType);

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      onImport(transactions);
      onClose();
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
    const headers = [
      'SKU',
      'Quantity',
      'ReferenceNumber',
      'HandlerName',
      'Notes'
    ].join(',');

    const exampleData = products.slice(0, 2).map(product => 
      [
        product.sku,
        '100',
        selectedType === 'inbound' ? 'PO123456' : 'SO123456',
        'John Doe',
        'Sample notes'
      ].join(',')
    ).join('\n');

    const content = `${headers}\n${exampleData}`;
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedType}_workflow_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Bulk Import Workflows
        </h3>
        <button
          onClick={downloadTemplate}
          className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
        >
          <Download className="h-4 w-4 mr-1" />
          Download Template
        </button>
      </div>

      <div className="flex justify-center space-x-4 mb-4">
        <label className="inline-flex items-center">
          <input
            type="radio"
            className="form-radio text-indigo-600 dark:text-indigo-400"
            name="type"
            value="inbound"
            checked={selectedType === 'inbound'}
            onChange={(e) => setSelectedType(e.target.value as 'inbound' | 'outbound')}
          />
          <span className="ml-2 text-gray-700 dark:text-gray-300">Inbound</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            className="form-radio text-indigo-600 dark:text-indigo-400"
            name="type"
            value="outbound"
            checked={selectedType === 'outbound'}
            onChange={(e) => setSelectedType(e.target.value as 'inbound' | 'outbound')}
          />
          <span className="ml-2 text-gray-700 dark:text-gray-300">Outbound</span>
        </label>
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
  );
}

export default BulkTransactionModal;