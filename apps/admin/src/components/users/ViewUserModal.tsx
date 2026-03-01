import { BaseModal, BaseButton, BaseStatusBadge } from '../base';
import type { User } from '../../services';
import React from 'react';

interface ViewUserModalProps {
    isOpen: boolean;
    user: User;
    onClose: () => void;
}

const ViewUserModal: React.FC<ViewUserModalProps> = ({ isOpen, user, onClose }) => {
    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="User Details"
            size="md"
            footer={
                <BaseButton variant="secondary" onClick={onClose}>
                    Close
                </BaseButton>
            }
        >
            <div className="space-y-6">
                {/* User Header with Avatar */}
                <div className="flex gap-4 items-start pb-4 border-b border-neutral-200">
                    <img
                        src={user.profilePictureUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id}
                        alt={user.firstName}
                        className="w-16 h-16 rounded-full object-cover border-2 border-neutral-200"
                    />
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{user.firstName} {user.lastName}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="mt-2 flex gap-2">
                            <BaseStatusBadge status={user.status === 'ACTIVE' ? 'active' : user.status === 'SUSPENDED' ? 'suspended' : 'inactive'} />
                        </div>
                    </div>
                </div>

                {/* User Information Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase">Email</label>
                        <p className="text-sm text-gray-900 mt-1">{user.email}</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase">Phone</label>
                        <p className="text-sm text-gray-900 mt-1">{user.phoneNumber || '-'}</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase">Status</label>
                        <p className="mt-1">
                            <BaseStatusBadge status={user.status === 'ACTIVE' ? 'active' : user.status === 'SUSPENDED' ? 'suspended' : 'inactive'} variant="subtle" />
                        </p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase">Verified</label>
                        <p className="text-sm text-gray-900 mt-1">{user.isVerified ? 'Yes' : 'No'}</p>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
};

export default ViewUserModal;