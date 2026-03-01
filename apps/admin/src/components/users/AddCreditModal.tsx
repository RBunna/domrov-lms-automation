import React, { useState } from 'react';
import { BaseModal, BaseButton, BaseInput } from '../base';
import { type User } from '../../services';

interface AddCreditModalProps {
    isOpen: boolean;
    user: User;
    onClose: () => void;
    onSave: (amount: number) => void;
    isSubmitting: boolean;
}

const AddCreditModal: React.FC<AddCreditModalProps> = ({ isOpen, user, onClose, onSave, isSubmitting }) => {
    const [amount, setAmount] = useState('');

    const handleSave = () => {
        const numAmount = parseFloat(amount);
        if (numAmount && numAmount > 0) {
            onSave(numAmount);
            setAmount('');
        }
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Credit"
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
                        disabled={!amount || parseFloat(amount) <= 0}
                    >
                        Add Credit
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
                    label="Amount to Add"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter positive amount"
                    min="0"
                    step="0.01"
                />
                {amount && parseFloat(amount) > 0 && (
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm text-blue-900">
                            Credits to Add: <strong>{amount}</strong>
                        </p>
                    </div>
                )}
            </div>
        </BaseModal>
    );
};

export default AddCreditModal;