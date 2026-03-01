import { Eye, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { type Transaction } from '../../services';
import { formatCurrency } from '../../utils';

interface TransactionTableProps {
    transactions: Transaction[];
    isLoading?: boolean;
    onView?: (transaction: Transaction) => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
    transactions,
    isLoading = false,
    onView,
}) => {
    if (isLoading) {
        return (
            <div className="text-center py-8">
                <div className="inline-block">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
                </div>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center text-gray-600">
                No transactions found
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-sm text-left">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                        <th className="px-6 py-3 font-semibold text-gray-600">ID</th>
                        <th className="px-6 py-3 font-semibold text-gray-600">User</th>
                        <th className="px-6 py-3 font-semibold text-gray-600">Amount</th>
                        <th className="px-6 py-3 font-semibold text-gray-600">Method</th>
                        <th className="px-6 py-3 font-semibold text-gray-600">Status</th>
                        <th className="px-6 py-3 font-semibold text-gray-600">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((t) => (
                        <tr
                            key={t.id}
                            className="border-b last:border-b-0 hover:bg-neutral-50 transition-colors"
                        >
                            <td className="px-6 py-4 font-mono text-xs text-gray-700">{t.id}</td>
                            <td className="px-6 py-4 font-medium text-gray-900">{t.user}</td>
                            <td className="px-6 py-4 font-semibold text-gray-900">
                                {formatCurrency(t.amount)}
                            </td>
                            <td className="px-6 py-4 text-gray-700 text-sm">{t.method}</td>
                            <td className="px-6 py-4">
                                <span
                                    className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${t.status === 'paid'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}
                                >
                                    {t.status === 'paid' ? (
                                        <CheckCircle className="w-4 h-4" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4" />
                                    )}
                                    {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                {onView && (
                                    <button
                                        className="p-2 rounded hover:bg-blue-50 transition flex items-center gap-2"
                                        onClick={() => onView(t)}
                                        title={t.userNote ? 'View details and note' : 'View details'}
                                    >
                                        <Eye className="w-4 h-4 text-blue-600" />
                                        {t.userNote && (
                                            <FileText className="w-4 h-4 text-amber-600" />
                                        )}
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TransactionTable;
