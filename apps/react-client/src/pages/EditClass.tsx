import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import ImageUpload from "@/components/forms/ImageUpload";
import classService from "@/services/classService";
import type { CloudinaryUploadResponse } from "@/types";

interface EditClassFormData {
    name: string;
    description: string;
    coverImageUrl?: string;
}

export default function EditClass() {
    const navigate = useNavigate();
    const params = useParams();
    const classId = Number(params.id) || 0;

    const [formData, setFormData] = useState<EditClassFormData>({
        name: "",
        description: "",
        coverImageUrl: undefined,
    });
    const [errors, setErrors] = useState<Partial<Record<keyof EditClassFormData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        const fetchClassData = async () => {
            try {
                setIsLoading(true);
                setSubmitError(null);
                // Get all classes and find the one with matching ID
                const allClasses = await classService.getMyClasses();
                const classData = allClasses.find(c => c.id === classId);
                
                if (classData) {
                    setFormData({
                        name: classData.name || "",
                        description: classData.description || "",
                        coverImageUrl: classData.coverImageUrl || undefined,
                    });
                } else {
                    setSubmitError("Class not found");
                }
            } catch (err: any) {
                const errorMsg = err?.response?.data?.message || err?.message || "Failed to load class data";
                console.error("Error fetching class:", err);
                setSubmitError(errorMsg);
            } finally {
                setIsLoading(false);
            }
        };

        if (classId > 0) {
            fetchClassData();
        }
    }, [classId]);

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof EditClassFormData, string>> = {};
        if (!formData.name.trim()) {
            newErrors.name = "Class name is required";
        } else if (formData.name.length < 3) {
            newErrors.name = "Class name must be at least 3 characters";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            await classService.updateClass(classId, {
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                coverImageUrl: formData.coverImageUrl,
            });
            navigate(`/class/${classId}`);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : "Failed to update class");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name as keyof EditClassFormData]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleImageUploadSuccess = (result: CloudinaryUploadResponse) => {
        setFormData((prev) => ({ ...prev, coverImageUrl: result.secure_url }));
    };

    const handleImageUploadError = (error: string) => {
        setErrors((prev) => ({ ...prev, coverImageUrl: error }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-100">
                <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-4 border-4 rounded-full animate-spin border-primary border-t-transparent"></div>
                    <p className="text-slate-600">Loading class...</p>
                </div>
            </div>
        );
    }

    // Continue showing the form even if there's an error loading initial data
    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <header className="text-white bg-primary">
                <div className="max-w-4xl px-6 py-4 mx-auto">
                    <div className="flex items-center gap-3">
                        <Link
                            to={`/class/${classId}`}
                            className="p-2 transition-colors rounded-lg hover:bg-white/10"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold">Edit Class</h1>
                            <p className="text-sm text-blue-100">Update your class details</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl px-6 py-8 mx-auto">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Left Column - Form */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Cover Image Section */}
                            <section className="p-6 bg-white border shadow-sm rounded-xl border-slate-200">
                                <h2 className="mb-1 text-lg font-semibold text-slate-900">Cover Image</h2>
                                <p className="mb-4 text-sm text-slate-500">Upload an image for your class card</p>

                                <ImageUpload
                                    label=""
                                    maxSizeMB={5}
                                    currentImageUrl={formData.coverImageUrl}
                                    onSuccess={handleImageUploadSuccess}
                                    onError={handleImageUploadError}
                                />
                                {formData.coverImageUrl && (
                                    <p className="flex items-center gap-1 mt-2 text-sm text-green-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Image uploaded
                                    </p>
                                )}
                                {errors.coverImageUrl && (
                                    <p className="mt-2 text-sm text-red-600">{errors.coverImageUrl}</p>
                                )}
                            </section>

                            {/* Class Details Section */}
                            <section className="p-6 bg-white border shadow-sm rounded-xl border-slate-200">
                                <h2 className="mb-1 text-lg font-semibold text-slate-900">Class Details</h2>
                                <p className="mb-4 text-sm text-slate-500">Basic information about your class</p>

                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Class Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Enter class name"
                                            className={`w-full px-4 py-2.5 rounded-lg border ${errors.name ? "border-red-300 focus:ring-red-500" : "border-slate-300 focus:ring-primary"
                                                } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors`}
                                        />
                                        {errors.name && (
                                            <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Description
                                        </label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Enter class description"
                                            rows={3}
                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none"
                                        />
                                        <p className="mt-1.5 text-xs text-slate-500">
                                            Briefly describe what students will learn
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Error Message */}
                            {submitError && (
                                <div className="flex items-center gap-3 p-4 border border-red-200 bg-red-50 rounded-xl">
                                    <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm text-red-700">{submitError}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                <Link
                                    to={`/class/${classId}`}
                                    className="flex-1 px-6 py-3 font-medium text-center transition-colors border rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center justify-center flex-1 gap-2 px-6 py-3 font-medium text-white transition-colors rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Updating...
                                        </>
                                    ) : (
                                        "Update Class"
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Right Column - Preview */}
                        <div className="lg:col-span-1">
                            <div className="sticky overflow-hidden bg-white border shadow-sm top-6 rounded-xl border-slate-200">
                                <div className="flex items-center justify-center h-32 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
                                    {formData.coverImageUrl ? (
                                        <img
                                            src={formData.coverImageUrl}
                                            alt={formData.name}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <span className="text-3xl font-bold text-slate-300">
                                            {formData.name
                                                ?.split(" ")
                                                .map((w) => w[0])
                                                .join("")
                                                .toUpperCase()
                                                .slice(0, 2) || "CL"}
                                        </span>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="mb-1 text-sm font-semibold text-slate-900 line-clamp-2">
                                        {formData.name || "Class Name"}
                                    </h3>
                                    <p className="text-xs text-slate-600 line-clamp-2">
                                        {formData.description || "No description provided"}
                                    </p>
                                    <p className="mt-3 text-xs text-slate-500">
                                        This is how your class card will appear
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}
