import React, { useState, useCallback, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Alert, Modal,
  ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAllJobPostsAdmin, approveJobPost, rejectJobPost } from "@notifiu/shared";
import type { JobPost } from "@notifiu/shared/src/types/auth";
import { CheckCircle, XCircle, Eye, X, ExternalLink } from "lucide-react-native";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { useFocusEffect } from "@react-navigation/native";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, { bg: string; text: string }> = {
    approved: { bg: "bg-green-100", text: "text-green-700" },
    rejected: { bg: "bg-red-100",   text: "text-red-700"   },
    pending:  { bg: "bg-yellow-100", text: "text-yellow-700" },
  };
  const s = styles[status] || styles.pending;
  return (
    <View className={`px-3 py-1 rounded-full self-start ${s.bg}`}>
      <Text className={`text-[10px] font-black uppercase ${s.text}`}>{status}</Text>
    </View>
  );
};

export default function AdminJobsScreen() {
  const navigation = useNavigation<NavProp>();

  const [jobs, setJobs]                     = useState<JobPost[]>([]);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [selectedJob, setSelectedJob]       = useState<JobPost | null>(null);
  const [rejectModalJob, setRejectModalJob] = useState<JobPost | null>(null);
  const [rejectReason, setRejectReason]     = useState("");
  const [rejectLoading, setRejectLoading]   = useState(false);

  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const fetchJobs = useCallback(async () => {
    try {
      const res = await getAllJobPostsAdmin({ status: "pending" });
      setJobs(res.data.data || []);
    } catch {
      Alert.alert("Error", "Failed to load job posts.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
  useCallback(() => {
    fetchJobs();
    getAllJobPostsAdmin({}).then(res => {
      const all: JobPost[] = res.data.data || [];
      setStats({
        total:    all.length,
        approved: all.filter(j => j.status === "approved").length,
        pending:  all.filter(j => j.status === "pending").length,
        rejected: all.filter(j => j.status === "rejected").length,
      });
    }).catch(() => {});
  }, [fetchJobs])
);

  const handleApprove = (jobId: string) => {
    Alert.alert(
      "Approve Post",
      "This job post will be visible to all students.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              await approveJobPost(jobId);
              // Remove from the pending list once approved
              setJobs(prev => prev.filter(j => j._id !== jobId));
              setStats(prev => ({ ...prev, pending: prev.pending - 1, approved: prev.approved + 1 }));
              if (selectedJob?._id === jobId) setSelectedJob(null);
            } catch {
              Alert.alert("Error", "Failed to approve job post.");
            }
          }
        }
      ]
    );
  };

  const handleReject = async () => {
    if (!rejectModalJob || !rejectReason.trim()) return;
    setRejectLoading(true);
    try {
      await rejectJobPost(rejectModalJob._id, rejectReason);
      // Remove from the pending list once rejected
      setJobs(prev => prev.filter(j => j._id !== rejectModalJob._id));
      setStats(prev => ({ ...prev, pending: prev.pending - 1, rejected: prev.rejected + 1 }));
      if (selectedJob?._id === rejectModalJob._id) setSelectedJob(null);
      setRejectModalJob(null);
      setRejectReason("");
    } catch {
      Alert.alert("Error", "Failed to reject job post.");
    } finally {
      setRejectLoading(false);
    }
  };

  // ── Reject Reason Modal ──────────────────────────────────────
  const RejectModal = () => (
    <Modal
      visible={!!rejectModalJob}
      transparent
      animationType="fade"
      onRequestClose={() => { setRejectModalJob(null); setRejectReason(""); }}
    >
      <View className="flex-1 bg-black/40 items-center justify-center px-6">
        <View className="bg-white rounded-3xl p-6 w-full">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-[#2D3A5D] font-black text-lg">Reject Post</Text>
            <TouchableOpacity
              onPress={() => { setRejectModalJob(null); setRejectReason(""); }}
              className="bg-gray-100 p-2 rounded-full"
            >
              <X size={16} color="#374151" />
            </TouchableOpacity>
          </View>

          <Text className="text-gray-500 text-sm mb-4">
            Rejecting:{" "}
            <Text className="font-black text-[#2D3A5D]">{rejectModalJob?.title}</Text>
          </Text>

          <Text className="text-gray-700 text-sm font-semibold mb-2">
            Rejection Reason <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={rejectReason}
            onChangeText={setRejectReason}
            placeholder="Explain why this post is being rejected..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="bg-[#F0F2F5] rounded-2xl px-4 py-3 text-sm text-[#2D3A5D] min-h-[100px] mb-5"
          />

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => { setRejectModalJob(null); setRejectReason(""); }}
              className="flex-1 border border-gray-200 py-3 rounded-2xl items-center"
            >
              <Text className="text-gray-500 font-bold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleReject}
              disabled={rejectLoading || !rejectReason.trim()}
              className="flex-1 bg-red-500 py-3 rounded-2xl items-center"
              style={{ opacity: rejectLoading || !rejectReason.trim() ? 0.6 : 1 }}
            >
              {rejectLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-bold">Confirm Reject</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ── Job Detail Modal ─────────────────────────────────────────
  const JobDetailModal = () => (
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
            <TouchableOpacity
              onPress={() => setSelectedJob(null)}
              className="bg-gray-100 p-2 rounded-full"
            >
              <X size={18} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
            <View className="flex-row items-center gap-2 mb-3">
              <StatusBadge status={selectedJob.status} />
              {selectedJob.isExpired && (
                <View className="bg-gray-100 px-3 py-1 rounded-full">
                  <Text className="text-gray-500 text-[10px] font-black uppercase">Expired</Text>
                </View>
              )}
            </View>

            <Text className="text-[#2D3A5D]/60 text-sm font-bold capitalize mb-3">
              {selectedJob.companyName} · {selectedJob.jobType} · {selectedJob.location}
            </Text>

            <Text className="text-gray-500 text-sm leading-relaxed mb-4">
              {selectedJob.description}
            </Text>

            {/* Details */}
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

            {/* Skills */}
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

            {/* Application link */}
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

            {/* Approve / Reject buttons */}
            <View className="flex-row gap-3 pb-6">
              <TouchableOpacity
                onPress={() => handleApprove(selectedJob._id)}
                className="flex-1 flex-row items-center justify-center gap-2 bg-green-500 py-4 rounded-2xl"
              >
                <CheckCircle size={16} color="white" />
                <Text className="text-white font-black">Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setRejectModalJob(selectedJob); setSelectedJob(null); }}
                className="flex-1 flex-row items-center justify-center gap-2 bg-red-500 py-4 rounded-2xl"
              >
                <XCircle size={16} color="white" />
                <Text className="text-white font-black">Reject</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      )}
    </Modal>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <RejectModal />
      <JobDetailModal />

      {/* Header */}
      <View className="px-6 pt-4 pb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-black text-[#2D3A5D]">Job Approvals</Text>
          <Text className="text-gray-400 text-sm">{jobs.length} pending</Text>
        </View>
        <View className="flex-row gap-2">
  <TouchableOpacity
    onPress={() => navigation.navigate("AdminAllJobs")}
    className="bg-gray-100 px-4 py-2 rounded-xl"
  >
    <Text className="text-gray-500 text-xs font-black">All ({stats.total})</Text>
  </TouchableOpacity>
  <TouchableOpacity
    onPress={() => navigation.navigate("AdminApprovedJobs")}
    className="bg-green-50 px-4 py-2 rounded-xl"
  >
    <Text className="text-green-600 text-xs font-black">Approved ({stats.approved})</Text>
  </TouchableOpacity>
  <TouchableOpacity
    onPress={() => navigation.navigate("AdminRejectedJobs")}
    className="bg-red-50 px-4 py-2 rounded-xl"
  >
    <Text className="text-red-500 text-xs font-black">Rejected ({stats.rejected})</Text>
  </TouchableOpacity>
