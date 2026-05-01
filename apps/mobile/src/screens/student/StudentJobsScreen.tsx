import React, { useState, useCallback, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Alert, Modal,
  ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getApprovedJobPosts, toggleBookmark, toggleMarkApplied, incrementViewCount
} from "@notifiu/shared";
import type { JobPost } from "@notifiu/shared/src/types/auth";
import {
  Search, Briefcase, MapPin, Clock, Bookmark,
  CheckSquare, ExternalLink, X, ChevronDown
} from "lucide-react-native";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";

// add these two to the existing imports
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { getServerURL } from "@notifiu/shared";
import { Download, FileText } from "lucide-react-native";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const JOB_TYPES = ["", "full-time", "part-time", "internship", "remote"];

function DownloadJDButton({ url, fileName }: { url: string; fileName: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const localUri = `${FileSystem.cacheDirectory}${fileName.replace(/[^a-zA-Z0-9.]/g, "_")}`;

      const result = await FileSystem.downloadAsync(url, localUri);

      if (result.status !== 200) {
        Alert.alert("Download Failed", "Could not download the file. Please try again.");
        return;
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(localUri, {
          mimeType:    "application/pdf",
          dialogTitle: `Open ${fileName}`,
        });
      } else {
        Alert.alert("Downloaded", `File saved: ${fileName}`);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to download file.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleDownload}
      disabled={downloading}
      className="flex-row items-center gap-3 bg-[#FBB017]/10 border border-[#FBB017]/30 px-4 py-3 rounded-xl mb-5"
      style={{ opacity: downloading ? 0.6 : 1 }}
    >
      <FileText size={16} color="#FBB017" />
      <View className="flex-1">
        <Text className="text-[#2D3A5D] text-xs font-black">Job Description</Text>
        <Text className="text-gray-400 text-[10px] mt-0.5" numberOfLines={1}>{fileName}</Text>
      </View>
      {downloading ? (
        <ActivityIndicator size="small" color="#FBB017" />
      ) : (
        <Download size={16} color="#FBB017" />
      )}
    </TouchableOpacity>
  );
}

