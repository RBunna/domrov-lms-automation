export interface Evaluation {
  submission_id: number;
  score: number;
  feedback: string;
  penalty_score: number;
  isApproved: boolean;
  isModified: boolean;
  evaluation_type: string;
  ai_output: string;
  confidence_point: string;
}
