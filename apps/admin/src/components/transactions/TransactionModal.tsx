import React, { useState } from 'react';
import { CheckCircle, Image as ImageIcon, X, Search, Check, AlertCircle } from 'lucide-react';
import { BaseModal, BaseButton, BaseInput } from '../base';
import { type Transaction } from '../../services';
import { apiClient } from '../../services/api';
import { formatCurrency } from '../../utils';

interface TransactionModalProps {
    isOpen: boolean;
    transaction: Transaction | null;
    onClose: () => void;
    onVerify: (id: number, note?: string) => Promise<void>;
    onFail: (id: number, note?: string) => Promise<void>;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
    isOpen,
    transaction,
    onClose,
    onVerify,
    onFail,
}) => {
    const [verificationNote, setVerificationNote] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [fullscreenImage, setFullscreenImage] = useState(false);
    const [hashInput, setHashInput] = useState('');
    const [amountInput, setAmountInput] = useState('');
    const [paymentData, setPaymentData] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);

    const handleVerify = async () => {
        if (!transaction) return;
        try {
            setIsProcessing(true);
            await onVerify(transaction.id, verificationNote || undefined);
            setVerificationNote('');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFail = async () => {
        if (!transaction) return;
        try {
            setIsProcessing(true);
            await onFail(transaction.id, verificationNote || undefined);
            setVerificationNote('');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        setVerificationNote('');
        setImageError(false);
        setFullscreenImage(false);
        setHashInput('');
        setAmountInput('');
        setPaymentData(null);
        onClose();
    };

    const handleSearchPayment = async () => {
        if (!hashInput || !amountInput || !transaction) return;
        try {
            setIsSearching(true);
            // Call real backend API to verify the payment
            const response = await apiClient.transactions.verifyByHash(
                hashInput,
                parseFloat(amountInput),
                transaction.userId,
            );

            // Set payment data to show the verification result
            setPaymentData({
                status: response.message || 'Verified',
                hash: hashInput,
                amount: amountInput,
                currency: transaction.currency,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Search error:', error);
            setPaymentData({
                status: 'Failed',
                error: error instanceof Error ? error.message : 'Verification failed',
                hash: hashInput,
                amount: amountInput,
            });
        } finally {
            setIsSearching(false);
        }
    };

    if (!transaction) return null;

    // Full-screen image verification view
    if (fullscreenImage && transaction.proofImageUrl && !imageError) {
        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                onClick={() => setFullscreenImage(false)}
            >
                <div
                    className="bg-white rounded-lg w-[95vw] h-[75vh] max-w-7xl shadow-2xl flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-neutral-200 bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-900">Verify Payment - {transaction.id}</h3>
                        <button
                            onClick={() => setFullscreenImage(false)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content Grid */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* Left Column - Transaction Image */}
                        <div className="w-1/2 border-r border-neutral-200 p-3 flex flex-col bg-gray-50 overflow-hidden">
                            <div className="text-xs font-semibold text-gray-600 uppercase mb-1 flex-shrink-0">
                                Transaction Proof
                            </div>
                            <div className="flex-1 w-full flex items-center justify-center overflow-auto">
                                <img
                                    src={transaction.proofImageUrl}
                                    alt="Transaction proof"
                                    className="w-full h-full object-contain rounded-lg shadow-md"
                                />
                            </div>
                        </div>

                        {/* Right Column - Verification Form */}
                        <div className="w-1/2 p-6 overflow-y-auto flex flex-col space-y-6">
                            {/* Search Section */}
                            <div className="flex-shrink-0">
                                <p className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Transaction Hash Verification</p>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 uppercase mb-2 block">
                                            Transaction Hash / ID
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter transaction hash..."
                                            value={hashInput}
                                            onChange={(e) => setHashInput(e.target.value)}
                                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 uppercase mb-2 block">
                                            Amount
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Enter amount..."
                                            value={amountInput}
                                            onChange={(e) => setAmountInput(e.target.value)}
                                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSearchPayment}
                                        disabled={!hashInput || !amountInput || isSearching}
                                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition flex items-center justify-center gap-2 font-medium text-sm"
                                    >
                                        <Search className="w-4 h-4" />
                                        {isSearching ? 'Searching...' : 'Verify Transaction'}
                                    </button>
                                </div>
                            </div>

                            {/* Payment Details */}
                            {paymentData && (
                                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-4 overflow-y-auto">
                                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-blue-200">
                                        {paymentData.status === 'Success' ? (
                                            <>
                                                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                                <span className="text-sm font-semibold text-green-700">{paymentData.status}</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                                <span className="text-sm font-semibold text-red-700">{paymentData.status}</span>
                                            </>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start gap-4">
                                            <span className="text-sm text-gray-600 font-medium min-w-fit">Sender Account</span>
                                            <span className="text-sm text-gray-900 font-medium text-right">{paymentData.senderAccountId}</span>
                                        </div>
                                        <div className="flex justify-between items-start gap-4">
                                            <span className="text-sm text-gray-600 font-medium min-w-fit">Recipient Account</span>
                                            <span className="text-sm text-gray-900 font-medium text-right">{paymentData.recipientAccountId}</span>
                                        </div>
                                        <div className="flex justify-between items-start gap-4">
                                            <span className="text-sm text-gray-600 font-medium min-w-fit">Amount</span>
                                            <span className="text-sm text-gray-900 font-semibold text-right">${paymentData.amount} {paymentData.currency}</span>
                                        </div>
                                        <div className="flex justify-between items-start gap-4">
                                            <span className="text-sm text-gray-600 font-medium min-w-fit">Description</span>
                                            <span className="text-sm text-gray-900 font-medium text-right break-words">{paymentData.description}</span>
                                        </div>
                                        <div className="flex justify-between items-start gap-4">
                                            <span className="text-sm text-gray-600 font-medium min-w-fit">Transaction Date</span>
                                            <span className="text-xs text-gray-900 font-medium text-right">{paymentData.transactionDate}</span>
                                        </div>
                                        <div className="flex justify-between items-start gap-4 pt-3 border-t border-blue-200">
                                            <span className="text-sm text-gray-600 font-medium min-w-fit">Status</span>
                                            <span className="text-sm text-green-700 font-semibold">{paymentData.trackingStatus}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!paymentData && (
                                <div className="flex-1 flex items-center justify-center text-center text-gray-400">
                                    <p className="text-sm">Enter hash and amount to verify transaction details</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const statusColor: Record<string, string> = {
        paid: 'text-green-600 bg-green-50 border-green-200',
        unpaid: 'text-red-600 bg-red-50 border-red-200',
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={handleClose}
            title={`Transaction ${transaction.id}`}
            size="lg"
            footer={
                transaction.status === 'unpaid' ? (
                    <>
                        <BaseButton
                            variant="secondary"
                            onClick={handleClose}
                            disabled={isProcessing}
                        >
                            Cancel
                        </BaseButton>
                        <BaseButton
                            variant="secondary"
                            onClick={handleFail}
                            isLoading={isProcessing}
                        >
                            Reject Payment
                        </BaseButton>
                        <BaseButton
                            variant="primary"
                            onClick={handleVerify}
                            isLoading={isProcessing}
                        >
                            Mark as Paid
                        </BaseButton>
                    </>
                ) : (
                    <BaseButton variant="secondary" onClick={handleClose}>
                        Close
                    </BaseButton>
                )
            }
        >
            <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Transaction Header */}
                    <div className="pb-6 border-b border-neutral-200">
                        <div className="mb-4">
                            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                                Amount
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(transaction.amount)} {transaction.method}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                                Status
                            </p>
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${statusColor[transaction.status]}`}>
                                <span className="font-medium capitalize text-sm">
                                    {transaction.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                                User
                            </p>
                            <p className="text-gray-900 font-medium">{transaction.user}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                                Date
                            </p>
                            <p className="text-gray-700">{transaction.date}</p>
                        </div>
                    </div>

                    {/* User Note */}
                    {transaction.userNote && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-xs font-semibold text-blue-600 uppercase mb-2">
                                User Note
                            </p>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                {transaction.userNote}
                            </p>
                        </div>
                    )}

                    {/* Verification Status */}
                    {transaction.status === 'paid' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-green-700">
                                    Transaction verified - Status: Paid
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Proof Image */}
                    {transaction.proofImageUrl && (
                        <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase mb-3">
                                Transaction Proof
                            </p>
                            <div className="relative bg-gray-100 rounded-lg overflow-hidden border border-neutral-200 group">
                                {!imageError ? (
                                    <>
                                        <img
                                            src={transaction.proofImageUrl}
                                            alt="Transaction proof"
                                            className="w-full h-auto object-contain cursor-pointer group-hover:opacity-90 transition-opacity"
                                            onError={() => setImageError(true)}
                                            onClick={() => setFullscreenImage(true)}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none">
                                            <div className="bg-black/60 text-white px-3 py-1.5 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                Click to view larger
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-48 bg-gray-50 text-gray-400">
                                        <div className="text-center">
                                            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Image unavailable</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Verification Section */}
                    {transaction.status === 'unpaid' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-xs font-semibold text-yellow-700 uppercase mb-3">
                                Verification Notes
                            </p>
                            <BaseInput
                                placeholder="Add notes for verification (optional)"
                                value={verificationNote}
                                onChange={(e) => setVerificationNote(e.target.value)}
                                className="mb-3"
                                maxLength={500}
                            />
                            <p className="text-xs text-gray-600">
                                {verificationNote.length}/500
                            </p>
                        </div>
                    )}

                    {/* Verification Note */}
                    {transaction.verificationNote && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <p className="text-xs font-semibold text-purple-600 uppercase mb-2">
                                Verification Note
                            </p>
                            <p className="text-gray-700 text-sm">{transaction.verificationNote}</p>
                        </div>
                    )}
                </div>
            </div>
        </BaseModal>
    );
};

export default TransactionModal;
