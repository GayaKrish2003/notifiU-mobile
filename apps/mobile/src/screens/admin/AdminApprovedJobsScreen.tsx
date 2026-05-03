import React, { useState, useCallback, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal, ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAllJobPostsAdmin } from "@notifiu/shared";
import type { JobPost } from "@notifiu/shared/src/types/auth";
import { Eye, X, ExternalLink, ChevronLeft } from "lucide-react-native";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";

const StatusBadge = ({ status }: { status: string }) => (
  <View className="px-3 py-1 rounded-full self-start bg-green-100">
    <Text className="text-[10px] font-black uppercase text-green-700">{status}</Text>
  </View>
);

export default function AdminApprovedJobsScreen() {
  const navigation = useNavigation();
  const [jobs, setJobs]         = useState<JobPost[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const fetchJobs = useCallback(async () => {
    try {
      const res = await getAllJobPostsAdmin({ status: "approved" });
      setJobs(res.data.data || []);
    } catch {
      Alert.alert("Error", "Failed to load approved jobs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      {/* Job Detail Modal — same as AdminJobsScreen's modal, minus Approve/Reject buttons */}
      <Modal
        visible={!!selectedJob}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedJob(null)}
      >
        {selectedJob && (
          <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
              <Text className="text-[#2D3A5D] font-black text-lg flex-1 pr-4" numberOfLines={1}>
                {selectedJob.title}
              </Text>
              <TouchableOpacity onPress={() => setSelectedJob(null)} className="bg-gray-100 p-2 rounded-full">
                <X size={18} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
              <StatusBadge status={selectedJob.status} />
              <Text className="text-[#2D3A5D]/60 text-sm font-bold capitalize mt-3 mb-3">
                {selectedJob.companyName} · {selectedJob.jobType} · {selectedJob.location}
              </Text>
              <Text className="text-gray-500 text-sm leading-relaxed mb-4">{selectedJob.description}</Text>
              <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                {[
                  { label: "Salary",   value: selectedJob.salaryRange },
                  { label: "Deadline", value: formatDate(selectedJob.deadline) },
                  { label: "Posted",   value: formatDate(selectedJob.createdAt) },
                  { label: "Views",    value: String(selectedJob.viewCount) },
                ].map(({ label, value }) => (
                  <View key={label} className="flex-row justify-between py-2 border-b border-gray-100">
                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-wide">{label}</Text>
                    <Text className="text-[#2D3A5D] text-xs font-bold">{value}</Text>
                  </View>
                ))}
              </View>
              {selectedJob.skills.length > 0 && (
                <View className="mb-4">
                  <Text className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-2">Skills</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {selectedJob.skills.map(skill => (
                      <View key={skill} className="bg-[#FBB017]/10 px-3 py-1 rounded-full">
                        <Text className="text-[#2D3A5D] text-xs font-bold">{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              <TouchableOpacity
                onPress={() => {
                  let url = selectedJob.applicationLink;
                  if (!url.startsWith("http")) url = "https://" + url;
                  Linking.openURL(url);
                }}
                className="flex-row items-center gap-2 bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl mb-5"
              >
                <ExternalLink size={14} color="#FBB017" />
                <Text className="text-[#FBB017] text-xs font-bold flex-1" numberOfLines={1}>
                  {selectedJob.applicationLink}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* Header */}
      <View className="px-6 py-4 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => navigation.goBack()} className="bg-gray-100 p-2 rounded-full">
          <ChevronLeft size={20} color="#2D3A5D" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-black text-[#2D3A5D]">Approved Jobs</Text>
          <Text className="text-gray-400 text-sm">{jobs.length} posts</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FBB017" />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchJobs(); }} />}
          ListEmptyComponent={() => (
            <View className="items-center mt-20">
              <Text className="text-gray-300 text-base">No approved posts found.</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-[#2D3A5D] font-bold text-sm mb-1" numberOfLines={1}>{item.title}</Text>
                  <Text className="text-gray-400 text-xs capitalize mb-2">{item.companyName} · {item.jobType}</Text>
                  <StatusBadge status={item.status} />
                  <Text className="text-gray-400 text-[10px] mt-2">
                    Posted: {formatDate(item.createdAt)} · Deadline: {formatDate(item.deadline)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedJob(item)}
                  className="bg-[#1A1C2C] px-3 py-2 rounded-xl flex-row items-center gap-1"
                >
                  <Eye size={14} color="white" />
                  <Text className="text-white text-[10px] font-black">View</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}