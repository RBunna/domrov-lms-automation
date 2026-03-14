// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";

// interface CreateAssignmentData {
//   title: string;
//   session: string;
//   submissionType: "individual" | "group";
//   instructions: string;
//   startDate: string;
//   startTime: string;
//   dueDate: string;
//   dueTime: string;
//   maxScore: number;
//   allowedSubmissionMethod: string;
//   allowLateSubmissions: boolean;
//   aiEvaluationEnabled: boolean;
//   learningResources: File[];
// }

// export default function CreateAssignmentForm({ classId }: { classId: string }) {
//   const router = useRouter();
//   const draftKey = `draft_assignment_${classId}`;
  
//   const [formData, setFormData] = useState<CreateAssignmentData>({
//     title: "",
//     session: new Date().getFullYear().toString(),
//     submissionType: "individual",
//     instructions: "",
//     startDate: "",
//     startTime: "",
//     dueDate: "",
//     dueTime: "",
//     maxScore: 100,
//     allowedSubmissionMethod: "both",
//     allowLateSubmissions: false,
//     aiEvaluationEnabled: false,
//     learningResources: [],
//   });

//   const [uploadedFiles, setUploadedFiles] = useState<
//     Array<{ name: string; type: string }>
//   >([]);

//   // Load saved draft on component mount
//   useEffect(() => {
//     const savedDraft = localStorage.getItem(draftKey);
//     if (savedDraft) {
//       try {
//         const parsed = JSON.parse(savedDraft);
//         setFormData(parsed);
//       } catch (error) {
//         console.error("Failed to load draft:", error);
//       }
//     }
//   }, [draftKey]);

//   // Auto-save to localStorage whenever formData changes
//   useEffect(() => {
//     localStorage.setItem(draftKey, JSON.stringify(formData));
//   }, [formData, draftKey]);

//   const handleInputChange = (
//     e: React.ChangeEvent<
//       HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
//     >
//   ) => {
//     const { name, value, type } = e.currentTarget;

//     if (type === "checkbox") {
//       setFormData((prev) => ({
//         ...prev,
//         [name]: (e.currentTarget as HTMLInputElement).checked,
//       }));
//     } else {
//       setFormData((prev) => ({
//         ...prev,
//         [name]: value,
//       }));
//     }
//   };

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = Array.from(e.target.files || []);
//     setFormData((prev) => ({
//       ...prev,
//       learningResources: [...prev.learningResources, ...files],
//     }));

//     // Add to display list
//     files.forEach((file) => {
//       setUploadedFiles((prev) => [
//         ...prev,
//         { name: file.name, type: file.type },
//       ]);
//     });
//   };

//   const handleRemoveFile = (index: number) => {
//     setFormData((prev) => ({
//       ...prev,
//       learningResources: prev.learningResources.filter((_, i) => i !== index),
//     }));
//     setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // TODO: Submit to API
//     console.log("Assignment Data:", formData);
//     // router.push(`/class/${classId}`);
//   };

//   const handlePreview = () => {
//     // TODO: Show preview modal
//     console.log("Preview:", formData);
//   };

//   return (
//     <div className="min-h-screen p-8 bg-slate-50">
//       <div className="max-w-4xl p-8 mx-auto bg-white rounded-lg shadow-sm">
//         <form onSubmit={handleSubmit} className="space-y-8">
//           {/* General Information Section */}
//           <section>
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-xl font-semibold text-slate-900">
//                 General Information
//               </h2>
//               <div className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 rounded bg-blue-50">
//                 ℹ
//                 REQUIRED INFO
//               </div>
//             </div>

//             <div className="space-y-4">
//               {/* Assignment Title */}
//               <div>
//                 <label className="block mb-2 text-sm font-medium text-slate-700">
//                   Assignment Title <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   name="title"
//                   value={formData.title}
//                   onChange={handleInputChange}
//                   placeholder="Advanced Database Systems Project"
//                   className="w-full px-4 py-3 transition-colors bg-white border rounded-lg border-slate-300 text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   required
//                 />
//               </div>

