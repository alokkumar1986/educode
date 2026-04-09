export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'student' | 'instructor' | 'admin';
  createdAt: any;
  enrolledCourses?: string[]; // Array of course IDs
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string; // HTML, CSS, JS, etc.
  instructorId: string;
  instructorName: string;
  instructorPhoto: string;
  published: boolean;
  createdAt: any;
  updatedAt: any;
  lessonCount: number;
  thumbnail?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Quiz {
  questions: QuizQuestion[];
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string; // Markdown
  quiz?: Quiz;
  order: number;
  createdAt: any;
}

export interface UserProgress {
  userId: string;
  courseId: string;
  completedLessons: string[]; // Array of lesson IDs
  lastAccessedAt: any;
}

export type Category = 'HTML' | 'CSS' | 'JavaScript' | 'jQuery' | 'AJAX' | 'Angular' | 'React' | 'Node.js' | 'Python' | 'Other';

export const CATEGORIES: Category[] = [
  'HTML', 'CSS', 'JavaScript', 'jQuery', 'AJAX', 'Angular', 'React', 'Node.js', 'Python', 'Other'
];
