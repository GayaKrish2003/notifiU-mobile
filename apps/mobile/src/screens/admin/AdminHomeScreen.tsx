import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Modal, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Search, ChevronDown, Trash2, Eye, Clock,
  Check, X, AlertTriangle, Ban,
} from "lucide-react-native";
import {
  getAllUsers, updateAccountStatus, deleteUser, getUserActivity,
} from "@notifiu/shared";

interface UserData {
  _id: string;
  name: string;
  email?: string;
  role?: string;
  accountStatus?: string;
  paymentStatus?: string;
  studentId?: string;
  lecturerId?: string;
  faculty?: string;
  department?: string;
  companyName?: string;
  createdAt?: string;
}

interface Pagination { total: number; page: number; totalPages: number; }
type ApiError = { response?: { data?: { message?: string } } };

const ROLE_OPTIONS = [
  { value: "all", label: "All Users" },
  { value: "student", label: "Students" },
  { value: "lecturer", label: "Lecturers" },
  { value: "jobprovider", label: "Job Providers" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
  { value: "deactivated", label: "Deactivated" },
];

const ACCOUNT_STATUS_OPTIONS = ["active", "pending", "suspended", "deactivated"];

const ACCOUNT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:      { bg: "#dcfce7", text: "#15803d" },
  pending:     { bg: "#fef9c3", text: "#a16207" },
  suspended:   { bg: "#fee2e2", text: "#dc2626" },
  deactivated: { bg: "#f1f5f9", text: "#475569" },
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  student:     { bg: "#e0f2fe", text: "#0369a1" },
  lecturer:    { bg: "#f3e8ff", text: "#7e22ce" },
  jobprovider: { bg: "#fce7f3", text: "#be185d" },
  superadmin:  { bg: "#fef9c3", text: "#a16207" },
};

const FALLBACK_COLOR = { bg: "#f1f5f9", text: "#475569" };

const getStatusColor = (status?: string) =>
  ACCOUNT_STATUS_COLORS[status ?? ""] ?? FALLBACK_COLOR;

const getRoleColor = (role?: string) =>
  ROLE_COLORS[role ?? ""] ?? FALLBACK_COLOR;

interface DropdownProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}

