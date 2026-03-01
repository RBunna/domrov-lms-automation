import { useState, useEffect } from 'react';
import TransactionTable from '../components/transactions/TransactionTable';
import TransactionModal from '../components/transactions/TransactionModal';
import { MainLayout, PageHeader } from '../components/layout';
import { transactionService, type Transaction } from '../services';
import { useFilter, useModal } from '../hooks';

const Transactions = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { isOpen: modalOpen, openModal, closeModal } = useModal();

    const { filters, filteredData, setFilter } = useFilter(transactions, [
        'user',
        'id',
    ]);

    useEffect(() => {
        loadTransactions();
    }, []);

    useEffect(() => {
        // Reload when filters change
        loadTransactions();
    }, [filters.status, filters.search]);

    const loadTransactions = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await transactionService.fetchTransactions(
                1,
                100,
                (filters.status as string) || undefined,
                (filters.search as string) || undefined
            );
            setTransactions(response.data || []);
        } catch (err) {
            setError('Failed to load transactions. Please try again.');
            console.error('Load error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewTransaction = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        openModal();
    };

    const handleVerifyTransaction = async (id: string | number, note?: string) => {
        try {
            setError(null);
            await transactionService.verifyTransaction(id, note);
            await loadTransactions();
            closeModal();
        } catch (err) {
            setError('Failed to verify transaction. Please try again.');
            console.error('Verify error:', err);
        }
    };

    const handleFailTransaction = async (id: string | number, reason?: string, note?: string) => {
        try {
            setError(null);
            await transactionService.failTransaction(id, reason || 'Rejected by admin', note);
            await loadTransactions();
            closeModal();
        } catch (err) {
            setError('Failed to update transaction. Please try again.');
            console.error('Fail error:', err);
        }
    };

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
                    value={(filters.search as string) || ''}
                    onChange={(e) => setFilter('search', e.target.value)}
                    className="flex-1 pl-4 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <select
                    value={(filters.status as string) || ''}
                    onChange={(e) => setFilter('status', e.target.value)}
                    className="px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                    <option value="">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                </select>
            </div>

            <TransactionTable
                transactions={filteredData}
                isLoading={isLoading}
                onView={handleViewTransaction}
            />

            {modalOpen && selectedTransaction && (
                <TransactionModal
                    isOpen={modalOpen}
                    transaction={selectedTransaction}
                    onClose={closeModal}
                    onVerify={handleVerifyTransaction}
                    onFail={handleFailTransaction}
                />
            )}
        </MainLayout>
    );
};

export default Transactions;
