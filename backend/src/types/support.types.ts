export type IssueType =
  | 'rollback'
  | 'sync'
  | 'auth'
  | 'performance'
  | 'data'
  | 'general';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface DiagnosisResult {
  type: IssueType;
  severity: Severity;
  description: string;
  solution: string;
  automated: boolean;
  confidence: number;
}

export interface FixAction {
  success: boolean;
  action: string;
}

export interface FixResult {
  success: boolean;
  fixes: FixAction[];
  message: string;
}

export interface OptimizationAction {
  success: boolean;
  action: string;
}

export interface OptimizationResult {
  success: boolean;
  optimizations: OptimizationAction[];
  message: string;
}
