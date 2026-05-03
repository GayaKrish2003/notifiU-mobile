import React, { useState, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAppliedJobs } from "@notifiu/shared";
import type { JobPost } from "@notifiu/shared/src/types/auth";
import { ArrowLeft, CheckSquare, Clock } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function AppliedJobsScreen() {
  const navigation = useNavigation<NavProp>();
  const [jobs, setJobs]         = useState<JobPost[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const fetchApplied = async () => {
    try {
      const res = await getAppliedJobs();
      setJobs(res.data.data || []);
    } catch {
      Alert.alert("Error", "Failed to load applied jobs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchApplied(); }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <View className="flex-row items-center px-6 py-4 gap-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-white p-2 rounded-xl border border-gray-100"
        >
          <ArrowLeft size={20} color="#2D3A5D" />
        </TouchableOpacity>
        <Text className="text-2xl font-black text-[#2D3A5D]">Applied Jobs</Text>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchApplied(); }} />}
          ListEmptyComponent={() => (
            <View className="items-center mt-20">
              <CheckSquare size={40} color="#E5E7EB" />
              <Text className="text-gray-300 text-base mt-4 text-center">
                No applied jobs yet.{"\n"}Mark jobs as applied after submitting.
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="text-[#2D3A5D] font-bold text-sm" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View className="bg-green-100 px-2 py-0.5 rounded-full">
                      <Text className="text-green-700 text-[9px] font-black">✓ Applied</Text>
                    </View>
                  </View>
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
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}