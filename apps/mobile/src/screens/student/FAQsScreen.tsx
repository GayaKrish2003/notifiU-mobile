import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Search, ArrowLeft, ChevronDown, ChevronUp,
  Send, Bot, Plus, Pencil, ImageIcon, X,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {
  sendChatMessage, getTickets, getTicketById,
  createTicket, updateTicket,
  addTicketResponse,
  getServerURL, getToken,
} from "@notifiu/shared";
import type { ChatMessage } from "@notifiu/shared";


type MainView = "home" | "chatbot" | "create-ticket" | "my-tickets" | "ticket-detail" | "edit-ticket";

interface ImageFile { uri: string; name: string; type: string; }

interface FaqItem { category: string; question: string; answer: string; }
interface TicketData {
  _id: string; subject: string; description: string;
  status: string; category: string; createdAt: string;
  attachments?: Array<{ _id: string; file_path: string; original_name: string; mime_type?: string; }>;
}
interface TicketResponse {
  _id: string; response_message: string;
  responded_by: { name?: string; username?: string };
  createdAt: string;
}
interface JwtPayload { id: string; role: string; exp: number; }


const FAQ_DATA: FaqItem[] = [
  { category: "Academic", question: "How do I register for modules this semester?", answer: "Log in to the student portal, navigate to Module Registration under the Academic tab, and select the modules you wish to enroll in before the registration deadline." },
  { category: "Academic", question: "Where can I find my exam timetable?", answer: "Exam timetables are published in the Events section of your dashboard and also sent to your registered university email address two weeks before examinations begin." },
  { category: "Academic", question: "What is the grading system used at the university?", answer: "The university uses a GPA scale of 4.0. A = 4.0, A- = 3.7, B+ = 3.3, B = 3.0, C = 2.0, D = 1.0, F = 0.0. Your CGPA is the weighted average of all completed modules." },
  { category: "Administrative", question: "How do I update my personal contact information?", answer: 'Go to your Profile tab and click "Edit Profile". You can update your phone number, address, and other contact details there.' },
  { category: "Administrative", question: "How do I apply for a fee payment extension?", answer: 'Submit a formal request through the support ticket system selecting "Administrative" as the category. The finance office will respond within 3 working days.' },
  { category: "Administrative", question: "Where can I obtain my official enrollment certificate?", answer: "Submit a support ticket under the Administrative category. Allow 5–7 working days for processing." },
  { category: "Technical", question: "I cannot log in to my student account. What should I do?", answer: 'Try resetting your password using the "Forgot Password" link. If the issue persists, raise a Technical support ticket and our IT team will assist within 24 hours.' },
  { category: "Technical", question: "The portal is not loading correctly on my browser.", answer: "Clear your browser cache and cookies, then try again. If the issue continues, submit a Technical ticket with your browser details." },
  { category: "General", question: "What are the library opening hours?", answer: "Mon–Fri 8:00 AM – 10:00 PM, Sat 9:00 AM – 6:00 PM, Sun 10:00 AM – 4:00 PM. Extended hours apply during examinations." },
  { category: "General", question: "How can I contact my academic advisor?", answer: 'Your academic advisor\'s contact is in the Profile section under "Academic Information". You can email them directly or book an appointment via the portal.' },
];

const TICKET_CATEGORIES = ["Academic", "Administrative", "Technical", "General", "Other"];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open:        { bg: "#dbeafe", text: "#1d4ed8" },
  in_progress: { bg: "#fef9c3", text: "#a16207" },
  resolved:    { bg: "#dcfce7", text: "#15803d" },
  closed:      { bg: "#f1f5f9", text: "#475569" },
};


