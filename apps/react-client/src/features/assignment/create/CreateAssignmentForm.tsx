import { useState, useEffect } from "react";

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
    <div className="p-4 bg-slate-50">
      <div className="max-w-2xl p-5 mx-auto bg-white rounded-lg shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Information Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-900">
                General Information
              </h2>
            </div>

            <div className="space-y-2">
              {/* Assignment Title */}
              <div>
                <label className="block mb-1 text-xs font-medium text-slate-700">
                  Assignment Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter title"
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              {/* Session and Submission Type */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700">
                    Session <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="session"
                    value={formData.session}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-text"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700">
                    Submission Type
                  </label>
                  <select
                    name="submissionType"
                    value={formData.submissionType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer appearance-none"
                  >
                    <option value="individual">Individual</option>
                    <option value="group">Group</option>
                  </select>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block mb-1 text-xs font-medium text-slate-700">
                  Instructions <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  placeholder="Enter instructions"
                  className="w-full h-16 px-3 py-1.5 text-sm bg-white text-slate-900 placeholder-slate-400 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  required
                />
              </div>
            </div>
          </section>

          {/* Scheduling & Grading Section */}
          <section className="pt-3 border-t border-slate-200">
            <h2 className="mb-2 text-base font-semibold text-slate-900">
              Scheduling & Grading
            </h2>

            <div className="space-y-2">
              {/* Date and Time Fields */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Max Score and Submission Method */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700">
                    Max Score
                  </label>
                  <input
                    type="number"
                    name="maxScore"
                    value={formData.maxScore}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-text"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700">
                    Submission Method
                  </label>
                  <select
                    name="allowedSubmissionMethod"
                    value={formData.allowedSubmissionMethod}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer appearance-none"
                  >
                    <option value="both">Both</option>
                    <option value="file">File Only</option>
                    <option value="text">Text Only</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-900">
                    Late Submissions
                  </p>
                  <label className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      name="allowLateSubmissions"
                      checked={formData.allowLateSubmissions}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-2 text-xs border border-purple-200 rounded bg-purple-50">
                  <div>
                    <p className="font-medium text-slate-900">
                      AI Evaluation
                    </p>
                    <p className="text-slate-600">
                      Auto-analyze submissions
                    </p>
                  </div>
                  <label className="relative inline-flex items-center shrink-0">
                    <input
                      type="checkbox"
                      name="aiEvaluationEnabled"
                      checked={formData.aiEvaluationEnabled}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Learning Resources Section */}
          <section className="pt-3 border-t border-slate-200">
            <h2 className="mb-2 text-base font-semibold text-slate-900">
              Learning Resources
            </h2>

            <label
              htmlFor="file-upload"
              className="flex flex-col items-center p-3 text-center transition-colors border-2 border-dashed rounded-lg cursor-pointer border-slate-300 hover:border-blue-400 hover:bg-blue-50 group"
            >
              <p className="text-xs font-medium transition-colors text-slate-900 group-hover:text-blue-700">
                Click to upload files
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                PDF, DOCX, ZIP or MP4
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
              <div className="mt-2 space-y-1">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded-lg bg-slate-50 border-slate-200"
                  >
                    <span className="text-xs font-medium truncate text-slate-900">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handlePreview}
              className="px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 font-medium"
            >
              Preview
            </button>

            <div className="flex gap-2">
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
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={() => {
                  localStorage.setItem(`draft_assignment_${classId}`, JSON.stringify(formData));
                  alert("Saved to draft!");
                }}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
              >
                Draft
              </button>

              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Publish
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
