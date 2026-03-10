import { Avatar, StatusBadge } from "@/components/primitives";

interface StudentsTabProps {
  classId: string;
}

/**
 * StudentsTab - Student list and management view.
 */
export default function StudentsTab({ classId: _classId }: StudentsTabProps) {
  const students = [
    { id: "1", name: "John Doe", email: "john.doe@example.com", status: "active" as const },
    { id: "2", name: "Jane Smith", email: "jane.smith@example.com", status: "active" as const },
    { id: "3", name: "Bob Johnson", email: "bob.johnson@example.com", status: "active" as const },
    { id: "4", name: "Alice Brown", email: "alice.brown@example.com", status: "active" as const },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Students ({students.length})
          </h2>
        </div>

        <div className="divide-y divide-slate-200">
          {students.map((student) => (
            <div
              key={student.id}
              className="p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Avatar name={student.name} size="sm" bgColor="bg-blue-100" className="!text-blue-700" />
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">{student.name}</h4>
                  <p className="text-sm text-slate-500">{student.email}</p>
                </div>
                <StatusBadge status={student.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
