import React, { useState, useEffect, useCallback, useMemo } from 'react';
import TransactionTable from '../components/transactions/TransactionTable';
import TransactionModal from '../components/transactions/TransactionModal';
import { MainLayout, PageHeader } from '../components/layout';
import { transactionService, type Transaction } from '../services';
import { useModal } from '../hooks';

// Custom debounce hook
const useDebounce = <T,>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Memoized TransactionTable to prevent unnecessary re-renders
const MemoizedTransactionTable = React.memo(TransactionTable);

const Transactions = () => {
    // Data state
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // UI state (doesn't trigger table re-render)
    const [error, setError] = useState<string | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    
    // Filter state
    const [currentSearch, setCurrentSearch] = useState<string>('');
    const [currentStatus, setCurrentStatus] = useState<string>('');
    
    // Debounced search (500ms delay)
    const debouncedSearch = useDebounce(currentSearch, 500);
    
    const { isOpen: modalOpen, openModal, closeModal } = useModal();

    useEffect(() => {
        loadTransactions();
    }, []);

    // Only reload when debounced search or status changes
    useEffect(() => {
        loadTransactions();
    }, [debouncedSearch, currentStatus]);

    const loadTransactions = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await transactionService.fetchTransactions(
                1,
                100,
                currentStatus || undefined,
                debouncedSearch || undefined
            );
            setTransactions(response.data || []);
        } catch (err) {
            setError('Failed to load transactions. Please try again.');
            console.error('Load error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch, currentStatus]);

    const handleSearch = useCallback((value: string) => {
        setCurrentSearch(value);
    }, []);

    const handleStatusFilter = useCallback((value: string) => {
        setCurrentStatus(value);
    }, []);

    const handleViewTransaction = useCallback((transaction: Transaction) => {
        setSelectedTransaction(transaction);
        openModal();
    }, [openModal]);

    return (
        <MainLayout>
            <PageHeader
                title="Transactions"
                description="View and manage all payment transactions."
            />

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            <div className="mb-6 flex flex-col md:flex-row gap-3">
                <input
                    type="text"
                    placeholder="Search transaction ID or user..."
                    value={currentSearch || ''}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="flex-1 pl-4 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <select
                    value={currentStatus || ''}
                    onChange={(e) => handleStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                    <option value="">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                </select>
            </div>

            {/* Transactions Table - Memoized to prevent unnecessary re-renders */}
            <MemoizedTransactionTable
                transactions={transactions}
                isLoading={isLoading}
                onView={handleViewTransaction}
            />

            {modalOpen && selectedTransaction && (
                <TransactionModal
                    isOpen={modalOpen}
                    transaction={selectedTransaction}
                    onClose={closeModal}
                />
            )}
        </MainLayout>
    );
};

export default Transactions;
