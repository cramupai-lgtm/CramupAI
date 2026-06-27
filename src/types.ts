export type AccountTier = "Free" | "Premium";

export const ALL_SUBJECTS = [
  "Biology",
  "Chemistry",
  "Physics",
  "Mathematics",
  "Computer Science",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Corporate Law",
  "Criminal Law",
  "International Law",
  "History",
  "Geography",
  "Political Science",
  "Economics",
  "Psychology",
  "Sociology",
  "Philosophy",
  "Medicine",
  "Nursing",
  "Pharmacy",
  "Dentistry",
  "Business Administration",
  "Marketing",
  "Finance",
  "Accounting",
  "English Literature",
  "Linguistics",
  "Art History",
  "Environmental Science",
  "Astronomy",
  "Data Science"
];

export interface AppUser {
  uid: string;
  email: string;
  account_tier: AccountTier;
  selected_subject: string;
  monthly_uploads_used_counter: number;
  display_name?: string;
  auto_renew?: boolean;
  premium_purchased_at?: string;
  billing_period?: "monthly" | "annual";
  paypal_email?: string;
}

export type FileType = "PDF" | "Video" | "Audio" | "YouTube URL" | "Photo";

export interface Material {
  id: string;
  user_id: string;
  title: string;
  subject?: string;
  file_type: FileType;
  raw_extracted_text: string;
  structured_summary_markdown: string;
  translation_language: string;
  generated_at: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  storage_path?: string;
}

export interface QuizQuestion {
  id: string;
  question_text: string;
  choices: string[]; // empty for fill-in-the-blanks
  correct_answer: string;
  explanation: string; // detailed explanation of why correct/incorrect
}

export interface QuizRecord {
  id: string;
  material_id: string;
  quiz_type: "MCQ" | "Fill-In-The-Blanks";
  selected_question_count: number;
  selected_choices_per_question: number;
  questions: QuizQuestion[];
}

export interface Flashcard {
  id: string;
  material_id: string;
  question_front: string;
  answer_back: string;
  is_custom?: boolean;
  color_theme?: string;
}

export interface ChatMessage {
  id: string;
  material_id: string;
  message_sender: "User" | "AI";
  text_payload: string;
  timestamp: string;
}