//               {/* Session and Submission Type */}
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block mb-2 text-sm font-medium text-slate-700">
//                     Session <span className="text-red-500">*</span>
//                   </label>
//                   <div className="relative">
//                     <input
//                       type="text"
//                       name="session"
//                       value={formData.session}
//                       onChange={handleInputChange}
//                       className="w-full px-4 py-3 transition-colors bg-white border rounded-lg border-slate-300 text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-text"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block mb-2 text-sm font-medium text-slate-700">
//                     Submission Type
//                   </label>
//                   <select
//                     name="submissionType"
//                     value={formData.submissionType}
//                     onChange={handleInputChange}
//                     className="w-full px-4 py-3 transition-colors bg-white border rounded-lg appearance-none cursor-pointer border-slate-300 text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   >
//                     <option value="individual">Individual Submission</option>
//                     <option value="group">Group Submission</option>
//                   </select>
//                 </div>
//               </div>

//               {/* Instructions */}
//               <div>
//                 <label className="block mb-2 text-sm font-medium text-slate-700">
//                   Instructions <span className="text-red-500">*</span>
//                 </label>
//                 <div className="overflow-hidden border rounded-lg border-slate-200">
//                   <div className="flex items-center gap-2 p-3 border-b bg-slate-50 border-slate-200">
//                     <button
//                       type="button"
//                       className="p-1 font-bold rounded hover:bg-slate-200"
//                       title="Bold"
//                     >
//                       B
//                     </button>
//                     <button
//                       type="button"
//                       className="p-1 italic rounded hover:bg-slate-200"
//                       title="Italic"
//                     >
//                       I
//                     </button>
//                     <button
//                       type="button"
//                       className="p-1 rounded hover:bg-slate-200"
//                       title="List"
//                     >
//                       ≡
//                     </button>
//                     <button
//                       type="button"
//                       className="p-1 rounded hover:bg-slate-200"
//                       title="Link"
//                     >
//                       🔗
//                     </button>
//                   </div>
//                   <textarea
//                     name="instructions"
//                     value={formData.instructions}
//                     onChange={handleInputChange}
//                     placeholder="Outline the expectations, deliverables, and any technical constraints for students..."
//                     className="w-full h-32 px-4 py-3 bg-white border resize-none text-slate-900 placeholder-slate-400 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     required
//                   />
//                 </div>
//               </div>
//             </div>
//           </section>

//           {/* Scheduling & Grading Section */}
//           <section className="pt-8 border-t border-slate-200">
//             <h2 className="mb-6 text-xl font-semibold text-slate-900">
//               Scheduling & Grading
//             </h2>

//             <div className="space-y-4">
//               {/* Date and Time Fields */}
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block mb-2 text-sm font-medium text-slate-700">
//                     Start Date & Time
//                   </label>
//                   <input
//                     type="datetime-local"
//                     className="w-full px-4 py-3 transition-colors bg-white border rounded-lg cursor-pointer border-slate-300 text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     value={formData.startDate}
//                     onChange={(e) =>
//                       setFormData({ ...formData, startDate: e.target.value })
//                     }
//                   />
//                 </div>

//                 <div>
//                   <label className="block mb-2 text-sm font-medium text-slate-700">
//                     Due Date & Time
//                   </label>
//                   <input
//                     type="datetime-local"
//                     className="w-full px-4 py-3 transition-colors bg-white border rounded-lg cursor-pointer border-slate-300 text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     value={formData.dueDate}
//                     onChange={(e) =>
//                       setFormData({ ...formData, dueDate: e.target.value })
//                     }
//                   />
//                 </div>
//               </div>

//               {/* Max Score and Submission Method */}
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block mb-2 text-sm font-medium text-slate-700">
//                     Max Score
//                   </label>
//                   <input
//                     type="number"
//                     name="maxScore"
//                     value={formData.maxScore}
//                     onChange={handleInputChange}
//                     className="w-full px-4 py-3 transition-colors bg-white border rounded-lg border-slate-300 text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-text"
//                   />
//                 </div>

//                 <div>
//                   <label className="block mb-2 text-sm font-medium text-slate-700">
//                     Allowed Submission Method
//                   </label>
//                   <select
//                     name="allowedSubmissionMethod"
//                     value={formData.allowedSubmissionMethod}
//                     onChange={handleInputChange}
//                     className="w-full px-4 py-3 transition-colors bg-white border rounded-lg appearance-none cursor-pointer border-slate-300 text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   >
//                     <option value="both">Both File & Text</option>
//                     <option value="file">File Only</option>
//                     <option value="text">Text Only</option>
//                   </select>
//                 </div>
//               </div>

