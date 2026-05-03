import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Eye, EyeOff, GraduationCap, Briefcase, BookOpen, ArrowLeft, Users
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { register } from "@notifiu/shared";
import type { RootStackParamList } from "../../navigation/RootNavigator";

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type UserRole = "student" | "lecturer" | "jobprovider" | "clubpresident";
type ApiError = { response?: { data?: { message?: string } } };

interface FormData {
  name: string; email: string; password: string; confirmPassword: string;
  address: string; age: string; nic: string; phonenumber: string;
  university: string; faculty: string; academicYear: string; studentId: string;
  department: string; lecturerId: string;
  companyName: string; designation: string; companyWebsite: string;
}

interface FormErrors {
  name: string; email: string; password: string; confirmPassword: string;
  address: string; age: string; nic: string; phonenumber: string;
  university: string; faculty: string; academicYear: string; studentId: string;
  department: string;
  companyName: string; designation: string; companyWebsite: string;
}

const EMPTY_FORM: FormData = {
  name: "", email: "", password: "", confirmPassword: "",
  address: "", age: "", nic: "", phonenumber: "",
  university: "", faculty: "", academicYear: "", studentId: "",
  department: "", lecturerId: "",
  companyName: "", designation: "", companyWebsite: "",
};

const EMPTY_ERRORS: FormErrors = {
  name: "", email: "", password: "", confirmPassword: "",
  address: "", age: "", nic: "", phonenumber: "",
  university: "", faculty: "", academicYear: "", studentId: "",
  department: "",
  companyName: "", designation: "", companyWebsite: "",
};


const validate = (form: FormData, role: UserRole): FormErrors => {
  const e = { ...EMPTY_ERRORS };

  if (!form.name.trim()) e.name = "Full name is required.";
  else if (form.name.trim().length < 3) e.name = "Name must be at least 3 characters.";

  if (!form.email.trim()) e.email = "Email is required.";
  else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address.";

  if (!form.password) e.password = "Password is required.";
  else if (form.password.length < 8) e.password = "Password must be at least 8 characters.";
  else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
    e.password = "Must contain at least one letter and one number.";

  if (!form.confirmPassword) e.confirmPassword = "Please confirm your password.";
  else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match.";

  if (!form.address.trim()) e.address = "Address is required.";

  if (!form.age) e.age = "Age is required.";
  else if (isNaN(Number(form.age)) || Number(form.age) < 16 || Number(form.age) > 100)
    e.age = "Enter a valid age (16–100).";

  if (!form.nic.trim()) e.nic = "NIC is required.";
  else if (!/^[0-9]{9}[vVxX]$|^[0-9]{12}$/.test(form.nic.trim()))
    e.nic = "Enter a valid NIC (e.g. 123456789V or 200012345678).";

  if (!form.phonenumber.trim()) e.phonenumber = "Phone number is required.";
  else if (!/^\d{9,12}$/.test(form.phonenumber.replace(/\s/g, "")))
    e.phonenumber = "Enter a valid phone number (9–12 digits).";

  if (role === "student") {
    if (!form.university.trim()) e.university = "University is required.";
    if (!form.faculty.trim()) e.faculty = "Faculty is required.";
    if (!form.academicYear.trim()) e.academicYear = "Academic year is required.";
    if (!form.studentId.trim()) e.studentId = "Student ID is required.";
  }

  if (role === "lecturer") {
    if (!form.department.trim()) e.department = "Department is required.";
  }

  if (role === "jobprovider") {
    if (!form.companyName.trim()) e.companyName = "Company name is required.";
    if (!form.designation.trim()) e.designation = "Designation is required.";
    if (form.companyWebsite && !/^https?:\/\/.+/.test(form.companyWebsite))
      e.companyWebsite = "Enter a valid URL (e.g. https://company.com).";
  }

  return e;
};

const hasErrors = (e: FormErrors) => Object.values(e).some((v) => v !== "");


interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "url";
  autoCapitalize?: "none" | "words" | "sentences";
  secureTextEntry?: boolean;
  multiline?: boolean;
  required?: boolean;
  maxLength?: number;
  rightElement?: React.ReactNode;
}

