import { useState, useEffect } from "react";
import { Upload, Link2, FileText, Video, Package, X, Eye } from "lucide-react";

interface CreateAssignmentData {
  title: string;
  session: string;
  submissionType: "individual" | "group";
  instructions: string;
  startDate: string;
  startTime: string;
  dueDate: string;
  dueTime: string;
  maxScore: number;
  allowedSubmissionMethod: string;
  allowLateSubmissions: boolean;
  aiEvaluationEnabled: boolean;
  learningResources: File[];
}

export default function CreateAssignmentForm({ classId }: { classId: string }) {
  const draftKey = `draft_assignment_${classId}`;

  const [formData, setFormData] = useState<CreateAssignmentData>({
    title: "",
    session: new Date().getFullYear().toString(),
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
  });

  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; type: string }>
  >([]);

  // Load saved draft on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed);
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
    }
  }, [draftKey]);

  // Auto-save to localStorage whenever formData changes
  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify(formData));
  }, [formData, draftKey]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Submit to API
    console.log("Assignment Data:", formData);
    // router.push(`/class/${classId}`);
  };

  const handlePreview = () => {
    // TODO: Show preview modal
    console.log("Preview:", formData);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Create Assignment</h1>
            <p className="mt-2 text-slate-600">
              Set up a new assignment with instructions, resources, and grading rules.
            </p>
          </div>

          {/* Top Grid: General Info | Scheduling | Grading & Rules */}
          <div className="grid grid-cols-3 gap-6">
            {/* General Information Section */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-bold tracking-wider uppercase text-slate-900">
                  General Information
                </h2>
                <span className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-full">
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
            <div className="bg-white border border-slate-200 rounded-lg p-6">
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
            <div className="bg-white border border-slate-200 rounded-lg p-6">
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
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="mb-4 text-sm font-bold tracking-wider uppercase text-slate-900">
                Instructions <span className="text-red-500">*</span>
              </h2>
              <div className="overflow-hidden border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2 p-3 border-b border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    className="p-1 text-sm font-bold text-slate-700 rounded hover:bg-slate-200 transition-colors"
                    title="Bold"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    className="p-1 text-sm italic text-slate-700 rounded hover:bg-slate-200 transition-colors"
                    title="Italic"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    className="p-1 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                    title="List"
                  >
                    ≡
                  </button>
                  <button
                    type="button"
                    className="p-1 text-slate-700 rounded hover:bg-slate-200 transition-colors"
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
                  className="w-full h-40 px-4 py-3 text-sm bg-white text-slate-900 resize-none placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Resources Section */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="mb-4 text-sm font-bold tracking-wider uppercase text-slate-900">
                Resources
              </h2>

              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center p-8 mb-4 text-center border-2 border-dashed border-slate-300 rounded-lg cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50 group"
              >
                <div className="mb-3">
                  <Upload className="w-10 h-10 mx-auto text-slate-400 transition-colors group-hover:text-blue-500" />
                </div>
                <p className="text-sm font-medium text-slate-700 transition-colors group-hover:text-blue-700">
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
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
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
                        className="flex-shrink-0 p-1 ml-2 text-slate-400 transition-colors hover:text-red-600"
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    title: "",
                    session: new Date().getFullYear().toString(),
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
                  });
                  setUploadedFiles([]);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg transition-colors hover:bg-slate-50"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={() => {
                  localStorage.setItem(`draft_assignment_${classId}`, JSON.stringify(formData));
                  alert("Assignment saved to draft!");
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg transition-colors hover:bg-slate-50"
              >
                Save to Draft
              </button>

              <button
                type="submit"
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
              >
                Publish & Notify
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
