import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { login } from "@notifiu/shared";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { Dimensions } from "react-native";
import { registerPushToken } from "../../services/registerPushToken";

type LoginNavProp = NativeStackNavigationProp<RootStackParamList, "Login">;

interface LoginResponse {
  role: string;
  accessToken?: string;
  token?: string;
  name?: string;
  email?: string;
  _id?: string;
  studentId?: string;
  phonenumber?: string;
}

type ApiError = { response?: { data?: { message?: string } } };

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<LoginNavProp>();
  const { width } = Dimensions.get("window");

  const handleLogin = async () => {
    setError("");
    if (!email.trim()) { setError("Email is required."); return; }
    if (!password) { setError("Password is required."); return; }

    setLoading(true);
    try {
      const response = await login({ email: email.trim().toLowerCase(), password });
      const data = response.data as LoginResponse;
      const accessToken = data.accessToken || data.token;

      if (accessToken) {
        await AsyncStorage.setItem("token", accessToken);
        await AsyncStorage.setItem("user", JSON.stringify({ accessToken, name: data.name, email: data.email, role: data.role, _id: data._id,
          
  studentId: data.studentId || null,
  phonenumber: data.phonenumber || null, }));
  // After
try {
  await registerPushToken();
} catch {
  // push token registration failed — login still proceeds
}
      }

      if (data.role === "superadmin") navigation.replace("AdminTabs");
      else if (data.role === "lecturer") navigation.replace("LecturerTabs");
      else if (data.role === "jobprovider") navigation.replace("JobProviderTabs"); 
      else if (data.role === "clubpresident") navigation.replace("ClubPresidentTabs");
      else navigation.replace("StudentTabs");
    } catch (err: unknown) {
      setError((err as ApiError).response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-[#F8F9FA]" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 items-center justify-center p-6">
          <View className="bg-white rounded-[32px] p-10 w-full max-w-sm shadow-sm border border-gray-100">
            <View className="items-center mb-8">
              <View className="items-center mb-4">
                <Image
                     source={require("../../../assets/Logo.png")}
                     style={{ width: width * 0.7, height: 100 }}
                     resizeMode="cover"
                      />
              </View>
              <Text className="text-gray-400 font-medium text-base">Login to Your Account</Text>
            </View>

            {error !== "" && (
              <View className="bg-red-50 rounded-xl p-3 mb-5">
                <Text className="text-red-500 text-sm text-center">{error}</Text>
              </View>
            )}

            <View className="mb-5">
              <Text className="text-gray-700 text-sm font-medium mb-2 pl-1">Email / Username</Text>
              <TextInput
                value={email}
                onChangeText={(v) => { setEmail(v); setError(""); }}
                autoCapitalize="none"
                keyboardType="email-address"
                className="bg-[#F0F2F5] rounded-2xl px-4 py-4 text-gray-800 text-sm"
                placeholderTextColor="#9CA3AF"
                placeholder="Enter your email"
              />
            </View>

            <View className="mb-5">
              <Text className="text-gray-700 text-sm font-medium mb-2 pl-1">Password</Text>
              <View className="relative">
                <TextInput
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError(""); }}
                  secureTextEntry={!showPassword}
                  className="bg-[#F0F2F5] rounded-2xl px-4 py-4 text-gray-800 text-sm pr-12"
                  placeholderTextColor="#9CA3AF"
                  placeholder="Enter your password"
                />
                <TouchableOpacity onPress={() => setShowPassword((p) => !p)} className="absolute right-4 top-4">
                  {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                </TouchableOpacity>
              </View>
            </View>

            <View className="items-end mb-6">
              <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                <Text className="text-[#FBB017] text-sm font-semibold">Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="bg-[#FBB017] rounded-2xl py-4 items-center shadow-sm"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Login</Text>}
            </TouchableOpacity>

            <View className="flex-row justify-center gap-1 mt-5">
              <Text className="text-sm text-gray-500">Don't have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text className="text-[#FBB017] text-sm font-semibold">Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}