export default function StudentJobsScreen() {
  const navigation = useNavigation<NavProp>();
  const [jobs, setJobs]                   = useState<JobPost[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [appliedIds, setAppliedIds]       = useState<Set<string>>(new Set());
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [search, setSearch]               = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("");
  const [showFilter, setShowFilter]       = useState(false);
  const [selectedJob, setSelectedJob]     = useState<JobPost | null>(null);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const fetchJobs = useCallback(async (s?: string, jt?: string) => {
    try {
      const params: Record<string, string> = {};
      if (s)  params.search  = s;
      if (jt) params.jobType = jt;
      const res = await getApprovedJobPosts(params);
      setJobs(res.data.data || []);
    } catch {
      Alert.alert("Error", "Failed to load jobs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, []);

  const handleToggleBookmark = async (jobId: string) => {
    try {
      await toggleBookmark(jobId);
      setBookmarkedIds(prev => {
        const next = new Set(prev);
        if (next.has(jobId)) { next.delete(jobId); } else { next.add(jobId); }
        return next;
      });
    } catch {
      Alert.alert("Error", "Failed to update bookmark.");
    }
  };

  const handleToggleApplied = async (jobId: string) => {
    try {
      await toggleMarkApplied(jobId);
      setAppliedIds(prev => {
        const next = new Set(prev);
        if (next.has(jobId)) { next.delete(jobId); } else { next.add(jobId); }
        return next;
      });
    } catch {
      Alert.alert("Error", "Failed to update applied status.");
    }
  };

  const handleApplyNow = (job: JobPost) => {
    incrementViewCount(job._id).catch(() => {});
    let url = job.applicationLink.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    Linking.openURL(url);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">

      {/* Job Detail Modal */}
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
              <Text className="text-[#2D3A5D]/60 text-sm font-bold capitalize mb-3">
                {selectedJob.companyName} · {selectedJob.jobType} · {selectedJob.location}
              </Text>
              <Text className="text-gray-500 text-sm leading-relaxed mb-5">
                {selectedJob.description}
              </Text>
              <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                {[
                  { label: "Salary",   value: selectedJob.salaryRange },
                  { label: "Deadline", value: formatDate(selectedJob.deadline) },
                ].map(({ label, value }) => (
                  <View key={label} className="flex-row justify-between py-2 border-b border-gray-100">
                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-wide">{label}</Text>
                    <Text className="text-[#2D3A5D] text-xs font-bold">{value}</Text>
                  </View>
                ))}
              </View>
              {selectedJob.skills.length > 0 && (
                <View className="mb-5">
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
              <View className="flex-row gap-3 pb-6">
                <TouchableOpacity
                  onPress={() => handleApplyNow(selectedJob)}
                  className="flex-1 flex-row items-center justify-center gap-2 bg-[#FBB017] py-4 rounded-2xl"
                >
                  <ExternalLink size={16} color="white" />
                  <Text className="text-white font-black text-sm">Apply Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleToggleBookmark(selectedJob._id)}
                  className={`p-4 rounded-2xl border ${bookmarkedIds.has(selectedJob._id) ? "bg-[#FBB017] border-[#FBB017]" : "bg-white border-gray-200"}`}
                >
                  <Bookmark size={18} color={bookmarkedIds.has(selectedJob._id) ? "white" : "#9CA3AF"} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleToggleApplied(selectedJob._id)}
                  className={`p-4 rounded-2xl border ${appliedIds.has(selectedJob._id) ? "bg-green-500 border-green-500" : "bg-white border-gray-200"}`}
                >
                  <CheckSquare size={18} color={appliedIds.has(selectedJob._id) ? "white" : "#9CA3AF"} />
                </TouchableOpacity>
              </View>
              {/* Job Description PDF download */}
                {selectedJob.attachment?.file_path && (
                  <DownloadJDButton
                    url={selectedJob.attachment.url ?? ""}
                    fileName={selectedJob.attachment.original_name ?? "job_description.pdf"}
                  />
                )}
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* Header */}
      <View className="px-6 pt-4 pb-3 flex-row items-center justify-between">
        <Text className="text-2xl font-black text-[#2D3A5D]">Job Board</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => navigation.navigate("SavedJobs")}
            className="bg-[#FBB017]/10 px-4 py-2 rounded-xl"
          >
            <Text className="text-[#FBB017] text-xs font-black">Saved</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("AppliedJobs")}
            className="bg-green-50 px-4 py-2 rounded-xl"
          >
            <Text className="text-green-600 text-xs font-black">Applied</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search + Filter */}
      <View className="px-6 mb-3 flex-row gap-2">
        <View className="flex-1 flex-row items-center bg-white rounded-2xl px-4 border border-gray-100 gap-2">
          <Search size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => fetchJobs(search, jobTypeFilter)}
            returnKeyType="search"
            placeholder="Search jobs..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 py-3 text-sm text-[#2D3A5D]"
          />
        </View>
        <TouchableOpacity
          onPress={() => setShowFilter(!showFilter)}
          className={`px-4 rounded-2xl border items-center justify-center ${jobTypeFilter ? "bg-[#FBB017] border-[#FBB017]" : "bg-white border-gray-100"}`}
        >
          <ChevronDown size={18} color={jobTypeFilter ? "white" : "#9CA3AF"} />
        </TouchableOpacity>
      </View>

      {/* Filter dropdown */}
      {showFilter && (
        <View className="mx-6 mb-3 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {JOB_TYPES.map(type => (
            <TouchableOpacity
              key={type || "all"}
              onPress={() => { setJobTypeFilter(type); setShowFilter(false); fetchJobs(search, type); }}
              className={`px-4 py-3 ${jobTypeFilter === type ? "bg-[#FBB017]/10" : ""}`}
            >
              <Text className={`text-sm capitalize ${jobTypeFilter === type ? "text-[#FBB017] font-bold" : "text-[#2D3A5D]"}`}>
                {type || "All Types"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Jobs list */}
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchJobs(search, jobTypeFilter); }} />}
          ListEmptyComponent={() => (
            <View className="items-center mt-20">
              <Text className="text-gray-300 text-base text-center">No job posts found.</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedJob(item)}
              className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-[#2D3A5D] font-bold text-sm mb-1" numberOfLines={1}>{item.title}</Text>
                  <View className="flex-row items-center gap-3 mb-2">
                    <View className="flex-row items-center gap-1">
                      <Briefcase size={10} color="#9CA3AF" />
                      <Text className="text-gray-400 text-[11px]">{item.companyName}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <MapPin size={10} color="#9CA3AF" />
                      <Text className="text-gray-400 text-[11px]">{item.location}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-1 mb-2">
                    <Clock size={10} color="#9CA3AF" />
                    <Text className="text-gray-400 text-[11px]">Deadline: {formatDate(item.deadline)}</Text>
                  </View>
                  <View className="flex-row flex-wrap gap-1.5">
                    <View className="bg-[#FBB017]/10 px-2 py-0.5 rounded-full">
                      <Text className="text-[#2D3A5D] text-[10px] font-bold capitalize">{item.jobType}</Text>
                    </View>
                    {item.skills.slice(0, 3).map(skill => (
                      <View key={skill} className="bg-gray-100 px-2 py-0.5 rounded-full">
                        <Text className="text-gray-500 text-[10px] font-bold">{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View className="items-center gap-2">
                  <TouchableOpacity
                    onPress={() => handleToggleBookmark(item._id)}
                    className={`p-2 rounded-xl border ${bookmarkedIds.has(item._id) ? "bg-[#FBB017] border-[#FBB017]" : "bg-gray-50 border-gray-100"}`}
                  >
                    <Bookmark size={14} color={bookmarkedIds.has(item._id) ? "white" : "#9CA3AF"} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleToggleApplied(item._id)}
                    className={`p-2 rounded-xl border ${appliedIds.has(item._id) ? "bg-green-500 border-green-500" : "bg-gray-50 border-gray-100"}`}
                  >
                    <CheckSquare size={14} color={appliedIds.has(item._id) ? "white" : "#9CA3AF"} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}