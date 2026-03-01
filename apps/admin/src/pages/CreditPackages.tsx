import { useState, useEffect } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import CreditPackageTable from '../components/credit-packages/CreditPackageTable';
import CreditPackageModal from '../components/credit-packages/CreditPackageModal';
import { BaseButton, BaseModal } from '../components/base';
import { MainLayout, PageHeader } from '../components/layout';
import { creditPackageService } from '../services';
import { type CreditPackage } from '../types/credit-package';
import { useModal } from '../hooks';

type CreditPackageInput = Partial<Omit<CreditPackage, 'id' | 'created_at' | 'updated_at'>> & {
    id?: number;
};

const isCreatePackageInput = (
    pkg: CreditPackageInput
): pkg is Omit<CreditPackage, 'id' | 'created_at' | 'updated_at'> => {
    return typeof pkg.name === 'string' && pkg.name.trim().length > 0;
};

const CreditPackages = () => {
    const [packages, setPackages] = useState<CreditPackage[]>([]);
    const [editPackage, setEditPackage] = useState<CreditPackage | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deletePackageId, setDeletePackageId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [togglePackageId, setTogglePackageId] = useState<number | null>(null);
    const [isTogglingStatus, setIsTogglingStatus] = useState(false);
    const { isOpen: modalOpen, openModal, closeModal } = useModal();
    const { isOpen: deleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
    const { isOpen: toggleModalOpen, openModal: openToggleModal, closeModal: closeToggleModal } = useModal();

    // Load packages on mount
    useEffect(() => {
        loadPackages();
    }, []);

    const loadPackages = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await creditPackageService.fetchPackages();
            setPackages(data);
        } catch (err) {
            setError('Failed to load packages. Please try again.');
            console.error('Load error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (pkg: CreditPackage) => {
        setEditPackage(pkg);
        openModal();
    };

    const handleCreate = () => {
        setEditPackage(null);
        openModal();
    };

    const handleSave = async (pkg: CreditPackageInput) => {
        try {
            setError(null);
            if (pkg.id) {
                // Update existing
                await creditPackageService.updatePackage(pkg.id, pkg);
            } else {
                // Create new
                if (!isCreatePackageInput(pkg)) {
                    setError('Package name is required.');
                    return;
                }
                await creditPackageService.createPackage(pkg);
            }
            await loadPackages();
            closeModal();
        } catch (err) {
            setError('Failed to save package. Please try again.');
            console.error('Save error:', err);
        }
    };

    const handleToggle = async (id: number) => {
        setTogglePackageId(id);
        openToggleModal();
    };

    const confirmToggle = async () => {
        if (!togglePackageId) return;
        try {
            setIsTogglingStatus(true);
            setError(null);
            await creditPackageService.togglePackageStatus(togglePackageId);
            await loadPackages();
            closeToggleModal();
        } catch (err) {
            setError('Failed to update package status. Please try again.');
            console.error('Toggle error:', err);
        } finally {
            setIsTogglingStatus(false);
            setTogglePackageId(null);
        }
    };

    const handleDelete = async (id: number) => {
        setDeletePackageId(id);
        openDeleteModal();
    };

    const confirmDelete = async () => {
        if (!deletePackageId) return;
        try {
            setIsDeleting(true);
            setError(null);
            await creditPackageService.deletePackage(deletePackageId);
            await loadPackages();
            closeDeleteModal();
        } catch (err) {
            setError('Failed to delete package. Please try again.');
            console.error('Delete error:', err);
        } finally {
            setIsDeleting(false);
            setDeletePackageId(null);
        }
    };

    return (
        <MainLayout>
            <PageHeader
                title="Credit Packages"
                description="Manage credit bundles available for purchase."
                actions={
                    <BaseButton
                        variant="primary"
                        leftIcon={<Plus className="w-5 h-5" />}
                        onClick={handleCreate}
                    >
                        Create Package
                    </BaseButton>
                }
            />

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            <CreditPackageTable
                packages={packages}
                onEdit={handleEdit}
                onToggle={handleToggle}
                onDelete={handleDelete}
                isLoading={isLoading}
            />

            {modalOpen && (
                <CreditPackageModal
                    isOpen={modalOpen}
                    pkg={editPackage}
                    onClose={closeModal}
                    onSave={handleSave}
                />
            )}

            {deleteModalOpen && (
                <BaseModal
                    isOpen={deleteModalOpen}
                    onClose={closeDeleteModal}
                    title="Delete Package"
                    size="sm"
                    footer={
                        <>
                            <BaseButton
                                variant="secondary"
                                onClick={closeDeleteModal}
                                disabled={isDeleting}
                            >
                                Cancel
                            </BaseButton>
                            <BaseButton
                                variant="danger"
                                onClick={confirmDelete}
                                isLoading={isDeleting}
                            >
                                Delete
                            </BaseButton>
                        </>
                    }
                >
                    <div className="flex gap-4">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-gray-700 font-medium mb-2">
                                Are you sure you want to delete this package?
                            </p>
                            <p className="text-gray-600 text-sm">
                                This action cannot be undone. All transactions and references to this package will be lost.
                            </p>
                        </div>
                    </div>
                </BaseModal>
            )}

            {toggleModalOpen && togglePackageId && (
                <BaseModal
                    isOpen={toggleModalOpen}
                    onClose={closeToggleModal}
                    title="Change Package Status"
                    size="sm"
                    footer={
                        <>
                            <BaseButton
                                variant="secondary"
                                onClick={closeToggleModal}
                                disabled={isTogglingStatus}
                            >
                                Cancel
                            </BaseButton>
                            <BaseButton
                                variant="primary"
                                onClick={confirmToggle}
                                isLoading={isTogglingStatus}
                            >
                                Confirm
                            </BaseButton>
                        </>
                    }
                >
                    <div>
                        {packages
                            .filter((pkg) => pkg.id === togglePackageId)
                            .map((pkg) => (
                                <div key={pkg.id}>
                                    <p className="text-gray-700 font-medium mb-2">
                                        {pkg.isActive
                                            ? `Deactivate "${pkg.name}"?`
                                            : `Activate "${pkg.name}"?`}
                                    </p>
                                    <p className="text-gray-600 text-sm">
                                        {pkg.isActive
                                            ? 'This package will no longer be available for purchase. Existing users can still use their credits.'
                                            : 'This package will be available for purchase.'}
                                    </p>
                                </div>
                            ))}
                    </div>
                </BaseModal>
            )}
        </MainLayout>
    );
};

export default CreditPackages;