</View>
      </View>

      <View className="flex-row px-6 gap-3 mb-4">
  <View className="flex-1 bg-[#1A1C2C] rounded-2xl p-3">
    <Text className="text-white font-black text-xl">{stats.total}</Text>
    <Text className="text-white/50 text-[9px] font-bold uppercase tracking-widest mt-1">Total</Text>
  </View>
  <View className="flex-1 bg-[#FBB017] rounded-2xl p-3">
    <Text className="text-[#2D3A5D] font-black text-xl">{stats.pending}</Text>
    <Text className="text-[#2D3A5D]/60 text-[9px] font-bold uppercase tracking-widest mt-1">Pending</Text>
  </View>
  <View className="flex-1 bg-green-500 rounded-2xl p-3">
    <Text className="text-white font-black text-xl">{stats.approved}</Text>
    <Text className="text-white/70 text-[9px] font-bold uppercase tracking-widest mt-1">Approved</Text>
  </View>
  <View className="flex-1 bg-red-500 rounded-2xl p-3">
    <Text className="text-white font-black text-xl">{stats.rejected}</Text>
    <Text className="text-white/70 text-[9px] font-bold uppercase tracking-widest mt-1">Rejected</Text>
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchJobs(); }}
            />
          }
          ListEmptyComponent={() => (
            <View className="items-center mt-20">
              <Text className="text-gray-300 text-base">No pending posts found.</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-[#2D3A5D] font-bold text-sm mb-1" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text className="text-gray-400 text-xs capitalize mb-2">
                    {item.companyName} · {item.jobType}
                  </Text>
                  <StatusBadge status={item.status} />
                  <Text className="text-gray-400 text-[10px] mt-2">
                    Posted: {formatDate(item.createdAt)} · Deadline: {formatDate(item.deadline)}
                  </Text>
                </View>

                {/* Action buttons */}
                <View className="items-center gap-2">
                  <TouchableOpacity
                    onPress={() => setSelectedJob(item)}
                    className="bg-[#1A1C2C] px-3 py-2 rounded-xl flex-row items-center gap-1"
                  >
                    <Eye size={14} color="white" />
                    <Text className="text-white text-[10px] font-black">View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleApprove(item._id)}
                    className="bg-green-50 p-2 rounded-xl"
                  >
                    <CheckCircle size={16} color="#10B981" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setRejectModalJob(item)}
                    className="bg-red-50 p-2 rounded-xl"
                  >
                    <XCircle size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