function Dropdown({ label, value, options, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View>
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        className="flex-row items-center gap-2 bg-white border border-gray-200 px-3 py-2.5 rounded-xl"
      >
        <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest">{label}:</Text>
        <Text className="text-[#2D3A5D] text-xs font-bold">{selected?.label}</Text>
        <ChevronDown size={14} color="#9CA3AF" />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity className="flex-1" onPress={() => setOpen(false)} activeOpacity={1}>
          <View className="absolute top-40 left-4 right-4 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => { onChange(opt.value); setOpen(false); }}
                className={`px-5 py-3.5 border-b border-gray-50 ${value === opt.value ? "bg-[#FFF9EE]" : ""}`}
              >
                <Text className={`text-sm font-bold ${value === opt.value ? "text-[#FBB017]" : "text-[#2D3A5D]"}`}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function ActivityModal({ visible, user, activity, loading, onClose }: {
  visible: boolean; user: UserData | null; activity: any[]; loading: boolean; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: "70%" }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-[#2D3A5D] font-black text-lg">{user?.name}</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color="#9CA3AF" /></TouchableOpacity>
          </View>
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Activity Log</Text>
          {loading
            ? <ActivityIndicator color="#FBB017" />
            : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {activity.length === 0
                  ? <Text className="text-gray-300 text-center py-8">No activity recorded.</Text>
                  : activity.map((a, i) => (
                    <View key={i} className="flex-row gap-3 mb-3 pb-3 border-b border-gray-50">
                      <View className="w-7 h-7 bg-[#FBB017]/10 rounded-full items-center justify-center mt-0.5">
                        <Clock size={12} color="#FBB017" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[#2D3A5D] text-xs font-bold capitalize">{a.action?.replace(/_/g, " ")}</Text>
                        {a.details && <Text className="text-gray-400 text-xs mt-0.5">{a.details}</Text>}
                        <Text className="text-gray-300 text-[10px] mt-1">{new Date(a.timestamp).toLocaleString()}</Text>
                      </View>
                    </View>
                  ))
                }
              </ScrollView>
            )
          }
        </View>
      </View>
    </Modal>
  );
}

function StatusPickerModal({ visible, user, onSelect, onClose }: {
  visible: boolean; user: UserData | null; onSelect: (s: string) => void; onClose: () => void;
}) {
  const statusIcons: Record<string, React.ReactNode> = {
    active:      <Check size={16} color="#15803d" />,
    pending:     <Clock size={16} color="#a16207" />,
    suspended:   <AlertTriangle size={16} color="#dc2626" />,
    deactivated: <Ban size={16} color="#475569" />,
  };
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity className="flex-1 bg-black/40 justify-end" onPress={onClose} activeOpacity={1}>
        <View className="bg-white rounded-t-3xl p-6">
          <Text className="text-[#2D3A5D] font-black text-base mb-1">Update Status</Text>
          <Text className="text-gray-400 text-xs mb-5">{user?.name}</Text>
          {ACCOUNT_STATUS_OPTIONS.map((s) => {
            const sc = getStatusColor(s);
            const isActive = user?.accountStatus === s;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => onSelect(s)}
                className={`flex-row items-center justify-between px-4 py-3.5 rounded-xl mb-2 ${isActive ? "border-2 border-[#FBB017]" : "border border-gray-100"}`}
              >
                <View className="flex-row items-center gap-3">
                  {statusIcons[s]}
                  <Text className="text-[#2D3A5D] font-bold text-sm capitalize">{s}</Text>
                </View>
                <View className="px-2 py-1 rounded-full" style={{ backgroundColor: sc.bg }}>
                  <Text className="text-xs font-bold capitalize" style={{ color: sc.text }}>{s}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function UserDetailModal({ visible, user, onClose, onStatusChange, onDelete, onViewActivity }: {
  visible: boolean; user: UserData | null; onClose: () => void;
  onStatusChange: (userId: string, status: string) => void;
  onDelete: (userId: string, name: string) => void;
  onViewActivity: (user: UserData) => void;
}) {
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  if (!user) return null;
  const sc = getStatusColor(user.accountStatus);
  const rc = getRoleColor(user.role);
  const displayId = user.studentId || user.lecturerId || user._id.substring(0, 8).toUpperCase();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <StatusPickerModal
        visible={showStatusPicker}
        user={user}
        onSelect={(s) => { setShowStatusPicker(false); onStatusChange(user._id, s); }}
        onClose={() => setShowStatusPicker(false)}
      />
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-3xl p-6">
          <View className="flex-row items-start justify-between mb-5">
            <View className="flex-1">
              <Text className="text-[#2D3A5D] font-black text-lg" numberOfLines={1}>{user.name}</Text>
              <Text className="text-gray-400 text-xs mt-1">{user.email}</Text>
              <View className="flex-row gap-2 mt-2">
                <View className="px-2 py-1 rounded-full" style={{ backgroundColor: rc.bg }}>
                  <Text className="text-[10px] font-bold capitalize" style={{ color: rc.text }}>{user.role}</Text>
                </View>
                <View className="bg-[#1A1C2C] px-2 py-1 rounded-full">
                  <Text className="text-[10px] font-bold text-white uppercase">{displayId}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}><X size={22} color="#9CA3AF" /></TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setShowStatusPicker(true)}
            className="flex-row items-center justify-between bg-gray-50 rounded-2xl px-4 py-3.5 mb-3 border border-gray-100"
          >
            <Text className="text-[#2D3A5D] text-sm font-bold">Account Status</Text>
            <View className="flex-row items-center gap-2">
              <View className="px-3 py-1 rounded-full" style={{ backgroundColor: sc.bg }}>
                <Text className="text-xs font-bold capitalize" style={{ color: sc.text }}>{user.accountStatus ?? "unknown"}</Text>
              </View>
              <ChevronDown size={14} color="#9CA3AF" />
            </View>
          </TouchableOpacity>

          {user.faculty && (
            <View className="bg-gray-50 rounded-2xl px-4 py-3 mb-3 border border-gray-100">
              <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Faculty</Text>
              <Text className="text-[#2D3A5D] text-sm font-bold">{user.faculty}</Text>
            </View>
          )}
          {user.department && (
            <View className="bg-gray-50 rounded-2xl px-4 py-3 mb-3 border border-gray-100">
              <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Department</Text>
              <Text className="text-[#2D3A5D] text-sm font-bold">{user.department}</Text>
            </View>
          )}
          {user.companyName && (
            <View className="bg-gray-50 rounded-2xl px-4 py-3 mb-3 border border-gray-100">
              <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Company</Text>
              <Text className="text-[#2D3A5D] text-sm font-bold">{user.companyName}</Text>
            </View>
          )}

          <View className="flex-row gap-3 mt-2">
            <TouchableOpacity
              onPress={() => { onClose(); onViewActivity(user); }}
              className="flex-1 flex-row items-center justify-center gap-2 bg-[#1A1C2C] py-3.5 rounded-2xl"
            >
              <Clock size={16} color="#FBB017" />
              <Text className="text-white font-bold text-xs">Activity</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { onClose(); onDelete(user._id, user.name); }}
              className="flex-1 flex-row items-center justify-center gap-2 bg-red-50 py-3.5 rounded-2xl border border-red-100"
            >
              <Trash2 size={16} color="#ef4444" />
              <Text className="text-red-500 font-bold text-xs">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function AdminHomeScreen() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, totalPages: 1 });
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [activityUser, setActivityUser] = useState<UserData | null>(null);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      const data = res.data as any;
      let filtered = (data.users ?? data ?? []) as UserData[];
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.studentId?.toLowerCase().includes(q) ||
            u.lecturerId?.toLowerCase().includes(q)
        );
      }
      if (selectedRole !== "all") filtered = filtered.filter((u) => u.role === selectedRole);
      if (statusFilter !== "all") filtered = filtered.filter((u) => u.accountStatus === statusFilter);
      setUsers(filtered);
      setPagination(data.pagination ?? { total: filtered.length, page: 1, totalPages: 1 });
    } catch {
      Alert.alert("Error", "Failed to load users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedRole, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(), 400);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const onRefresh = () => { setRefreshing(true); fetchUsers(); };

  const handleStatusChange = (userId: string, status: string) => {
    const user = users.find((u) => u._id === userId);
    if (!user) return;
    Alert.alert("Confirm", `Change ${user.name}'s status to "${status}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            await updateAccountStatus(userId, status);
            setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, accountStatus: status } : u));
            if (selectedUser?._id === userId) setSelectedUser((prev) => prev ? { ...prev, accountStatus: status } : null);
            Alert.alert("Success", `Status updated to ${status}.`);
          } catch (err: unknown) {
            Alert.alert("Error", (err as ApiError).response?.data?.message || "Failed to update status.");
          }
        },
      },
    ]);
  };

  const handleDelete = (userId: string, name: string) => {
    Alert.alert("Delete User", `Permanently delete ${name}'s account?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await deleteUser(userId);
            setUsers((prev) => prev.filter((u) => u._id !== userId));
            Alert.alert("Success", "User deleted.");
          } catch (err: unknown) {
            Alert.alert("Error", (err as ApiError).response?.data?.message || "Failed to delete user.");
          }
        },
      },
    ]);
  };

  const handleViewActivity = async (user: UserData) => {
    setActivityUser(user);
    setShowActivity(true);
    setActivityLoading(true);
    try {
      const res = await getUserActivity(user._id);
      setActivityData((res.data as any).user?.activityLog ?? []);
    } catch {
      setActivityData([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const getDisplayId = (user: UserData) =>
    user.studentId || user.lecturerId || user._id.substring(0, 8).toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <UserDetailModal
        visible={showUserDetail}
        user={selectedUser}
        onClose={() => setShowUserDetail(false)}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        onViewActivity={handleViewActivity}
      />
      <ActivityModal
        visible={showActivity}
        user={activityUser}
        activity={activityData}
        loading={activityLoading}
        onClose={() => setShowActivity(false)}
      />

      <ScrollView
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FBB017" />}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-[#2D3A5D]">User Profiles</Text>
          <View className="bg-[#1A1C2C] px-3 py-1.5 rounded-xl">
            <Text className="text-[#FBB017] text-xs font-black">{pagination.total} total</Text>
          </View>
        </View>

        <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 mb-3">
          <Search size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, email or ID..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 py-3.5 px-3 text-sm text-[#2D3A5D]"
          />
        </View>

        <View className="flex-row gap-2 mb-5">
          <Dropdown label="Role" value={selectedRole} options={ROLE_OPTIONS} onChange={setSelectedRole} />
          <Dropdown label="Status" value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />
        </View>

        {loading && <ActivityIndicator color="#FBB017" className="mt-10" />}

        {!loading && (
          <View className="gap-3 pb-8">
            {users.map((user) => {
              const sc = getStatusColor(user.accountStatus);
              const rc = getRoleColor(user.role);
              return (
                <TouchableOpacity
                  key={user._id}
                  onPress={() => { setSelectedUser(user); setShowUserDetail(true); }}
                  className="bg-white rounded-2xl p-4 border border-gray-100"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-[#2D3A5D] font-bold text-sm" numberOfLines={1}>{user.name}</Text>
                      <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>{user.email}</Text>
                      <Text className="text-gray-300 text-[10px] mt-0.5 font-bold uppercase">{getDisplayId(user)}</Text>
                    </View>
                    <View className="items-end gap-1.5">
                      <View className="px-2 py-1 rounded-full" style={{ backgroundColor: rc.bg }}>
                        <Text className="text-[10px] font-bold capitalize" style={{ color: rc.text }}>{user.role ?? "unknown"}</Text>
                      </View>
                      <View className="px-2 py-1 rounded-full" style={{ backgroundColor: sc.bg }}>
                        <Text className="text-[10px] font-bold capitalize" style={{ color: sc.text }}>{user.accountStatus ?? "unknown"}</Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                    <TouchableOpacity onPress={() => handleViewActivity(user)} className="flex-row items-center gap-1">
                      <Clock size={13} color="#9CA3AF" />
                      <Text className="text-gray-400 text-xs">Activity</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setSelectedUser(user); setShowUserDetail(true); }} className="flex-row items-center gap-1">
                      <Eye size={13} color="#9CA3AF" />
                      <Text className="text-gray-400 text-xs">Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(user._id, user.name)} className="flex-row items-center gap-1 ml-auto">
                      <Trash2 size={13} color="#f87171" />
                      <Text className="text-red-400 text-xs">Delete</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
            {users.length === 0 && (
              <View className="items-center py-16">
                <Text className="text-gray-300 font-bold tracking-widest">No users found.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}