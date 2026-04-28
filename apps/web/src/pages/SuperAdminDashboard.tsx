import React, { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  BookOpen,
  Briefcase,
  Calendar,
  MessageCircleQuestion,
  User as UserIcon,
  Search,
  ChevronDown,
  Trash2,
  FileText,
  Download,
  X as XIcon,
  Clock,
  Pencil,
  Archive,
  ArrowLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Logo from "../components/Logo";
import ProfileModal from "../components/ProfileModal";
import AdminUserEditModal from "../components/AdminUserEditModal";
import ActivityModal from "../components/ActivityModal";
import api, {
  getUsersByRole,
  updateAccountStatus,
  exportUsersCSV,
  exportUsersExcel,
  deleteUser,
  getUserActivity,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  addTicketResponse,
  getModules,
  getModuleById,
  deleteModule,
} from "../services/api";

type TabKey = "home" | "module" | "career" | "events" | "faqs" | "profile";
type TicketView = "list" | "detail";
type ExportFormat = "excel" | "csv";
type ModuleView =
  | "dashboard"
  | "create"
  | "edit"
  | "assignLecturer"
  | "enrollments"
  | "reports";
type ModuleStatusFilter = "all" | "active" | "archived";

type ApiError = {
  response?: { data?: { message?: string } };
};

interface UserData {
  _id?: string;
  name: string;
  email?: string;
  role?: string;
  profileImage?: string;
  studentId?: string;
  lecturerId?: string;
  accountStatus?: string;
  paymentStatus?: string;
  faculty?: string;
  department?: string;
  companyName?: string;
  [key: string]: unknown;
}

interface HeaderUser {
  name: string;
  displayId: string;
  initials: string;
  profileImage?: string;
}

interface RoleOption {
  value: string;
  label: string;
}

interface ColumnDef {
  key: string;
  label: string;
}

interface TicketData {
  _id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
  user_id: { _id?: string; username?: string; role?: string };
}

interface TicketResponseData {
  _id: string;
  response_message: string;
  createdAt: string;
  responded_by: { username?: string; role?: string };
}

interface AdminModuleFileItem {
  storedName: string;
  displayName: string;
  url: string;
}

interface AdminModuleData {
  _id: string;
  moduleCode: string;
  moduleName: string;
  semester: string;
  academicYear: string;
  archived?: boolean;
  lecturerId?: string | { _id?: string; name?: string; email?: string };
  files: AdminModuleFileItem[];
}

interface LecturerOption {
  _id: string;
  name: string;
  email?: string;
  lecturerId?: string;
}

interface EnrollmentRecord {
  _id?: string;
  studentId?: string;
  studentName?: string;
  moduleId?: string;
  moduleCode?: string;
  moduleName?: string;
  [key: string]: unknown;
}

interface ModuleFormState {
  moduleName: string;
  moduleCode: string;
  semester: string;
  academicYear: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (format: ExportFormat) => Promise<void>;
  selectedRole: string;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onDownload,
  selectedRole,
}) => {
  const [format, setFormat] = useState<ExportFormat>("excel");
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#1A1C2C]/50 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300">
        <div className="bg-[#1A1C2C] p-6 text-white relative flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FBB017] rounded-xl flex items-center justify-center text-[#2D3A5D]">
              <Download size={20} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Export Data</h3>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <XIcon size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <p className="text-[#2D3A5D]/60 font-bold text-xs uppercase tracking-widest text-center">
            Select format for <span className="text-[#FBB017]">{selectedRole}s</span> list
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setFormat("excel")}
              className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                format === "excel"
                  ? "border-[#FBB017] bg-[#FFF9EE]"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div className={`p-3 rounded-xl ${format === "excel" ? "bg-[#FBB017] text-white" : "bg-gray-100 text-gray-400"}`}>
                <FileText size={24} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${format === "excel" ? "text-[#FBB017]" : "text-gray-400"}`}>
                Excel
              </span>
            </button>

            <button
              onClick={() => setFormat("csv")}
              className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                format === "csv"
                  ? "border-[#FBB017] bg-[#FFF9EE]"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div className={`p-3 rounded-xl ${format === "csv" ? "bg-[#FBB017] text-white" : "bg-gray-100 text-gray-400"}`}>
                <FileText size={24} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${format === "csv" ? "text-[#FBB017]" : "text-gray-400"}`}>
                CSV
              </span>
            </button>
          </div>

          <button
            onClick={() => {
              setIsDownloading(true);
              onDownload(format).finally(() => setIsDownloading(false));
            }}
            disabled={isDownloading}
            className="w-full bg-[#1A1C2C] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#2D3A5D] transition-all active:scale-[0.98] mt-4"
          >
            {isDownloading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Download size={18} />
            )}
            <span className="text-xs uppercase tracking-widest">
              {isDownloading ? "Downloading..." : `Download ${format.toUpperCase()}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface StatusBadgeProps {
  status: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, onChange, disabled }) => {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    suspended: "bg-red-100 text-red-700",
    deactivated: "bg-gray-100 text-gray-500",
  };

  const currentClass = colors[status] || colors.pending;

  return (
    <select
      value={status}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      disabled={disabled}
      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest outline-none border-none cursor-pointer appearance-none text-center ${currentClass} disabled:opacity-70 disabled:cursor-not-allowed transition-all focus:ring-2 focus:ring-[#FBB017]`}
      style={{ WebkitAppearance: "none", MozAppearance: "none" } as React.CSSProperties}
    >
      <option value="active">ACTIVE</option>
      <option value="pending">PENDING</option>
      <option value="suspended">SUSPENDED</option>
      <option value="deactivated">DEACTIVATED</option>
    </select>
  );
};

interface PaymentStatusBadgeProps {
  status: string;
  onChange: (value: string) => void;
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status, onChange }) => {
  const colors: Record<string, string> = {
    paid: "bg-green-100 text-green-700 w-24",
    process: "bg-blue-100 text-blue-700 w-24",
    pending: "bg-rose-100 text-rose-700 w-24",
  };

  const currentClass = colors[status] || colors.pending;

  return (
    <select
      value={status || "pending"}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      className={`py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest outline-none border-none cursor-pointer appearance-none text-center ${currentClass} transition-all focus:ring-2 focus:ring-[#FBB017]`}
      style={{ WebkitAppearance: "none", MozAppearance: "none" } as React.CSSProperties}
    >
      <option value="paid">PAID</option>
      <option value="process">PROCESS</option>
      <option value="pending">PENDING</option>
    </select>
  );
};

