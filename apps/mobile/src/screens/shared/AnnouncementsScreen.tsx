import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, ArrowLeft, Paperclip, Download, FileText } from "lucide-react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { getAnnouncements, getServerURL } from "@notifiu/shared";


interface Attachment {
  _id: string;
  file_path: string;
  original_name: string;
  mime_type: string;
  size_bytes?: number;
}

interface Announcement {
  _id: string;
  title: string;
  content: string;
  priority: "low" | "medium" | "high" | "urgent";
  publish_date: string;
  createdAt: string;
  status: string;
  attachments: Attachment[];
}


const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  low:    { bg: "#f0fdf4", text: "#16a34a", border: "#16a34a" },
  medium: { bg: "#fefce8", text: "#ca8a04", border: "#ca8a04" },
  high:   { bg: "#fff7ed", text: "#ea580c", border: "#ea580c" },
  urgent: { bg: "#fef2f2", text: "#dc2626", border: "#dc2626" },
};


const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

function resolveAttachmentUrl(filePath: string): string {
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }
  const serverRoot = getServerURL();
  const cleanFilePath = filePath.startsWith("/") ? filePath : `/${filePath}`;
  return encodeURI(`${serverRoot}${cleanFilePath}`);
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


function useAttachmentDownload() {
  const [isDownloading, setIsDownloading] = useState(false);

  const download = async (att: Attachment) => {
    if (isDownloading) return;
    setIsDownloading(true);

    const url = resolveAttachmentUrl(att.file_path);

    try {
      const rawFileName = att.original_name || att.file_path.split("/").pop() || "attachment";
      const fileName = rawFileName.replace(/[^a-zA-Z0-9.]/g, '_');
      const localUri = `${FileSystem.cacheDirectory}${fileName}`;

      console.log("Downloading from:", url);
      const downloadRes = await FileSystem.downloadAsync(url, localUri, {
        md5: false,
      });

      if (downloadRes.status !== 200) {
        Alert.alert(
          "Download Failed",
          `Status: ${downloadRes.status}\nURL: ${url}\n\nPlease check if your server is running and reachable.`
        );
        return;
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
      
        if (Platform.OS === 'ios') await new Promise(resolve => setTimeout(resolve, 300));
        await Sharing.shareAsync(localUri, {
          mimeType: att.mime_type || "application/octet-stream",
          dialogTitle: `Open ${rawFileName}`,
        });
      } else {
        Alert.alert("Success", `File downloaded: ${rawFileName}`);
      }
    } catch (err: any) {
      console.error("Download error:", err);
      
  
      Alert.alert(
        "Download Issue",
        `Could not save file locally (${err.message}).\n\nWould you like to try opening it in your browser instead?`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Open in Browser", 
            onPress: () => Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open browser.")) 
          }
        ]
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return { isDownloading, download };
}


function AttachmentRow({ att }: { att: Attachment }) {
  const { isDownloading, download } = useAttachmentDownload();

  return (
    <View className="bg-[#EBECEF]/60 rounded-2xl px-5 py-4 flex-row items-center justify-between mt-2 mb-1">
      <View className="flex-row items-center gap-3 flex-1">
        <FileText size={16} color="#9CA3AF" />
        <View className="flex-1">
          <Text className="text-[#2D3A5D]/70 text-sm font-medium" numberOfLines={1}>
            {att.original_name}
          </Text>
          {att.size_bytes ? (
            <Text className="text-[#2D3A5D]/30 text-xs mt-0.5">{formatBytes(att.size_bytes)}</Text>
          ) : null}
        </View>
      </View>

      <TouchableOpacity
        onPress={() => download(att)}
        disabled={isDownloading}
        className="border border-[#2D3A5D]/20 px-4 py-1.5 rounded-full flex-row items-center gap-1"
        style={{ opacity: isDownloading ? 0.5 : 1 }}
      >
        {isDownloading ? (
          <ActivityIndicator size="small" color="#9CA3AF" />
        ) : (
          <>
            <Download size={12} color="#9CA3AF" />
            <Text className="text-[#2D3A5D]/50 text-[11px] font-bold ml-1">Download</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Detail View ──────────────────────────────────────────────
function AnnouncementDetail({
  announcement,
  onBack,
}: {
  announcement: Announcement;
  onBack: () => void;
}) {
  const colors = PRIORITY_COLORS[announcement.priority] ?? PRIORITY_COLORS.medium;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {/* Back */}
        <View className="flex-row items-center gap-4 mb-8">
          <TouchableOpacity onPress={onBack} className="flex-row items-center gap-2">
            <ArrowLeft size={18} color="#9CA3AF" />
            <Text className="text-gray-400 font-bold text-sm">Back</Text>
          </TouchableOpacity>
          <Text className="text-[#2D3A5D]/20 font-black text-lg tracking-[0.3em] uppercase">
            Announcements
          </Text>
        </View>

        {/* Detail Card */}
        <View className="bg-[#EBECEF]/40 rounded-2xl p-6 mb-3 relative">
          <View className="flex-row items-center justify-between mb-4">
            <View className="bg-[#FBB017] px-3 py-1.5 rounded-full">
              <Text className="text-white text-[11px] font-bold">
                {formatDate(announcement.publish_date)}
              </Text>
            </View>
            <View
              className="px-3 py-1 rounded-full border"
              style={{ backgroundColor: colors.bg, borderColor: colors.border }}
            >
              <Text
                className="text-[11px] font-bold capitalize"
                style={{ color: colors.text }}
              >
                {announcement.priority}
              </Text>
            </View>
          </View>

          <Text className="text-[#2D3A5D] font-bold text-base mb-2">{announcement.title}</Text>
          <Text className="text-[#2D3A5D]/60 text-sm leading-relaxed mb-8">
            {announcement.content}
          </Text>
          <Text className="text-[#2D3A5D]/30 text-xs font-bold tracking-widest text-right">
            Created {formatDate(announcement.createdAt)} · {formatTime(announcement.createdAt)}
          </Text>
        </View>

        {/* Attachments */}
        {announcement.attachments?.length > 0 && (
          <>
            <View className="flex-row items-center gap-2 mt-4 mb-2">
              <Paperclip size={14} color="#9CA3AF" />
              <Text className="text-[#2D3A5D]/40 text-xs font-bold uppercase tracking-widest">
                {announcement.attachments.length} Attachment{announcement.attachments.length > 1 ? "s" : ""}
              </Text>
            </View>
            {announcement.attachments.map((att) => (
              <AttachmentRow key={att._id} att={att} />
            ))}
          </>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Announcement | null>(null);

  const checkConnection = async () => {
    setIsChecking(true);
    const start = Date.now();
    try {
      // Try to hit the root endpoint
      const rootUrl = getServerURL();
      const res = await fetch(`${rootUrl}/`, { method: 'GET' });
      const time = Date.now() - start;
      Alert.alert(
        "Network Status",
        `✅ Connected to server!\n\nURL: ${rootUrl}\nStatus: ${res.status}\nResponse Time: ${time}ms\n\nIf downloads still fail, it may be a file path issue on the server.`
      );
    } catch (err: any) {
      Alert.alert(
        "Connection Failed",
        `❌ Could not reach server.\n\nAttempted URL: ${getServerURL()}\nError: ${err.message}\n\n1. Check if server is running.\n2. Ensure phone is on same WiFi as PC.\n3. Make sure PC firewall allows port 5005.`
      );
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    getAnnouncements({ status: "published" })
      .then((res: any) => {
        // Backend returns array directly (no .data wrapper in controller)
        const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setAnnouncements(data);
      })
      .catch(() => setError("Failed to load announcements."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.priority.toLowerCase().includes(search.toLowerCase()) ||
      formatDate(a.publish_date).toLowerCase().includes(search.toLowerCase())
  );

  // ─── Detail view ──────────────────────────────────────
  if (selected) {
    return <AnnouncementDetail announcement={selected} onBack={() => setSelected(null)} />;
  }

  // ─── List view ────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-[#2D3A5D]/20 font-black text-xl tracking-[0.3em] uppercase">
            Announcements
          </Text>
        
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 mb-8">
          <Search size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by title, priority or date"
            placeholderTextColor="#9CA3AF"
            className="flex-1 py-4 px-3 text-sm text-[#2D3A5D]"
          />
        </View>

        {/* States */}
        {loading && <ActivityIndicator color="#FBB017" className="mt-10" />}
        {error !== "" && (
          <Text className="text-red-400 text-center font-bold py-10">{error}</Text>
        )}

        {/* List */}
        {!loading && !error && (
          <View className="gap-5 pb-8">
            {filtered.map((ann) => {
              const colors = PRIORITY_COLORS[ann.priority] ?? PRIORITY_COLORS.medium;
              const hasAttachments = ann.attachments?.length > 0;

              return (
                <TouchableOpacity
                  key={ann._id}
                  onPress={() => setSelected(ann)}
                  className="bg-[#EBECEF]/40 rounded-2xl px-6 py-5 relative"
                  activeOpacity={0.75}
                >
                  {/* Priority + date row */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="bg-[#FBB017] px-3 py-1.5 rounded-full">
                      <Text className="text-white text-[11px] font-bold">
                        {formatDate(ann.publish_date)}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      {hasAttachments && (
                        <View className="flex-row items-center gap-1 bg-[#2D3A5D]/5 px-2 py-1 rounded-full">
                          <Paperclip size={10} color="#9CA3AF" />
                          <Text className="text-gray-400 text-[10px] font-bold">
                            {ann.attachments.length}
                          </Text>
                        </View>
                      )}
                      <View
                        className="px-3 py-1 rounded-full border"
                        style={{ borderColor: colors.border }}
                      >
                        <Text
                          className="text-[11px] font-bold capitalize"
                          style={{ color: colors.text }}
                        >
                          {ann.priority}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text className="text-[#2D3A5D] font-bold text-sm mb-1">{ann.title}</Text>
                  <Text className="text-[#2D3A5D]/60 text-sm" numberOfLines={2}>
                    {ann.content}
                  </Text>

                  <Text className="text-[#2D3A5D]/30 text-xs font-bold tracking-widest text-right mt-3">
                    {formatDate(ann.createdAt)} · {formatTime(ann.createdAt)}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {filtered.length === 0 && (
              <View className="items-center py-20">
                <Text className="text-[#2D3A5D]/20 font-bold tracking-widest">
                  No announcements found.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}