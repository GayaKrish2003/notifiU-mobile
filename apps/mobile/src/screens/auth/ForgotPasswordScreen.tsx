import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Mail, ShieldCheck, Lock, Eye, EyeOff } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { forgotPassword, verifyOTP, resetPassword } from "@notifiu/shared";
import type { RootStackParamList } from "../../navigation/RootNavigator";

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type Step = 1 | 2 | 3;
type ApiError = { response?: { data?: { message?: string } } };

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { num: 1, label: "Email", Icon: Mail },
    { num: 2, label: "OTP", Icon: ShieldCheck },
    { num: 3, label: "Password", Icon: Lock },
  ];
  return (
    <View className="flex-row items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={s.num}>
          <View className="items-center">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: current >= s.num ? "#FBB017" : "#F0F2F5" }}
            >
              <s.Icon size={18} color={current >= s.num ? "#fff" : "#9CA3AF"} />
            </View>
            <Text className="text-xs mt-1 font-medium" style={{ color: current >= s.num ? "#FBB017" : "#9CA3AF" }}>
              {s.label}
            </Text>
          </View>
          {i < steps.length - 1 && (
            <View className="w-10 h-0.5 mb-5 rounded" style={{ backgroundColor: current > s.num ? "#FBB017" : "#E5E7EB" }} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NavProp>();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (v: string) => {
    if (!v.trim()) return "Email is required.";
    if (!/^\S+@\S+\.\S+$/.test(v)) return "Enter a valid email address.";
    return "";
  };

  const validateOTP = (v: string) => {
    if (!v.trim()) return "OTP is required.";
    if (!/^\d{6}$/.test(v)) return "OTP must be exactly 6 digits.";
    return "";
  };

  const validatePassword = (v: string, c: string) => {
    if (!v) return "Password is required.";
    if (v.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return "Password must contain at least one letter and one number.";
    if (v !== c) return "Passwords do not match.";
    return "";
  };

  const handleSendOTP = async () => {
    const err = validateEmail(email);
    if (err) { setError(err); return; }
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await forgotPassword({ email: email.trim().toLowerCase() });
      setSuccess((res.data as any).message || "OTP sent to your email!");
      setStep(2);
    } catch (e: unknown) {
      setError((e as ApiError).response?.data?.message || "Failed to send OTP. Please check your email.");
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    const err = validateOTP(otp);
    if (err) { setError(err); return; }
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await verifyOTP({ email: email.trim().toLowerCase(), otp });
      setSuccess((res.data as any).message || "OTP verified!");
      setStep(3);
    } catch (e: unknown) {
      setError((e as ApiError).response?.data?.message || "Invalid or expired OTP.");
    } finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    const err = validatePassword(newPassword, confirmPassword);
    if (err) { setError(err); return; }
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await resetPassword({ email: email.trim().toLowerCase(), password: newPassword });
      setSuccess((res.data as any).message || "Password reset successfully!");
      setTimeout(() => navigation.replace("Login"), 2000);
    } catch (e: unknown) {
      setError((e as ApiError).response?.data?.message || "Password reset failed.");
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 items-center justify-center p-6">
            <View className="bg-white rounded-[32px] p-8 w-full max-w-sm border border-gray-100">

              <View className="items-center mb-6">
                <View className="items-center mb-4">
                  <Image
                      source={require("../../../assets/Logo.png")}
                      style={{ width: 180, height: 60 }}
                      resizeMode="cover"
                      />
                  </View>
                <Text className="text-gray-400 font-medium text-base">Reset Password</Text>
              </View>

              <StepIndicator current={step} />

              {error !== "" && (
                <View className="bg-red-50 rounded-xl p-3 mb-4">
                  <Text className="text-red-500 text-sm text-center">{error}</Text>
                </View>
              )}
              {success !== "" && (
                <View className="bg-green-50 rounded-xl p-3 mb-4">
                  <Text className="text-green-600 text-sm text-center">{success}</Text>
                </View>
              )}

              {/* Step 1 */}
              {step === 1 && (
                <View className="gap-5">
                  <View>
                    <Text className="text-gray-700 text-sm font-medium mb-2 pl-1">Email Address</Text>
                    <TextInput
                      value={email}
                      onChangeText={(v) => { setEmail(v); setError(""); }}
                      placeholder="Enter your registered email"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="bg-[#F0F2F5] rounded-2xl px-4 py-4 text-sm text-[#2D3A5D]"
                    />
                  </View>
                  <TouchableOpacity onPress={handleSendOTP} disabled={loading} className="bg-[#FBB017] rounded-2xl py-4 items-center" style={{ opacity: loading ? 0.7 : 1 }}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Send OTP</Text>}
                  </TouchableOpacity>
                </View>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <View className="gap-5">
                  <View>
                    <Text className="text-gray-700 text-sm font-medium mb-2 pl-1">Enter OTP</Text>
                    <TextInput
                      value={otp}
                      onChangeText={(v) => { setOtp(v.replace(/\D/g, "").substring(0, 6)); setError(""); }}
                      placeholder="000000"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      maxLength={6}
                      textAlign="center"
                      className="bg-[#F0F2F5] rounded-2xl px-4 py-4 text-2xl text-[#2D3A5D] font-bold tracking-widest"
                    />
                    <Text className="text-gray-400 text-xs text-center mt-2">Check your email for the 6-digit OTP</Text>
                  </View>
                  <TouchableOpacity onPress={handleVerifyOTP} disabled={loading} className="bg-[#FBB017] rounded-2xl py-4 items-center" style={{ opacity: loading ? 0.7 : 1 }}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Verify OTP</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setStep(1); setOtp(""); setError(""); setSuccess(""); }} className="items-center">
                    <Text className="text-gray-500 text-sm">Resend OTP</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <View className="gap-5">
                  <View>
                    <Text className="text-gray-700 text-sm font-medium mb-2 pl-1">New Password</Text>
                    <View className="relative">
                      <TextInput
                        value={newPassword}
                        onChangeText={(v) => { setNewPassword(v); setError(""); }}
                        placeholder="Min. 8 characters"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showPassword}
                        className="bg-[#F0F2F5] rounded-2xl px-4 py-4 text-sm text-[#2D3A5D] pr-12"
                      />
                      <TouchableOpacity onPress={() => setShowPassword((p) => !p)} className="absolute right-4 top-4">
                        {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                      </TouchableOpacity>
                    </View>
                    <Text className="text-gray-400 text-xs mt-1 pl-1">Must contain letters and numbers</Text>
                  </View>
                  <View>
                    <Text className="text-gray-700 text-sm font-medium mb-2 pl-1">Confirm Password</Text>
                    <View className="relative">
                      <TextInput
                        value={confirmPassword}
                        onChangeText={(v) => { setConfirmPassword(v); setError(""); }}
                        placeholder="Re-enter new password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showConfirm}
                        className="bg-[#F0F2F5] rounded-2xl px-4 py-4 text-sm text-[#2D3A5D] pr-12"
                      />
                      <TouchableOpacity onPress={() => setShowConfirm((p) => !p)} className="absolute right-4 top-4">
                        {showConfirm ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleResetPassword} disabled={loading} className="bg-[#FBB017] rounded-2xl py-4 items-center" style={{ opacity: loading ? 0.7 : 1 }}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Reset Password</Text>}
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity onPress={() => navigation.navigate("Login")} className="flex-row items-center justify-center gap-1 mt-6">
                <ArrowLeft size={16} color="#9CA3AF" />
                <Text className="text-gray-500 text-sm">Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}