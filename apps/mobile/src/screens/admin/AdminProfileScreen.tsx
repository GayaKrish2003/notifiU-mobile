import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut, Shield, User, Mail, Clock } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getUserProfile } from "@notifiu/shared";
import type { RootStackParamList } from "../../navigation/RootNavigator";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface AdminData {
  _id?: string;
  name: string;
  email?: string;
  role?: string;
  profileImage?: string;
  lastLogin?: string;
  createdAt?: string;
  accountStatus?: string;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

export default function AdminProfileScreen() {
  const [profile, setProfile] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavProp>();

  useEffect(() => {
    getUserProfile()
      .then((res: any) => setProfile(res.data.user))
      .catch(async () => {
        const cached = await AsyncStorage.getItem("user");
        if (cached) setProfile(JSON.parse(cached));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout", style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");
          navigation.replace("Login");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA] items-center justify-center">
        <ActivityIndicator size="large" color="#FBB017" />
      </SafeAreaView>
    );
  }

  const initials = profile?.name ? getInitials(profile.name) : "SA";
  const displayId = profile?._id?.substring(0, 8).toUpperCase() ?? "ADMIN";

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="bg-[#1A1C2C] px-6 pt-6 pb-8">
          <View className="flex-row items-center gap-5 mb-5">
            <View className="w-20 h-20 bg-[#FBB017] rounded-full items-center justify-center overflow-hidden border-2 border-white/20">
              {profile?.profileImage ? (
                <Image source={{ uri: profile.profileImage }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Text className="text-[#2D3A5D] text-2xl font-black">{initials}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-black uppercase mb-2" numberOfLines={1}>
                {profile?.name || "Super Admin"}
              </Text>
              <View className="flex-row items-center gap-2">
                <View className="bg-[#FBB017] px-3 py-1 rounded-lg">
                  <Text className="text-[#2D3A5D] text-[10px] font-black tracking-widest uppercase">{displayId}</Text>
                </View>
                <View className="bg-white/10 px-3 py-1 rounded-lg flex-row items-center gap-1">
                  <Shield size={10} color="#FBB017" />
                  <Text className="text-white/60 text-[10px] font-bold tracking-widest uppercase">Super Admin</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Info Cards */}
        <View className="px-5 pt-6">
          <Text className="text-[#2D3A5D]/40 text-[10px] font-black uppercase tracking-widest mb-3">Account Information</Text>

          <View className="bg-gray-50 border border-gray-100 rounded-2xl p-3 mb-3 flex-row items-center gap-3">
            <View className="bg-white p-2 rounded-xl border border-gray-50">
              <Mail size={14} color="#FBB017" />
            </View>
            <View>
              <Text className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Email</Text>
              <Text className="text-xs text-[#2D3A5D] font-bold">{profile?.email || "N/A"}</Text>
            </View>
          </View>

          <View className="bg-gray-50 border border-gray-100 rounded-2xl p-3 mb-3 flex-row items-center gap-3">
            <View className="bg-white p-2 rounded-xl border border-gray-50">
              <User size={14} color="#FBB017" />
            </View>
            <View>
              <Text className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Role</Text>
              <Text className="text-xs text-[#2D3A5D] font-bold capitalize">{profile?.role || "superadmin"}</Text>
            </View>
          </View>

          <View className="bg-gray-50 border border-gray-100 rounded-2xl p-3 mb-3 flex-row items-center gap-3">
            <View className="bg-white p-2 rounded-xl border border-gray-50">
              <Shield size={14} color="#FBB017" />
            </View>
            <View>
              <Text className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Account Status</Text>
              <Text className="text-xs text-[#2D3A5D] font-bold capitalize">{profile?.accountStatus || "active"}</Text>
            </View>
          </View>

          {profile?.lastLogin && (
            <View className="bg-gray-50 border border-gray-100 rounded-2xl p-3 mb-3 flex-row items-center gap-3">
              <View className="bg-white p-2 rounded-xl border border-gray-50">
                <Clock size={14} color="#FBB017" />
              </View>
              <View>
                <Text className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Last Login</Text>
                <Text className="text-xs text-[#2D3A5D] font-bold">
                  {new Date(profile.lastLogin).toLocaleString("en-GB", {
                    day: "2-digit", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>
          )}

          {profile?.createdAt && (
            <View className="bg-gray-50 border border-gray-100 rounded-2xl p-3 mb-6 flex-row items-center gap-3">
              <View className="bg-white p-2 rounded-xl border border-gray-50">
                <Clock size={14} color="#FBB017" />
              </View>
              <View>
                <Text className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Member Since</Text>
                <Text className="text-xs text-[#2D3A5D] font-bold">
                  {new Date(profile.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </Text>
              </View>
            </View>
          )}

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center justify-center gap-2 bg-white py-4 rounded-2xl border border-red-100 mb-8"
          >
            <LogOut size={18} color="#ef4444" />
            <Text className="text-red-500 font-black text-sm uppercase tracking-widest">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}