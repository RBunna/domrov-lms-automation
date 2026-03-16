import { useState, useEffect } from "react";
import { Upload, Link2, FileText, Video, Package, X, Eye, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AssignmentData } from "@/context/AssignmentContext";
import { useAssignments } from "@/context/AssignmentContext";
import { useToast } from "@/components/Toast";
import Dialog from "@/components/Dialog";

interface EditAssignmentFormProps {
  classId: string;
  assignmentId: string;
  initialData?: AssignmentData;
}

export default function EditAssignmentForm({
  classId,
  assignmentId,
  initialData,
}: EditAssignmentFormProps) {
  const navigate = useNavigate();
  const { updateAssignment, getAssignmentById } = useAssignments();
  const { showToast } = useToast();
  
  // Get assignment data from context or use initialData
  const assignmentFromContext = getAssignmentById(assignmentId);
  const loadedData = initialData || assignmentFromContext;

  const [formData, setFormData] = useState<AssignmentData>(
    loadedData || {
      title: "",
      session: "2024",
      submissionType: "individual",
      instructions: "",
      startDate: "",
      startTime: "",
      dueDate: "",
      dueTime: "",
      maxScore: 100,
      allowedSubmissionMethod: "both",
      allowLateSubmissions: false,
      aiEvaluationEnabled: false,
      learningResources: [],
    }
  );

  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; type: string }>
  >([
    { name: "Database_Design_Guide.pdf", type: "application/pdf" },
    { name: "Sample_Data.zip", type: "application/zip" },
  ]);

  const [hasChanges, setHasChanges] = useState(false);
  const [originalData] = useState(
    loadedData || {
      title: "",
      session: "2024",
      submissionType: "individual",
      instructions: "",
      startDate: "",
      startTime: "",
      dueDate: "",
      dueTime: "",
      maxScore: 100,
      allowedSubmissionMethod: "both",
      allowLateSubmissions: false,
      aiEvaluationEnabled: false,
      learningResources: [],
    }
  );

  // Track if form has changes
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  useEffect(() => {
    const isChanged = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasChanges(isChanged);
  }, [formData, originalData]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.currentTarget;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.currentTarget as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev) => ({
      ...prev,
      learningResources: [...prev.learningResources, ...files],
    }));

    // Add to display list
    files.forEach((file) => {
      setUploadedFiles((prev) => [
        ...prev,
        { name: file.name, type: file.type },
      ]);
    });
  };

  const handleRemoveFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      learningResources: prev.learningResources.filter((_, i) => i !== index),
    }));
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Update assignment in context
    const success = updateAssignment(assignmentId, formData);
    if (success) {
      showToast("✅ Assignment updated successfully!", "success", 3000);
      // Navigate back to assignment tab after brief delay to show toast
      setTimeout(() => {
        navigate(`/class/${classId}`, { state: { activeTab: "assignment" } });
      }, 500);
    } else {
      showToast("❌ Failed to update assignment", "error", 3000);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      setCancelDialogOpen(true);
    } else {
      navigate(`/class/${classId}`, { state: { activeTab: "assignment" } });
    }
  };

  const handlePreview = () => {
    // TODO: Show preview modal
    console.log("Preview:", formData);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 mx-auto max-w-7xl">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Edit Assignment</h1>
            <p className="mt-2 text-slate-600">
              Update the assignment details, instructions, resources, and grading rules.
            </p>
          </div>

          {/* Top Grid: General Info | Scheduling | Grading & Rules */}
          <div className="grid grid-cols-3 gap-6">
            {/* General Information Section */}
            <div className="p-6 bg-white border rounded-lg border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-bold tracking-wider uppercase text-slate-900">
                  General Information
                </h2>
                <span className="px-3 py-1 text-xs font-semibold text-blue-600 rounded-full bg-blue-50">
                  REQUIRED
                </span>
              </div>

              <div className="space-y-5">
                {/* Assignment Title */}
                <div>
                  <label className="block mb-2 text-xs font-semibold tracking-wide uppercase text-slate-700">
                    Assignment Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Advanced Database Systems Project"
                    className="w-full px-3 py-2.5 text-sm bg-white text-slate-900 border border-slate-200 rounded-lg placeholder-slate-400 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Session and Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-2 text-xs font-semibold tracking-wide uppercase text-slate-700">
                      Session <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="session"
                      value={formData.session}
                      onChange={handleInputChange}
                      placeholder="2024"
                      className="w-full px-3 py-2.5 text-sm bg-white text-slate-900 border border-slate-200 rounded-lg placeholder-slate-400 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-xs font-semibold tracking-wide uppercase text-slate-700">
                      Type
                    </label>
                    <select
                      name="submissionType"
                      value={formData.submissionType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 text-sm bg-white text-slate-900 border border-slate-200 rounded-lg appearance-none cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="individual">Individual</option>
                      <option value="group">Group</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Scheduling Section */}
            <div className="p-6 bg-white border rounded-lg border-slate-200">
              <h2 className="mb-6 text-sm font-bold tracking-wider uppercase text-slate-900">
                Scheduling
              </h2>

              <div className="space-y-5">
                {/* Start Date */}
                <div>
                  <label className="block mb-2 text-xs font-semibold tracking-wide uppercase text-slate-700">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    placeholder="mm/dd/yyyy, --:-- --"
                    className="w-full px-3 py-2.5 text-sm bg-white text-slate-900 border border-slate-200 rounded-lg placeholder-slate-400 cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block mb-2 text-xs font-semibold tracking-wide uppercase text-slate-700">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    placeholder="mm/dd/yyyy, --:-- --"
                    className="w-full px-3 py-2.5 text-sm bg-white text-slate-900 border border-slate-200 rounded-lg placeholder-slate-400 cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Grading & Rules Section */}
            <div className="p-6 bg-white border rounded-lg border-slate-200">
              <h2 className="mb-6 text-sm font-bold tracking-wider uppercase text-slate-900">
                Grading & Rules
              </h2>

              <div className="space-y-5">
                {/* Max Score and Method */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-2 text-xs font-semibold tracking-wide uppercase text-slate-700">
                      Max Score
                    </label>
                    <input
                      type="number"
                      name="maxScore"
                      value={formData.maxScore}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 text-sm bg-white text-slate-900 border border-slate-200 rounded-lg placeholder-slate-400 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-xs font-semibold tracking-wide uppercase text-slate-700">
                      Method
                    </label>
                    <select
                      name="allowedSubmissionMethod"
                      value={formData.allowedSubmissionMethod}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 text-sm bg-white text-slate-900 border border-slate-200 rounded-lg appearance-none cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="both">Both</option>
                      <option value="file">File Only</option>
                      <option value="text">Text Only</option>
                    </select>
                  </div>
                </div>

                {/* Late Submissions Toggle */}
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm font-medium text-slate-900">
                    Late Submissions
                  </p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="allowLateSubmissions"
                      checked={formData.allowLateSubmissions}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* AI Evaluation Toggle */}
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm font-medium text-slate-900">
                    AI Evaluation
                  </p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="aiEvaluationEnabled"
                      checked={formData.aiEvaluationEnabled}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Instructions | Resources */}
          <div className="grid grid-cols-2 gap-6">
            {/* Instructions Section */}
            <div className="p-6 bg-white border rounded-lg border-slate-200">
              <h2 className="mb-4 text-sm font-bold tracking-wider uppercase text-slate-900">
                Instructions <span className="text-red-500">*</span>
              </h2>
              <div className="overflow-hidden border rounded-lg border-slate-200">
                <div className="flex items-center gap-2 p-3 border-b border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    className="p-1 text-sm font-bold transition-colors rounded text-slate-700 hover:bg-slate-200"
                    title="Bold"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    className="p-1 text-sm italic transition-colors rounded text-slate-700 hover:bg-slate-200"
                    title="Italic"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    className="p-1 transition-colors rounded text-slate-700 hover:bg-slate-200"
                    title="List"
                  >
                    ≡
                  </button>
                  <button
                    type="button"
                    className="p-1 transition-colors rounded text-slate-700 hover:bg-slate-200"
                    title="Link"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  placeholder="Outline expectations and deliverables..."
                  className="w-full h-40 px-4 py-3 text-sm bg-white resize-none text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Resources Section */}
            <div className="p-6 bg-white border rounded-lg border-slate-200">
              <h2 className="mb-4 text-sm font-bold tracking-wider uppercase text-slate-900">
                Resources
              </h2>

              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center p-8 mb-4 text-center transition-all border-2 border-dashed rounded-lg cursor-pointer border-slate-300 hover:border-blue-400 hover:bg-blue-50 group"
              >
                <div className="mb-3">
                  <Upload className="w-10 h-10 mx-auto transition-colors text-slate-400 group-hover:text-blue-500" />
                </div>
                <p className="text-sm font-medium transition-colors text-slate-700 group-hover:text-blue-700">
                  Drop files to upload
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.docx,.zip,.mp4"
                />
              </label>

              {/* Uploaded Files Display */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 transition-colors border rounded-lg border-slate-200 bg-slate-50 hover:bg-slate-100"
                    >
                      <div className="flex items-center flex-1 min-w-0 gap-3">
                        <div className="flex-shrink-0">
                          {file.type.includes("pdf") ? (
                            <FileText className="w-5 h-5 text-red-500" />
                          ) : file.type.includes("video") ? (
                            <Video className="w-5 h-5 text-blue-500" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-500" />
                          )}
                        </div>
                        <span className="text-sm font-medium truncate text-slate-900">
                          {file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="flex-shrink-0 p-1 ml-2 transition-colors text-slate-400 hover:text-red-600"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={handlePreview}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors text-slate-600 hover:text-slate-900"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 text-sm font-medium transition-colors border rounded-lg text-slate-700 border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!hasChanges}
                className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  hasChanges
                    ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                    : "bg-slate-400 cursor-not-allowed"
                }`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>

        {/* Cancel Confirmation Dialog */}
        <Dialog
          isOpen={cancelDialogOpen}
          onClose={() => setCancelDialogOpen(false)}
          title="Unsaved Changes"
          description="You have unsaved changes. Are you sure you want to cancel?"
          icon={<AlertTriangle className="w-6 h-6 text-yellow-600" />}
          iconBgColor="bg-yellow-100"
          buttons={[
            {
              label: 'Keep Editing',
              onClick: () => setCancelDialogOpen(false),
              variant: 'secondary',
            },
            {
              label: 'Discard Changes',
              onClick: () => {
                setCancelDialogOpen(false);
                navigate(`/class/${classId}`, { state: { activeTab: "assignment" } });
              },
              variant: 'danger',
            },
          ]}
        />
      </div>
    </div>
  );
}