function Field({
  label, value, onChange, error, placeholder, keyboardType = "default",
  autoCapitalize = "sentences", secureTextEntry, multiline, required, maxLength, rightElement,
}: FieldProps) {
  return (
    <View className="mb-4">
      <Text className="text-gray-700 text-sm font-medium mb-2 pl-1">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>
      <View className="relative">
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          maxLength={maxLength}
          textAlignVertical={multiline ? "top" : "center"}
          className={`rounded-2xl px-4 text-sm text-[#2D3A5D] ${multiline ? "py-3 min-h-[90px]" : "py-4"} ${error ? "bg-red-50 border border-red-300" : "bg-[#F0F2F5]"} ${rightElement ? "pr-12" : ""}`}
        />
        {rightElement && (
          <View className="absolute right-4 top-4">{rightElement}</View>
        )}
      </View>
      {error ? <Text className="text-red-500 text-xs mt-1 pl-1">{error}</Text> : null}
    </View>
  );
}


function RoleCard({ role, onSelect }: { role: UserRole; onSelect: (r: UserRole) => void }) {
  const config = {
    student:     { Icon: GraduationCap, title: "Student", desc: "Access announcements, tickets, and campus resources." },
    lecturer:    { Icon: BookOpen,       title: "Lecturer", desc: "Manage announcements and academic notifications." },
    jobprovider: { Icon: Briefcase,      title: "Job Provider", desc: "Post opportunities for students." },
    clubpresident: { Icon: Users,         title: "Club President",  desc: "Create and manage events for your club." },
  }[role];

  return (
    <TouchableOpacity
      onPress={() => onSelect(role)}
      className="bg-white rounded-[24px] p-6 border border-gray-100 mb-4"
    >
      <View className="bg-[#F0F2F5] p-3 rounded-2xl w-fit mb-3">
        <config.Icon size={28} color="#2D3A5D" />
      </View>
      <Text className="text-[#2D3A5D] text-lg font-bold mb-1">{config.title}</Text>
      <Text className="text-gray-500 text-sm leading-relaxed">{config.desc}</Text>
    </TouchableOpacity>
  );
}


