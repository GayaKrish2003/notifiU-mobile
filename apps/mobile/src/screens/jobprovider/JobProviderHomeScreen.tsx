import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, ActivityIndicator, TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { getMyJobPosts } from "@notifiu/shared";
import type { JobPost } from "@notifiu/shared/src/types/auth";
import { Briefcase, Clock, CheckCircle, XCircle, Eye } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";


interface JwtPayload { id: string; role: string; }

interface UserData {
  name?: string;
  companyName?: string;
  email?: string;
}

export default function JobProviderHomeScreen() {
  const [userData, setUserData] = useState<UserData>({});
  const [posts, setPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Add this import at the top of the file


// 2. Replace the entire useEffect block with this
useFocusEffect(
  useCallback(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem("user");
        if (saved) setUserData(JSON.parse(saved));

        const res = await getMyJobPosts();
        setPosts(res.data.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [])
);

  const stats = {
    total:    posts.length,
    approved: posts.filter(p => p.status === "approved").length,
    pending:  posts.filter(p => p.status === "pending").length,
    rejected: posts.filter(p => p.status === "rejected").length,
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA] items-center justify-center">
        <ActivityIndicator size="large" color="#FBB017" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ─────────────────────────────────── */}
        <View className="bg-[#1A1C2C] px-6 pt-6 pb-8">
          <Text className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">
            Welcome back
          </Text>
          <Text className="text-white text-xl font-black mb-1">
            {userData.name || "Job Provider"}
          </Text>
          <Text className="text-[#FBB017] text-sm font-semibold">
            {userData.companyName || "Your Company"}
          </Text>
        </View>

        <View className="px-6 py-6 space-y-6">

          {/* ── Stats ──────────────────────────────────── */}
          <View>
            <Text className="text-[#2D3A5D] font-black text-base mb-3">
              Your Posts Overview
            </Text>
            <View className="flex-row gap-3">
              {/* Total */}
              <View className="flex-1 bg-[#1A1C2C] rounded-2xl p-4">
                <Text className="text-white font-black text-2xl">{stats.total}</Text>
                <Text className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Total
                </Text>
              </View>
              {/* Approved */}
              <View className="flex-1 bg-green-500 rounded-2xl p-4">
                <Text className="text-white font-black text-2xl">{stats.approved}</Text>
                <Text className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Live
                </Text>
              </View>
              {/* Pending */}
              <View className="flex-1 bg-[#FBB017] rounded-2xl p-4">
                <Text className="text-[#2D3A5D] font-black text-2xl">{stats.pending}</Text>
                <Text className="text-[#2D3A5D]/60 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Pending
                </Text>
              </View>
              {/* Rejected */}
              <View className="flex-1 bg-red-500 rounded-2xl p-4">
                <Text className="text-white font-black text-2xl">{stats.rejected}</Text>
                <Text className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Rejected
                </Text>
              </View>
            </View>
          </View>

          {/* ── Recent Posts ───────────────────────────── */}
          <View>
            <Text className="text-[#2D3A5D] font-black text-base mb-3">
              Recent Posts
            </Text>

            {posts.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 items-center border border-gray-100">
                <Briefcase size={32} color="#D1D5DB" />
                <Text className="text-gray-400 text-sm mt-3 text-center">
                  No posts yet.{"\n"}Tap "Post a Job" to get started.
                </Text>
              </View>
            ) : (
              posts.slice(0, 3).map((post) => (
                <View
                  key={post._id}
                  className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-[#2D3A5D] font-bold text-sm" numberOfLines={1}>
                        {post.title}
                      </Text>
                      <Text className="text-gray-400 text-xs mt-0.5 capitalize">
                        {post.jobType} · {post.location}
                      </Text>
                    </View>

                    {/* Status badge */}
                    <View className={`px-3 py-1 rounded-full ${
                      post.status === "approved" ? "bg-green-100" :
                      post.status === "rejected" ? "bg-red-100" : "bg-yellow-100"
                    }`}>
                      <Text className={`text-[10px] font-black uppercase ${
                        post.status === "approved" ? "text-green-700" :
                        post.status === "rejected" ? "text-red-700" : "text-yellow-700"
                      }`}>
                        {post.status}
                      </Text>
                    </View>
                  </View>

                  {/* Rejection reason */}
                  {post.status === "rejected" && post.rejectionReason ? (
                    <View className="bg-red-50 rounded-xl px-3 py-2 mt-2">
                      <Text className="text-red-500 text-xs font-bold">
                        Reason: {post.rejectionReason}
                      </Text>
                    </View>
                  ) : null}

                  {/* Footer row */}
                  <View className="flex-row items-center mt-2 pt-2 border-t border-gray-50">
                    <Eye size={11} color="#9CA3AF" />
                    <Text className="text-gray-400 text-[10px] ml-1">
                      {post.viewCount} views
                    </Text>
                    <Text className="text-gray-300 mx-2">·</Text>
                    <Text className="text-gray-400 text-[10px]">
                      Deadline: {formatDate(post.deadline)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}