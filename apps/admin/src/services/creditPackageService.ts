// Credit Package Service

import { type CreditPackage } from '../types/credit-package';
import { apiClient } from './api';

class CreditPackageService {
    /**
     * Fetch all credit packages from the API
     * API returns: { success: true, data: [...] }
     * request function automatically unwraps to: [...]
     */
    async fetchPackages(): Promise<CreditPackage[]> {
        try {
            const response = await apiClient.wallet.getAllPackages();
            // Response is already unwrapped to the array
            return response || [];
        } catch (error) {
            console.error('Failed to fetch credit packages:', error);
            throw error;
        }
    }

    /**
     * Create a new credit package
     * API returns: { success: true, data: { id, name, description, ... } }
     * request function automatically unwraps to: { id, name, description, ... }
     */
    async createPackage(pkg: Omit<CreditPackage, 'id' | 'created_at' | 'updated_at'>): Promise<CreditPackage> {
        try {
            const response = await apiClient.wallet.createPackage({
                name: pkg.name,
                description: pkg.description,
                credits: pkg.credits,
                bonusCredits: pkg.bonusCredits,
                price: pkg.price,
                currency: pkg.currency,
                isActive: pkg.isActive,
                sortOrder: pkg.sortOrder,
            });
            return response;
        } catch (error) {
            console.error('Failed to create credit package:', error);
            throw error;
        }
    }

    /**
     * Update an existing credit package
     * NOTE: The backend does not support direct updates. 
     * This method is kept for API compatibility but cannot actually update existing packages.
     * To modify a package, deactivate it (toggle status) and create a new one.
     */
    async updatePackage(id: number, _updates: Partial<CreditPackage>): Promise<CreditPackage> {
        console.warn(`Package update not supported by backend API. Package ID: ${id}`);
        throw new Error('Package updates are not supported. Please deactivate the old package and create a new one.');
    }

    /**
     * Toggle package active status
     * API returns: { success: true, data: { id, name, isActive, ... } }
     * request function automatically unwraps to: { id, name, isActive, ... }
     */
    async togglePackageStatus(id: number): Promise<CreditPackage> {
        try {
            const response = await apiClient.wallet.togglePackage(id);
            return response;
        } catch (error) {
            console.error(`Failed to toggle package status for ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete package (note: backend only supports toggle, not delete)
     * Use togglePackageStatus instead
     */
    async deletePackage(id: number): Promise<void> {
        await this.togglePackageStatus(id);
    }
}


export const creditPackageService = new CreditPackageService();

// Export type for re-exports
export type { CreditPackage } from '../types/credit-package';
