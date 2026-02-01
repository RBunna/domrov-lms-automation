interface ScoreCriteria {
    value: number[];
}

export interface EvaluateRequest {
    submission_id: string;
    score: ScoreCriteria;
    feedback: string;
    input_token: number;
    output_token: number;
}

export interface EvaluateResponse {
    success: boolean;
    message: string;
}
