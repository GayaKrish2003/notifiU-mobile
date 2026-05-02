export type UserRole = 'superadmin' | 'student' | 'lecturer' | 'jobprovider' | 'clubpresident';

export interface LoginResponse {
  success:       boolean;
  _id:           string;
  name:          string;
  email:         string;
  role:          UserRole;
  accountStatus: string;
  accessToken:   string;
  studentId?:    string;
  phonenumber?:  string;
}

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
  url:           string;
} | null;
}


// ── Event types ────────────────────────────────────────────────
export interface RsvpEntry {
  name?:          string;
  studentId:      string;
  contactNumber:  string;
  rsvpTime?:      string;
}

export interface AttendanceEntry {
  studentId: string;
  markedAt?: string;
}

export interface Event {
  _id:            string;
  title:          string;
  description:    string;
  date:           string;
  time:           string;
  location:       string;
  organizingClub: string;
  category:       'Workshop' | 'Seminar' | 'Club Activity' | 'Sports' | 'Musical';
  type:           'Event' | 'Workshop';
  priority:       'Normal' | 'Urgent';
  seatLimit:      number;
  posterImage:    string | null;
  posterImageKey: string | null;
  creatorRole:    'superadmin' | 'clubpresident' | 'lecturer';
  createdBy:      string;
  status:         'Upcoming' | 'History';
  startTime:      string;
  endTime:        string;
  rsvpList:       RsvpEntry[];
  attendanceList: AttendanceEntry[];
  createdAt:      string;
  updatedAt:      string;
}

export interface EventNotification {
  eventId:      string;
  title:        string;
  message:      string;
  type:         'reminder' | 'attendance';
  hasAttended?: boolean;
}