interface UserTableProps {
  users: UserData[];
  roleType: string;
  onStatusChange: (userId: string, newStatus: string, userName: string) => void;
  onPaymentStatusChange: (userId: string, newStatus: string, userName: string) => void;
  onDelete: (userId: string, userName: string) => void;
  onEdit: (user: UserData) => void;
  onViewActivity: (userId: string) => void;
  currentUserId?: string;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  roleType,
  onStatusChange,
  onPaymentStatusChange,
  onDelete,
  onEdit,
  onViewActivity,
  currentUserId,
}) => {
  const columns: ColumnDef[] = [
    {
      key: "name",
      label:
        roleType === "student"
          ? "Student Name"
          : roleType === "lecturer"
            ? "Lecturer Name"
            : roleType === "jobprovider"
              ? "Provider Name"
              : "User Name",
    },
    { key: "specialization", label: "Specialization" },
    { key: "accountStatus", label: "Profile" },
    { key: "payment", label: "Payment" },
    { key: "actions", label: "Actions" },
  ];

  const getInitials = (name: string): string => {
    if (!name) return "NA";
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const getId = (user: UserData): string | undefined => {
    return user.studentId || user.lecturerId || user._id?.substring(0, 8).toUpperCase();
  };

  if (!users || users.length === 0) {
    return <div className="text-center py-20 text-gray-300 font-bold tracking-widest uppercase text-sm">No {roleType}s found</div>;
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-gray-100">
      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] bg-[#F8F9FA] px-8 py-5 border-b border-gray-100">
        {columns.map((col) => (
          <p key={col.key} className="text-[#2D3A5D]/60 font-black text-[11px] uppercase tracking-widest">
            {col.label}
          </p>
        ))}
      </div>

      {users.map((user, idx) => (
        <div
          key={user._id || idx}
          className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] items-center px-8 py-5 border-b border-gray-50 hover:bg-[#FFF9EE]/30 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 ${idx % 3 === 0 ? "bg-blue-100 text-blue-600" : idx % 3 === 1 ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-600"} rounded-full flex items-center justify-center text-xs font-black shrink-0 overflow-hidden`}>
              {user.profileImage ? <img src={user.profileImage as string} alt={user.name} className="w-full h-full object-cover" /> : getInitials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="text-[#2D3A5D] font-bold text-sm truncate">{user.name}</p>
              <p className="text-[#2D3A5D]/40 font-bold text-[10px]">{getId(user)}</p>
            </div>
          </div>

          <div>
            <p className="text-[#2D3A5D]/60 font-bold text-xs uppercase">{(user.faculty || user.department || user.companyName || "N/A") as string}</p>
          </div>

          <div>
            <StatusBadge status={user.accountStatus as string} onChange={(newStatus) => onStatusChange(user._id!, newStatus, user.name)} disabled={user._id === currentUserId} />
          </div>

          <div>
            <PaymentStatusBadge status={user.paymentStatus as string} onChange={(newStatus) => onPaymentStatusChange(user._id!, newStatus, user.name)} />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(user)} className="bg-[#1A1C2C] text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#2D3A5D] transition-all">
              Edit
            </button>
            <button onClick={() => onViewActivity(user._id!)} className="bg-amber-50 text-amber-600 p-2 rounded-xl hover:bg-amber-100 transition-all active:scale-90" title="View Activity">
              <Clock size={14} />
            </button>
            {user._id !== currentUserId && (
              <button onClick={() => onDelete(user._id!, user.name)} className="bg-rose-50 text-rose-600 p-2 rounded-xl hover:bg-rose-100 transition-all active:scale-90" title="Delete Account">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  tab: TabKey;
  active?: boolean;
  onClick: (tab: TabKey) => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, tab, active = false, onClick }) => (
  <div onClick={() => onClick(tab)} className="flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-300 px-6 group">
    <Icon size={22} className={active ? "text-[#FBB017]" : "text-white/60 group-hover:text-white"} />
    <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${active ? "text-[#FBB017]" : "text-white/40 group-hover:text-white/80"}`}>{label}</span>
  </div>
);

const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [userToEdit, setUserToEdit] = useState<UserData | null>(null);
  const [activityModalUser, setActivityModalUser] = useState<{ name: string; email: string; role: string; [key: string]: unknown } | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState<boolean>(false);
  const [fullUserData, setFullUserData] = useState<UserData | null>(null);
  const [user, setUser] = useState<HeaderUser>({ name: "Super Admin", displayId: "ADMIN", initials: "SA" });

  const [moduleView, setModuleView] = useState<ModuleView>("dashboard");
  const [modules, setModules] = useState<AdminModuleData[]>([]);
  const [selectedModule, setSelectedModule] = useState<AdminModuleData | null>(null);
  const [loadingModules, setLoadingModules] = useState<boolean>(false);
  const [moduleSearch, setModuleSearch] = useState<string>("");
  const [moduleSemesterFilter, setModuleSemesterFilter] = useState<string>("all");
  const [moduleStatusFilter, setModuleStatusFilter] = useState<ModuleStatusFilter>("all");
  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);
  const [loadingLecturers, setLoadingLecturers] = useState<boolean>(false);
  const [moduleEnrollments, setModuleEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState<boolean>(false);
  const [submittingModule, setSubmittingModule] = useState<boolean>(false);
  const [selectedLecturerId, setSelectedLecturerId] = useState<string>("");
  const [workload, setWorkload] = useState<any[]>([]);
  const [semesterReport, setSemesterReport] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(false);
  const [showAllWorkload, setShowAllWorkload] = useState(false);
  const [showAllSemester, setShowAllSemester] = useState(false);

  const emptyModuleForm: ModuleFormState = {
    moduleName: "",
    moduleCode: "",
    semester: "",
    academicYear: "",
  };
  const [moduleForm, setModuleForm] = useState<ModuleFormState>(emptyModuleForm);

  const semesterOptions = [
    "Year 1 Semester 1",
    "Year 1 Semester 2",
    "Year 2 Semester 1",
    "Year 2 Semester 2",
    "Year 3 Semester 1",
    "Year 3 Semester 2",
    "Year 4 Semester 1",
    "Year 4 Semester 2",
  ];

  const [ticketView, setTicketView] = useState<TicketView>("list");
  const [allTickets, setAllTickets] = useState<TicketData[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [ticketResponses, setTicketResponses] = useState<TicketResponseData[]>([]);
  const [adminReply, setAdminReply] = useState<string>("");
  const [adminReplySending, setAdminReplySending] = useState<boolean>(false);
  const [ticketStatusUpdating, setTicketStatusUpdating] = useState<boolean>(false);
  const [ticketSearchQuery, setTicketSearchQuery] = useState<string>("");

  const roleOptions: RoleOption[] = [
    { value: "all", label: "All Users" },
    { value: "student", label: "Students" },
    { value: "lecturer", label: "Lecturers" },
    { value: "jobprovider", label: "Job Providers" },
    { value: "clubpresident", label: "Club Presidents" }, 
  ];

  const statusOptions: RoleOption[] = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" },
    { value: "suspended", label: "Suspended" },
    { value: "deactivated", label: "Deactivated" },
  ];

  const TICKET_STATUS_COLOR: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    resolved: "bg-green-100 text-green-700",
    closed: "bg-gray-100 text-gray-500",
  };

  const updateHeader = (userData: UserData | null): void => {
    if (!userData) return;
    const displayId = userData._id?.substring(0, 8).toUpperCase() || "ADMIN";
    const names = userData.name.trim().split(" ");

    let formattedName = userData.name;
    let initials = "SA";

    if (names.length >= 2) {
      formattedName = `${names[0].charAt(0).toUpperCase()}.${names[names.length - 1]}`;
      initials = (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    } else if (names.length === 1) {
      initials = names[0].substring(0, 2).toUpperCase();
    }

    setUser({ name: formattedName, displayId, initials, profileImage: userData.profileImage as string | undefined });
    setFullUserData(userData);
  };

  const fetchUsers = async (): Promise<void> => {
    try {
      setLoadingUsers(true);
      const response = await getUsersByRole(selectedRole);
      if (response.data.success) {
        let fetchedUsers = response.data.users as UserData[];

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          fetchedUsers = fetchedUsers.filter(
            (u) =>
              u.name?.toLowerCase().includes(q) ||
              u.email?.toLowerCase().includes(q) ||
              String(u.studentId || u.lecturerId || "").toLowerCase().includes(q),
          );
        }

        if (statusFilter !== "all") {
          fetchedUsers = fetchedUsers.filter((u) => (u.accountStatus || "").toLowerCase() === statusFilter);
        }

        setUsers(fetchedUsers);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchModules = async (): Promise<void> => {
    try {
      setLoadingModules(true);
      const response = await getModules();
      setModules((response.data || []) as AdminModuleData[]);
    } catch (err) {
      console.error("Failed to fetch modules:", err);
      setModules([]);
    } finally {
      setLoadingModules(false);
    }
  };

  const fetchLecturers = async (): Promise<void> => {
    try {
      setLoadingLecturers(true);
      const response = await api.get("/users/lecturers");
      setLecturers((response.data || []) as LecturerOption[]);
    } catch (err) {
      console.error("Failed to fetch lecturers:", err);
      setLecturers([]);
    } finally {
      setLoadingLecturers(false);
    }
  };

  const fetchEnrollmentsForModule = async (moduleId?: string): Promise<void> => {
    try {
      setLoadingEnrollments(true);
      const response = await api.get("/enrollments");
      const allEnrollments = response.data || [];
      const filteredByModule = moduleId ? allEnrollments.filter((e: any) => String(e.moduleId) === String(moduleId)) : allEnrollments;
      setModuleEnrollments(filteredByModule as EnrollmentRecord[]);
    } catch (err) {
      console.error("Failed to fetch enrollments:", err);
      setModuleEnrollments([]);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const fetchReports = async (): Promise<void> => {
    try {
      setLoadingReports(true);
      const [workloadRes, semesterRes] = await Promise.all([api.get("/reports/workload"), api.get("/reports/semester")]);
      setWorkload(workloadRes.data || []);
      setSemesterReport(semesterRes.data || []);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setWorkload([]);
      setSemesterReport([]);
      alert("Failed to load reports");
    } finally {
      setLoadingReports(false);
    }
  };

  const openModuleForEdit = async (moduleId: string): Promise<void> => {
    try {
      setLoadingModules(true);
      const response = await getModuleById(moduleId);
      const data = response.data as AdminModuleData;
      setSelectedModule(data);
      setModuleForm({
        moduleName: data.moduleName || "",
        moduleCode: data.moduleCode || "",
        semester: data.semester || "",
        academicYear: data.academicYear || "",
      });
      setModuleView("edit");
    } catch (err) {
      console.error("Failed to load module details:", err);
      alert("Failed to load module details");
    } finally {
      setLoadingModules(false);
    }
  };

  const openModuleForAssignLecturer = async (moduleId: string): Promise<void> => {
    try {
      setLoadingModules(true);
      const response = await getModuleById(moduleId);
      const data = response.data as AdminModuleData;
      setSelectedModule(data);
      const currentLecturerId = typeof data.lecturerId === "object" ? data.lecturerId?._id : data.lecturerId;
      setSelectedLecturerId(currentLecturerId || "");
      await fetchLecturers();
      setModuleView("assignLecturer");
    } catch (err) {
      console.error("Failed to load module details:", err);
      alert("Failed to load module details");
    } finally {
      setLoadingModules(false);
    }
  };

  const openModuleEnrollments = async (moduleId?: string): Promise<void> => {
    try {
      setModuleSearch("");
      if (moduleId) {
        setLoadingModules(true);
        const response = await getModuleById(moduleId);
        setSelectedModule(response.data as AdminModuleData);
      } else {
        setSelectedModule(null);
      }
      await fetchEnrollmentsForModule(moduleId);
      setModuleView("enrollments");
    } catch (err) {
      console.error("Failed to load enrollments:", err);
      alert("Failed to load enrollments");
    } finally {
      setLoadingModules(false);
    }
  };

  const openModuleReports = async (): Promise<void> => {
    await fetchReports();
    setModuleView("reports");
  };

  const downloadCSV = (rows: string[][], fileName: string): void => {
    const csvContent = rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportWorkload = (): void => {
    const csvRows: string[][] = [
      ["Lecturer Name", "Module Code", "Module Name", "Semester"],
      ...workload.map((row) => [String(row.lecturerName ?? ""), String(row.moduleCode ?? ""), String(row.moduleName ?? ""), String(row.semester ?? "")]),
    ];
    downloadCSV(csvRows, "lecturer_workload_report.csv");
  };

  const handleExportSemester = (): void => {
    const csvRows: string[][] = [
      ["Semester", "Module Code", "Module Name"],
      ...semesterReport.map((row) => [String(row.semester ?? ""), String(row.moduleCode ?? ""), String(row.moduleName ?? "")]),
    ];
    downloadCSV(csvRows, "semester_module_report.csv");
  };

  const displayedWorkload = showAllWorkload ? workload : workload.slice(0, 5);
  const displayedSemester = showAllSemester ? semesterReport : semesterReport.slice(0, 5);

  const resetModuleEditor = (): void => {
    setSelectedModule(null);
    setModuleForm(emptyModuleForm);
    setSelectedLecturerId("");
    setModuleEnrollments([]);
    setModuleSearch("");
  };

  const handleCreateModule = async (): Promise<void> => {
    if (!moduleForm.moduleName.trim() || !moduleForm.moduleCode.trim() || !moduleForm.semester.trim() || !moduleForm.academicYear.trim()) {
      alert("Please fill all module fields");
      return;
    }

    try {
      setSubmittingModule(true);
      await api.post("/modules", {
        moduleName: moduleForm.moduleName.trim(),
        moduleCode: moduleForm.moduleCode.trim().toUpperCase(),
        semester: moduleForm.semester.trim(),
        academicYear: moduleForm.academicYear.trim(),
      });
      alert("Module created successfully");
      resetModuleEditor();
      await fetchModules();
      setModuleView("dashboard");
    } catch (err) {
      console.error("Failed to create module:", err);
      alert("Failed to create module");
    } finally {
      setSubmittingModule(false);
    }
  };

  const handleUpdateModule = async (): Promise<void> => {
    if (!selectedModule?._id) return;
    if (!moduleForm.moduleName.trim() || !moduleForm.moduleCode.trim() || !moduleForm.semester.trim() || !moduleForm.academicYear.trim()) {
      alert("Please fill all module fields");
      return;
    }

    try {
      setSubmittingModule(true);
      await api.put(`/modules/${selectedModule._id}`, {
        moduleName: moduleForm.moduleName.trim(),
        moduleCode: moduleForm.moduleCode.trim().toUpperCase(),
        semester: moduleForm.semester.trim(),
        academicYear: moduleForm.academicYear.trim(),
      });
      alert("Module updated successfully");
      resetModuleEditor();
      await fetchModules();
      setModuleView("dashboard");
    } catch (err) {
      console.error("Failed to update module:", err);
      alert("Failed to update module");
    } finally {
      setSubmittingModule(false);
    }
  };

  const handleAssignLecturer = async (): Promise<void> => {
    if (!selectedModule?._id || !selectedLecturerId) {
      alert("Please select a lecturer");
      return;
    }

    try {
      setSubmittingModule(true);
      await api.put(`/modules/${selectedModule._id}/assign`, { lecturerId: selectedLecturerId });
      setModules((prev) => prev.map((m) => (m._id === selectedModule._id ? { ...m, lecturerId: selectedLecturerId } : m)));
      alert("Lecturer assigned successfully");
      resetModuleEditor();
      await fetchModules();
      setModuleView("dashboard");
    } catch (err) {
      console.error("Failed to assign lecturer:", err);
      alert("Failed to assign lecturer");
    } finally {
      setSubmittingModule(false);
    }
  };

  const handleArchiveToggle = async (moduleId: string, currentArchived: boolean | undefined, moduleName: string): Promise<void> => {
    const action = currentArchived ? "unarchive" : "archive";
    if (!window.confirm(`Are you sure you want to ${action} ${moduleName}?`)) return;

    try {
      await api.put(`/modules/archive/${moduleId}`);
      setModules((prev) => prev.map((m) => (m._id === moduleId ? { ...m, archived: !currentArchived } : m)));
      if (selectedModule?._id === moduleId) {
        setSelectedModule((prev) => (prev ? { ...prev, archived: !currentArchived } : prev));
      }
      alert(`Module ${action}d successfully`);
    } catch (err) {
      console.error(`Failed to ${action} module:`, err);
      alert(`Failed to ${action} module`);
    }
  };

  const handleDeleteModule = async (moduleId: string, moduleName: string): Promise<void> => {
    if (!window.confirm(`Are you sure you want to delete ${moduleName}?`)) return;
    try {
      await deleteModule(moduleId);
      setModules((prev) => prev.filter((m) => m._id !== moduleId));
      if (selectedModule?._id === moduleId) {
        resetModuleEditor();
        setModuleView("dashboard");
      }
      alert("Module deleted successfully");
    } catch (err) {
      console.error("Failed to delete module:", err);
      alert("Failed to delete module");
    }
  };

  const handleDeleteEnrollment = async (id: string): Promise<void> => {
    if (!window.confirm("Delete this enrollment?")) return;
    try {
      await api.delete(`/enrollments/${id}`);
      setModuleEnrollments((prev) => prev.filter((e) => e._id !== id));
      alert("Enrollment deleted successfully");
      if (selectedModule?._id) {
        await fetchEnrollmentsForModule(selectedModule._id);
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to delete enrollment");
    }
  };

  const filteredModules = useMemo(() => {
    return modules
      .filter((m) => {
        if (!moduleSearch) return true;
        return m.moduleName?.toLowerCase().includes(moduleSearch.toLowerCase()) || m.moduleCode?.toLowerCase().includes(moduleSearch.toLowerCase());
      })
      .filter((m) => {
        if (moduleSemesterFilter === "all") return true;
        return m.semester === moduleSemesterFilter;
      })
      .filter((m) => {
        if (moduleStatusFilter === "all") return true;
        if (moduleStatusFilter === "active") return !m.archived;
        return !!m.archived;
      });
  }, [modules, moduleSearch, moduleSemesterFilter, moduleStatusFilter]);

  const fetchAllTickets = (): void => {
    setTicketsLoading(true);
    getTickets().then((res) => setAllTickets(res.data as TicketData[])).catch(() => setAllTickets([])).finally(() => setTicketsLoading(false));
  };

  const openAdminTicketDetail = (ticket: TicketData): void => {
    getTicketById(ticket._id)
      .then((res) => {
        const data = res.data as { ticket: TicketData; responses: TicketResponseData[] };
        setSelectedTicket(data.ticket);
        setTicketResponses(data.responses);
        setTicketView("detail");
      })
      .catch(() => {
        setSelectedTicket(ticket);
        setTicketResponses([]);
        setTicketView("detail");
      });
  };

  const handleAdminStatusChange = (ticketId: string, status: string): void => {
    setTicketStatusUpdating(true);
    updateTicket(ticketId, { status })
      .then(() => {
        setSelectedTicket((prev) => (prev ? { ...prev, status } : prev));
        setAllTickets((prev) => prev.map((t) => (t._id === ticketId ? { ...t, status } : t)));
      })
      .catch(() => alert("Failed to update ticket status."))
      .finally(() => setTicketStatusUpdating(false));
  };

  const handleAdminReply = (): void => {
    if (!adminReply.trim() || !selectedTicket) return;
    setAdminReplySending(true);
    addTicketResponse(selectedTicket._id, adminReply)
      .then((res) => {
        setTicketResponses((prev) => [...prev, res.data as TicketResponseData]);
        setAdminReply("");
        if (selectedTicket.status === "open") handleAdminStatusChange(selectedTicket._id, "in_progress");
      })
      .catch(() => alert("Failed to send reply."))
      .finally(() => setAdminReplySending(false));
  };

  const handleAdminDeleteTicket = (ticketId: string): void => {
    if (!window.confirm("Permanently delete this ticket and all its responses?")) return;
    deleteTicket(ticketId)
      .then(() => {
        setAllTickets((prev) => prev.filter((t) => t._id !== ticketId));
        if (ticketView === "detail") setTicketView("list");
      })
      .catch(() => alert("Failed to delete ticket."));
  };

  const filteredTickets = allTickets.filter(
    (t) => t.subject.toLowerCase().includes(ticketSearchQuery.toLowerCase()) || t.category.toLowerCase().includes(ticketSearchQuery.toLowerCase()) || t.status.toLowerCase().includes(ticketSearchQuery.toLowerCase()),
  );

  const handleStatusChange = async (userId: string, newStatus: string, userName: string): Promise<void> => {
    if (!window.confirm(`Are you sure you want to change the status of ${userName} to ${newStatus.toUpperCase()}?`)) return;
    try {
      const response = await updateAccountStatus(userId, newStatus);
      if (response.data.success) {
        fetchUsers();
        alert(`Successfully updated status to ${newStatus}`);
      }
    } catch (err: unknown) {
      alert((err as ApiError).response?.data?.message || "Failed to update status");
    }
  };

  const handlePaymentStatusChange = async (userId: string, newStatus: string, userName: string): Promise<void> => {
    if (!window.confirm(`Are you sure you want to change the payment status of ${userName} to ${newStatus.toUpperCase()}?`)) return;
    try {
      const response = await api.patch(`/users/${userId}/payment-status`, { status: newStatus });
      if (response.data.success) fetchUsers();
    } catch (err: unknown) {
      alert((err as ApiError).response?.data?.message || "Failed to update payment status");
    }
  };

  const handleViewActivity = async (userId: string): Promise<void> => {
    try {
      const response = await getUserActivity(userId);
      if (response.data.success) {
        setActivityModalUser(response.data.user as { name: string; email: string; role: string; [key: string]: unknown });
      }
    } catch (err: unknown) {
      alert((err as ApiError).response?.data?.message || "Failed to load user activity");
    }
  };

  const handleDeleteUser = async (userId: string, userName: string): Promise<void> => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete the account for ${userName}? This action cannot be undone.`)) return;
    try {
      const response = await deleteUser(userId);
      if (response.data.success) {
        fetchUsers();
        alert("User account deleted successfully");
      }
    } catch (err: unknown) {
      console.error("Delete failed:", err);
      alert((err as ApiError).response?.data?.message || "Failed to delete user");
    }
  };

  const handleExport = async (format: ExportFormat): Promise<void> => {
    try {
      const response = format === "excel" ? await exportUsersExcel() : await exportUsersCSV();
      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${selectedRole}s_export_${new Date().toISOString().split("T")[0]}.${format === "excel" ? "xlsx" : "csv"}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowExportModal(false);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export data. Please try again.");
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) updateHeader(JSON.parse(savedUser) as UserData);
  }, []);

  useEffect(() => {
    if (activeTab === "home") {
      const delayDebounceFn = setTimeout(() => fetchUsers(), 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [activeTab, selectedRole, searchQuery, statusFilter]);

  useEffect(() => {
    if (activeTab === "faqs") fetchAllTickets();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "module") {
      fetchModules();
      fetchLecturers();
    }
  }, [activeTab]);

  const handleLogout = (): void => {
    localStorage.clear();
    navigate("/login");
  };

  const underConstructionTabs: TabKey[] = ["career", "events"];

  return (
    <div className="min-h-screen bg-white relative">
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} onLogout={handleLogout} onUpdate={updateHeader} />
      <AdminUserEditModal isOpen={!!userToEdit} onClose={() => setUserToEdit(null)} userData={userToEdit} onUpdate={() => fetchUsers()} />
      <ActivityModal isOpen={!!activityModalUser} onClose={() => setActivityModalUser(null)} activityData={activityModalUser} />
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} selectedRole={selectedRole} onDownload={handleExport} />

      <header className="px-10 py-5 flex justify-between items-center border-b border-gray-100 bg-white sticky top-0 z-[50]">
        <Logo className="scale-[0.85] origin-left" />
        <div onClick={() => setShowProfileModal(true)} className="flex items-center gap-4 cursor-pointer">
          <div className="text-right">
            <p className="text-[#2D3A5D] font-black text-xs tracking-[0.2em] mb-0.5 uppercase">{user.displayId}</p>
            <p className="text-[#2D3A5D]/60 font-bold text-[11px] truncate max-w-[150px]">{user.name}</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-[#FBB017] to-[#e9a215] rounded-full flex items-center justify-center text-[#2D3A5D] font-black text-sm shadow-[0_8px_20px_-4px_rgba(251,176,23,0.3)] overflow-hidden">
            {user.profileImage ? <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" /> : user.initials}
          </div>
        </div>
      </header>

      <nav className="bg-[#1A1C2C] px-10 py-4 flex items-center justify-between shadow-lg sticky top-[89px] z-[40]">
        <div className="flex-1"></div>
        <div className="flex items-center gap-2">
          <NavItem icon={Home} label="Home" tab="home" active={activeTab === "home"} onClick={setActiveTab} />
          <NavItem icon={BookOpen} label="Module" tab="module" active={activeTab === "module"} onClick={setActiveTab} />
          <NavItem icon={Briefcase} label="Career" tab="career" active={activeTab === "career"} onClick={setActiveTab} />
          <NavItem icon={Calendar} label="Events" tab="events" active={activeTab === "events"} onClick={setActiveTab} />
          <NavItem icon={MessageCircleQuestion} label="FAQs" tab="faqs" active={activeTab === "faqs"} onClick={setActiveTab} />
        </div>
        <div className="flex-1 flex justify-end">
          <NavItem icon={UserIcon} label="Profile" tab="profile" active={activeTab === "profile"} onClick={setActiveTab} />
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-16 py-16">
        {activeTab === "home" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center mb-10">
              <h1 className="text-2xl font-black text-[#2D3A5D] tracking-tight">User Profiles</h1>
              <button onClick={() => setShowExportModal(true)} className="bg-[#FBB017] text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#e9a215] transition-all shadow-lg shadow-[#FBB017]/20 active:scale-95">
                Export
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-8">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Search by name, email, or NIC..." value={searchQuery} onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)} className="w-full bg-white border-2 border-gray-100 pl-14 pr-6 py-3 rounded-2xl font-bold text-sm text-[#2D3A5D] focus:border-[#FBB017] outline-none transition-all placeholder:text-gray-300" />
              </div>

              <div className="relative">
                <button onClick={() => { setShowDropdown(!showDropdown); setShowStatusDropdown(false); }} className="flex items-center gap-3 bg-white border-2 border-gray-100 px-6 py-3 rounded-2xl font-bold text-sm text-[#2D3A5D] hover:border-[#FBB017]/30 transition-all min-w-[160px]">
                  <span className="text-gray-400 font-extrabold text-[10px] uppercase tracking-widest mr-1">Role:</span>
                  {roleOptions.find((r) => r.value === selectedRole)?.label}
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
                </button>
                {showDropdown && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 overflow-hidden min-w-[180px] animate-in slide-in-from-top-2 duration-200">
                    {roleOptions.map((option) => (
                      <button key={option.value} onClick={() => { setSelectedRole(option.value); setShowDropdown(false); }} className={`w-full text-left px-6 py-3 text-sm font-bold hover:bg-[#FFF9EE] transition-colors ${selectedRole === option.value ? "text-[#FBB017] bg-[#FFF9EE]" : "text-[#2D3A5D]"}`}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowDropdown(false); }} className="flex items-center gap-3 bg-white border-2 border-gray-100 px-6 py-3 rounded-2xl font-bold text-sm text-[#2D3A5D] hover:border-[#FBB017]/30 transition-all min-w-[160px]">
                  <span className="text-gray-400 font-extrabold text-[10px] uppercase tracking-widest mr-1">Status:</span>
                  {statusOptions.find((s) => s.value === statusFilter)?.label}
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`} />
                </button>
                {showStatusDropdown && (
                  <div className="absolute top-full right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 overflow-hidden min-w-[180px] animate-in slide-in-from-top-2 duration-200">
                    {statusOptions.map((option) => (
                      <button key={option.value} onClick={() => { setStatusFilter(option.value); setShowStatusDropdown(false); }} className={`w-full text-left px-6 py-3 text-sm font-bold hover:bg-[#FFF9EE] transition-colors ${statusFilter === option.value ? "text-[#FBB017] bg-[#FFF9EE]" : "text-[#2D3A5D]"}`}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {loadingUsers ? (
              <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-4 border-[#FBB017]/30 border-t-[#FBB017] rounded-full animate-spin"></div></div>
            ) : (
              <UserTable users={users} roleType={selectedRole} onStatusChange={handleStatusChange} onPaymentStatusChange={handlePaymentStatusChange} onDelete={handleDeleteUser} onEdit={(u) => setUserToEdit(u)} onViewActivity={handleViewActivity} currentUserId={fullUserData?._id} />
            )}
          </div>
        )}

        {activeTab === "module" && moduleView === "dashboard" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-[#2D3A5D] tracking-tight">Module Management</h1>
                <div className="bg-[#1A1C2C] px-3 py-1.5 rounded-xl"><span className="text-[#FBB017] text-xs font-black">{filteredModules.length} total</span></div>
              </div>
            </div>

            <div className="relative mb-4 max-w-xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search by module name or code..." value={moduleSearch} onChange={(e) => setModuleSearch(e.target.value)} className="w-full bg-white border border-gray-200 pl-14 pr-5 py-3.5 rounded-2xl text-sm text-[#2D3A5D] font-medium outline-none focus:ring-2 focus:ring-[#FBB017]" />
            </div>

            <div className="mb-5 max-w-xs">
              <select
                value={moduleSemesterFilter}
                onChange={(e) => setModuleSemesterFilter(e.target.value)}
                className="w-full bg-white border border-[#FBB017] text-[#2D3A5D] px-4 py-3 rounded-2xl font-bold text-sm outline-none"
              >
                <option value="all">All Semesters</option>

                {semesterOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {(["all", "active", "archived"] as ModuleStatusFilter[]).map((status) => (
                <button key={status} onClick={() => setModuleStatusFilter(status)} className={`px-4 py-2 rounded-full border text-xs font-bold ${moduleStatusFilter === status ? "bg-[#FBB017] border-[#FBB017] text-white" : "bg-white border-gray-200 text-[#2D3A5D]"}`}>
                  {status === "all" ? "All Modules" : status === "active" ? "Active" : "Archived"}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <button onClick={() => { resetModuleEditor(); setModuleView("create"); }} className="bg-[#1A1C2C] text-white px-4 py-3 rounded-2xl text-sm font-bold">+ Create Module</button>
              <button onClick={() => { resetModuleEditor(); setModuleView("assignLecturer"); }} className="bg-[#FBB017] text-white px-4 py-3 rounded-2xl text-sm font-bold">Assign Lecturer</button>
              <button onClick={() => { resetModuleEditor(); openModuleEnrollments(); }} className="bg-[#FBB017] text-white px-4 py-3 rounded-2xl text-sm font-bold">Enrollments</button>
              <button onClick={() => { resetModuleEditor(); openModuleReports(); }} className="bg-[#FBB017] text-white px-4 py-3 rounded-2xl text-sm font-bold">Reports</button>
            </div>

            {loadingModules ? (
              <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#FBB017]/30 border-t-[#FBB017] rounded-full animate-spin" /></div>
            ) : (
              <div className="space-y-3 pb-8">
                {filteredModules.map((m) => (
                  <div key={m._id} className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-3">
                        <h3 className="text-[#2D3A5D] font-bold text-sm">{m.moduleName}</h3>
                        <p className="text-gray-400 text-xs mt-0.5">{m.moduleCode}</p>
                        <p className="text-gray-300 text-[10px] mt-1 font-bold uppercase">{m.semester}</p>
                      </div>
                      {m.archived && <div className="px-2 py-1 rounded-full bg-red-50"><span className="text-red-400 text-[10px] font-bold">Archived</span></div>}
                    </div>

                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 flex-wrap">
                      <button onClick={() => openModuleForEdit(m._id)} className="flex items-center gap-1"><Pencil size={13} className="text-blue-500" /><span className="text-blue-500 text-xs">Edit</span></button>
                      <button onClick={() => handleDeleteModule(m._id, m.moduleName)} className="flex items-center gap-1"><Trash2 size={13} className="text-red-400" /><span className="text-red-400 text-xs">Delete</span></button>
                      <button onClick={() => handleArchiveToggle(m._id, m.archived, m.moduleName)} className="flex items-center gap-1"><Archive size={13} className="text-[#FBB017]" /><span className="text-[#FBB017] text-xs">{m.archived ? "Unarchive" : "Archive"}</span></button>
                    </div>
                  </div>
                ))}

                {filteredModules.length === 0 && <div className="items-center py-16 text-center"><p className="text-gray-300 font-bold tracking-widest">No modules found.</p></div>}
              </div>
            )}
          </div>
        )}

        {activeTab === "module" && moduleView === "create" && (
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <button onClick={() => { resetModuleEditor(); setModuleView("dashboard"); }} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl mb-4">
              <ArrowLeft size={16} className="text-[#2D3A5D]" />
              <span className="text-[#2D3A5D] font-bold text-sm">Back</span>
            </button>

            <div className="mb-5">
              <h2 className="text-2xl font-black text-[#2D3A5D]">Create Module</h2>
              <p className="text-gray-400 text-sm mt-1">Add a new module to the system</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-[11px] font-black uppercase tracking-widest mb-2 block">Module Code *</label>
                  <input value={moduleForm.moduleCode} onChange={(e) => setModuleForm({ ...moduleForm, moduleCode: e.target.value.toUpperCase() })} placeholder="e.g. SE2030" className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-[#2D3A5D] outline-none focus:ring-2 focus:ring-[#FBB017]" />
                </div>
                <div>
                  <label className="text-gray-400 text-[11px] font-black uppercase tracking-widest mb-2 block">Module Name *</label>
                  <input value={moduleForm.moduleName} onChange={(e) => setModuleForm({ ...moduleForm, moduleName: e.target.value })} placeholder="Enter module name" className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-[#2D3A5D] outline-none focus:ring-2 focus:ring-[#FBB017]" />
                </div>
                <div>
                  <label className="text-gray-400 text-[11px] font-black uppercase tracking-widest mb-2 block">Semester *</label>
                  <input value={moduleForm.semester} onChange={(e) => setModuleForm({ ...moduleForm, semester: e.target.value })} placeholder="e.g. Year 1 Semester 1" className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-[#2D3A5D] outline-none focus:ring-2 focus:ring-[#FBB017]" />
                </div>
                <div>
                  <label className="text-gray-400 text-[11px] font-black uppercase tracking-widest mb-2 block">Academic Year *</label>
                  <input value={moduleForm.academicYear} onChange={(e) => setModuleForm({ ...moduleForm, academicYear: e.target.value })} placeholder="e.g. 2026" className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-[#2D3A5D] outline-none focus:ring-2 focus:ring-[#FBB017]" />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => { resetModuleEditor(); setModuleView("dashboard"); }} className="flex-1 bg-gray-100 py-3.5 rounded-2xl items-center border border-gray-200 font-bold text-sm text-gray-600">Cancel</button>
                <button onClick={handleCreateModule} disabled={submittingModule} className="flex-1 bg-[#1A1C2C] py-3.5 rounded-2xl items-center font-bold text-sm text-white disabled:opacity-70">{submittingModule ? "Saving..." : "Save Module"}</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "module" && moduleView === "edit" && (
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <button onClick={() => { resetModuleEditor(); setModuleView("dashboard"); }} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl mb-4">
              <ArrowLeft size={16} className="text-[#2D3A5D]" />
              <span className="text-[#2D3A5D] font-bold text-sm">Back</span>
            </button>

            <h2 className="text-xl font-bold text-[#2D3A5D] mb-5">Edit Module</h2>

            <div className="bg-white rounded-3xl p-5 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-[11px] font-black uppercase mb-2 block">Module Name *</label>
                  <input value={moduleForm.moduleName} onChange={(e) => setModuleForm({ ...moduleForm, moduleName: e.target.value })} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-[#2D3A5D] outline-none focus:ring-2 focus:ring-[#FBB017]" />
                </div>
                <div>
                  <label className="text-gray-400 text-[11px] font-black uppercase mb-2 block">Module Code *</label>
                  <input value={moduleForm.moduleCode} onChange={(e) => setModuleForm({ ...moduleForm, moduleCode: e.target.value.toUpperCase() })} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-[#2D3A5D] outline-none focus:ring-2 focus:ring-[#FBB017]" />
                </div>
                <div>
                  <label className="text-gray-400 text-[11px] font-black uppercase mb-2 block">Semester *</label>
                  <input value={moduleForm.semester} onChange={(e) => setModuleForm({ ...moduleForm, semester: e.target.value })} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-[#2D3A5D] outline-none focus:ring-2 focus:ring-[#FBB017]" />
                </div>
                <div>
                  <label className="text-gray-400 text-[11px] font-black uppercase mb-2 block">Academic Year *</label>
                  <input value={moduleForm.academicYear} onChange={(e) => setModuleForm({ ...moduleForm, academicYear: e.target.value })} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-[#2D3A5D] outline-none focus:ring-2 focus:ring-[#FBB017]" />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => { resetModuleEditor(); setModuleView("dashboard"); }} className="flex-1 bg-gray-100 py-3.5 rounded-2xl items-center border border-gray-200 font-bold text-sm text-gray-600">Cancel</button>
                <button onClick={handleUpdateModule} disabled={submittingModule} className="flex-1 bg-[#1A1C2C] py-3.5 rounded-2xl items-center font-bold text-sm text-white disabled:opacity-70">{submittingModule ? "Updating..." : "Update"}</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "module" && moduleView === "assignLecturer" && (
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <button onClick={() => { resetModuleEditor(); setModuleView("dashboard"); }} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl mb-4">
              <ArrowLeft size={16} className="text-[#2D3A5D]" />
              <span className="text-[#2D3A5D] font-bold text-sm">Back</span>
            </button>

            <h2 className="text-xl font-bold text-[#2D3A5D] mb-5">Assign Lecturer</h2>

            <div className="bg-white rounded-3xl p-5 border border-gray-100">
              <div className="mb-4">
                <label className="text-gray-400 text-[11px] font-black uppercase mb-2 block">Module *</label>
                <select value={selectedModule?._id || ""} onChange={(e) => { if (e.target.value) { openModuleForAssignLecturer(e.target.value); } else { setSelectedModule(null); setSelectedLecturerId(""); } }} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-[#2D3A5D] outline-none">
                  <option value="">Select Module</option>
                  {modules.map((m) => (
                    <option key={m._id} value={m._id}>{m.moduleName} ({m.moduleCode}) {m.archived ? "- Archived" : ""}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="text-gray-400 text-[11px] font-black uppercase mb-2 block">Lecturer *</label>
                <select value={selectedLecturerId} onChange={(e) => setSelectedLecturerId(e.target.value)} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-[#2D3A5D] outline-none">
                  <option value="">Select Lecturer</option>
                  {lecturers.map((l) => (
                    <option key={l._id} value={l._id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => { resetModuleEditor(); setModuleView("dashboard"); }} className="flex-1 bg-gray-100 py-3.5 rounded-2xl items-center border border-gray-200 font-bold text-sm text-gray-600">Cancel</button>
                <button onClick={handleAssignLecturer} className="flex-1 bg-[#1A1C2C] py-3.5 rounded-2xl items-center font-bold text-sm text-white">Assign Lecturer</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "module" && moduleView === "enrollments" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <button onClick={() => { resetModuleEditor(); setModuleView("dashboard"); }} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl mb-4">
              <ArrowLeft size={16} className="text-[#2D3A5D]" />
              <span className="text-[#2D3A5D] font-bold text-sm">Back</span>
            </button>

            <h2 className="text-xl font-bold text-[#2D3A5D] mb-4">Enrollment Management</h2>

            <div className="relative mb-4 max-w-xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" value={moduleSearch} onChange={(e) => setModuleSearch(e.target.value)} placeholder="Search by Student ID..." className="w-full bg-white border border-gray-200 rounded-2xl pl-14 pr-5 py-3.5 text-sm text-[#2D3A5D] outline-none" />
            </div>

            {loadingEnrollments ? (
              <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#FBB017]/30 border-t-[#FBB017] rounded-full animate-spin" /></div>
            ) : (
              <div className="space-y-3 pb-8">
                {moduleEnrollments.filter((e) => String(e.studentId || "").toLowerCase().includes(moduleSearch.toLowerCase())).map((e, index) => (
                  <div key={e._id || index} className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="flex-1 pr-3">
                      <p className="text-[#2D3A5D] font-bold text-sm">{e.studentName}</p>
                      <p className="text-gray-400 text-xs mt-1">ID: {e.studentId}</p>
                      <p className="text-gray-300 text-[10px] mt-1 font-bold uppercase">{e.moduleCode}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                      <button onClick={() => e._id && handleDeleteEnrollment(e._id)} className="flex items-center gap-1 ml-auto">
                        <Trash2 size={13} className="text-red-400" />
                        <span className="text-red-400 text-xs">Delete</span>
                      </button>
                    </div>
                  </div>
                ))}

                {moduleEnrollments.filter((e) => String(e.studentId || "").toLowerCase().includes(moduleSearch.toLowerCase())).length === 0 && <div className="items-center py-16 text-center"><p className="text-gray-300 font-bold tracking-widest">No enrollments found</p></div>}
              </div>
            )}
          </div>
        )}

        {activeTab === "module" && moduleView === "reports" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <button onClick={() => { resetModuleEditor(); setModuleView("dashboard"); }} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl mb-4">
              <ArrowLeft size={16} className="text-[#2D3A5D]" />
              <span className="text-[#2D3A5D] font-bold text-sm">Back</span>
            </button>

            <h2 className="text-xl font-bold text-[#2D3A5D] mb-4">Reports</h2>

            {loadingReports ? (
              <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#FBB017]/30 border-t-[#FBB017] rounded-full animate-spin" /></div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[#2D3A5D] font-bold">Lecturer Workload</h3>
                    <div className="flex gap-2">
                      <button onClick={() => setShowAllWorkload(!showAllWorkload)} className="bg-gray-100 text-[#2D3A5D] px-3 py-1.5 rounded-xl text-xs font-bold">{showAllWorkload ? "Hide" : "View"}</button>
                      <button onClick={handleExportWorkload} className="bg-[#FBB017] text-white px-3 py-1.5 rounded-xl text-xs font-bold">Export</button>
                    </div>
                  </div>

                  {displayedWorkload.length === 0 ? (
                    <p className="text-gray-400 text-sm">No workload data found</p>
                  ) : (
                    <>
                      {displayedWorkload.map((item, index) => (
                        <div key={index} className="border-b border-gray-100 pb-3 mb-3 last:border-b-0">
                          <p className="text-[#2D3A5D] font-bold text-sm">{item.lecturerName}</p>
                          <p className="text-gray-400 text-xs mt-1">{item.moduleName} ({item.moduleCode})</p>
                          <p className="text-gray-300 text-[10px] mt-1 font-bold uppercase">{item.semester}</p>
                        </div>
                      ))}
                      <p className="text-gray-300 text-xs text-center mt-2">Showing {displayedWorkload.length} of {workload.length}</p>
                    </>
                  )}
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[#2D3A5D] font-bold">Semester Modules</h3>
                    <div className="flex gap-2">
                      <button onClick={() => setShowAllSemester(!showAllSemester)} className="bg-gray-100 text-[#2D3A5D] px-3 py-1.5 rounded-xl text-xs font-bold">{showAllSemester ? "Hide" : "View"}</button>
                      <button onClick={handleExportSemester} className="bg-[#FBB017] text-white px-3 py-1.5 rounded-xl text-xs font-bold">Export</button>
                    </div>
                  </div>

                  {displayedSemester.length === 0 ? (
                    <p className="text-gray-400 text-sm">No semester data found</p>
                  ) : (
                    <>
                      {displayedSemester.map((item, index) => (
                        <div key={index} className="border-b border-gray-100 pb-3 mb-3 last:border-b-0">
                          <p className="text-[#2D3A5D] font-bold text-sm">{item.semester}</p>
                          <p className="text-gray-400 text-xs mt-1">{item.moduleName} ({item.moduleCode})</p>
                        </div>
                      ))}
                      <p className="text-gray-300 text-xs text-center mt-2">Showing {displayedSemester.length} of {semesterReport.length}</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "faqs" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {ticketView === "list" && (
              <div>
                <div className="flex justify-between items-center mb-10">
                  <h1 className="text-2xl font-bold text-[#2D3A5D]">Support Tickets</h1>
                  <button onClick={fetchAllTickets} className="border-2 border-[#1A1C2C] text-[#1A1C2C] px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1A1C2C] hover:text-white transition-all">Refresh</button>
                </div>

                <div className="relative mb-8">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" placeholder="Search by subject, category or status..." value={ticketSearchQuery} onChange={(e) => setTicketSearchQuery(e.target.value)} className="w-full bg-white border-2 border-gray-100 pl-14 pr-6 py-3 rounded-2xl font-bold text-sm text-[#2D3A5D] focus:border-[#FBB017] outline-none transition-all placeholder:text-gray-300" />
                </div>

                {ticketsLoading ? (
                  <div className="flex justify-center py-32"><div className="w-10 h-10 border-4 border-[#FBB017]/30 border-t-[#FBB017] rounded-full animate-spin" /></div>
                ) : filteredTickets.length === 0 ? (
                  <div className="text-center py-20 text-gray-300 font-bold tracking-widest uppercase text-sm">{allTickets.length === 0 ? "No tickets yet. Click Refresh to load." : "No tickets match your search."}</div>
                ) : (
                  <div className="overflow-hidden rounded-[2rem] border border-gray-100">
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] bg-[#F8F9FA] px-8 py-5 border-b border-gray-100 gap-4">
                      {["Subject", "Category", "Status", "Date", "Actions"].map((h) => (
                        <p key={h} className="text-[#2D3A5D]/60 font-black text-[11px] uppercase tracking-widest">{h}</p>
                      ))}
                    </div>

                    {filteredTickets.map((t, idx) => (
                      <div key={t._id} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center px-8 py-5 border-b border-gray-50 hover:bg-[#FFF9EE]/30 transition-colors gap-4">
                        <div className="min-w-0">
                          <p className="text-[#2D3A5D] font-bold text-sm truncate">{t.subject}</p>
                          <p className="text-[#2D3A5D]/40 text-[10px] font-medium mt-0.5">{t.user_id?.username || `User #${idx + 1}`}</p>
                        </div>
                        <p className="text-[#2D3A5D]/60 font-bold text-xs uppercase">{t.category}</p>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full w-fit ${TICKET_STATUS_COLOR[t.status] || "bg-gray-100 text-gray-500"}`}>{t.status.replace("_", " ")}</span>
                        <p className="text-[#2D3A5D]/40 font-medium text-xs">{new Date(t.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openAdminTicketDetail(t)} className="bg-[#1A1C2C] text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#2D3A5D] transition-all">View</button>
                          <button onClick={() => handleAdminDeleteTicket(t._id)} className="bg-rose-50 text-rose-600 p-2 rounded-xl hover:bg-rose-100 transition-all"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {ticketView === "detail" && selectedTicket && (
              <div>
                <div className="flex items-center gap-6 mb-10">
                  <button onClick={() => { setTicketView("list"); fetchAllTickets(); }} className="flex items-center gap-2 text-[#2D3A5D]/40 hover:text-[#FBB017] transition-colors font-bold text-sm"><ChevronDown size={18} className="rotate-90" /> Back</button>
                  <h1 className="text-2xl font-black text-[#2D3A5D] tracking-tight">Ticket Detail</h1>
                  <div className="flex-1" />
                  <button onClick={() => handleAdminDeleteTicket(selectedTicket._id)} className="flex items-center gap-2 bg-rose-50 text-rose-600 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all"><Trash2 size={14} /> Delete Ticket</button>
                </div>

                <div className="bg-[#EBECEF]/40 rounded-2xl px-8 py-6 mb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-[#2D3A5D] font-black text-base mb-1">{selectedTicket.subject}</p>
                      <p className="text-[#2D3A5D]/40 text-xs font-medium">{selectedTicket.category} · {selectedTicket.user_id?.username || "Unknown User"} · {new Date(selectedTicket.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <select value={selectedTicket.status} disabled={ticketStatusUpdating} onChange={(e) => handleAdminStatusChange(selectedTicket._id, e.target.value)} className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full outline-none border-none cursor-pointer appearance-none ${TICKET_STATUS_COLOR[selectedTicket.status] || "bg-gray-100 text-gray-500"} disabled:opacity-70`}>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[#2D3A5D]/70 text-sm leading-relaxed">{selectedTicket.description}</p>
                </div>

                {ticketResponses.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <p className="text-[#2D3A5D]/30 font-black text-[10px] uppercase tracking-widest px-2">Responses ({ticketResponses.length})</p>
                    {ticketResponses.map((r) => {
                      const isStaff = r.responded_by?.role !== "student";
                      return (
                        <div key={r._id} className={`rounded-2xl px-8 py-5 ${isStaff ? "bg-[#1A1C2C]/5 border border-[#1A1C2C]/10" : "bg-white border border-gray-100"}`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isStaff ? "text-[#2D3A5D]" : "text-[#FBB017]"}`}>{isStaff ? r.responded_by?.username || "Staff" : "Student"}</span>
                            <span className="text-[#2D3A5D]/30 text-[10px]">{new Date(r.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <p className="text-[#2D3A5D]/70 text-sm leading-relaxed">{r.response_message}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedTicket.status !== "closed" && (
                  <div className="bg-[#EBECEF]/40 rounded-2xl px-8 py-6 flex gap-4 items-end">
                    <textarea value={adminReply} onChange={(e) => setAdminReply(e.target.value)} placeholder="Type your response to the student..." rows={3} className="flex-1 bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm text-[#2D3A5D] font-medium outline-none focus:border-[#FBB017]/50 transition-all resize-none" />
                    <button onClick={handleAdminReply} disabled={adminReplySending || !adminReply.trim()} className="bg-[#FBB017] text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#e9a215] transition-all disabled:opacity-50 shrink-0">{adminReplySending ? "Sending..." : "Reply"}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && <div className="flex flex-col items-center justify-center py-52 text-center animate-in zoom-in-95 duration-500"><h2 className="text-3xl font-black text-[#2D3A5D]/10 tracking-[0.4em] uppercase">ADMIN PROFILE</h2><p className="text-[#2D3A5D]/20 font-bold mt-4 tracking-widest">Click the profile icon to view or edit your profile</p></div>}

        {underConstructionTabs.includes(activeTab) && <div className="flex flex-col items-center justify-center py-52 text-center animate-in zoom-in-95 duration-500"><h2 className="text-3xl font-black text-[#2D3A5D]/10 tracking-[0.4em] uppercase">{activeTab} SECTION</h2><p className="text-[#2D3A5D]/20 font-bold mt-4 tracking-widest">This part is currently under construction</p></div>}
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
