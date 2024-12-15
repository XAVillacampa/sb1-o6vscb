import { Transaction } from '../types';

export const generateWorkflowNumber = (transactions: Transaction[]): string => {
  const date = new Date();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  const prefix = `WF${month}${year}-`;

  // Get all workflow numbers for the current month
  const currentMonthWorkflows = transactions
    .filter(t => t.workflowNumber?.startsWith(prefix))
    .map(t => parseInt(t.workflowNumber?.split('-')[1] || '0'));

  // Find the highest number and increment
  const highestNumber = Math.max(0, ...currentMonthWorkflows);
  const nextNumber = (highestNumber + 1).toString().padStart(3, '0');

  return `${prefix}${nextNumber}`;
};