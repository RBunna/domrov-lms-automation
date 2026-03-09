export interface Assessment {
  assessment_id: number;
  class_id: number;
  ai_model_id: number;
  title: string;
  instruction: string;
  start_date: Date;
  end_date: Date;
  max_score: number;
  submission_type: string;
  allow_late: boolean;
  evaluation_criteria: string;
  ai_evaluation_enable: boolean;
  allowTeamSubmission: boolean;
}