function ChatBotView({ onBack }: { onBack: () => void }) {
  interface Msg { id: number; role: "user" | "assistant"; content: string; }
  const [messages, setMessages] = useState<Msg[]>([{
    id: 0, role: "assistant",
    content: "Hi! I'm your NotifiU AI assistant. Ask me anything about your modules, exams, fees, or how to use the portal.",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const nextId = useRef(1);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Msg = { id: nextId.current++, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history: ChatMessage[] = [...messages, userMsg]
        .filter((m) => m.id !== 0)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await sendChatMessage(history);
      setMessages((prev) => [...prev, {
        id: nextId.current++, role: "assistant",
        content: (res.data as { message: string }).message,
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: nextId.current++, role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-3 bg-[#F8F9FA]">
          <TouchableOpacity onPress={onBack} className="flex-row items-center gap-2 mb-3">
            <ArrowLeft size={18} color="#9CA3AF" />
            <Text className="text-gray-400 font-bold text-sm">Back</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-[#2D3A5D] text-center">How can we help you?</Text>
          <Text className="text-sm text-gray-400 text-center">Ask questions about the portal.</Text>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          className="flex-1 bg-[#F9FAFB] px-4"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          <View className="py-4 gap-3">
            {messages.map((msg) => (
              <View key={msg.id} className={`flex-row ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <View className="w-8 h-8 bg-[#FBB017] rounded-full items-center justify-center mr-2 mt-1">
                    <Bot size={14} color="#1A1C2C" />
                  </View>
                )}
                <View
                  className={`max-w-[78%] px-4 py-3 rounded-2xl ${msg.role === "user" ? "bg-[#1A1C2C]" : "bg-white border border-gray-200"}`}
                >
                  <Text className={`text-sm leading-relaxed ${msg.role === "user" ? "text-white" : "text-[#2D3A5D]"}`}>
                    {msg.content}
                  </Text>
                </View>
              </View>
            ))}
            {loading && (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#9CA3AF" />
                <Text className="text-gray-400 text-sm">Thinking...</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Input */}
        <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-t border-gray-100">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask a question..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#2D3A5D]"
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={loading || !input.trim()}
            className="bg-[#FBB017] p-3 rounded-xl"
            style={{ opacity: loading || !input.trim() ? 0.5 : 1 }}
          >
            <Send size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Main FAQs Screen ─────────────────────────────────────────
export default function FAQsScreen() {
  const [view, setView] = useState<MainView>("home");
  const [search, setSearch] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string>("student");

  // Tickets
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [ticketResponses, setTicketResponses] = useState<TicketResponse[]>([]);

  // Create ticket form
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [subjectError, setSubjectError] = useState("");
  const [descError, setDescError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reply
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);

  // Edit ticket
  const [editSubject, setEditSubject] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("General");
  const [editSubjectError, setEditSubjectError] = useState("");
  const [editDescError, setEditDescError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Image attachments
  const [createImages, setCreateImages] = useState<ImageFile[]>([]);
  const [editImages, setEditImages] = useState<ImageFile[]>([]);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);

  // Countdown timer for 5-minute edit window
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem("token").then((token) => {
      if (token) {
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          setUserRole(decoded.role);
        } catch {}
      }
    });
  }, []);

  const filteredFaqs = FAQ_DATA.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase())
  );

  const fetchTickets = () => {
    setTicketsLoading(true);
    getTickets()
      .then((res: any) => setTickets(res.data))
      .catch(() => setTickets([]))
      .finally(() => setTicketsLoading(false));
  };

  const openTicketDetail = (ticket: TicketData) => {
    getTicketById(ticket._id)
      .then((res: any) => {
        setSelectedTicket(res.data.ticket);
        setTicketResponses(res.data.responses || []);
      })
      .catch(() => {
        setSelectedTicket(ticket);
        setTicketResponses([]);
      })
      .finally(() => setView("ticket-detail"));
  };

  // Recalculate countdown whenever selectedTicket changes
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

  // ─── Validation ───────────────────────────────────────────
  const validateTicketForm = (): boolean => {
    let valid = true;
    if (!subject.trim()) {
      setSubjectError("Subject is required.");
      valid = false;
    } else if (subject.trim().length < 5) {
      setSubjectError("Subject must be at least 5 characters.");
      valid = false;
    } else {
      setSubjectError("");
    }

    if (!description.trim()) {
      setDescError("Description is required.");
      valid = false;
    } else if (description.trim().length < 10) {
      setDescError("Description must be at least 10 characters.");
      valid = false;
    } else {
      setDescError("");
    }

    return valid;
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

  const pickImages = async (
    current: ImageFile[],
    setter: (imgs: ImageFile[]) => void
  ) => {
    const MAX = 5;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const remaining = MAX - current.length;
    if (remaining <= 0) {
      Alert.alert("Limit reached", "You can only attach up to 5 images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (!result.canceled) {
      const picked: ImageFile[] = result.assets.map((a) => ({
        uri: a.uri,
        name: a.fileName ?? `image_${Date.now()}.jpg`,
        type: a.mimeType ?? "image/jpeg",
      }));
      setter([...current, ...picked].slice(0, MAX));
    }
  };

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

  const handleCreateTicket = async () => {
    if (!validateTicketForm()) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("subject", subject.trim());
      formData.append("description", description.trim());
      formData.append("category", category);
      createImages.forEach((img) => {
        formData.append("attachments", { uri: img.uri, name: img.name, type: img.type } as any);
      });
      await createTicket(formData as any);
      setSubject("");
      setDescription("");
      setCategory("General");
      setCreateImages([]);
      setView("my-tickets");
      fetchTickets();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || err.message || "Failed to create ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
        setTicketResponses((prev) => [...prev, res.data]);
        setReply("");
      })
      .catch(() => Alert.alert("Error", "Failed to send reply."))
      .finally(() => setReplying(false));
  };

  const openEditTicket = () => {
    if (!selectedTicket) return;
    setEditSubject(selectedTicket.subject);
    setEditDescription(selectedTicket.description);
    setEditCategory(selectedTicket.category);
    setEditSubjectError("");
    setEditDescError("");
    setEditImages([]);
    setView("edit-ticket");
  };

  const handleDeleteExistingAttachment = (attachmentId: string) => {
    if (!selectedTicket) return;
    setDeletingAttachmentId(attachmentId);
    axios.delete(`https://notifiu.up.railway.app/api/tickets/${selectedTicket._id}/attachments/${attachmentId}`)
      .then(() => {
        setSelectedTicket((prev) =>
          prev
            ? { ...prev, attachments: prev.attachments?.filter((a) => a._id !== attachmentId) }
            : prev
        );
      })
      .catch(() => Alert.alert("Error", "Failed to remove attachment."))
      .finally(() => setDeletingAttachmentId(null));
  };

  const handleEditTicket = async () => {
    if (!selectedTicket || !validateEditForm()) return;
    setEditSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("subject", editSubject.trim());
      formData.append("description", editDescription.trim());
      formData.append("category", editCategory);
      editImages.forEach((img) => {
        formData.append("attachments", { uri: img.uri, name: img.name, type: img.type } as any);
      });
      const res = await updateTicket(selectedTicket._id, formData as any);
      const updated = res.data as TicketData;
      setSelectedTicket((prev) => prev ? { ...prev, ...updated } : prev);
      setTickets((prev) =>
        prev.map((t) => (t._id === selectedTicket._id ? { ...t, ...updated } : t))
      );
      setEditImages([]);
      setView("ticket-detail");
      Alert.alert("Success", "Ticket updated successfully.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update ticket.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // ─── Edit Ticket ──────────────────────────────────────────
  if (view === "edit-ticket" && selectedTicket) {
    const formatCountdown = (s: number) =>
      `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA]">
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => setView("ticket-detail")} className="flex-row items-center gap-2 mb-6">
            <ArrowLeft size={18} color="#9CA3AF" />
            <Text className="text-gray-400 font-bold text-sm">Back</Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-[#2D3A5D] mb-1">Edit Ticket</Text>
          <Text className="text-sm text-gray-400 mb-2">Update your ticket details below.</Text>

          {/* Countdown warning */}
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
                placeholder="Brief description of your issue"
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
                placeholder="Describe your issue in detail..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                className={`rounded-2xl px-4 py-4 text-sm text-[#2D3A5D] ${editDescError ? "bg-red-50 border border-red-300" : "bg-[#F0F2F5]"}`}
                style={{ minHeight: 120 }}
              />
              {editDescError !== "" && <Text className="text-red-500 text-xs mt-1 pl-1">{editDescError}</Text>}
            </View>

            {/* Existing attachments */}
            {(selectedTicket.attachments ?? []).length > 0 && (
              <View>
                <Text className="text-[#2D3A5D] text-[11px] font-black uppercase tracking-widest mb-2">
                  Current Attachments
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {(selectedTicket.attachments ?? []).map((att) => {
                    const isDeleting = deletingAttachmentId === att._id;
                    const imgUrl = att.file_path.startsWith("http")
                      ? att.file_path
                      : `${getServerURL()}${att.file_path}`;
                    return (
                      <View key={att._id} style={{ position: "relative" }}>
                        <TouchableOpacity onPress={() => handleDownloadAttachment(att)} activeOpacity={0.8}>
                          <Image
                            source={{ uri: imgUrl }}
                            style={{ width: 72, height: 72, borderRadius: 12, opacity: isDeleting ? 0.4 : 1 }}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                        {isDeleting
                          ? <ActivityIndicator size="small" color="#ef4444" style={{ position: "absolute", top: 26, left: 26 }} />
                          : (
                            <TouchableOpacity
                              onPress={() => handleDeleteExistingAttachment(att._id)}
                              style={{
                                position: "absolute", top: -6, right: -6,
                                backgroundColor: "#ef4444", width: 20, height: 20,
                                borderRadius: 10, alignItems: "center", justifyContent: "center",
                              }}
                            >
                              <X size={10} color="#fff" />
                            </TouchableOpacity>
                          )
                        }
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* New image attachments */}
            {(() => {
              const existingCount = (selectedTicket.attachments ?? []).length;
              const totalAllowed = 5;
              const canAddMore = existingCount + editImages.length < totalAllowed;
              return (
                <View>
                  <Text className="text-[#2D3A5D] text-[11px] font-black uppercase tracking-widest mb-1">
                    Add More Images
                    <Text className="text-gray-400 font-normal normal-case tracking-normal text-[10px]"> (PNG, JPG, JPEG · {totalAllowed - existingCount} remaining)</Text>
                  </Text>
                  <View className="flex-row flex-wrap gap-2 mt-2">
                    {editImages.map((img, idx) => (
                      <View key={idx} style={{ position: "relative" }}>
                        <Image
                          source={{ uri: img.uri }}
                          style={{ width: 72, height: 72, borderRadius: 12 }}
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          onPress={() => setEditImages((prev) => prev.filter((_, i) => i !== idx))}
                          style={{
                            position: "absolute", top: -6, right: -6,
                            backgroundColor: "#ef4444", width: 20, height: 20,
                            borderRadius: 10, alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <X size={10} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {canAddMore && (
                      <TouchableOpacity
                        onPress={() => pickImages(editImages, setEditImages)}
                        style={{
                          width: 72, height: 72, borderRadius: 12,
                          backgroundColor: "#F0F2F5", borderWidth: 2,
                          borderStyle: "dashed", borderColor: "#D1D5DB",
                          alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <ImageIcon size={20} color="#9CA3AF" />
                        <Text style={{ color: "#9CA3AF", fontSize: 9, fontWeight: "700", marginTop: 4 }}>
                          Add Image
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {!canAddMore && (
                    <Text className="text-gray-400 text-xs mt-1">Maximum 5 attachments reached.</Text>
                  )}
                </View>
              );
            })()}

            {/* Buttons */}
            <View className="flex-row gap-3 pt-2">
              <TouchableOpacity
                onPress={() => setView("ticket-detail")}
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

  // ─── Chatbot ──────────────────────────────────────────────
  if (view === "chatbot") {
    return <ChatBotView onBack={() => setView("home")} />;
  }

  // ─── Create Ticket ────────────────────────────────────────
  if (view === "create-ticket") {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA]">
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => setView("home")} className="flex-row items-center gap-2 mb-6">
            <ArrowLeft size={18} color="#9CA3AF" />
            <Text className="text-gray-400 font-bold text-sm">Back</Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-[#2D3A5D] mb-1">Help & Support</Text>
          <Text className="text-sm text-gray-400 mb-6">Submit a request and our team will get back to you.</Text>

          <View className="bg-white rounded-3xl p-6 gap-5 mb-8">
            {/* Subject */}
            <View>
              <Text className="text-[#2D3A5D] text-[11px] font-black uppercase tracking-widest mb-2">
                Subject <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={subject}
                onChangeText={(v) => { setSubject(v); if (subjectError) setSubjectError(""); }}
                placeholder="Brief description of your issue"
                placeholderTextColor="#9CA3AF"
                className={`rounded-2xl px-4 py-4 text-sm text-[#2D3A5D] ${subjectError ? "bg-red-50 border border-red-300" : "bg-[#F0F2F5]"}`}
                maxLength={255}
              />
              {subjectError !== "" && <Text className="text-red-500 text-xs mt-1 pl-1">{subjectError}</Text>}
              <Text className="text-gray-400 text-xs mt-1 pl-1 text-right">{subject.length}/255</Text>
            </View>

            {/* Category */}
            <View>
              <Text className="text-[#2D3A5D] text-[11px] font-black uppercase tracking-widest mb-2">Category</Text>
              <View className="flex-row flex-wrap gap-2">
                {TICKET_CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCategory(c)}
                    className={`px-4 py-2 rounded-full border ${category === c ? "bg-[#FBB017] border-[#FBB017]" : "bg-white border-gray-200"}`}
                  >
                    <Text className={`text-xs font-bold ${category === c ? "text-white" : "text-gray-500"}`}>{c}</Text>
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
                value={description}
                onChangeText={(v) => { setDescription(v); if (descError) setDescError(""); }}
                placeholder="Describe your issue in detail..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                className={`rounded-2xl px-4 py-4 text-sm text-[#2D3A5D] ${descError ? "bg-red-50 border border-red-300" : "bg-[#F0F2F5]"}`}
                style={{ minHeight: 120 }}
              />
              {descError !== "" && <Text className="text-red-500 text-xs mt-1 pl-1">{descError}</Text>}
            </View>

            {/* Image Attachments */}
            <View>
              <Text className="text-[#2D3A5D] text-[11px] font-black uppercase tracking-widest mb-1">
                Attachments
                <Text className="text-gray-400 font-normal normal-case tracking-normal text-[10px]"> (PNG, JPG, JPEG · max 5)</Text>
              </Text>
              <View className="flex-row flex-wrap gap-2 mt-2">
                {createImages.map((img, idx) => (
                  <View key={idx} style={{ position: "relative" }}>
                    <Image
                      source={{ uri: img.uri }}
                      style={{ width: 72, height: 72, borderRadius: 12 }}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => setCreateImages((prev) => prev.filter((_, i) => i !== idx))}
                      style={{
                        position: "absolute", top: -6, right: -6,
                        backgroundColor: "#ef4444", width: 20, height: 20,
                        borderRadius: 10, alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <X size={10} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {createImages.length < 5 && (
                  <TouchableOpacity
                    onPress={() => pickImages(createImages, setCreateImages)}
                    style={{
                      width: 72, height: 72, borderRadius: 12,
                      backgroundColor: "#F0F2F5", borderWidth: 2,
                      borderStyle: "dashed", borderColor: "#D1D5DB",
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <ImageIcon size={20} color="#9CA3AF" />
                    <Text style={{ color: "#9CA3AF", fontSize: 9, fontWeight: "700", marginTop: 4 }}>
                      Add Image
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {createImages.length >= 5 && (
                <Text className="text-gray-400 text-xs mt-1">Maximum 5 images reached.</Text>
              )}
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3 pt-2">
              <TouchableOpacity
                onPress={() => setView("home")}
                className="flex-1 border-2 border-gray-200 py-4 rounded-2xl items-center"
              >
                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateTicket}
                disabled={submitting}
                className="flex-1 bg-[#FBB017] py-4 rounded-2xl items-center"
                style={{ opacity: submitting ? 0.7 : 1 }}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text className="text-white text-[10px] font-black uppercase tracking-widest">Submit Ticket</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── My Tickets ───────────────────────────────────────────
  if (view === "my-tickets") {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA]">
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-4">
              <TouchableOpacity onPress={() => setView("home")} className="flex-row items-center gap-2">
                <ArrowLeft size={18} color="#9CA3AF" />
                <Text className="text-gray-400 font-bold text-sm">Back</Text>
              </TouchableOpacity>
              <Text className="text-xl font-bold text-[#2D3A5D]">My Tickets</Text>
            </View>
            <TouchableOpacity onPress={() => setView("create-ticket")} className="bg-[#FBB017] px-4 py-2 rounded-2xl flex-row items-center gap-1">
              <Plus size={14} color="#fff" />
              <Text className="text-white text-[10px] font-black uppercase tracking-widest">New</Text>
            </TouchableOpacity>
          </View>

          {ticketsLoading
            ? <ActivityIndicator color="#FBB017" className="mt-10" />
            : tickets.length === 0
              ? <View className="items-center py-16"><Text className="text-gray-300 font-bold tracking-widest">No tickets found.</Text></View>
              : (
                <View className="gap-3 pb-8">
                  {tickets.map((ticket) => {
                    const sc = STATUS_COLORS[ticket.status] ?? STATUS_COLORS.open;
                    return (
                      <TouchableOpacity
                        key={ticket._id}
                        onPress={() => openTicketDetail(ticket)}
                        className="bg-white rounded-2xl p-5 border border-gray-100"
                      >
                        <View className="flex-row items-start justify-between mb-2">
                          <Text className="text-[#2D3A5D] font-bold text-sm flex-1 pr-3" numberOfLines={2}>{ticket.subject}</Text>
                          <View className="px-2 py-1 rounded-full" style={{ backgroundColor: sc.bg }}>
                            <Text className="text-xs font-bold capitalize" style={{ color: sc.text }}>{ticket.status.replace("_", " ")}</Text>
                          </View>
                        </View>
                        <Text className="text-gray-400 text-xs">{ticket.category} · {new Date(ticket.createdAt).toLocaleDateString()}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )
          }
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Ticket Detail ────────────────────────────────────────
  if (view === "ticket-detail" && selectedTicket) {
    const sc = STATUS_COLORS[selectedTicket.status] ?? STATUS_COLORS.open;
    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA]">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <TouchableOpacity onPress={() => { setView("my-tickets"); fetchTickets(); }} className="flex-row items-center gap-2 mb-6">
              <ArrowLeft size={18} color="#9CA3AF" />
              <Text className="text-gray-400 font-bold text-sm">Back</Text>
            </TouchableOpacity>

            {/* Edit window banner */}
            {secondsLeft > 0 && selectedTicket.status === "open" && (
              <TouchableOpacity
                onPress={openEditTicket}
                className="flex-row items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4"
              >
                <View className="flex-row items-center gap-2">
                  <Pencil size={13} color="#d97706" />
                  <Text className="text-amber-700 text-xs font-bold">
                    Edit window · {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")} left
                  </Text>
                </View>
                <Text className="text-amber-600 text-xs font-black uppercase tracking-widest">Edit →</Text>
              </TouchableOpacity>
            )}

            {/* Ticket info */}
            <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100">
              <View className="flex-row items-start justify-between mb-3">
                <Text className="text-[#2D3A5D] font-bold text-base flex-1 pr-3">{selectedTicket.subject}</Text>
                <View className="px-2 py-1 rounded-full" style={{ backgroundColor: sc.bg }}>
                  <Text className="text-xs font-bold capitalize" style={{ color: sc.text }}>{selectedTicket.status.replace("_", " ")}</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-xs mb-3">{selectedTicket.category} · {new Date(selectedTicket.createdAt).toLocaleDateString()}</Text>
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
            {ticketResponses.map((r) => (
              <View key={r._id} className="bg-[#FBB017]/10 rounded-2xl p-4 border border-[#FBB017]/20 mb-3">
                <Text className="text-[#FBB017] text-xs font-bold mb-1">
                  {r.responded_by?.name || r.responded_by?.username || "Support Team"}
                </Text>
                <Text className="text-[#2D3A5D] text-sm leading-relaxed">{r.response_message}</Text>
                <Text className="text-gray-400 text-xs mt-2">{new Date(r.createdAt).toLocaleDateString()}</Text>
              </View>
            ))}

            {/* Reply box — only if not closed */}
            {selectedTicket.status !== "closed" && (
              <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-8">
                <Text className="text-[#2D3A5D] text-xs font-black uppercase tracking-widest mb-3">Add Reply</Text>
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
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── Home View (FAQ list + action buttons) ────────────────
  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-2xl font-bold text-[#2D3A5D]">FAQ</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => { fetchTickets(); setView("my-tickets"); }}
              className="border-2 border-[#1A1C2C] px-3 py-2 rounded-2xl"
            >
              <Text className="text-[#1A1C2C] text-[10px] font-black uppercase tracking-widest">My Tickets</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setView("create-ticket")}
              className="bg-[#FBB017] px-3 py-2 rounded-2xl"
            >
              <Text className="text-white text-[10px] font-black uppercase tracking-widest">+ Ticket</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Chatbot Card */}
        <TouchableOpacity
          onPress={() => setView("chatbot")}
          className="bg-[#1A1C2C] rounded-2xl p-5 mb-6 flex-row items-center gap-4"
        >
          <View className="w-10 h-10 bg-[#FBB017] rounded-full items-center justify-center">
            <Bot size={20} color="#1A1C2C" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-sm mb-0.5">NotifiU AI Assistant</Text>
            <Text className="text-gray-400 text-xs">Ask questions about modules, fees, portal & more</Text>
          </View>
          <Text className="text-[#FBB017] text-xl font-bold">›</Text>
        </TouchableOpacity>

        {/* Search */}
        <View className="flex-row items-center bg-white border border-gray-100 rounded-2xl px-4 mb-5">
          <Search size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search frequently asked questions..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 py-4 px-3 text-sm text-[#2D3A5D]"
          />
        </View>

        {/* FAQ accordion */}
        <View className="gap-3 pb-8">
          {filteredFaqs.map((faq, idx) => (
            <View key={idx} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              <TouchableOpacity
                onPress={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="flex-row items-center justify-between px-5 py-4"
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="border border-[#FBB017] rounded-full px-2 py-0.5">
                    <Text className="text-[#FBB017] text-[9px] font-bold uppercase tracking-widest">{faq.category}</Text>
                  </View>
                  <Text className="text-[#2D3A5D] font-bold text-sm flex-1" numberOfLines={2}>{faq.question}</Text>
                </View>
                {expandedFaq === idx
                  ? <ChevronUp size={18} color="#FBB017" />
                  : <ChevronDown size={18} color="#9CA3AF" />
                }
              </TouchableOpacity>
              {expandedFaq === idx && (
                <View className="px-5 pb-5 ml-5 border-l-2 border-[#FBB017]/40">
                  <Text className="text-[#2D3A5D]/60 text-sm leading-relaxed">{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
          {filteredFaqs.length === 0 && (
            <Text className="text-center text-gray-300 font-bold py-10 tracking-widest">
              No results found. Try creating a support ticket.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}