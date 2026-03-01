import React from 'react';
import { BaseModal, BaseButton } from '../base';
import { Lock, Unlock } from 'lucide-react';
import { type User } from '../../services';

interface StatusToggleModalProps {
    isOpen: boolean;
    user: User;
    onClose: () => void;
    onConfirm: () => void;
    isSubmitting: boolean;
}

const StatusToggleModal: React.FC<StatusToggleModalProps> = ({ isOpen, user, onClose, onConfirm, isSubmitting }) => {
    const isActive = user.status === 'ACTIVE';
    const newStatus = isActive ? 'SUSPENDED' : 'ACTIVE';
    const Icon = isActive ? Lock : Unlock;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title={isActive ? 'Disable Account' : 'Enable Account'}
            size="sm"
            footer={
                <div className="flex gap-2 justify-end">
                    <BaseButton variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </BaseButton>
                    <BaseButton
                        variant={isActive ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        isLoading={isSubmitting}
                    >
                        {isActive ? 'Disable Account' : 'Enable Account'}
                    </BaseButton>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="flex gap-3 items-start">
                    <Icon className={`w-8 h-8 mt-1 ${isActive ? 'text-red-600' : 'text-green-600'}`} />
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                            {isActive ? 'Disable this account?' : 'Enable this account?'}
                        </h3>
                        <p className="text-sm text-gray-600">
                            {isActive
                                ? `This will suspend ${user.firstName} ${user.lastName} from accessing the system. Their data will not be deleted.`
                                : `This will reactivate ${user.firstName} ${user.lastName} to access the system again.`}
                        </p>
                    </div>
                </div>
                <div className="p-3 bg-neutral-50 rounded border border-neutral-200">
                    <p className="text-xs font-medium text-gray-700">User: <strong>{user.firstName} {user.lastName}</strong></p>
                    <p className="text-xs text-gray-600">Current Status: <strong className="capitalize">{user.status}</strong></p>
                    <p className="text-xs text-gray-600">New Status: <strong className="capitalize text-blue-600">{newStatus}</strong></p>
                </div>
            </div>
        </BaseModal>
    );
};

export default StatusToggleModal;