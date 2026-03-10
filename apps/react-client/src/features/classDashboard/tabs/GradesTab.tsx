"use client";

interface GradesTabProps {
  classId: string;
}

/**
 * GradesTab - Shows student grades and performance.
 */
export default function GradesTab({ classId: _classId }: GradesTabProps) {
  // Mock grade data
  const gradeCategories = [
    {
      category: "Assignments",
      weight: "40%",
      score: "85/100",
      percentage: "85%",
    },
    {
      category: "Quizzes",
      weight: "30%",
      score: "92/100",
      percentage: "92%",
    },
    {
      category: "Mid-term Exam",
      weight: "15%",
      score: "78/100",
      percentage: "78%",
    },
    {
      category: "Final Project",
      weight: "15%",
      score: "88/100",
      percentage: "88%",
    },
  ];

  const totalGrade = "85.5%";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Overall Grade Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Overall Grade</h2>
        <div className="text-4xl font-bold text-blue-600 mb-1">{totalGrade}</div>
        <p className="text-sm text-slate-600">B+ (Good)</p>
      </div>

      {/* Grade Breakdown */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Grade Breakdown</h2>
        
        <div className="space-y-4">
          {gradeCategories.map((item, index) => (
            <div
              key={index}
              className="border border-slate-200 rounded-lg p-4 hover:shadow-md hover:border-slate-300 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900">{item.category}</h3>
                <span className="text-sm text-slate-500">Weight: {item.weight}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Score: {item.score}</span>
                <span className="text-lg font-semibold text-blue-600">{item.percentage}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3 w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: item.percentage }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grade Distribution Info */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 mb-2">Grading Scale</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div><span className="font-medium">A:</span> 90-100%</div>
          <div><span className="font-medium">B:</span> 80-89%</div>
          <div><span className="font-medium">C:</span> 70-79%</div>
          <div><span className="font-medium">D:</span> 60-69%</div>
        </div>
      </div>
    </div>
  );
}
