export type UserRole = 'superadmin' | 'student' | 'lecturer' | 'jobprovider';

export interface User {
  id: string;
  username: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
}

// ── Job Post types ─────────────────────────────────────────────
export interface JobPost {
  _id: string;
  postedBy: {
    _id: string;
    companyName: string;
    companyWebsite: string;
  };
  title: string;
  description: string;
  companyName: string;
  jobType: 'full-time' | 'part-time' | 'internship' | 'remote';
  location: string;
  skills: string[];
  salaryRange: string;
  applicationLink: string;
  deadline: string;
  isExpired: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  attachment?: {
  file_path:     string;
  original_name: string;
  size_bytes:    number;
} | null;
}