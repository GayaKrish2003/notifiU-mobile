import React, { useState, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getBookmarkedJobs, toggleBookmark } from "@notifiu/shared";
import type { JobPost } from "@notifiu/shared/src/types/auth";
import { ArrowLeft, Bookmark, Clock } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function SavedJobsScreen() {
  const navigation = useNavigation<NavProp>();
  const [jobs, setJobs]         = useState<JobPost[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const fetchSaved = async () => {
    try {
      const res = await getBookmarkedJobs();
      setJobs(res.data.data || []);
    } catch {
      Alert.alert("Error", "Failed to load saved jobs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchSaved(); }, []);

  const handleRemove = async (jobId: string) => {
    try {
      await toggleBookmark(jobId);
      setJobs(prev => prev.filter(j => j._id !== jobId));
    } catch {
      Alert.alert("Error", "Failed to remove bookmark.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <View className="flex-row items-center px-6 py-4 gap-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-white p-2 rounded-xl border border-gray-100"
        >
          <ArrowLeft size={20} color="#2D3A5D" />
        </TouchableOpacity>
        <Text className="text-2xl font-black text-[#2D3A5D]">Saved Jobs</Text>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSaved(); }} />}
          ListEmptyComponent={() => (
            <View className="items-center mt-20">
              <Bookmark size={40} color="#E5E7EB" />
              <Text className="text-gray-300 text-base mt-4 text-center">
                No saved jobs yet.{"\n"}Tap the bookmark icon on any job.
              </Text>
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
                  <View className="flex-row items-center gap-1">
                    <Clock size={10} color="#9CA3AF" />
                    <Text className="text-gray-400 text-[11px]">
                      Deadline: {formatDate(item.deadline)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemove(item._id)}
                  className="bg-red-50 p-2 rounded-xl"
                >
                  <Bookmark size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}