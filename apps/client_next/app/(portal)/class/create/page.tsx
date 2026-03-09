"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClass } from "@/lib/api/classes";

interface CreateClassData {
  name: string;
  group: string;
  generation: string;
  status: "active" | "inactive" | "archived";
}

// --- Constants ---
const _STATUS_OPTIONS = ["active", "inactive", "archived"] as const;

// Generate initials from class name
const _getInitials = (name: string): string => {
  if (!name.trim()) return "?";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
};

// Generate a gradient based on the name
const getGradientFromName = (name: string): string => {
  if (!name.trim()) return "from-slate-700 to-slate-900";
  const gradients = [
    "from-blue-600 to-blue-800",
    "from-purple-600 to-purple-800",
    "from-green-600 to-green-800",
    "from-orange-600 to-orange-800",
    "from-red-600 to-red-800",
    "from-indigo-600 to-indigo-800",
    "from-teal-600 to-teal-800",
    "from-pink-600 to-pink-800",
  ];
  const index = name.charCodeAt(0) % gradients.length;
  return gradients[index];
};

export default function CreateClassPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateClassData>({
    name: "",
    group: "",
    generation: "",
    status: "active",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateClassData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateClassData, string>> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Class name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Class name must be at least 3 characters";
    }
    if (!formData.group.trim()) {
      newErrors.group = "Group is required";
    }
    if (!formData.generation.trim()) {
      newErrors.generation = "Generation is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await createClass({
        name: formData.name.trim(),
        group: formData.group.trim(),
        generation: formData.generation.trim(),
        status: formData.status,
      });
      router.push("/dashboard");
    } catch (err) {
      alert("Error saving class: " + (err instanceof Error ? err.message : err));
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof CreateClassData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-100">Dashboard</p>
            <h1 className="text-xl font-semibold">Create New Class</h1>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        {/* Two Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column - Form */}
          <div className="w-1/2 p-8 overflow-y-auto">
            <div className="max-w-xl mx-auto">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Class Details</h2>
                <p className="text-sm text-slate-500">
                  Fill in the details below to create a new class. A unique join code will be generated automatically.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
              {/* Class Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  Class Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Introduction to Programming"
                  className={`w-full px-4 py-3 rounded-lg border-2 bg-white text-slate-900 placeholder:text-slate-400 ${
                    errors.name
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-400 focus:ring-primary focus:border-primary"
                  } focus:outline-none focus:ring-2 transition-all`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* Group */}
              <div>
                <label htmlFor="group" className="block text-sm font-medium text-slate-700 mb-2">
                  Group <span className="text-red-500">*</span>
                </label>
                <input
                  id="group"
                  name="group"
                  type="text"
                  value={formData.group}
                  onChange={handleChange}
                  placeholder="e.g., Group A"
                  className={`w-full px-4 py-3 rounded-lg border-2 bg-white text-slate-900 placeholder:text-slate-400 ${
                    errors.group
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-400 focus:ring-primary focus:border-primary"
                  } focus:outline-none focus:ring-2 transition-all`}
                />
                {errors.group && <p className="mt-1 text-sm text-red-500">{errors.group}</p>}
              </div>

              {/* Generation */}
              <div>
                <label htmlFor="generation" className="block text-sm font-medium text-slate-700 mb-2">
                  Generation <span className="text-red-500">*</span>
                </label>
                <input
                  id="generation"
                  name="generation"
                  type="text"
                  value={formData.generation}
                  onChange={handleChange}
                  placeholder="e.g., 2026"
                  className={`w-full px-4 py-3 rounded-lg border-2 bg-white text-slate-900 placeholder:text-slate-400 ${
                    errors.generation
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-400 focus:ring-primary focus:border-primary"
                  } focus:outline-none focus:ring-2 transition-all`}
                />
                {errors.generation && (
                  <p className="mt-1 text-sm text-red-500">{errors.generation}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-400 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="flex-1 px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="w-1/2 bg-white p-8 overflow-y-auto border-l border-slate-200">
          <div className="max-w-xl mx-auto">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Preview</h2>
            
            {/* Preview Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
              {/* Card Header with Dynamic Gradient */}
              <div className={`bg-gradient-to-br ${getGradientFromName(formData.name)} h-32 flex items-center justify-center`}>
                <h3 className="text-white text-2xl font-bold uppercase tracking-wide">
                  {formData.name || "CLASS NAME"}
                </h3>
              </div>
              
              {/* Card Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Term1</p>
                    <p className="font-semibold text-slate-900">
                      {formData.name || "Class Name"}
                    </p>
                    {formData.group && (
                      <p className="text-sm text-slate-600 mt-1">{formData.group}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    formData.status === "active" 
                      ? "bg-green-100 text-green-800"
                      : formData.status === "inactive"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                  </span>
                  <button className="text-sm font-medium text-primary hover:text-primary/80">
                    Open
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• A unique join code will be generated</li>
                <li>• Students can join using the code</li>
                <li>• You can manage assignments and resources</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
