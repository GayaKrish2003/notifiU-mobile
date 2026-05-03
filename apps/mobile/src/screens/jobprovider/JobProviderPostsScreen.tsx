import React, { useState, useCallback, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal, ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMyJobPosts, deleteJobPost } from "@notifiu/shared";
import type { JobPost } from "@notifiu/shared/src/types/auth";
import { Trash2, Eye, X, ExternalLink, Clock, Pencil } from "lucide-react-native";
import { Linking } from "react-native";

// add this new import:
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, { bg: string; text: string }> = {
    approved: { bg: "bg-green-100", text: "text-green-700" },
    rejected: { bg: "bg-red-100",   text: "text-red-700"   },
    pending:  { bg: "bg-yellow-100", text: "text-yellow-700" },
  };
  const s = styles[status] || styles.pending;
  return (
    <View className={`px-3 py-1 rounded-full ${s.bg}`}>
      <Text className={`text-[10px] font-black uppercase ${s.text}`}>{status}</Text>
    </View>
  );
};

export default function JobProviderPostsScreen() {
  const navigation = useNavigation<NavProp>();
  const [posts, setPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<JobPost | null>(null);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const fetchPosts = useCallback(async () => {
    try {
      const res = await getMyJobPosts();
      setPosts(res.data.data || []);
    } catch {
      Alert.alert("Error", "Failed to load your posts.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Post",
      "Are you sure? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteJobPost(id);
              setPosts(prev => prev.filter(p => p._id !== id));
              if (selectedPost?._id === id) setSelectedPost(null);
            } catch {
              Alert.alert("Error", "Failed to delete post.");
            }
          }
        }
      ]
    );
  };

  // ── Detail Modal ─────────────────────────────────────────────
  const DetailModal = () => (
    <Modal
      visible={!!selectedPost}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setSelectedPost(null)}
    >
      {selectedPost && (
        <SafeAreaView className="flex-1 bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
            <Text className="text-[#2D3A5D] font-black text-lg flex-1 pr-4" numberOfLines={1}>
              {selectedPost.title}
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedPost(null)}
              className="bg-gray-100 p-2 rounded-full"
            >
              <X size={18} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
            {/* Status */}
            <View className="flex-row items-center gap-3 mb-4">
              <StatusBadge status={selectedPost.status} />
              {selectedPost.isExpired && (
                <View className="bg-gray-100 px-3 py-1 rounded-full">
                  <Text className="text-gray-500 text-[10px] font-black uppercase">Expired</Text>
                </View>
              )}
            </View>

            {/* Rejection reason */}
            {selectedPost.status === "rejected" && selectedPost.rejectionReason ? (
              <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <Text className="text-red-500 text-xs font-black uppercase tracking-wider mb-1">
                  Rejection Reason
                </Text>
                <Text className="text-red-500 text-sm">{selectedPost.rejectionReason}</Text>
              </View>
            ) : null}

            {/* Description */}
            <Text className="text-gray-500 text-sm leading-relaxed mb-5">
              {selectedPost.description}
            </Text>

            {/* Details grid */}
            <View className="bg-gray-50 rounded-2xl p-4 mb-4">
              {[
                { label: "Company",  value: selectedPost.companyName },
                { label: "Job Type", value: selectedPost.jobType },
                { label: "Location", value: selectedPost.location },
                { label: "Salary",   value: selectedPost.salaryRange },
                { label: "Deadline", value: formatDate(selectedPost.deadline) },
                { label: "Views",    value: String(selectedPost.viewCount) },
              ].map(({ label, value }) => (
                <View key={label} className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-gray-400 text-xs font-bold uppercase tracking-wide">{label}</Text>
                  <Text className="text-[#2D3A5D] text-xs font-bold capitalize">{value}</Text>
                </View>
              ))}
            </View>

            {/* Skills */}
            {selectedPost.skills.length > 0 && (
              <View className="mb-4">
                <Text className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-2">Skills</Text>
                <View className="flex-row flex-wrap gap-2">
                  {selectedPost.skills.map(skill => (
                    <View key={skill} className="bg-[#FBB017]/10 px-3 py-1 rounded-full">
                      <Text className="text-[#2D3A5D] text-xs font-bold">{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Apply link */}
            <TouchableOpacity
              onPress={() => Linking.openURL(selectedPost.applicationLink)}
              className="flex-row items-center gap-2 bg-[#FBB017] px-4 py-3 rounded-xl mb-6"
            >
              <ExternalLink size={16} color="white" />
              <Text className="text-white font-bold text-sm flex-1" numberOfLines={1}>
                {selectedPost.applicationLink}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      )}
    </Modal>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <DetailModal />

      <View className="px-6 py-4">
        <Text className="text-2xl font-black text-[#2D3A5D]">My Job Posts</Text>
        <Text className="text-gray-400 text-sm mt-1">{posts.length} total</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FBB017" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPosts(); }} />}
          ListEmptyComponent={() => (
            <View className="items-center mt-20">
              <Text className="text-gray-300 text-base">No posts yet.</Text>
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
                    {item.jobType} · {item.location}
                  </Text>
                  <StatusBadge status={item.status} />

                  {/* Rejection reason inline */}
                  {item.status === "rejected" && item.rejectionReason ? (
                    <Text className="text-red-400 text-xs mt-2" numberOfLines={2}>
                      ✕ {item.rejectionReason}
                    </Text>
                  ) : null}

                  <View className="flex-row items-center mt-2">
                    <Clock size={10} color="#9CA3AF" />
                    <Text className="text-gray-400 text-[10px] ml-1">
                      Deadline: {formatDate(item.deadline)}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View className="items-center gap-2">
  <TouchableOpacity
    onPress={() => setSelectedPost(item)}
    className="bg-[#FBB017] px-3 py-2 rounded-xl"
  >
    <Eye size={16} color="white" />
  </TouchableOpacity>
  {item.status !== "approved" && (
    <TouchableOpacity
      onPress={() => navigation.navigate("EditJobPost", { jobId: item._id })}
      className="bg-[#FBB017]/10 px-3 py-2 rounded-xl"
    >
      <Pencil size={16} color="#FBB017" />
    </TouchableOpacity>
  )}
  <TouchableOpacity
    onPress={() => handleDelete(item._id)}
    className="bg-red-50 px-3 py-2 rounded-xl"
  >
    <Trash2 size={16} color="#EF4444" />
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