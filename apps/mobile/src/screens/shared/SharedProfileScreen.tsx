import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Award,
  IdCard,
  Edit3,
  LogOut,
  BookOpen,
  Save,
  X,
  User,
  Building,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getUserProfile, updateUserProfile } from "@notifiu/shared";
import type { RootStackParamList } from "../../navigation/RootNavigator";

type NavProp = NativeStackNavigationProp<RootStackParamList>;


interface UserData {
  _id?: string;
  name: string;
  email?: string;
  role?: string;
  profileImage?: string;
  phonenumber?: string;
  nic?: string;
  address?: string;
  age?: string | number;
  studentId?: string;
  lecturerId?: string;
  university?: string;
  faculty?: string;
  academicYear?: string;
  department?: string;
  companyName?: string;
  designation?: string;
  accountStatus?: string;
  profileCompletion?: number;
  lastLogin?: string;
  [key: string]: unknown;
}

type ApiError = { response?: { data?: { message?: string } } };


const getInitials = (name: string): string => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getDisplayId = (data: UserData): string =>
  data.studentId ||
  data.lecturerId ||
  data._id?.substring(0, 8).toUpperCase() ||
  "ID000000";


interface InfoCardProps {
  icon: React.FC<{ size: number; color: string }>;
  label: string;
  value?: string | number;
  isEditing: boolean;
  fieldName: string;
  onEdit: (field: string, value: string) => void;
  editable?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
}

