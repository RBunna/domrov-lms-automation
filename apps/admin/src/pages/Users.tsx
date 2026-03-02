import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import UserTableFilters from '../components/users/UserTableFilters';
import UserTable from '../components/users/UserTable';
import { MainLayout, PageHeader } from '../components/layout';
import { userService, type User } from '../services';
import { useModal } from '../hooks';
import { AlertCircle, CheckCircle } from 'lucide-react';
import type { UserCreditReason } from '../types/admin-wallet';
import AddCreditModal from '../components/users/AddCreditModal';
import DeductCreditModal from '../components/users/DeductCreditModal';
import StatusToggleModal from '../components/users/StatusToggleModal';

type DeductReason = Extract<UserCreditReason, 'refund' | 'other'> | 'penalty' | 'correction';

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

// Memoized UserTable to prevent unnecessary re-renders
const MemoizedUserTable = React.memo(UserTable);

const Users = () => {
  const navigate = useNavigate();
  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI state (doesn't trigger table re-render)
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter state
  const [currentSearch, setCurrentSearch] = useState<string>('');
  const [currentStatus, setCurrentStatus] = useState<string>('all');
  const [currentRole, setCurrentRole] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounced search (500ms delay)
  const debouncedSearch = useDebounce(currentSearch, 500);

  const viewModal = useModal();
  const addCreditModal = useModal();
  const deductCreditModal = useModal();
  const statusModal = useModal();

  // Fetch users only when debounced search, status, or role changes
  useEffect(() => {
    loadUsers(1);
  }, [debouncedSearch, currentStatus, currentRole]);

  // Clear success message after 4 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadUsers = useCallback(async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      setCurrentPage(page);

      const response = await userService.fetchUsers(
        page,
        10,
        {
          status: currentStatus,
          role: currentRole,
          verified: 'all',
          search: debouncedSearch || '',
          sortBy: 'newest',
        }
      );

      // Memoized transform to prevent unnecessary re-processing
      const transformedUsers = response.data.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName || null,
        email: user.email,
        profilePictureUrl: user.profilePictureUrl,
        avatar: user.profilePictureUrl || undefined,
        name: `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`,
        role: user.role,
        balance: user.credits,
        credits: user.credits,
        status: user.status,
        created: user.joinDate,
        isVerified: user.isVerified,
        gender: user.gender || null,
        dob: user.dob || null,
        phoneNumber: user.phoneNumber || null,
        joinDate: user.joinDate,
        lastActivity: user.lastActivity,
        totalPurchased: user.totalPurchased,
      }));

      setUsers(transformedUsers);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load users. Please try again.';
      setError(errorMsg);
      console.error('Load users error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, currentStatus, currentRole]);

  // Memoized event handlers - prevent recreating functions on every render
  const handleSearch = useCallback((value: string) => {
    setCurrentSearch(value);
  }, []);

  const handleStatusFilter = useCallback((value: string) => {
    setCurrentStatus(value);
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  const handleRoleFilter = useCallback((value: string) => {
    setCurrentRole(value);
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  const handleViewClick = useCallback((user: User) => {
    // Navigate to user detail page instead of opening modal
    navigate(`/users/${user.id}`);
  }, [navigate]);

  const handleAddCreditClick = useCallback((user: User) => {
    setSelectedUser(user);
    addCreditModal.openModal();
  }, [addCreditModal]);

  const handleDeductCreditClick = useCallback((user: User) => {
    setSelectedUser(user);
    deductCreditModal.openModal();
  }, [deductCreditModal]);

  const handleStatusToggleClick = useCallback((user: User) => {
    setSelectedUser(user);
    statusModal.openModal();
  }, [statusModal]);

  const handleAddCredit = useCallback(async (amount: number, reason: UserCreditReason) => {
    if (!selectedUser || amount <= 0) return;
    try {
      setIsSubmitting(true);
      setError(null);

      await userService.addCredits(
        selectedUser.id,
        amount,
        reason,
        `Admin added ${amount} credits`
      );

      await loadUsers(currentPage);
      setSuccessMessage(
        `Added ${amount} credits to ${selectedUser.firstName}`
      );
      addCreditModal.closeModal();
      setSelectedUser(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add credits. Please try again.';
      setError(errorMsg);
      console.error('Add credits error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedUser, currentPage, loadUsers, addCreditModal]);

  const handleDeductCredit = useCallback(async (amount: number, reason: DeductReason) => {
    if (!selectedUser || amount <= 0) return;
    try {
      setIsSubmitting(true);
      setError(null);

      await userService.deductCredits(
        selectedUser.id,
        amount,
        reason,
        `Admin deducted ${amount} credits`
      );

      await loadUsers(currentPage);
      setSuccessMessage(
        `Deducted ${amount} credits from ${selectedUser.firstName}`
      );
      deductCreditModal.closeModal();
      setSelectedUser(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to deduct credits. Please try again.';
      setError(errorMsg);
      console.error('Deduct credits error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedUser, currentPage, loadUsers, deductCreditModal]);

  const handleStatusToggle = useCallback(async (status: 'active' | 'inactive' | 'banned', reason?: string) => {
    if (!selectedUser) return;
    try {
      setIsSubmitting(true);
      setError(null);

      await userService.toggleUserStatus(selectedUser.id, status, reason);

      await loadUsers(currentPage);
      setSuccessMessage(`User status changed to ${status}`);
      statusModal.closeModal();
      setSelectedUser(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to change user status. Please try again.';
      setError(errorMsg);
      console.error('Toggle status error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedUser, currentPage, loadUsers, statusModal]);

  // Memoize handlers to pass to table
  const tableHandlers = useMemo(() => ({
    onView: handleViewClick,
    onAddCredit: handleAddCreditClick,
    onDeductCredit: handleDeductCreditClick,
    onToggleStatus: handleStatusToggleClick,
  }), [handleViewClick, handleAddCreditClick, handleDeductCreditClick, handleStatusToggleClick]);

  return (
    <MainLayout>
      <PageHeader
        title="Users"
        description="Manage system users and their access levels."
      />

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filters */}
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

      {/* Users Table - Memoized to prevent unnecessary re-renders */}
      <div className="mb-6">
        <MemoizedUserTable
          users={users}
          isLoading={isLoading}
          {...tableHandlers}
        />
      </div>

      {/* Add Credits Modal */}
      <AddCreditModal
        user={selectedUser}
        isOpen={addCreditModal.isOpen}
        isSubmitting={isSubmitting}
        onClose={addCreditModal.closeModal}
        onSubmit={handleAddCredit}
      />

      {/* Deduct Credits Modal */}
      <DeductCreditModal
        user={selectedUser}
        isOpen={deductCreditModal.isOpen}
        isSubmitting={isSubmitting}
        onClose={deductCreditModal.closeModal}
        onSubmit={handleDeductCredit}
      />

      {/* Status Toggle Modal */}
      <StatusToggleModal
        user={selectedUser}
        isOpen={statusModal.isOpen}
        isSubmitting={isSubmitting}
        onClose={statusModal.closeModal}
        onSubmit={handleStatusToggle}
      />
    </MainLayout>
  );
};

export default Users;