//               {/* Toggles */}
//               <div className="pt-2 space-y-3">
//                 <div className="flex items-center justify-between">
//                   <p className="font-medium text-slate-900">
//                     Allow Late Submissions
//                   </p>
//                   <label className="relative inline-flex items-center">
//                     <input
//                       type="checkbox"
//                       name="allowLateSubmissions"
//                       checked={formData.allowLateSubmissions}
//                       onChange={handleInputChange}
//                       className="sr-only peer"
//                     />
//                     <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                   </label>
//                 </div>

//                 <div className="flex items-center justify-between p-4 border border-purple-200 rounded-lg bg-purple-50">
//                   <div>
//                     <p className="font-medium text-slate-900">
//                       AI Evaluation Enable
//                     </p>
//                     <p className="text-sm text-slate-600">
//                       Automatically analyze submissions for rubric alignment
//                       and plagiarism.
//                     </p>
//                   </div>
//                   <label className="relative inline-flex items-center">
//                     <input
//                       type="checkbox"
//                       name="aiEvaluationEnabled"
//                       checked={formData.aiEvaluationEnabled}
//                       onChange={handleInputChange}
//                       className="sr-only peer"
//                     />
//                     <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                   </label>
//                 </div>
//               </div>
//             </div>
//           </section>

//           {/* Learning Resources Section */}
//           <section className="pt-8 border-t border-slate-200">
//             <h2 className="mb-6 text-xl font-semibold text-slate-900">
//               Learning Resources
//             </h2>

//             <label
//               htmlFor="file-upload"
//               className="flex flex-col items-center p-8 text-center transition-colors border-2 border-dashed rounded-lg cursor-pointer border-slate-300 hover:border-blue-400 hover:bg-blue-50 group"
//             >
//               <div className="mb-3 text-4xl">📁</div>
//               <p className="font-medium transition-colors text-slate-900 group-hover:text-blue-700">
//                 Click to upload or drag and drop
//               </p>
//               <p className="mt-1 text-sm text-slate-500">
//                 PDF, DOCX, ZIP or MP4 (Max 500MB per file)
//               </p>
//               <input
//                 type="file"
//                 multiple
//                 onChange={handleFileUpload}
//                 className="hidden"
//                 id="file-upload"
//                 accept=".pdf,.docx,.zip,.mp4"
//               />
//             </label>

//             {/* Uploaded Files Display */}
//             {uploadedFiles.length > 0 && (
//               <div className="mt-4 space-y-2">
//                 {uploadedFiles.map((file, index) => (
//                   <div
//                     key={index}
//                     className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 border-slate-200"
//                   >
//                     <div className="flex items-center gap-3">
//                       <div>
//                         {file.type.includes("pdf") ? (
//                           "📄"
//                         ) : file.type.includes("video") ? (
//                           "🎥"
//                         ) : (
//                           "📦"
//                         )}
//                       </div>
//                       <span className="text-sm font-medium text-slate-900">
//                         {file.name}
//                       </span>
//                     </div>
//                     <button
//                       type="button"
//                       onClick={() => handleRemoveFile(index)}
//                       className="text-red-500 hover:text-red-700"
//                     >
//                       ✕
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </section>

//           {/* Action Buttons */}
//           <div className="flex items-center justify-between pt-8 border-t border-slate-200">
//             <button
//               type="button"
//               onClick={handlePreview}
//               className="px-6 py-2 font-medium text-slate-700 hover:text-slate-900"
//             >
//               Preview Assignment
//             </button>

//             <div className="flex gap-3">
//               <button
//                 type="button"
//                 onClick={() => {
//                   setFormData({
//                     title: "",
//                     session: new Date().getFullYear().toString(),
//                     submissionType: "individual",
//                     instructions: "",
//                     startDate: "",
//                     startTime: "",
//                     dueDate: "",
//                     dueTime: "",
//                     maxScore: 100,
//                     allowedSubmissionMethod: "both",
//                     allowLateSubmissions: false,
//                     aiEvaluationEnabled: false,
//                     learningResources: [],
//                   });
//                   setUploadedFiles([]);
//                 }}
//                 className="px-6 py-2 font-medium border rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50"
//               >
//                 Reset
//               </button>

//               <button
//                 type="button"
//                 onClick={() => {
//                   localStorage.setItem(`draft_assignment_${classId}`, JSON.stringify(formData));
//                   alert("Assignment saved to draft!");
//                 }}
//                 className="px-6 py-2 font-medium border rounded-lg border-slate-300 text-slate-700 hover:bg-slate-100"
//               >
//                 Save to Draft
//               </button>

//               <button
//                 type="submit"
//                 className="px-6 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
//               >
//                 Publish & Notify Students
//               </button>
//             </div>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
