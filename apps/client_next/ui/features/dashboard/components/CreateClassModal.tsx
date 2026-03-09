"use client";

import { useState } from "react";
import Modal from "@/ui/design-system/primitives/Modal";
import FormInput from "@/ui/design-system/primitives/FormInput";
import Avatar from "@/ui/design-system/primitives/Avatar";

export interface CreateClassData {
  name: string;
  description: string;
  group: string;
  generation: string;
  status: string;
}

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateClassData) => void;
}

export default function CreateClassModal({
  isOpen,
  onClose,
  onCreate,
}: CreateClassModalProps) {
  const [formData, setFormData] = useState<CreateClassData>({
    name: "",
    description: "",
    group: "",
    generation: "",
    status: "active",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateClassData, string>>
  >({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateClassData, string>> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Class name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Class name must be at least 3 characters";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onCreate({
      name: formData.name.trim(),
      description: formData.description.trim(),
      group: formData.group.trim(),
      generation: formData.generation.trim(),
      status: formData.status,
    });

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      group: "",
      generation: "",
      status: "active",
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof CreateClassData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create a New Class"
      description="Fill in the details below to create a new class. A unique join code will be generated automatically."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Class Preview */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <Avatar
            name={formData.name || "Class Name"}
            size="lg"
            shape="rounded"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-500">Preview</p>
            <p className="font-semibold text-slate-900 truncate">
              {formData.name || "Class Name"}
            </p>
          </div>
        </div>

        <FormInput
          id="name"
          name="name"
          label="Class Name"
          required
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Advanced Web Development"
          error={errors.name}
          autoFocus
        />
        <FormInput
          id="description"
          name="description"
          label="Description"
          required
          value={formData.description}
          onChange={handleChange}
          placeholder="e.g., Learning about NestJS and React"
          error={errors.description}
        />
        <FormInput
          id="group"
          name="group"
          label="Group"
          required
          value={formData.group}
          onChange={handleChange}
          placeholder="e.g., WebDev"
          error={errors.group}
        />
        <FormInput
          id="generation"
          name="generation"
          label="Generation"
          required
          value={formData.generation}
          onChange={handleChange}
          placeholder="e.g., 2026"
          error={errors.generation}
        />
        <div className="mb-2">
          <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-2">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Create Class
          </button>
        </div>
      </form>
    </Modal>
  );
}
