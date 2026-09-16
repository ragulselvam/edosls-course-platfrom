export type RoleName = 'super_admin' | 'college_admin' | 'trainer' | 'student';

export interface User {
  id: number;
  email: string;
  role_id?: number;
  role_name?: RoleName;
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  college_id?: number | null;
  college_name?: string | null;
  college_code?: string | null;
  is_active?: boolean | number;
  created_at?: string;
  // Student specific
  roll_number?: string | null;
  department?: string | null;
  year_of_study?: number | null;
  batch?: string | null;
}

export interface College {
  id: number;
  name: string;
  code: string;
  logo_url?: string | null;
  accent_color?: string | null;
  is_active?: boolean | number;
  student_count?: number;
  course_count?: number;
  certificate_count?: number;
  created_at?: string;
}

export interface Course {
  id: number;
  college_id?: number | null;
  college_name?: string | null;
  college_code?: string | null;
  trainer_id?: number | null;
  trainer_name?: string | null;
  title: string;
  code: string;
  description?: string;
  category?: string;
  level?: string;
  duration?: string;
  thumbnail_url?: string | null;
  instructor_name?: string;
  learning_objectives?: string;
  batch?: string;
  enrollment_type?: string;
  visibility?: string;
  passing_percentage?: number;
  certificate_enabled?: boolean | number;
  is_published?: boolean | number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  module_count?: number;
  lesson_count?: number;
  enrollment_count?: number;
  modules?: CourseModule[];
}

export interface CourseModule {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  order_index: number;
  created_at?: string;
  contents?: CourseContent[];
}

export interface CourseContent {
  id: number;
  module_id: number;
  title: string;
  content_type: 'video' | 'markdown' | 'pdf' | 'code' | 'link' | 'quiz';
  content_data?: string;
  file_url?: string | null;
  duration_minutes?: number;
  is_mandatory?: boolean | number;
  order_index?: number;
  created_at?: string;
}

export interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
  progress_percentage: number;
  enrolled_at: string;
  completed_at?: string | null;
  course_title?: string;
  course_code?: string;
  course_thumbnail?: string;
  student_name?: string;
  student_email?: string;
  student_roll?: string;
  college_name?: string;
  certificate_code?: string | null;
}

export interface Assessment {
  id: number;
  course_id: number;
  college_id?: number | null;
  title: string;
  description?: string;
  assessment_type: 'quiz' | 'exam' | 'coding';
  time_limit_minutes: number;
  passing_percentage: number;
  max_attempts: number;
  is_published: boolean | number;
  created_at?: string;
  course_title?: string;
  course_code?: string;
  questions?: AssessmentQuestion[];
  question_count?: number;
}

export interface AssessmentQuestion {
  id?: number;
  assessment_id?: number;
  question_text: string;
  question_type: 'mcq' | 'multiple_select' | 'coding' | 'text';
  points: number;
  order_index?: number;
  code_template?: string;
  expected_output?: string;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id?: number;
  option_text: string;
  is_correct: boolean;
  order_index?: number;
}

export interface Certificate {
  id: number;
  certificate_code: string;
  user_id: number;
  course_id: number;
  college_id?: number | null;
  student_name?: string;
  student_roll?: string;
  course_title?: string;
  course_code?: string;
  college_name?: string;
  issued_at: string;
  score_percentage?: number;
  grade?: string;
  qr_code_url?: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type?: string;
  is_read: boolean | number;
  created_at: string;
}

export interface DashboardMetrics {
  total_colleges?: number;
  active_colleges?: number;
  total_students?: number;
  total_courses?: number;
  published_courses?: number;
  total_certificates?: number;
  global_completion_rate?: number;
  colleges_breakdown?: Array<{
    id: number;
    name: string;
    code: string;
    student_count: number;
    course_count: number;
    certificate_count: number;
    is_active: boolean | number;
  }>;
  recent_audits?: Array<{
    id: number;
    action: string;
    resource_type: string;
    resource_id?: number;
    user_email?: string;
    college_name?: string;
    created_at: string;
  }>;
}

export interface SandboxRunResult {
  stdout: string;
  stderr: string;
  exit_code: number;
  execution_time_ms: number;
  status: 'success' | 'error' | 'timeout';
  test_results?: Array<{
    name: string;
    passed: boolean;
    expected?: string;
    actual?: string;
  }>;
}
