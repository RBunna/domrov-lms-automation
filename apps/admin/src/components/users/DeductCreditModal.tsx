import React, { useState } from 'react';
import { BaseModal, BaseButton, BaseInput } from '../base';
import { type User } from '../../services';

interface DeductCreditModalProps {
    isOpen: boolean;
    user: User;
    onClose: () => void;
    onSave: (amount: number) => void;
    isSubmitting: boolean;
}

const DeductCreditModal: React.FC<DeductCreditModalProps> = ({ isOpen, user, onClose, onSave, isSubmitting }) => {
    const [amount, setAmount] = useState('');
    const numAmount = amount ? parseFloat(amount) : 0;
    const isValid = numAmount > 0;

    const handleSave = () => {
        if (isValid) {
            onSave(numAmount);
            setAmount('');
        }
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Deduct Credit"
            size="sm"
            footer={
                <div className="flex gap-2 justify-end">
                    <BaseButton variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </BaseButton>
                    <BaseButton
                        variant="primary"
                        onClick={handleSave}
                        isLoading={isSubmitting}
                        disabled={!isValid}
                    >
                        Deduct Credit
                    </BaseButton>
                </div>
            }
        >
            <div className="space-y-4">
                <div>
                    <p className="text-sm text-gray-600 mb-3">
                        User: <strong>{user.firstName} {user.lastName}</strong>
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                        Email: <strong>{user.email}</strong>
                    </p>
                </div>
                <BaseInput
                    label="Amount to Deduct"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter positive amount"
                    min="0"
                    step="0.01"
                />
                {amount && numAmount > 0 && (
                    <div className={`p-3 rounded border ${isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <p className={`text-sm ${isValid ? 'text-green-900' : 'text-red-900'}`}>
                            Credits to Deduct: <strong>{amount}</strong>
                        </p>
                    </div>
                )}
            </div>
        </BaseModal>
    );
};

export default DeductCreditModal;