export default function RegisterScreen() {
  const navigation = useNavigation<NavProp>();
  const [role, setRole] = useState<UserRole | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field: keyof FormData) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async () => {
    if (!role) return;
    const errs = validate(form, role);
    setErrors(errs);
    if (hasErrors(errs)) return;

    setApiError(""); setLoading(true);
    try {
      const { confirmPassword, ...submitData } = form;
      const payload = { ...submitData, age: parseInt(form.age, 10) };
      await register(role, payload);
      navigation.replace("Login");
    } catch (e: unknown) {
      setApiError(
        (e as ApiError).response?.data?.message ||
        "Registration failed. Please check all fields and try again."
      );
    } finally {
      setLoading(false);
    }
  };


  if (!role) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA]">
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          <View className="items-center mb-10">
            <View className="items-center mb-4">
               <Image
                    source={require("../../../assets/Logo.png")}
                    style={{ width: 180, height: 60 }}
                    resizeMode="cover"
                />
            </View>
            <Text className="text-gray-500 text-center">Select your account type to get started</Text>
          </View>

          <RoleCard role="student" onSelect={setRole} />
          <RoleCard role="lecturer" onSelect={setRole} />
          <RoleCard role="jobprovider" onSelect={setRole} />
          <RoleCard role="clubpresident" onSelect={setRole} /> 

          <View className="flex-row justify-center gap-1 mt-4 mb-10">
            <Text className="text-gray-500 text-sm">Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text className="text-[#FBB017] text-sm font-semibold">Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }


  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="px-6 pt-6 pb-10">

            {/* Header */}
            <TouchableOpacity onPress={() => { setRole(null); setErrors(EMPTY_ERRORS); setApiError(""); }} className="flex-row items-center gap-2 mb-6">
              <ArrowLeft size={20} color="#374151" />
              <Text className="text-gray-700 font-medium">Back</Text>
            </TouchableOpacity>

            <View className="items-center mb-8">
              <View className="items-center mb-4">
                  <Image
                     source={require("../../../assets/Logo.png")}
                     style={{ width: 180, height: 60 }}
                     resizeMode="contain"
                  />
              </View>
              <Text className="text-gray-500 text-center">
                  Select your account type to get started
              </Text>
            </View>

            {/* API Error */}
            {apiError !== "" && (
              <View className="bg-red-50 rounded-2xl p-4 mb-5">
                <Text className="text-red-500 text-sm text-center">{apiError}</Text>
              </View>
            )}

            {/* ── Common Fields ── */}
            <Text className="text-[#2D3A5D]/40 text-[10px] font-black uppercase tracking-widest mb-3">Personal Information</Text>

            <Field label="Full Name" value={form.name} onChange={set("name")} error={errors.name} placeholder="John Doe" autoCapitalize="words" required />
            <Field label="Email Address" value={form.email} onChange={set("email")} error={errors.email} placeholder="john@example.com" keyboardType="email-address" autoCapitalize="none" required />
            <Field label="Phone Number" value={form.phonenumber} onChange={set("phonenumber")} error={errors.phonenumber} placeholder="0771234567" keyboardType="phone-pad" required />
            <Field
              label="Password" value={form.password} onChange={set("password")} error={errors.password}
              placeholder="Min. 8 characters" secureTextEntry={!showPassword} required
              rightElement={
                <TouchableOpacity onPress={() => setShowPassword((p) => !p)}>
                  {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                </TouchableOpacity>
              }
            />
            <Field
              label="Confirm Password" value={form.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword}
              placeholder="Re-enter password" secureTextEntry={!showConfirm} required
              rightElement={
                <TouchableOpacity onPress={() => setShowConfirm((p) => !p)}>
                  {showConfirm ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                </TouchableOpacity>
              }
            />
            <Field label="NIC Number" value={form.nic} onChange={set("nic")} error={errors.nic} placeholder="200012345678" autoCapitalize="none" required />
            <Field label="Age" value={form.age} onChange={set("age")} error={errors.age} placeholder="22" keyboardType="numeric" required />
            <Field label="Address" value={form.address} onChange={set("address")} error={errors.address} placeholder="No. 1, Main Street, Colombo" multiline required />

            {/* ── Student Fields ── */}
            {role === "student" && (
              <>
                <Text className="text-[#2D3A5D]/40 text-[10px] font-black uppercase tracking-widest mb-3 mt-2">Academic Information</Text>
                <Field label="University" value={form.university} onChange={set("university")} error={errors.university} placeholder="University of Moratuwa" required />
                <Field label="Faculty" value={form.faculty} onChange={set("faculty")} error={errors.faculty} placeholder="Engineering" required />
                <Field label="Academic Year" value={form.academicYear} onChange={set("academicYear")} error={errors.academicYear} placeholder="2nd Year" required />
                <Field label="Student ID" value={form.studentId} onChange={set("studentId")} error={errors.studentId} placeholder="IT22234567" autoCapitalize="none" required />
              </>
            )}

            {/* ── Lecturer Fields ── */}
            {role === "lecturer" && (
              <>
                <Text className="text-[#2D3A5D]/40 text-[10px] font-black uppercase tracking-widest mb-3 mt-2">Academic Information</Text>
                <Field label="University" value={form.university} onChange={set("university")} error={errors.university} placeholder="University of Moratuwa" />
                <Field label="Department" value={form.department} onChange={set("department")} error={errors.department} placeholder="Department of Computer Science" required />
              </>
            )}

            {/* ── Job Provider Fields ── */}
            {role === "jobprovider" && (
              <>
                <Text className="text-[#2D3A5D]/40 text-[10px] font-black uppercase tracking-widest mb-3 mt-2">Company Information</Text>
                <Field label="Company Name" value={form.companyName} onChange={set("companyName")} error={errors.companyName} placeholder="Acme Corp" required />
                <Field label="Designation" value={form.designation} onChange={set("designation")} error={errors.designation} placeholder="HR Manager" required />
                <Field label="Company Website" value={form.companyWebsite} onChange={set("companyWebsite")} error={errors.companyWebsite} placeholder="https://company.com" keyboardType="url" autoCapitalize="none" />
              </>
            )}

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className="bg-[#FBB017] rounded-2xl py-4 items-center mt-4"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-bold text-base">Create Account</Text>
              }
            </TouchableOpacity>

            <View className="flex-row justify-center gap-1 mt-5">
              <Text className="text-gray-500 text-sm">Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text className="text-[#FBB017] text-sm font-semibold">Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}