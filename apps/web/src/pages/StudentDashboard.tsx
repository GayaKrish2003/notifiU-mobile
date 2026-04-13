import React, { useEffect, useState } from "react";
import ChatBot from "../components/ChatBot";
import { useNavigate } from "react-router-dom";
import {
    Home,
    BookOpen,
    Briefcase,
    Calendar,
    MessageCircleQuestion,
    User as UserIcon,
    Search,
    Edit3,
    ArrowLeft,
    Paperclip,
    Download,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Logo from "../components/Logo";
import ProfileModal from "../components/ProfileModal";
import {
    getAnnouncements,
    getTickets,
    getTicketById,
    createTicket,
    addTicketResponse,
} from "../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabKey =
    | "home"
    | "module"
    | "announcement"
    | "events"
    | "faqs"
    | "profile";

interface UserData {
    _id?: string;
    name: string;
    email?: string;
    role?: string;
    profileImage?: string;
    nic?: string;
    studentId?: string;
    lecturerId?: string;
    university?: string;
    department?: string;
    [key: string]: unknown;
}

interface HeaderUser {
    name: string;
    displayId: string;
    initials: string;
    profileImage?: string;
}

interface AcademicMetric {
    label1: string;
    val1: string;
    label2: string;
    val2: string;
}

interface ExamItem {
    name: string;
    code: string;
    status: string;
}

interface ExamSection {
    title: string;
    exams: ExamItem[];
}

interface NavItemProps {
    icon: LucideIcon;
    label: string;
    tab: TabKey;
    active?: boolean;
    onClick: (tab: TabKey) => void;
}

interface ProfileViewProps {
    userData: UserData | null;
    onEditClick: () => void;
}

interface Attachment {
    _id: string;
    file_path: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
}

interface Announcement {
    _id: string;
    title: string;
    content: string;
    priority: "low" | "medium" | "high" | "urgent";
    publish_date: string;
    expiry_date?: string;
    status: "draft" | "published" | "archived";
    attachments: Attachment[];
}

type FaqView = "faq" | "create-ticket" | "my-tickets" | "ticket-detail";

interface FaqItem {
    question: string;
    answer: string;
    category: string;
}

interface TicketData {
    _id: string;
    subject: string;
    description: string;
    category: string;
    status: string;
    createdAt: string;
    user_id: { username?: string; role?: string };
}

interface TicketResponse {
    _id: string;
    response_message: string;
    createdAt: string;
    responded_by: { username?: string; role?: string };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const NavItem: React.FC<NavItemProps> = ({
                                             icon: Icon,
                                             label,
                                             tab,
                                             active = false,
                                             onClick,
                                         }) => (
    <div
        onClick={() => onClick(tab)}
        className="flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-300 px-6 group"
    >
        <Icon
            size={22}
            className={
                active ? "text-[#FBB017]" : "text-white/60 group-hover:text-white"
            }
        />
        <span
            className={`text-[10px] font-black uppercase tracking-[0.1em] ${active ? "text-[#FBB017]" : "text-white/40 group-hover:text-white/80"}`}
        >
      {label}
    </span>
    </div>
);

const ProfileView: React.FC<ProfileViewProps> = ({ userData, onEditClick }) => {
    const academicMetrics: AcademicMetric[] = [
        {
            label1: "CGP",
            val1: "135",
            label2: "Specialization",
            val2: "Information Technology",
        },
        { label1: "CGPA", val1: "3.5", label2: "Repeat/IC Counts", val2: "0" },
        { label1: "WGPA", val1: "3.67", label2: "Batch", val2: "Weekend" },
    ];

    const examData: ExamSection[] = [
        {
            title: "Mid Term Exam",
            exams: [
                { name: "Software Engineering", code: "SE2020", status: "REGULAR" },
                {
                    name: "Database Design and Development",
                    code: "IT1102",
                    status: "REGULAR",
                },
                {
                    name: "Probability and Statistics",
                    code: "IT3120",
                    status: "REGULAR",
                },
                {
                    name: "Artificial Intelligence and Machine Learning",
                    code: "IT2011",
                    status: "REGULAR",
                },
            ],
        },
        {
            title: "Final Exam",
            exams: [
                { name: "Software Engineering", code: "SE2020", status: "REGULAR" },
                {
                    name: "Database Design and Development",
                    code: "IT1102",
                    status: "REGULAR",
                },
                {
                    name: "Probability and Statistics",
                    code: "IT3120",
                    status: "REGULAR",
                },
                {
                    name: "Artificial Intelligence and Machine Learning",
                    code: "IT2011",
                    status: "REGULAR",
                },
            ],
        },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-20 p-4 max-w-[1500px] mx-auto animate-in fade-in duration-700">
            {/* Left Column: Profile Identification & Academic Stats */}
            <div className="flex-1 space-y-12">
                <div className="space-y-6">
                    <h2 className="text-gray-400 font-medium text-lg tracking-[0.2em] uppercase">
                        PROFILE
                    </h2>
                    <div className="space-y-1">
                        <h1 className="text-[#FBB017] text-2xl font-black uppercase tracking-tight">
                            {userData?.studentId ||
                                userData?.lecturerId ||
                                userData?._id?.substring(0, 8).toUpperCase() ||
                                "ID12345678"}{" "}
                            {userData?.name || "USER NAME"}
                        </h1>
                        <p className="text-[#2D3A5D]/50 text-sm font-semibold italic">
                            {userData?.email || "user@email.com"}
                        </p>
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="space-y-1">
                        <p className="text-[#2D3A5D] font-black text-[11px] tracking-widest uppercase">
                            NIC
                        </p>
                        <p className="text-[#2D3A5D]/60 font-bold text-xs">
                            {userData?.nic || "1998********"}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[#2D3A5D] font-black text-[11px] tracking-widest uppercase">
                            GENDER
                        </p>
                        <p className="text-[#2D3A5D]/60 font-bold text-xs">MALE</p>
                    </div>
                    <div className="pt-4">
                        <button
                            onClick={onEditClick}
                            className="flex items-center gap-2 bg-[#1A1C2C] text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-[#2D3A5D] transition-all hover:scale-105 active:scale-95"
                        >
                            <Edit3 size={14} className="text-[#FBB017]" />
                            Edit Profile
                        </button>
                    </div>
                </div>

                {/* Academic/Professional Stats Box */}
                <div className="border-2 border-[#FBB017] rounded-[2.5rem] p-10 bg-white/50 relative overflow-hidden">
                    {userData?.role === "student" ? (
                        <div className="grid grid-cols-2 gap-x-12 gap-y-10">
                            {academicMetrics.map((item, idx) => (
                                <React.Fragment key={idx}>
                                    <div>
                                        <p className="text-[#2D3A5D] font-black text-[11px] tracking-widest uppercase mb-1">
                                            {item.label1}
                                        </p>
                                        <p className="text-[#2D3A5D]/40 font-bold text-xs">
                                            {item.val1}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[#2D3A5D] font-black text-[11px] tracking-widest uppercase mb-1">
                                            {item.label2}
                                        </p>
                                        <p className="text-[#2D3A5D]/40 font-bold text-xs">
                                            {item.val2}
                                        </p>
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-y-10">
                            <div>
                                <p className="text-[#2D3A5D] font-black text-[11px] tracking-widest uppercase mb-1">
                                    University
                                </p>
                                <p className="text-[#2D3A5D]/40 font-bold text-xs">
                                    {userData?.university || "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-[#2D3A5D] font-black text-[11px] tracking-widest uppercase mb-1">
                                    Department
                                </p>
                                <p className="text-[#2D3A5D]/40 font-bold text-xs">
                                    {userData?.department || "N/A"}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Exam Details (Only for Students) */}
            {userData?.role === "student" && (
                <div className="flex-[1.2] space-y-16">
                    {examData.map((section, sIdx) => (
                        <div key={sIdx} className="space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="text-[#FBB017] font-black">◆</span>
                                <h2 className="text-[#FBB017] font-black text-xl tracking-wide">
                                    {section.title}
                                </h2>
                            </div>

                            <div className="bg-[#EBECEF]/40 rounded-[2.5rem] p-8 space-y-4 shadow-inner">
                                {section.exams.map((exam, eIdx) => (
                                    <div
                                        key={eIdx}
                                        className="bg-white/40 hover:bg-white border border-transparent rounded-2xl p-4 flex items-center justify-between transition-all group"
                                    >
                                        <div className="flex-1 min-w-0 pr-4">
                                            <p className="text-[#2D3A5D] font-bold text-[10px] leading-relaxed uppercase truncate">
                                                {exam.name} -{" "}
                                                <span className="opacity-40">{exam.code}</span> -{" "}
                                                <span className="opacity-40 italic">{exam.status}</span>
                                            </p>
                                        </div>
                                        <button className="bg-[#FBB017] hover:bg-[#e9a215] text-[#2D3A5D] text-[9px] font-black px-5 py-2.5 rounded-xl shadow-lg shadow-[#FBB017]/10 transition-all uppercase tracking-[0.1em] shrink-0">
                                            CLICK HERE
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const StudentDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<TabKey>("home");
    const [fullUserData, setFullUserData] = useState<UserData | null>(null);
    const [user, setUser] = useState<HeaderUser>({
        name: "User Name",
        displayId: "ID12345678",
        initials: "UN",
    });

    const updateHeader = (userData: UserData | null): void => {
        if (!userData) return;
        const displayId =
            userData.studentId ||
            userData.lecturerId ||
            userData._id?.substring(0, 8).toUpperCase() ||
            "ID12345678";
        const names = userData.name.trim().split(" ");

        let formattedName = userData.name;
        let initials = "UN";

        if (names.length >= 2) {
            const firstNameInitial = names[0].charAt(0).toUpperCase();
            const lastName = names[names.length - 1];
            formattedName = `${firstNameInitial}.${lastName}`;
            initials = (
                names[0].charAt(0) + names[names.length - 1].charAt(0)
            ).toUpperCase();
        } else if (names.length === 1) {
            initials = names[0].substring(0, 2).toUpperCase();
        }

        setUser({
            name: formattedName,
            displayId,
            initials,
            profileImage: userData.profileImage as string | undefined,
        });
        setFullUserData(userData);
    };

    // ✅ ERROR 1 FIXED: User Data Fetching (Line 401 area)
    useEffect(() => {
        const fetchUserData = () => {
            const savedUser = localStorage.getItem("user");
            if (savedUser) {
                updateHeader(JSON.parse(savedUser) as UserData);
            }
        };
        fetchUserData();
    }, []);

    const handleLogout = (): void => {
        localStorage.clear();
        navigate("/login");
    };

    // ─── FAQ & Ticket state ───────────────────────────────────────────────────
    const [faqView, setFaqView] = useState<FaqView>("faq");
    const [faqSearch, setFaqSearch] = useState<string>("");
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [tickets, setTickets] = useState<TicketData[]>([]);
    const [ticketsLoading, setTicketsLoading] = useState<boolean>(false);
    const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
    const [ticketResponses, setTicketResponses] = useState<TicketResponse[]>([]);
    const [newTicketSubject, setNewTicketSubject] = useState<string>("");
    const [newTicketDesc, setNewTicketDesc] = useState<string>("");
    const [newTicketCategory, setNewTicketCategory] = useState<string>("General");
    const [ticketSubmitting, setTicketSubmitting] = useState<boolean>(false);
    const [replyMessage, setReplyMessage] = useState<string>("");
    const [replySending, setReplySending] = useState<boolean>(false);

    const FAQ_DATA: FaqItem[] = [
        {
            category: "Academic",
            question: "How do I register for modules this semester?",
            answer:
                "Log in to the student portal, navigate to Module Registration under the Academic tab, and select the modules you wish to enroll in before the registration deadline.",
        },
        {
            category: "Academic",
            question: "Where can I find my exam timetable?",
            answer:
                "Exam timetables are published in the Events section of your dashboard and also sent to your registered university email address two weeks before examinations begin.",
        },
        {
            category: "Academic",
            question: "What is the grading system used at the university?",
            answer:
                "The university uses a GPA scale of 4.0. A = 4.0, A- = 3.7, B+ = 3.3, B = 3.0, etc. Your CGPA is calculated as the weighted average of all completed modules.",
        },
        {
            category: "Administrative",
            question: "How do I update my personal contact information?",
            answer:
                'Go to your Profile tab and click "Edit Profile". You can update your phone number, address, and other contact details there. Changes are reflected immediately.',
        },
        {
            category: "Administrative",
            question: "How do I apply for a fee payment extension?",
            answer:
                'Submit a formal request through the support ticket system selecting "Administrative" as the category. Attach any supporting documents and the finance office will respond within 3 working days.',
        },
        {
            category: "Administrative",
            question: "Where can I obtain my official enrollment certificate?",
            answer:
                "Enrollment certificates can be requested from the Academic Registry. Submit a support ticket under the Administrative category and allow 5–7 working days for processing.",
        },
        {
            category: "Technical",
            question: "I cannot log in to my student account. What should I do?",
            answer:
                'First, try resetting your password using the "Forgot Password" link on the login page. If the issue persists, raise a Technical support ticket and our IT team will assist you within 24 hours.',
        },
        {
            category: "Technical",
            question:
                "The portal is not loading correctly on my browser. How do I fix this?",
            answer:
                "Clear your browser cache and cookies, then try again. We recommend using the latest version of Chrome or Firefox. If the issue continues, submit a Technical ticket with your browser details.",
        },
        {
            category: "General",
            question: "What are the library opening hours?",
            answer:
                "The main library is open Monday to Friday 8:00 AM – 10:00 PM, Saturday 9:00 AM – 6:00 PM, and Sunday 10:00 AM – 4:00 PM. Extended hours apply during examination periods.",
        },
        {
            category: "General",
            question: "How can I contact my academic advisor?",
            answer:
                'Your assigned academic advisor\'s contact details are available in the Profile section under "Academic Information". You can email them directly or book an appointment via the portal.',
        },
    ];

    const filteredFaqs = FAQ_DATA.filter(
        (f) =>
            f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
            f.answer.toLowerCase().includes(faqSearch.toLowerCase()) ||
            f.category.toLowerCase().includes(faqSearch.toLowerCase()),
    );

    const fetchMyTickets = (): void => {
        setTicketsLoading(true);
        getTickets()
            .then((res: any) => setTickets(res.data as TicketData[]))
            .catch(() => setTickets([]))
            .finally(() => setTicketsLoading(false));
    };

    const openTicketDetail = (ticket: TicketData): void => {
        getTicketById(ticket._id)
            .then((res: any) => {
                const data = res.data as {
                    ticket: TicketData;
                    responses: TicketResponse[];
                };
                setSelectedTicket(data.ticket);
                setTicketResponses(data.responses);
                setFaqView("ticket-detail");
            })
            .catch(() => {
                setSelectedTicket(ticket);
                setTicketResponses([]);
                setFaqView("ticket-detail");
            });
    };

    const handleCreateTicket = (): void => {
        if (!newTicketSubject.trim() || !newTicketDesc.trim()) return;
        setTicketSubmitting(true);
        createTicket({
            subject: newTicketSubject,
            description: newTicketDesc,
            category: newTicketCategory,
        })
            .then(() => {
                setNewTicketSubject("");
                setNewTicketDesc("");
                setNewTicketCategory("General");
                setFaqView("my-tickets");
                fetchMyTickets();
            })
            .catch(() => alert("Failed to create ticket. Please try again."))
            .finally(() => setTicketSubmitting(false));
    };

    const handleAddReply = (): void => {
        if (!replyMessage.trim() || !selectedTicket) return;
        setReplySending(true);
        addTicketResponse(selectedTicket._id, replyMessage)
            .then((res: any) => {
                setTicketResponses((prev) => [...prev, res.data as TicketResponse]);
                setReplyMessage("");
            })
            .catch(() => alert("Failed to send reply."))
            .finally(() => setReplySending(false));
    };

    const STATUS_COLOR: Record<string, string> = {
        open: "bg-blue-100 text-blue-700",
        in_progress: "bg-yellow-100 text-yellow-700",
        resolved: "bg-green-100 text-green-700",
        closed: "bg-gray-100 text-gray-500",
    };

    // ─── Announcement state ───────────────────────────────────────────────────
    const [selectedAnnouncement, setSelectedAnnouncement] =
        useState<Announcement | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [annLoading, setAnnLoading] = useState<boolean>(false);
    const [annError, setAnnError] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // ✅ ERROR 2 FIXED: Announcements Fetching (Line 569 area)
    useEffect(() => {
        const fetchAnnouncementsData = async () => {
            setAnnLoading(true);
            try {
                const res: any = await getAnnouncements({ status: "published" });
                setAnnouncements(res.data as Announcement[]);
            } catch (error) {
                setAnnError("Failed to load announcements.");
            } finally {
                setAnnLoading(false);
            }
        };

        fetchAnnouncementsData();
    }, []);

    const filteredAnnouncements = announcements.filter(
        (a: Announcement) =>
            a.priority.toLowerCase().includes(searchQuery.toLowerCase()) ||
            new Date(a.publish_date).toLocaleDateString().includes(searchQuery) ||
            a.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
        });

    const underConstructionTabs: TabKey[] = ["module", "announcement", "events"];

    return (
        <div className="min-h-screen bg-white relative">
            <ProfileModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                onLogout={handleLogout}
                onUpdate={updateHeader}
            />

            {/* Header */}
            <header className="px-10 py-5 flex justify-between items-center border-b border-gray-100 bg-white sticky top-0 z-[50]">
                <Logo className="scale-[0.85] origin-left" />
                <div
                    onClick={() => setShowProfileModal(true)}
                    className="flex items-center gap-4 cursor-pointer"
                >
                    <div className="text-right">
                        <p className="text-[#2D3A5D] font-black text-xs tracking-[0.2em] mb-0.5 uppercase">
                            {user.displayId}
                        </p>
                        <p className="text-[#2D3A5D]/60 font-bold text-[11px] truncate max-w-[150px]">
                            {user.name}
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-[#FBB017] to-[#e9a215] rounded-full flex items-center justify-center text-[#2D3A5D] font-black text-sm shadow-[0_8px_20px_-4px_rgba(251,176,23,0.3)] overflow-hidden">
                        {user.profileImage ? (
                            <img
                                src={user.profileImage}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            user.initials
                        )}
                    </div>
                </div>
            </header>

            {/* Navigation Bar */}
            <nav className="bg-[#1A1C2C] px-10 py-4 flex items-center justify-between shadow-lg sticky top-[89px] z-[40]">
                <div className="flex-1"></div>
                <div className="flex items-center gap-2">
                    <NavItem
                        icon={Home}
                        label="Home"
                        tab="home"
                        active={activeTab === "home"}
                        onClick={setActiveTab}
                    />
                    <NavItem
                        icon={BookOpen}
                        label="Module"
                        tab="module"
                        active={activeTab === "module"}
                        onClick={setActiveTab}
                    />
                    <NavItem
                        icon={Briefcase}
                        label="Announcement"
                        tab="announcement"
                        active={activeTab === "announcement"}
                        onClick={setActiveTab}
                    />
                    <NavItem
                        icon={Calendar}
                        label="Events"
                        tab="events"
                        active={activeTab === "events"}
                        onClick={setActiveTab}
                    />
                    <NavItem
                        icon={MessageCircleQuestion}
                        label="FAQs"
                        tab="faqs"
                        active={activeTab === "faqs"}
                        onClick={setActiveTab}
                    />
                </div>
                <div className="flex-1 flex justify-end">
                    <NavItem
                        icon={UserIcon}
                        label="Profile"
                        tab="profile"
                        active={activeTab === "profile"}
                        onClick={setActiveTab}
                    />
                </div>
            </nav>

            {/* Content */}
            <main className="max-w-[1600px] mx-auto px-16 py-16">
                {activeTab === "home" && !selectedAnnouncement && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex justify-between items-center mb-16">
                            <h1 className="text-3xl font-black text-[#2D3A5D]/10 tracking-[0.3em] uppercase">
                                ANNOUNCEMENTS
                            </h1>
                            <div className="relative w-96 group">
                                <Search
                                    className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FBB017] transition-colors"
                                    size={20}
                                />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by Category or Date"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] py-4 pl-16 pr-6 text-sm outline-none focus:bg-white focus:border-[#FBB017]/30 focus:shadow-xl text-[#2D3A5D] font-medium transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            {annLoading && (
                                <p className="text-center text-[#2D3A5D]/30 font-bold tracking-widest py-20">
                                    Loading...
                                </p>
                            )}
                            {annError && (
                                <p className="text-center text-red-400 font-bold py-20">
                                    {annError}
                                </p>
                            )}
                            {!annLoading &&
                                !annError &&
                                filteredAnnouncements.map((ann: Announcement) => (
                                    <div
                                        key={ann._id}
                                        onClick={() => setSelectedAnnouncement(ann)}
                                        className="bg-[#EBECEF]/40 hover:bg-white border border-transparent hover:border-[#FBB017]/10 rounded-2xl px-8 py-6 transition-all duration-300 hover:shadow-lg group relative overflow-hidden cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="bg-[#FBB017] text-white text-[11px] font-bold px-4 py-1.5 rounded-full shadow-sm">
                                                {formatDate(ann.publish_date)}
                                            </div>
                                            <div className="border border-[#FBB017] text-[#FBB017] text-[11px] font-bold px-4 py-1 rounded-full bg-white capitalize">
                                                {ann.priority}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[#2D3A5D] font-bold text-sm">
                                                {ann.title}
                                            </p>
                                            <p className="text-[#2D3A5D]/60 text-sm">{ann.content}</p>
                                        </div>

                                        <div className="absolute right-8 bottom-5 text-[#2D3A5D]/30 font-bold text-xs tracking-widest">
                                            {formatTime(ann.publish_date)}
                                        </div>
                                    </div>
                                ))}

                            {!annLoading &&
                                !annError &&
                                filteredAnnouncements.length === 0 && (
                                    <p className="text-center text-[#2D3A5D]/30 font-bold tracking-widest py-20">
                                        No announcements found.
                                    </p>
                                )}
                        </div>
                    </div>
                )}

                {activeTab === "home" && selectedAnnouncement && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-6 mb-10">
                            <button
                                onClick={() => setSelectedAnnouncement(null)}
                                className="flex items-center gap-2 text-[#2D3A5D]/40 hover:text-[#FBB017] transition-colors font-bold text-sm"
                            >
                                <ArrowLeft size={18} />
                                Back
                            </button>
                            <h1 className="text-3xl font-black text-[#2D3A5D]/10 tracking-[0.3em] uppercase">
                                ANNOUNCEMENTS
                            </h1>
                        </div>

                        {/* Detail Card */}
                        <div className="bg-[#EBECEF]/40 rounded-2xl px-8 py-6 relative mb-3">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-[#FBB017] text-white text-[11px] font-bold px-4 py-1.5 rounded-full shadow-sm">
                                    {formatDate(selectedAnnouncement.publish_date)}
                                </div>
                                <div className="border border-[#FBB017] text-[#FBB017] text-[11px] font-bold px-4 py-1 rounded-full bg-white capitalize">
                                    {selectedAnnouncement.priority}
                                </div>
                            </div>

                            <div className="space-y-1 mb-8">
                                <p className="text-[#2D3A5D] font-bold text-sm">
                                    {selectedAnnouncement.title}
                                </p>
                                <p className="text-[#2D3A5D]/60 text-sm">
                                    {selectedAnnouncement.content}
                                </p>
                            </div>

                            <div className="absolute right-8 bottom-5 text-[#2D3A5D]/30 font-bold text-xs tracking-widest">
                                {formatTime(selectedAnnouncement.publish_date)}
                            </div>
                        </div>

                        {/* Attachments */}
                        {selectedAnnouncement.attachments.map((att: Attachment) => (
                            <div
                                key={att._id}
                                className="bg-[#EBECEF]/60 rounded-2xl px-8 py-4 flex items-center justify-between mt-2"
                            >
                                <div className="flex items-center gap-3 text-[#2D3A5D]/50">
                                    <Paperclip size={16} />
                                    <span className="text-sm font-medium">
                    {att.original_name}
                  </span>
                                </div>
                                <a
                                    href={`http://localhost:5005${att.file_path}`}
                                    download={att.original_name}
                                    onClick={(e) => e.stopPropagation()}
                                    className="border border-[#2D3A5D]/20 text-[#2D3A5D]/60 hover:border-[#FBB017] hover:text-[#FBB017] text-[11px] font-bold px-5 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
                                >
                                    <Download size={12} />
                                    Download
                                </a>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── FAQs Tab ──────────────────────────────────────────────────────── */}
                {activeTab === "faqs" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
                        {/* ── FAQ List View ── */}
                        {faqView === "faq" && (
                            <div>
                                <div className="flex justify-between items-center mb-10">
                                    <h1 className="text-2xl font-bold text-[#2D3A5D]">
                                        FAQ
                                    </h1>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setFaqView("my-tickets");
                                                fetchMyTickets();
                                            }}
                                            className="border-2 border-[#1A1C2C] text-[#1A1C2C] px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1A1C2C] hover:text-white transition-all"
                                        >
                                            My Tickets
                                        </button>
                                        <button
                                            onClick={() => setFaqView("create-ticket")}
                                            className="bg-[#FBB017] text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#e9a215] "
                                        >
                                            Create a Ticket
                                        </button>
                                    </div>
                                </div>
                                {activeTab === "faqs" && (
                                    <div className="mt-10">
                                        <ChatBot />
                                    </div>
                                )}

                                <div className="relative mb-8">
                                    <Search
                                        className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300"
                                        size={18}
                                    />
                                    <input
                                        type="text"
                                        value={faqSearch}
                                        onChange={(e) => setFaqSearch(e.target.value)}
                                        placeholder="Search frequently asked questions..."
                                        className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] py-4 pl-16 pr-6 text-sm outline-none focus:bg-white focus:border-[#FBB017]/30 text-[#2D3A5D] font-medium transition-all"
                                    />
                                </div>

                                <div className="space-y-3">
                                    {filteredFaqs.map((faq, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-[#EBECEF]/40 rounded-2xl overflow-hidden transition-all"
                                        >
                                            <button
                                                onClick={() =>
                                                    setExpandedFaq(expandedFaq === idx ? null : idx)
                                                }
                                                className="w-full flex items-center justify-between px-8 py-5 text-left hover:bg-white transition-all group"
                                            >
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                          <span className="text-[9px] font-black uppercase tracking-widest border border-[#FBB017]/40 text-[#FBB017] px-3 py-1 rounded-full shrink-0">
                            {faq.category}
                          </span>
                                                    <span className="text-[#2D3A5D] font-bold text-sm truncate">
                            {faq.question}
                          </span>
                                                </div>
                                                <span
                                                    className={`text-[#FBB017] font-black text-xl ml-4 shrink-0 transition-transform ${expandedFaq === idx ? "rotate-45" : ""}`}
                                                >
                          +
                        </span>
                                            </button>
                                            {expandedFaq === idx && (
                                                <div className="px-8 pb-6">
                                                    <p className="text-[#2D3A5D]/60 text-sm leading-relaxed border-l-2 border-[#FBB017]/30 pl-5">
                                                        {faq.answer}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {filteredFaqs.length === 0 && (
                                        <p className="text-center text-[#2D3A5D]/30 font-bold tracking-widest py-16">
                                            No results found. Try creating a support ticket.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Create Ticket View ── */}
                        {faqView === "create-ticket" && (
                            <div className="mb-10">
                                <div className="flex items-center gap-3 mb-5">
                                    <button
                                        onClick={() => setFaqView("faq")}
                                        className="flex items-center gap-3 text-[#2D3A5D]/40 hover:text-[#FBB017] transition-colors font-bold text-sm"
                                    >
                                        <ArrowLeft size={18} />
                                        Back
                                    </button>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <h1 className="text-2xl font-bold text-[#2D3A5D]">
                                        Help & Support
                                    </h1>
                                    <p className="text-sm text-[#2D3A5D]/50">
                                        Submit a request or view your previous inquiries
                                    </p>
                                </div>

                                <div className="bg-[#EBECEF]/40 rounded-[2rem] p-10 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[#2D3A5D] font-black text-[11px] uppercase tracking-widest">
                                            Subject
                                        </label>
                                        <input
                                            type="text"
                                            value={newTicketSubject}
                                            onChange={(e) => setNewTicketSubject(e.target.value)}
                                            placeholder="Brief description of your issue"
                                            className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm text-[#2D3A5D] font-medium outline-none focus:border-[#FBB017]/50 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[#2D3A5D] font-black text-[11px] uppercase tracking-widest">
                                            Category
                                        </label>
                                        <select
                                            value={newTicketCategory}
                                            onChange={(e) => setNewTicketCategory(e.target.value)}
                                            className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm text-[#2D3A5D] font-medium outline-none focus:border-[#FBB017]/50 transition-all appearance-none cursor-pointer"
                                        >
                                            {[
                                                "Academic",
                                                "Administrative",
                                                "Technical",
                                                "General",
                                                "Other",
                                            ].map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[#2D3A5D] font-black text-[11px] uppercase tracking-widest">
                                            Description
                                        </label>
                                        <textarea
                                            value={newTicketDesc}
                                            onChange={(e) => setNewTicketDesc(e.target.value)}
                                            placeholder="Describe your issue in detail..."
                                            rows={6}
                                            className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm text-[#2D3A5D] font-medium outline-none focus:border-[#FBB017]/50 transition-all resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-2">
                                        <button
                                            onClick={() => setFaqView("faq")}
                                            className="flex-1 border-2 border-gray-200 text-[#2D3A5D]/50 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-[#2D3A5D]/20 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCreateTicket}
                                            disabled={
                                                ticketSubmitting ||
                                                !newTicketSubject.trim() ||
                                                !newTicketDesc.trim()
                                            }
                                            className="flex-1 bg-[#FBB017] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#e9a215] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {ticketSubmitting ? "Submitting..." : "Submit Ticket"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── My Tickets View ── */}
                        {faqView === "my-tickets" && (
                            <div>
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-6">
                                        <button
                                            onClick={() => setFaqView("faq")}
                                            className="flex items-center gap-2 text-[#2D3A5D]/40 hover:text-[#FBB017] transition-colors font-bold text-sm"
                                        >
                                            <ArrowLeft size={18} /> Back
                                        </button>
                                        <h1 className="text-3xl font-black text-[#2D3A5D]/10 tracking-[0.3em] uppercase">
                                            My Tickets
                                        </h1>
                                    </div>
                                    <button
                                        onClick={() => setFaqView("create-ticket")}
                                        className="bg-[#FBB017] text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#e9a215] transition-all"
                                    >
                                        + New Ticket
                                    </button>
                                </div>

                                {ticketsLoading ? (
                                    <div className="flex justify-center py-20">
                                        <div className="w-8 h-8 border-4 border-[#FBB017]/30 border-t-[#FBB017] rounded-full animate-spin" />
                                    </div>
                                ) : tickets.length === 0 ? (
                                    <div className="text-center py-20">
                                        <p className="text-[#2D3A5D]/20 font-bold tracking-widest">
                                            No support tickets yet.
                                        </p>
                                        <button
                                            onClick={() => setFaqView("create-ticket")}
                                            className="mt-6 text-[#FBB017] font-black text-sm underline underline-offset-4"
                                        >
                                            Create your first ticket
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {tickets.map((t) => (
                                            <div
                                                key={t._id}
                                                onClick={() => openTicketDetail(t)}
                                                className="bg-[#EBECEF]/40 hover:bg-white border border-transparent hover:border-[#FBB017]/10 rounded-2xl px-8 py-5 cursor-pointer transition-all hover:shadow-md flex items-center justify-between group"
                                            >
                                                <div className="flex-1 min-w-0 pr-6">
                                                    <p className="text-[#2D3A5D] font-bold text-sm truncate mb-1">
                                                        {t.subject}
                                                    </p>
                                                    <p className="text-[#2D3A5D]/40 font-medium text-xs">
                                                        {t.category} ·{" "}
                                                        {new Date(t.createdAt).toLocaleDateString("en-GB", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shrink-0 ${STATUS_COLOR[t.status] || "bg-gray-100 text-gray-500"}`}
                                                >
                          {t.status.replace("_", " ")}
                        </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Ticket Detail View ── */}
                        {faqView === "ticket-detail" && selectedTicket && (
                            <div>
                                <div className="flex items-center gap-6 mb-10">
                                    <button
                                        onClick={() => {
                                            setFaqView("my-tickets");
                                            fetchMyTickets();
                                        }}
                                        className="flex items-center gap-2 text-[#2D3A5D]/40 hover:text-[#FBB017] transition-colors font-bold text-sm"
                                    >
                                        <ArrowLeft size={18} /> Back
                                    </button>
                                    <h1 className="text-3xl font-black text-[#2D3A5D]/10 tracking-[0.3em] uppercase">
                                        Ticket Detail
                                    </h1>
                                </div>

                                <div className="bg-[#EBECEF]/40 rounded-2xl px-8 py-6 mb-4">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1 min-w-0 pr-6">
                                            <p className="text-[#2D3A5D] font-black text-base mb-1">
                                                {selectedTicket.subject}
                                            </p>
                                            <p className="text-[#2D3A5D]/40 text-xs font-medium">
                                                {selectedTicket.category} ·{" "}
                                                {new Date(selectedTicket.createdAt).toLocaleDateString(
                                                    "en-GB",
                                                    { day: "2-digit", month: "short", year: "numeric" },
                                                )}
                                            </p>
                                        </div>
                                        <span
                                            className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shrink-0 ${STATUS_COLOR[selectedTicket.status] || "bg-gray-100 text-gray-500"}`}
                                        >
                      {selectedTicket.status.replace("_", " ")}
                    </span>
                                    </div>
                                    <p className="text-[#2D3A5D]/70 text-sm leading-relaxed">
                                        {selectedTicket.description}
                                    </p>
                                </div>

                                {/* Responses */}
                                {ticketResponses.length > 0 && (
                                    <div className="space-y-3 mb-4">
                                        <p className="text-[#2D3A5D]/30 font-black text-[10px] uppercase tracking-widest px-2">
                                            Responses
                                        </p>
                                        {ticketResponses.map((r) => (
                                            <div
                                                key={r._id}
                                                className={`rounded-2xl px-8 py-5 ${r.responded_by?.role === "student" ? "bg-[#FFF9EE] border border-[#FBB017]/10" : "bg-white border border-gray-100"}`}
                                            >
                                                <div className="flex justify-between items-center mb-2">
                          <span
                              className={`text-[10px] font-black uppercase tracking-widest ${r.responded_by?.role === "student" ? "text-[#FBB017]" : "text-[#2D3A5D]/40"}`}
                          >
                            {r.responded_by?.role === "student"
                                ? "You"
                                : r.responded_by?.username || "Support Staff"}
                          </span>
                                                    <span className="text-[#2D3A5D]/30 text-[10px]">
                            {new Date(r.createdAt).toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                          </span>
                                                </div>
                                                <p className="text-[#2D3A5D]/70 text-sm leading-relaxed">
                                                    {r.response_message}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Reply box — only if ticket is not closed */}
                                {selectedTicket.status !== "closed" && (
                                    <div className="bg-[#EBECEF]/40 rounded-2xl px-8 py-6 flex gap-4 items-end">
                    <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Add a reply or additional information..."
                        rows={3}
                        className="flex-1 bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm text-[#2D3A5D] font-medium outline-none focus:border-[#FBB017]/50 transition-all resize-none"
                    />
                                        <button
                                            onClick={handleAddReply}
                                            disabled={replySending || !replyMessage.trim()}
                                            className="bg-[#FBB017] text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#e9a215] transition-all disabled:opacity-50 shrink-0"
                                        >
                                            {replySending ? "Sending..." : "Reply"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "profile" && (
                    <ProfileView
                        userData={fullUserData}
                        onEditClick={() => {
                            setShowProfileModal(true);
                            setTimeout(
                                () =>
                                    window.dispatchEvent(new CustomEvent("open-profile-edit")),
                                100,
                            );
                        }}
                    />
                )}



                {underConstructionTabs.includes(activeTab) && (
                    <div className="flex flex-col items-center justify-center py-52 text-center animate-in zoom-in-95 duration-500">
                        <h2 className="text-3xl font-black text-[#2D3A5D]/10 tracking-[0.4em] uppercase">
                            {activeTab} SECTION
                        </h2>
                        <p className="text-[#2D3A5D]/20 font-bold mt-4 tracking-widest">
                            This part is currently under construction
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default StudentDashboard;