function InfoCard({
  icon: Icon,
  label,
  value,
  isEditing,
  fieldName,
  onEdit,
  editable = true,
  keyboardType = "default",
}: InfoCardProps) {
  return (
    <View
      className={`p-3 rounded-2xl border mb-3 ${
        isEditing && editable
          ? "bg-white border-[#FBB017]"
          : "bg-gray-50 border-gray-100"
      }`}
    >
      <View className="flex-row items-center gap-3">
        <View className="bg-white p-2 rounded-xl border border-gray-50 shadow-sm">
          <Icon size={14} color="#FBB017" />
        </View>
        <View className="flex-1">
          <Text className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
            {label}
          </Text>
          {isEditing && editable ? (
            <TextInput
              value={String(value ?? "")}
              onChangeText={(v) => onEdit(fieldName, v)}
              placeholder={`Enter ${label}...`}
              placeholderTextColor="#D1D5DB"
              keyboardType={keyboardType}
              className="text-xs text-[#2D3A5D] font-bold p-0"
            />
          ) : (
            <Text className="text-xs text-[#2D3A5D] font-bold" numberOfLines={1}>
              {value ? String(value) : "N/A"}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}


function ProfileCompletion({ percent }: { percent: number }) {
  const color = percent >= 80 ? "#22c55e" : percent >= 50 ? "#FBB017" : "#ef4444";
  return (
    <View className="bg-white/10 rounded-2xl p-4 mt-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
          Profile Completion
        </Text>
        <Text className="font-black text-sm" style={{ color }}>
          {percent}%
        </Text>
      </View>
      <View className="bg-white/10 rounded-full h-1.5 overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
}

// ─── Profile Screen ───────────────────────────────────────────
export default function SharedProfileScreen() {
  const [profile, setProfile] = useState<UserData | null>(null);
  const [editData, setEditData] = useState<UserData>({ name: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const navigation = useNavigation<NavProp>();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await getUserProfile();
      const data = (res.data as any).user as UserData;
      setProfile(data);
      setEditData(data);
    } catch {
      const cached = await AsyncStorage.getItem("user");
      if (cached) {
        const parsed = JSON.parse(cached) as UserData;
        setProfile(parsed);
        setEditData(parsed);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field: string, value: string) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!editData.name.trim()) {
      Alert.alert("Validation", "Name is required.");
      return;
    }

    if (editData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email)) {
      Alert.alert("Validation", "Enter a valid email address.");
      return;
    }

    if (editData.phonenumber && !/^\d{10}$/.test(String(editData.phonenumber))) {
      Alert.alert("Validation", "Phone number must be exactly 10 digits.");
      return;
    }

    if (editData.nic && !/^\d{12}$/.test(String(editData.nic))) {
      Alert.alert("Validation", "NIC must be exactly 12 digits.");
      return;
    }

    if (
      editData.age &&
      (isNaN(Number(editData.age)) ||
        Number(editData.age) < 16 ||
        Number(editData.age) > 60)
    ) {
      Alert.alert("Validation", "Age must be between 16 and 60.");
      return;
    }

    setSaving(true);
    try {
      const res = await updateUserProfile(editData);
      const updated = (res.data as any).user as UserData;

      setProfile(updated);
      setEditData(updated);

      const cached = await AsyncStorage.getItem("user");
      const parsedCached = cached ? JSON.parse(cached) : {};
      await AsyncStorage.setItem(
        "user",
        JSON.stringify({ ...parsedCached, ...updated })
      );

      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully.");
    } catch (err: unknown) {
      Alert.alert(
        "Error",
        (err as ApiError).response?.data?.message || "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");
          navigation.replace("Login");
        },
      },
    ]);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (profile) setEditData(profile);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA] items-center justify-center">
        <ActivityIndicator size="large" color="#FBB017" />
      </SafeAreaView>
    );
  }

  const displayId = profile ? getDisplayId(profile) : "ID000000";
  const initials = profile?.name ? getInitials(profile.name) : "??";
  const completion = profile?.profileCompletion ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ──────────────────────────────────────── */}
        <View className="bg-[#1A1C2C] px-6 pt-6 pb-8">
          <View className="flex-row items-center gap-5">
            {/* Avatar */}
            <View className="relative">
              <View className="w-20 h-20 bg-[#FBB017] rounded-full items-center justify-center overflow-hidden border-2 border-white/20">
                {profile?.profileImage ? (
                  <Image
                    source={{ uri: profile.profileImage as string }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="text-[#2D3A5D] text-2xl font-black">
                    {initials}
                  </Text>
                )}
              </View>
              <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1A1C2C]" />
            </View>

            {/* Name + ID */}
            <View className="flex-1">
              {isEditing ? (
                <TextInput
                  value={editData.name}
                  onChangeText={(v) => handleEdit("name", v)}
                  className="text-white text-lg font-black uppercase border-b border-[#FBB017] pb-1 mb-2"
                />
              ) : (
                <Text
                  className="text-white text-lg font-black uppercase mb-2"
                  numberOfLines={1}
                >
                  {profile?.name || "Full Name"}
                </Text>
              )}
              <View className="flex-row items-center gap-2">
                <View className="bg-[#FBB017] px-3 py-1 rounded-lg">
                  <Text className="text-[#2D3A5D] text-[10px] font-black tracking-widest uppercase">
                    {displayId}
                  </Text>
                </View>
                <View className="bg-white/10 px-3 py-1 rounded-lg">
                  <Text className="text-white/60 text-[10px] font-bold tracking-widest uppercase">
                    {profile?.role || "user"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Profile Completion Bar (Only if role allows it) */}
          {profile?.role === "lecturer" && completion > 0 && (
            <ProfileCompletion percent={completion} />
          )}

          {/* Last Login */}
          {profile?.lastLogin && (
            <Text className="text-white/30 text-[10px] font-bold mt-4 text-right">
              Last Login: {new Date(profile.lastLogin).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </Text>
          )}
        </View>

        {/* ── Info Cards ──────────────────────────────────── */}
        <View className="px-5 pt-6">
          {/* Account Status Banner */}
          {profile?.accountStatus && profile.accountStatus !== "active" && (
            <View className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4 flex-row items-center gap-3">
              <Text className="text-yellow-600 text-xs font-bold">
                Account Status: <Text className="capitalize">{profile.accountStatus}</Text>
              </Text>
            </View>
          )}

          <Text className="text-[#2D3A5D]/40 text-[10px] font-black uppercase tracking-widest mb-3">
            Personal Information
          </Text>

          {/* Core fields */}
          <InfoCard
            icon={Mail}
            label="Email"
            value={editData.email}
            isEditing={false}
            fieldName="email"
            onEdit={handleEdit}
            editable={false}
          />
          <InfoCard
            icon={Phone}
            label="Phone"
            value={editData.phonenumber}
            isEditing={isEditing}
            fieldName="phonenumber"
            onEdit={handleEdit}
            keyboardType="phone-pad"
          />
          <InfoCard
            icon={IdCard}
            label="NIC"
            value={editData.nic}
            isEditing={isEditing}
            fieldName="nic"
            onEdit={handleEdit}
          />
          <InfoCard
            icon={MapPin}
            label="Address"
            value={editData.address}
            isEditing={isEditing}
            fieldName="address"
            onEdit={handleEdit}
          />
          <InfoCard
            icon={User}
            label="Age"
            value={editData.age}
            isEditing={isEditing}
            fieldName="age"
            onEdit={handleEdit}
            keyboardType="numeric"
          />

          <Text className="text-[#2D3A5D]/40 text-[10px] font-black uppercase tracking-widest mb-3 mt-2">
            Professional Information
          </Text>

          {/* Student-specific */}
          {profile?.role === "student" && (
            <>
              <InfoCard
                icon={Building}
                label="University"
                value={editData.university}
                isEditing={isEditing}
                fieldName="university"
                onEdit={handleEdit}
              />
              <InfoCard
                icon={GraduationCap}
                label="Faculty"
                value={editData.faculty}
                isEditing={isEditing}
                fieldName="faculty"
                onEdit={handleEdit}
              />
              <InfoCard
                icon={Award}
                label="Academic Year"
                value={editData.academicYear}
                isEditing={isEditing}
                fieldName="academicYear"
                onEdit={handleEdit}
              />
            </>
          )}

          {/* Lecturer-specific */}
          {profile?.role === "lecturer" && (
            <>
              <InfoCard
                icon={Building}
                label="University"
                value={editData.university}
                isEditing={isEditing}
                fieldName="university"
                onEdit={handleEdit}
              />
              <InfoCard
                icon={BookOpen}
                label="Department"
                value={editData.department}
                isEditing={isEditing}
                fieldName="department"
                onEdit={handleEdit}
              />
            </>
          )}

          {/* Jobprovider-specific */}
          {profile?.role === "jobprovider" && (
            <>
              <InfoCard
                icon={Building}
                label="Company"
                value={editData.companyName}
                isEditing={isEditing}
                fieldName="companyName"
                onEdit={handleEdit}
              />
              <InfoCard
                icon={IdCard}
                label="Designation"
                value={editData.designation}
                isEditing={isEditing}
                fieldName="designation"
                onEdit={handleEdit}
              />
            </>
          )}

          {/* ── Actions ─────────────────────────────────── */}
          <View className="flex-row gap-3 mt-4 mb-8">
            {isEditing ? (
              <>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  className="flex-1 flex-row items-center justify-center gap-2 bg-[#FBB017] py-4 rounded-2xl"
                  style={{ opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? (
                    <ActivityIndicator color="#2D3A5D" size="small" />
                  ) : (
                    <Save size={16} color="#2D3A5D" />
                  )}
                  <Text className="text-[#2D3A5D] font-black text-xs uppercase tracking-widest">
                    {saving ? "Saving..." : "Save Changes"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCancelEdit}
                  className="flex-1 flex-row items-center justify-center gap-2 bg-gray-100 py-4 rounded-2xl"
                >
                  <X size={16} color="#374151" />
                  <Text className="text-gray-700 font-black text-xs uppercase tracking-widest">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  className="flex-1 flex-row items-center justify-center gap-2 bg-[#1A1C2C] py-4 rounded-2xl"
                >
                  <Edit3 size={16} color="#FBB017" />
                  <Text className="text-white font-black text-xs uppercase tracking-widest">
                    Edit Profile
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleLogout}
                  className="flex-1 flex-row items-center justify-center gap-2 bg-white py-4 rounded-2xl border border-red-100"
                >
                  <LogOut size={16} color="#ef4444" />
                  <Text className="text-red-500 font-black text-xs uppercase tracking-widest">
                    Logout
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
