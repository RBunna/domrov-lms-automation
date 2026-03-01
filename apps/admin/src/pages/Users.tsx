
import { useState, useEffect } from 'react';
import UserTableFilters from '../components/users/UserTableFilters';
import UserTable from '../components/users/UserTable';
import { MainLayout, PageHeader } from '../components/layout';
import { userService, type User } from '../services';
import { useModal } from '../hooks';
import { AlertCircle } from 'lucide-react';
import ViewUserModal from '../components/users/ViewUserModal';
import AddCreditModal from '../components/users/AddCreditModal';
import DeductCreditModal from '../components/users/DeductCreditModal';
import StatusToggleModal from '../components/users/StatusToggleModal';

const Users = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentSearch, setCurrentSearch] = useState<string>('');
    const [currentStatus, setCurrentStatus] = useState<string>('');
    const [currentRole, setCurrentRole] = useState<string>('');

    const viewModal = useModal();
    const addCreditModal = useModal();
    const deductCreditModal = useModal();
    const statusModal = useModal();

    useEffect(() => {
        loadUsers();
    }, []);

    // Refetch data when filters change
    useEffect(() => {
        loadUsers();
    }, [currentSearch, currentStatus, currentRole]);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const loadUsers = async (page: number = 1, limit: number = 10) => {
        try {
            setError(null);
            const response = await userService.fetchDashboardUsers(
                page,
                limit,
                currentSearch || undefined,
                currentStatus || undefined,
                currentRole || undefined
            );

            // Transform response data to User format
            const transformedUsers: User[] = response.data.map((user) => ({
                id: user.id,
                firstName: user.name.split(' ')[0],
                lastName: user.name.split(' ').slice(1).join(' ') || '',
                email: user.email,
                profilePictureUrl: user.avatar,
                avatar: user.avatar,
                name: user.name,
                role: user.role,
                balance: user.balance,
                status: user.status.toUpperCase() as User['status'],
                created: user.created,
                isVerified: true,
            }));

            setUsers(transformedUsers);
        } catch (err) {
            setError('Failed to load users. Please try again.');
            console.error('Load error:', err);
        }
    };

    const handleSearch = (value: string) => {
        setCurrentSearch(value);
    };

    const handleStatusFilter = (value: string) => {
        setCurrentStatus(value);
    };

    const handleRoleFilter = (value: string) => {
        setCurrentRole(value);
    };

    const handleViewClick = (user: User) => {
        setSelectedUser(user);
        viewModal.openModal();
    };

    const handleAddCreditClick = (user: User) => {
        setSelectedUser(user);
        addCreditModal.openModal();
    };

    const handleDeductCreditClick = (user: User) => {
        setSelectedUser(user);
        deductCreditModal.openModal();
    };

    const handleStatusToggleClick = (user: User) => {
        setSelectedUser(user);
        statusModal.openModal();
    };

    const handleAddCredit = async (amount: number) => {
        if (!selectedUser || amount <= 0) return;
        try {
            setIsSubmitting(true);
            await userService.addCredits(
                selectedUser.id,
                amount,
                'admin_bonus',
                `Admin added ${amount} credits`
            );
            // Reload users to get updated data
            await loadUsers();
            setSuccessMessage(`Added ${amount} credits to ${selectedUser.firstName} ${selectedUser.lastName}`);
            addCreditModal.closeModal();
            setSelectedUser(null);
        } catch (err) {
            setError('Failed to add credit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeductCredit = async (amount: number) => {
        if (!selectedUser || amount <= 0) return;
        try {
            setIsSubmitting(true);
            await userService.deductCredits(
                selectedUser.id,
                amount,
                'admin_deduction',
                `Admin deducted ${amount} credits`
            );
            // Reload users to get updated data
            await loadUsers();
            setSuccessMessage(`Deducted ${amount} credits from ${selectedUser.firstName} ${selectedUser.lastName}`);
            deductCreditModal.closeModal();
            setSelectedUser(null);
        } catch (err) {
            setError('Failed to deduct credit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!selectedUser) return;
        try {
            setIsSubmitting(true);
            const newStatus = selectedUser.status === 'ACTIVE' ? 'inactive' : 'active';
            await userService.updateUserStatus(
                selectedUser.id,
                newStatus
            );
            // Reload users to get updated data
            await loadUsers();
            setSuccessMessage(`${selectedUser.firstName} ${selectedUser.lastName} is now ${newStatus === 'active' ? 'active' : 'inactive'}`);
            statusModal.closeModal();
            setSelectedUser(null);
        } catch (err) {
            setError('Failed to update user status. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MainLayout>
            <PageHeader
                title="Users"
                description="Manage system users and their access levels."
            />

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    {successMessage}
                </div>
            )}

            <div className="mb-6">
                <UserTableFilters
                    search={currentSearch || ''}
                    onSearchChange={handleSearch}
                    roleFilter={currentRole || ''}
                    onRoleChange={handleRoleFilter}
                    statusFilter={currentStatus || ''}
                    onStatusChange={handleStatusFilter}
                />
            </div>

            {/* Users Table */}
            <div className="mb-6">
                <UserTable
                    users={users}
                    onView={handleViewClick}
                    onAddCredit={handleAddCreditClick}
                    onDeductCredit={handleDeductCreditClick}
                    onToggleStatus={handleStatusToggleClick}
                />
            </div>

            {/* View User Modal - Read Only */}
            {selectedUser && (
                <ViewUserModal
                    isOpen={viewModal.isOpen}
                    user={selectedUser}
                    onClose={viewModal.closeModal}
                />
            )}

            {/* Add Credit Modal */}
            {selectedUser && (
                <AddCreditModal
                    isOpen={addCreditModal.isOpen}
                    user={selectedUser}
                    onClose={addCreditModal.closeModal}
                    onSave={handleAddCredit}
                    isSubmitting={isSubmitting}
                />
            )}

            {/* Deduct Credit Modal */}
            {selectedUser && (
                <DeductCreditModal
                    isOpen={deductCreditModal.isOpen}
                    user={selectedUser}
                    onClose={deductCreditModal.closeModal}
                    onSave={handleDeductCredit}
                    isSubmitting={isSubmitting}
                />
            )}

            {/* Status Toggle Modal */}
            {selectedUser && (
                <StatusToggleModal
                    isOpen={statusModal.isOpen}
                    user={selectedUser}
                    onClose={statusModal.closeModal}
                    onConfirm={handleToggleStatus}
                    isSubmitting={isSubmitting}
                />
            )}
        </MainLayout>
    );
};

export default Users;
