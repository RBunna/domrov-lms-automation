import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import EvaluationTable from '../components/evaluations/EvaluationTable';
import { BaseButton } from '../components/base';
import { MainLayout, PageHeader } from '../components/layout';
import { evaluationService, type Evaluation } from '../services';
import { useFilter } from '../hooks';

const Evaluations = () => {
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { filters, filteredData, setFilter } = useFilter(evaluations, [
        'user',
        'id',
    ]);

    useEffect(() => {
        loadEvaluations();
    }, []);

    const loadEvaluations = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await evaluationService.fetchEvaluations();
            setEvaluations(data);
        } catch (err) {
            setError('Failed to load evaluations. Please try again.');
            console.error('Load error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = () => {
        const csv = [
            ['Evaluation ID', 'User', 'Model', 'Input', 'Score', 'Status', 'Date'],
            ...filteredData.map((e) => [e.id, e.user, e.model, e.input, e.score, e.status, e.date]),
        ]
            .map((row) => row.map((cell) => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `evaluations-${new Date().toISOString()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <MainLayout>
            <PageHeader
                title="AI Evaluations"
                description="Monitor and manage AI model evaluation results."
                actions={
                    <BaseButton
                        variant="secondary"
                        leftIcon={<Download className="w-4 h-4" />}
                        onClick={handleExport}
                    >
                        Export CSV
                    </BaseButton>
                }
            />

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            <div className="mb-6 flex flex-col md:flex-row gap-3">
                <input
                    type="text"
                    placeholder="Search evaluation ID or user..."
                    value={(filters.search as string) || ''}
                    onChange={(e) => setFilter('search', e.target.value)}
                    className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <select
                    value={(filters.status as string) || ''}
                    onChange={(e) => setFilter('status', e.target.value)}
                    className="px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                </select>
            </div>

            <EvaluationTable
                evaluations={filteredData}
                isLoading={isLoading}
            />
        </MainLayout>
    );
};

export default Evaluations;