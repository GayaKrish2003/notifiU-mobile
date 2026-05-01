import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, ArrowLeft, Trash2, ChevronDown, Pencil } from "lucide-react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {
  getTickets, getTicketById, updateTicket,
  deleteTicket, addTicketResponse, getServerURL, getToken,
} from "@notifiu/shared";


type TicketView = "list" | "detail" | "edit";

interface TicketData {
  _id: string; subject: string; description: string;
  status: string; category: string; createdAt: string;
  user_id?: { username?: string; role?: string; };
  attachments?: Array<{ _id: string; file_path: string; original_name: string; mime_type?: string; }>;
}

interface TicketResponse {
  _id: string; response_message: string;
  responded_by: { username?: string; name?: string; role?: string; };
  createdAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open:        { bg: "#dbeafe", text: "#1d4ed8" },
  in_progress: { bg: "#fef9c3", text: "#a16207" },
  resolved:    { bg: "#dcfce7", text: "#15803d" },
  closed:      { bg: "#f1f5f9", text: "#475569" },
};

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"];

export default function AdminTicketsScreen() {
  const [view, setView] = useState<TicketView>("list");
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [responses, setResponses] = useState<TicketResponse[]>([]);


  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);


  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);


  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Edit ticket
  const [editSubject, setEditSubject] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("General");
  const [editSubjectError, setEditSubjectError] = useState("");
  const [editDescError, setEditDescError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // 5-minute edit window countdown
  const [secondsLeft, setSecondsLeft] = useState(0);

  const handleDownloadAttachment = async (att: { file_path: string; original_name: string; mime_type?: string }) => {
    try {
      const url = att.file_path.startsWith("http")
        ? att.file_path
        : `${getServerURL()}${att.file_path}`;
      const ext = att.original_name.split(".").pop() ?? "file";
      const localUri = `${FileSystem.cacheDirectory}${att.original_name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const token = await getToken();
      const { status } = await FileSystem.downloadAsync(url, localUri, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      if (status !== 200) {
        Alert.alert("Error", "Failed to download file.");
        return;
      }
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(localUri, {
          mimeType: att.mime_type ?? `application/${ext}`,
          dialogTitle: att.original_name,
          UTI: att.mime_type ?? `public.${ext}`,
        });
      } else {
        Alert.alert("Downloaded", `Saved to: ${localUri}`);
      }
    } catch {
      Alert.alert("Error", "Could not download the attachment.");
    }
  };

  const fetchTickets = () => {
    setLoading(true);
    getTickets()
      .then((res: any) => setTickets(res.data))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, []);

  // Recalculate countdown whenever the selected ticket changes
  useEffect(() => {
    if (!selectedTicket) return;
    const WINDOW = 5 * 60 * 1000;
    const calc = () => {
      const elapsed = Date.now() - new Date(selectedTicket.createdAt).getTime();
      return Math.max(0, Math.floor((WINDOW - elapsed) / 1000));
    };
    setSecondsLeft(calc());
    if (calc() <= 0) return;
    const interval = setInterval(() => {
      const s = calc();
      setSecondsLeft(s);
      if (s <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedTicket]);

  const filtered = tickets.filter(
    (t) =>
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.status.toLowerCase().includes(search.toLowerCase())
  );

  const openDetail = (ticket: TicketData) => {
    getTicketById(ticket._id)
      .then((res: any) => {
        setSelectedTicket(res.data.ticket);
        setResponses(res.data.responses || []);
      })
      .catch(() => {
        setSelectedTicket(ticket);
        setResponses([]);
      })
      .finally(() => setView("detail"));
  };

  
  const handleStatusChange = (status: string) => {
    if (!selectedTicket) return;
    setShowStatusPicker(false);
    setStatusUpdating(true);
    updateTicket(selectedTicket._id, { status })
      .then(() => {
        setSelectedTicket((prev) => prev ? { ...prev, status } : prev);
        setTickets((prev) => prev.map((t) => t._id === selectedTicket._id ? { ...t, status } : t));
      })
      .catch(() => Alert.alert("Error", "Failed to update ticket status."))
      .finally(() => setStatusUpdating(false));
  };

  
  const handleReply = () => {
    if (!reply.trim() || !selectedTicket) return;
    if (reply.trim().length < 2) {
      Alert.alert("Validation", "Reply must be at least 2 characters.");
      return;
    }
    setReplying(true);
    addTicketResponse(selectedTicket._id, reply.trim())
      .then((res: any) => {
        setResponses((prev) => [...prev, res.data]);
        setReply("");
        
        if (selectedTicket.status === "open") {
          handleStatusChange("in_progress");
        }
      })
      .catch(() => Alert.alert("Error", "Failed to send reply."))
      .finally(() => setReplying(false));
  };

  
  const handleDelete = (id: string) => {
    deleteTicket(id)
      .then(() => {
        setTickets((prev) => prev.filter((t) => t._id !== id));
        if (view === "detail") setView("list");
      })
      .catch(() => Alert.alert("Error", "Failed to delete ticket."))
      .finally(() => setDeleteId(null));
  };

  const openEditTicket = () => {
    if (!selectedTicket) return;
    setEditSubject(selectedTicket.subject);
    setEditDescription(selectedTicket.description);
    setEditCategory(selectedTicket.category);
    setEditSubjectError("");
    setEditDescError("");
    setView("edit");
  };

  const validateEditForm = (): boolean => {
    let valid = true;
    if (!editSubject.trim()) {
      setEditSubjectError("Subject is required.");
      valid = false;
    } else if (editSubject.trim().length < 5) {
      setEditSubjectError("Subject must be at least 5 characters.");
      valid = false;
    } else {
      setEditSubjectError("");
    }
    if (!editDescription.trim()) {
      setEditDescError("Description is required.");
      valid = false;
    } else if (editDescription.trim().length < 10) {
      setEditDescError("Description must be at least 10 characters.");
      valid = false;
    } else {
      setEditDescError("");
    }
    return valid;
  };

  const handleEditTicket = () => {
    if (!selectedTicket || !validateEditForm()) return;
    setEditSubmitting(true);
    updateTicket(selectedTicket._id, {
      subject: editSubject.trim(),
      description: editDescription.trim(),
      category: editCategory,
    })
      .then((res: any) => {
        const updated = res.data as TicketData;
        setSelectedTicket((prev) => prev ? { ...prev, ...updated } : prev);
        setTickets((prev) =>
          prev.map((t) => (t._id === selectedTicket._id ? { ...t, ...updated } : t))
        );
        setView("detail");
        Alert.alert("Success", "Ticket updated successfully.");
      })
      .catch((err: any) => {
        const msg = err?.response?.data?.error || "Failed to update ticket.";
        Alert.alert("Error", msg);
      })
      .finally(() => setEditSubmitting(false));
  };

  const DeleteModal = () => (
    <Modal visible={deleteId !== null} transparent animationType="fade">
      <View className="flex-1 bg-black/40 items-center justify-center px-6">
        <View className="bg-white rounded-2xl p-6 w-full">
          <Text className="text-[#2D3A5D] font-bold text-lg mb-2">Delete Ticket?</Text>
          <Text className="text-gray-400 text-sm mb-6">
            This will permanently delete the ticket and all its responses.
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setDeleteId(null)}
              className="flex-1 border border-gray-200 py-3 rounded-xl items-center"
            >
              <Text className="text-gray-500 font-bold text-sm">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deleteId && handleDelete(deleteId)}
              className="flex-1 bg-red-500 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-sm">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  
  const StatusPickerModal = () => (
    <Modal visible={showStatusPicker} transparent animationType="slide">
      <TouchableOpacity
        className="flex-1 bg-black/40 justify-end"
        onPress={() => setShowStatusPicker(false)}
        activeOpacity={1}
      >
        <View className="bg-white rounded-t-3xl p-6">
          <Text className="text-[#2D3A5D] font-black text-base mb-4 text-center">Update Status</Text>
          {STATUS_OPTIONS.map((s) => {
            const sc = STATUS_COLORS[s];
            const isActive = selectedTicket?.status === s;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => handleStatusChange(s)}
                className={`flex-row items-center justify-between px-4 py-3.5 rounded-xl mb-2 ${isActive ? "border-2 border-[#FBB017]" : "border border-gray-100"}`}
              >
                <Text className="text-[#2D3A5D] font-medium capitalize text-sm">{s.replace("_", " ")}</Text>
                <View className="px-2 py-1 rounded-full" style={{ backgroundColor: sc.bg }}>
                  <Text className="text-xs font-bold capitalize" style={{ color: sc.text }}>{s.replace("_", " ")}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );


  if (view === "list") {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA]">
        <DeleteModal />
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
          <Text className="text-xl font-bold text-[#2D3A5D] mb-4">Support Tickets</Text>

          <View className="flex-row items-center bg-white border border-gray-100 rounded-2xl px-4 mb-5">
            <Search size={16} color="#9CA3AF" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by subject, category or status..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 py-3.5 px-3 text-sm text-[#2D3A5D]"
            />
          </View>

          {loading && <ActivityIndicator color="#FBB017" className="mt-10" />}

          {!loading && (
            <View className="gap-3 pb-8">
              {filtered.map((ticket) => {
                const sc = STATUS_COLORS[ticket.status] ?? STATUS_COLORS.open;
                return (
                  <TouchableOpacity
                    key={ticket._id}
                    onPress={() => openDetail(ticket)}
                    className="bg-white rounded-2xl p-5 border border-gray-100"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <Text className="text-[#2D3A5D] font-bold text-sm flex-1 pr-3" numberOfLines={2}>{ticket.subject}</Text>
                      <View className="px-2 py-1 rounded-full" style={{ backgroundColor: sc.bg }}>
                        <Text className="text-xs font-bold capitalize" style={{ color: sc.text }}>{ticket.status.replace("_", " ")}</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-400 text-xs">{ticket.category} · {new Date(ticket.createdAt).toLocaleDateString()}</Text>
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation(); setDeleteId(ticket._id); }}
                        className="p-1"
                      >
                        <Trash2 size={14} color="#f87171" />
                      </TouchableOpacity>
                    </View>
                    {ticket.user_id?.username && (
                      <Text className="text-gray-400 text-xs mt-1">By: {ticket.user_id.username}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
              {filtered.length === 0 && (
                <View className="items-center py-16">
                  <Text className="text-gray-300 font-bold tracking-widest">No tickets found.</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === "detail" && selectedTicket) {
    const sc = STATUS_COLORS[selectedTicket.status] ?? STATUS_COLORS.open;
    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA]">
        <DeleteModal />
        <StatusPickerModal />
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View className="flex-row items-center justify-between mb-6">
              <TouchableOpacity onPress={() => setView("list")} className="flex-row items-center gap-2">
                <ArrowLeft size={18} color="#9CA3AF" />
                <Text className="text-gray-400 font-bold text-sm">Back</Text>
              </TouchableOpacity>
              <View className="flex-row items-center gap-2">
                {secondsLeft > 0 && (
                  <TouchableOpacity
                    onPress={openEditTicket}
                    className="flex-row items-center gap-1 border border-amber-300 bg-amber-50 px-3 py-1.5 rounded-xl"
                  >
                    <Pencil size={13} color="#d97706" />
                    <Text className="text-amber-700 text-xs font-bold">
                      Edit · {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setDeleteId(selectedTicket._id)}
                  className="flex-row items-center gap-1 border border-red-200 px-3 py-1.5 rounded-xl"
                >
                  <Trash2 size={14} color="#f87171" />
                  <Text className="text-red-400 text-xs font-bold">Delete</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Ticket info */}
            <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100">
              <View className="flex-row items-start justify-between mb-3">
                <Text className="text-[#2D3A5D] font-bold text-base flex-1 pr-3">{selectedTicket.subject}</Text>
                <TouchableOpacity
                  onPress={() => setShowStatusPicker(true)}
                  className="flex-row items-center gap-1 px-2 py-1 rounded-full"
                  style={{ backgroundColor: sc.bg }}
                >
                  {statusUpdating
                    ? <ActivityIndicator size="small" color={sc.text} />
                    : <>
                        <Text className="text-xs font-bold capitalize" style={{ color: sc.text }}>{selectedTicket.status.replace("_", " ")}</Text>
                        <ChevronDown size={12} color={sc.text} />
                      </>
                  }
                </TouchableOpacity>
              </View>
              <Text className="text-gray-400 text-xs mb-3">
                {selectedTicket.category} · {new Date(selectedTicket.createdAt).toLocaleDateString()}
                {selectedTicket.user_id?.username && ` · ${selectedTicket.user_id.username}`}
              </Text>
              <Text className="text-[#2D3A5D] text-sm leading-relaxed">{selectedTicket.description}</Text>
              {(selectedTicket.attachments ?? []).length > 0 && (
                <View className="mt-3 pt-3 border-t border-gray-100">
                  <Text className="text-[#2D3A5D] text-[10px] font-black uppercase tracking-widest mb-2">Attachments</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {(selectedTicket.attachments ?? []).map((att) => {
                      const fileUrl = att.file_path.startsWith("http")
                        ? att.file_path
                        : `${getServerURL()}${att.file_path}`;
                      const isImage = att.mime_type?.startsWith("image/") ?? /\.(jpg|jpeg|png)$/i.test(att.file_path);
                      return (
                        <TouchableOpacity
                          key={att._id}
                          onPress={() => handleDownloadAttachment(att)}
                          activeOpacity={0.75}
                          style={{ alignItems: "center", width: 80 }}
                        >
                          {isImage ? (
                            <Image
                              source={{ uri: fileUrl }}
                              style={{ width: 72, height: 72, borderRadius: 10 }}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={{
                              width: 72, height: 72, borderRadius: 10,
                              backgroundColor: "#FBB017", alignItems: "center", justifyContent: "center",
                            }}>
                              <Text style={{ fontSize: 22 }}>📎</Text>
                            </View>
                          )}
                          <Text numberOfLines={1} style={{ fontSize: 10, color: "#6b7280", marginTop: 3, width: 72, textAlign: "center" }}>
                            {att.original_name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Responses */}
            {responses.length > 0 && (
              <View className="gap-3 mb-4">
                {responses.map((r) => (
                  <View key={r._id} className="bg-[#FBB017]/10 rounded-2xl p-4 border border-[#FBB017]/20">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-[#FBB017] text-xs font-bold">
                        {r.responded_by?.username || r.responded_by?.name || "Support Team"}
                      </Text>
                      {r.responded_by?.role && (
                        <View className="bg-[#FBB017]/20 px-2 py-0.5 rounded-full">
                          <Text className="text-[#FBB017] text-[9px] font-bold uppercase">{r.responded_by.role}</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-[#2D3A5D] text-sm leading-relaxed">{r.response_message}</Text>
                    <Text className="text-gray-400 text-xs mt-2">{new Date(r.createdAt).toLocaleDateString()}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Reply box */}
            {selectedTicket.status !== "closed" && (
              <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-8">
                <Text className="text-[#2D3A5D] text-xs font-black uppercase tracking-widest mb-3">Reply to Student</Text>
                <TextInput
                  value={reply}
                  onChangeText={setReply}
                  placeholder="Write your reply..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  className="bg-[#F0F2F5] rounded-xl px-4 py-3 text-sm text-[#2D3A5D] mb-3"
                  style={{ minHeight: 80 }}
                />
                <TouchableOpacity
                  onPress={handleReply}
                  disabled={replying || !reply.trim()}
                  className="bg-[#FBB017] py-3 rounded-xl items-center"
                  style={{ opacity: replying || !reply.trim() ? 0.5 : 1 }}
                >
                  {replying
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text className="text-white font-bold text-sm">Send Reply</Text>
                  }
                </TouchableOpacity>
              </View>
            )}

            {selectedTicket.status === "closed" && (
              <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-8 items-center">
                <Text className="text-gray-400 text-sm">This ticket is closed. No further replies allowed.</Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (view === "edit" && selectedTicket) {
    const TICKET_CATEGORIES = ["Academic", "Administrative", "Technical", "General", "Other"];
    const formatCountdown = (s: number) =>
      `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA]">
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => setView("detail")} className="flex-row items-center gap-2 mb-6">
            <ArrowLeft size={18} color="#9CA3AF" />
            <Text className="text-gray-400 font-bold text-sm">Back</Text>
          </TouchableOpacity>

          <Text className="text-xl font-bold text-[#2D3A5D] mb-1">Edit Ticket</Text>
          <Text className="text-sm text-gray-400 mb-2">Modify the ticket details below.</Text>

          {secondsLeft > 0 && (
            <View className="flex-row items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5">
              <Pencil size={13} color="#d97706" />
              <Text className="text-amber-700 text-xs font-bold">
                Edit window closes in {formatCountdown(secondsLeft)}
              </Text>
            </View>
          )}

          <View className="bg-white rounded-3xl p-6 gap-5 mb-8">
            {/* Subject */}
            <View>
              <Text className="text-[#2D3A5D] text-[11px] font-black uppercase tracking-widest mb-2">
                Subject <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={editSubject}
                onChangeText={(v) => { setEditSubject(v); if (editSubjectError) setEditSubjectError(""); }}
                placeholder="Brief description of the issue"
                placeholderTextColor="#9CA3AF"
                className={`rounded-2xl px-4 py-4 text-sm text-[#2D3A5D] ${editSubjectError ? "bg-red-50 border border-red-300" : "bg-[#F0F2F5]"}`}
                maxLength={255}
              />
              {editSubjectError !== "" && <Text className="text-red-500 text-xs mt-1 pl-1">{editSubjectError}</Text>}
              <Text className="text-gray-400 text-xs mt-1 pl-1 text-right">{editSubject.length}/255</Text>
            </View>

            {/* Category */}
            <View>
              <Text className="text-[#2D3A5D] text-[11px] font-black uppercase tracking-widest mb-2">Category</Text>
              <View className="flex-row flex-wrap gap-2">
                {TICKET_CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setEditCategory(c)}
                    className={`px-4 py-2 rounded-full border ${editCategory === c ? "bg-[#FBB017] border-[#FBB017]" : "bg-white border-gray-200"}`}
                  >
                    <Text className={`text-xs font-bold ${editCategory === c ? "text-white" : "text-gray-500"}`}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description */}
            <View>
              <Text className="text-[#2D3A5D] text-[11px] font-black uppercase tracking-widest mb-2">
                Description <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={editDescription}
                onChangeText={(v) => { setEditDescription(v); if (editDescError) setEditDescError(""); }}
                placeholder="Describe the issue in detail..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                className={`rounded-2xl px-4 py-4 text-sm text-[#2D3A5D] ${editDescError ? "bg-red-50 border border-red-300" : "bg-[#F0F2F5]"}`}
                style={{ minHeight: 120 }}
              />
              {editDescError !== "" && <Text className="text-red-500 text-xs mt-1 pl-1">{editDescError}</Text>}
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3 pt-2">
              <TouchableOpacity
                onPress={() => setView("detail")}
                className="flex-1 border-2 border-gray-200 py-4 rounded-2xl items-center"
              >
                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEditTicket}
                disabled={editSubmitting}
                className="flex-1 bg-[#FBB017] py-4 rounded-2xl items-center"
                style={{ opacity: editSubmitting ? 0.7 : 1 }}
              >
                {editSubmitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text className="text-white text-[10px] font-black uppercase tracking-widest">Save Changes</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}