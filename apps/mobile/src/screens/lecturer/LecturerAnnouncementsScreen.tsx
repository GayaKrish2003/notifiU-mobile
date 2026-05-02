import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Modal, Platform, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import {
  Search, Plus, Pencil, Eye, Trash2, ArrowLeft,
  X, Paperclip, Calendar, File, Download,
} from "lucide-react-native";
import {
  getAnnouncements, createAnnouncement,
  updateAnnouncement, deleteAnnouncement, getServerURL,
} from "@notifiu/shared";


type AnnView = "list" | "create" | "detail" | "edit";

interface Attachment {
  _id: string;
  file_path: string;
  original_name: string;
  mime_type?: string;
}

interface PickedFile {
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
}

interface Announcement {
  _id: string;
  title: string;
  content: string;
  priority: "low" | "medium" | "high" | "urgent";
  publish_date: string;
  expiry_date?: string;
  status: string;
  attachments: Attachment[];
  createdAt?: string;
}

interface CreateFormData {
  title: string;
  content: string;
  priority: string;
  publish_date: Date | null;
  expiry_date: Date | null;
}

interface EditFormData {
  title: string;
  content: string;
  priority: string;
  expiry_date: Date | null;
}

interface CreateErrors {
  title: string; content: string; priority: string;
  publish_date: string; expiry_date: string;
}

interface EditErrors {
  title: string; content: string; priority: string; expiry_date: string;
}


const PRIORITY_LABELS: Record<string, string> = {
  high: "Academic", medium: "Administrative", low: "General", urgent: "Urgent",
};

const PRIORITY_OPTIONS = [
  { label: "Academic", value: "high" },
  { label: "Administrative", value: "medium" },
  { label: "General", value: "low" },
  { label: "Urgent", value: "urgent" },
];

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  published: { bg: "#dcfce7", text: "#15803d" },
  draft:     { bg: "#fef9c3", text: "#a16207" },
  archived:  { bg: "#f1f5f9", text: "#475569" },
};

const EMPTY_CREATE_ERRORS: CreateErrors = {
  title: "", content: "", priority: "", publish_date: "", expiry_date: "",
};

const EMPTY_EDIT_ERRORS: EditErrors = {
  title: "", content: "", priority: "", expiry_date: "",
};


const todayStart = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const tomorrowStart = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const formatDateObj = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const toISODate = (d: Date) => d.toISOString().split("T")[0];


const downloadAttachment = (filePath: string) => {
  const url = `${getServerURL()}${filePath}`;
  Linking.openURL(url).catch(() =>
    Alert.alert("Error", "Could not open the file. Make sure you are connected to the server.")
  );
};


interface DateFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  minimumDate: Date;
  error: string;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
}

function DateField({ label, value, onChange, minimumDate, error, required, disabled, hint }: DateFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <View>
      <Text className="text-[#2D3A5D] text-sm font-semibold mb-2">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
        {disabled && <Text className="text-gray-400 font-normal"> (cannot be changed)</Text>}
      </Text>
      <TouchableOpacity
        onPress={() => { if (!disabled) setShow(true); }}
        className={`flex-row items-center justify-between rounded-xl px-4 py-3 border ${
          disabled ? "bg-gray-50 border-gray-100" :
          error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
        }`}
      >
        <Text className={`text-sm ${value ? (disabled ? "text-gray-400" : "text-[#2D3A5D] font-medium") : "text-gray-400"}`}>
          {value ? formatDateObj(value) : `Select ${label}`}
        </Text>
        <Calendar size={18} color={disabled ? "#D1D5DB" : error ? "#f87171" : "#FBB017"} />
      </TouchableOpacity>
      {error !== "" && <Text className="text-red-500 text-xs mt-1 pl-1">{error}</Text>}
      {hint && error === "" && <Text className="text-gray-400 text-xs mt-1 pl-1">{hint}</Text>}
      {show && !disabled && (
        <DateTimePicker
          value={value ?? minimumDate}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "calendar"}
          minimumDate={minimumDate}
          onChange={(_, selected) => {
            setShow(Platform.OS === "ios");
            if (selected) onChange(selected);
          }}
        />
      )}
    </View>
  );
}


function CategoryPicker({
  value, onChange, error,
}: { value: string; onChange: (v: string) => void; error: string }) {
  return (
    <View>
      <Text className="text-[#2D3A5D] text-sm font-semibold mb-2">
        Category <Text className="text-red-500">*</Text>
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {PRIORITY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-full border ${value === opt.value ? "bg-[#FBB017] border-[#FBB017]" : "bg-white border-gray-200"}`}
          >
            <Text className={`text-xs font-bold ${value === opt.value ? "text-white" : "text-gray-500"}`}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error !== "" && <Text className="text-red-500 text-xs mt-1 pl-1">{error}</Text>}
    </View>
  );
}


const validateCreate = (form: CreateFormData): { errors: CreateErrors; valid: boolean } => {
  const errors = { ...EMPTY_CREATE_ERRORS };
  let valid = true;
  const today = todayStart();

  if (!form.title.trim()) { errors.title = "Title is required."; valid = false; }
  else if (form.title.trim().length < 5) { errors.title = "Title must be at least 5 characters."; valid = false; }
  else if (form.title.length > 255) { errors.title = "Title cannot exceed 255 characters."; valid = false; }

  if (!form.content.trim()) { errors.content = "Content is required."; valid = false; }
  else if (form.content.trim().length < 10) { errors.content = "Content must be at least 10 characters."; valid = false; }

  if (!form.priority) { errors.priority = "Please select a category."; valid = false; }

  if (!form.publish_date) {
    errors.publish_date = "Publish date is required."; valid = false;
  } else if (form.publish_date < today) {
    errors.publish_date = "Publish date cannot be in the past."; valid = false;
  }

  if (!form.expiry_date) {
  errors.expiry_date = "Expiry date is required.";
  valid = false;
} else {
  const tomorrow = tomorrowStart();
  if (form.expiry_date < tomorrow) {
    errors.expiry_date = "Expiry date must be after today."; valid = false;
  } else if (form.publish_date && form.expiry_date <= form.publish_date) {
    errors.expiry_date = "Expiry date must be after publish date."; valid = false;
  }
}

  return { errors, valid };
};

const validateEdit = (form: EditFormData, publishDate: Date): { errors: EditErrors; valid: boolean } => {
  const errors = { ...EMPTY_EDIT_ERRORS };
  let valid = true;

  if (!form.title.trim()) { errors.title = "Title is required."; valid = false; }
  else if (form.title.trim().length < 5) { errors.title = "Title must be at least 5 characters."; valid = false; }
  else if (form.title.length > 255) { errors.title = "Title cannot exceed 255 characters."; valid = false; }

  if (!form.content.trim()) { errors.content = "Content is required."; valid = false; }
  else if (form.content.trim().length < 10) { errors.content = "Content must be at least 10 characters."; valid = false; }

  if (!form.priority) { errors.priority = "Please select a category."; valid = false; }

  if (!form.expiry_date) {
  errors.expiry_date = "Expiry date is required.";
  valid = false;
} else {
  const tomorrow = tomorrowStart();
  if (form.expiry_date < tomorrow) {
    errors.expiry_date = "Expiry date must be after today."; valid = false;
  } else if (form.expiry_date <= publishDate) {
    errors.expiry_date = "Expiry date must be after the publish date."; valid = false;
  }
}

  return { errors, valid };
};

export default function LecturerAnnouncementsScreen() {
  const [view, setView] = useState<AnnView>("list");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [editAnn, setEditAnn] = useState<Announcement | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  
  const emptyCreateForm: CreateFormData = {
    title: "", content: "", priority: "", publish_date: todayStart(), expiry_date: null,
  };
  const [createForm, setCreateForm] = useState<CreateFormData>(emptyCreateForm);
  const [createErrors, setCreateErrors] = useState<CreateErrors>(EMPTY_CREATE_ERRORS);
  const [createLoading, setCreateLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<PickedFile | null>(null);

  
  const [editForm, setEditForm] = useState<EditFormData>({ title: "", content: "", priority: "", expiry_date: null });
  const [editErrors, setEditErrors] = useState<EditErrors>(EMPTY_EDIT_ERRORS);
  const [editLoading, setEditLoading] = useState(false);
  const [editNewFile, setEditNewFile] = useState<PickedFile | null>(null);

  const fetchAnnouncements = () => {
    setLoading(true);
    setError("");
    getAnnouncements()
      .then((res: any) => setAnnouncements(res.data))
      .catch(() => setError("Failed to load announcements."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const filtered = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      PRIORITY_LABELS[a.priority]?.toLowerCase().includes(search.toLowerCase()) ||
      formatDate(a.publish_date).includes(search)
  );


  const pickFile = async (forEdit = false) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        const file: PickedFile = {
          name: asset.name, uri: asset.uri,
          mimeType: asset.mimeType ?? "application/octet-stream",
          size: asset.size,
        };
        if (forEdit) setEditNewFile(file);
        else setAttachedFile(file);
      }
    } catch {
      Alert.alert("Error", "Failed to pick file.");
    }
  };

 
  const handleCreate = async () => {
    const { errors, valid } = validateCreate(createForm);
    setCreateErrors(errors);
    if (!valid) return;
    setCreateLoading(true);
    try {
      const data = new FormData() as any;
      data.append("title", createForm.title.trim());
      data.append("content", createForm.content.trim());
      data.append("priority", createForm.priority);
      data.append("status", "published");
      data.append("publish_date", toISODate(createForm.publish_date!));
      if (createForm.expiry_date) data.append("expiry_date", toISODate(createForm.expiry_date));
      if (attachedFile) {
        data.append("attachments", { uri: attachedFile.uri, name: attachedFile.name, type: attachedFile.mimeType } as any);
      }
      await createAnnouncement(data);
      setCreateForm(emptyCreateForm);
      setCreateErrors(EMPTY_CREATE_ERRORS);
      setAttachedFile(null);
      fetchAnnouncements();
      setView("list");
    } catch {
      Alert.alert("Error", "Failed to create announcement.");
    } finally {
      setCreateLoading(false);
    }
  };

 
  const openEdit = (ann: Announcement) => {
    setEditAnn(ann);
    setEditForm({
      title: ann.title,
      content: ann.content,
      priority: ann.priority,
      
      expiry_date: ann.expiry_date ? new Date(ann.expiry_date) : null,
    });
    setEditErrors(EMPTY_EDIT_ERRORS);
    setEditNewFile(null);
    setView("edit");
  };

  const handleEditSave = async () => {
    if (!editAnn) return;
    const publishDate = new Date(editAnn.publish_date);
    const { errors, valid } = validateEdit(editForm, publishDate);
    setEditErrors(errors);
    if (!valid) return;
    setEditLoading(true);
    try {
      const updated = await updateAnnouncement(editAnn._id, {
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        priority: editForm.priority,
        
        expiry_date: editForm.expiry_date ? toISODate(editForm.expiry_date) : undefined,
        status: editAnn.status,
      });
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === editAnn._id ? (updated.data as Announcement) : a))
      );
      setEditAnn(null);
      setView("list");
    } catch {
      Alert.alert("Error", "Failed to update announcement.");
    } finally {
      setEditLoading(false);
    }
  };

  
  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      if (view === "detail") setView("list");
    } catch {
      Alert.alert("Error", "Failed to delete announcement.");
    } finally {
      setDeleteId(null);
    }
  };

  const DeleteModal = () => (
    <Modal visible={deleteId !== null} transparent animationType="fade">
      <View className="flex-1 bg-black/40 items-center justify-center px-6">
        <View className="bg-white rounded-2xl p-6 w-full">
          <Text className="text-[#2D3A5D] font-bold text-lg mb-2">Delete Announcement?</Text>
          <Text className="text-gray-400 text-sm mb-6">This action cannot be undone.</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity onPress={() => setDeleteId(null)} className="flex-1 border border-gray-200 py-3 rounded-xl items-center">
              <Text className="text-gray-500 font-bold text-sm">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteId && handleDelete(deleteId)} className="flex-1 bg-red-500 py-3 rounded-xl items-center">
              <Text className="text-white font-bold text-sm">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

 
  const AttachmentsList = ({ attachments }: { attachments: Attachment[] }) => (
    <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
      <Text className="text-[#2D3A5D] text-xs font-black uppercase tracking-widest mb-3">Attachments</Text>
      {attachments.map((att) => (
        <TouchableOpacity
          key={att._id}
          onPress={() => downloadAttachment(att.file_path)}
          className="flex-row items-center gap-3 py-3 border-b border-gray-50"
        >
          <Paperclip size={14} color="#FBB017" />
          <Text className="text-[#2D3A5D] text-sm flex-1" numberOfLines={1}>{att.original_name}</Text>
          <View className="flex-row items-center gap-1 bg-[#FBB017]/10 px-2 py-1 rounded-full">
            <Download size={11} color="#FBB017" />
            <Text className="text-[#FBB017] text-[10px] font-bold">Download</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (view === "list") {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA]">
        <DeleteModal />
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-[#2D3A5D]">Announcements</Text>
            <TouchableOpacity
              onPress={() => { setCreateForm(emptyCreateForm); setCreateErrors(EMPTY_CREATE_ERRORS); setAttachedFile(null); setView("create"); }}
              className="flex-row items-center gap-2 bg-[#FBB017] px-4 py-2.5 rounded-xl"
            >
              <Plus size={16} color="#fff" />
              <Text className="text-white font-bold text-sm">New</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center bg-white border border-gray-100 rounded-2xl px-4 mb-5">
            <Search size={16} color="#9CA3AF" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by title, category or date..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 py-3.5 px-3 text-sm text-[#2D3A5D]"
            />
          </View>

          {loading && <ActivityIndicator color="#FBB017" className="mt-10" />}
          {error !== "" && <Text className="text-red-400 text-center font-bold py-10">{error}</Text>}

          {!loading && !error && (
            <View className="gap-3 pb-8">
              {filtered.map((ann) => {
                const sc = STATUS_COLOR[ann.status] ?? STATUS_COLOR.draft;
                return (
                  <View key={ann._id} className="bg-white rounded-2xl p-5 border border-gray-100">
                    <View className="flex-row items-start justify-between mb-2">
                      <Text className="text-[#2D3A5D] font-bold text-sm flex-1 pr-3" numberOfLines={2}>{ann.title}</Text>
                      <View className="px-2 py-1 rounded-full" style={{ backgroundColor: sc.bg }}>
                        <Text className="text-xs font-bold capitalize" style={{ color: sc.text }}>{ann.status}</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2 mb-1 flex-wrap">
                      <View className="border border-[#FBB017]/50 px-2 py-0.5 rounded-full">
                        <Text className="text-[#FBB017] text-[10px] font-bold">{PRIORITY_LABELS[ann.priority]}</Text>
                      </View>
                      <Text className="text-gray-400 text-xs">{formatDate(ann.publish_date)}</Text>
                      {ann.expiry_date && <Text className="text-gray-400 text-xs">→ {formatDate(ann.expiry_date)}</Text>}
                      {ann.attachments?.length > 0 && (
                        <View className="flex-row items-center gap-1">
                          <Paperclip size={10} color="#9CA3AF" />
                          <Text className="text-gray-400 text-[10px]">{ann.attachments.length} file{ann.attachments.length > 1 ? "s" : ""}</Text>
                        </View>
                      )}
                    </View>
                    {/* Show created time */}
                    {ann.createdAt && (
                      <Text className="text-gray-300 text-[10px] mb-2">
                        Posted: {formatDateTime(ann.createdAt)}
                      </Text>
                    )}
                    <View className="flex-row items-center gap-4 border-t border-gray-50 pt-3">
                      <TouchableOpacity onPress={() => openEdit(ann)} className="flex-row items-center gap-1">
                        <Pencil size={14} color="#9CA3AF" />
                        <Text className="text-gray-400 text-xs font-medium">Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { setSelected(ann); setView("detail"); }} className="flex-row items-center gap-1">
                        <Eye size={14} color="#9CA3AF" />
                        <Text className="text-gray-400 text-xs font-medium">View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setDeleteId(ann._id)} className="flex-row items-center gap-1">
                        <Trash2 size={14} color="#f87171" />
                        <Text className="text-red-400 text-xs font-medium">Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
              {filtered.length === 0 && (
                <View className="items-center py-16">
                  <Text className="text-gray-300 font-bold tracking-widest">No announcements found.</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

 
  if (view === "create") {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA]">
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center gap-3 mb-6">
            <TouchableOpacity onPress={() => setView("list")}><X size={22} color="#9CA3AF" /></TouchableOpacity>
            <Text className="text-[#2D3A5D]/30 font-black text-base tracking-widest uppercase">New Announcement</Text>
          </View>
          <View className="bg-white rounded-2xl p-6 mb-8 gap-5">
            <Text className="text-[#2D3A5D] font-black text-xl">Create Announcement</Text>

            {/* Title */}
            <View>
              <Text className="text-[#2D3A5D] text-sm font-semibold mb-2">Title <Text className="text-red-500">*</Text></Text>
              <TextInput
                value={createForm.title}
                onChangeText={(v) => { setCreateForm((p) => ({ ...p, title: v })); if (createErrors.title) setCreateErrors((p) => ({ ...p, title: "" })); }}
                placeholder="Enter announcement title"
                placeholderTextColor="#9CA3AF"
                maxLength={255}
                className={`rounded-xl px-4 py-3 text-sm text-[#2D3A5D] border ${createErrors.title ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"}`}
              />
              {createErrors.title !== "" && <Text className="text-red-500 text-xs mt-1 pl-1">{createErrors.title}</Text>}
              <Text className="text-gray-400 text-xs mt-1 text-right">{createForm.title.length}/255</Text>
            </View>

            {/* Content */}
            <View>
              <Text className="text-[#2D3A5D] text-sm font-semibold mb-2">Description <Text className="text-red-500">*</Text></Text>
              <TextInput
                value={createForm.content}
                onChangeText={(v) => { setCreateForm((p) => ({ ...p, content: v })); if (createErrors.content) setCreateErrors((p) => ({ ...p, content: "" })); }}
                placeholder="Enter announcement content"
                placeholderTextColor="#9CA3AF"
                multiline textAlignVertical="top"
                className={`rounded-xl px-4 py-3 text-sm text-[#2D3A5D] border ${createErrors.content ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"}`}
                style={{ minHeight: 100 }}
              />
              {createErrors.content !== "" && <Text className="text-red-500 text-xs mt-1 pl-1">{createErrors.content}</Text>}
            </View>

            {/* Category */}
            <CategoryPicker
              value={createForm.priority}
              onChange={(v) => { setCreateForm((p) => ({ ...p, priority: v })); if (createErrors.priority) setCreateErrors((p) => ({ ...p, priority: "" })); }}
              error={createErrors.priority}
            />

            {/* Publish Date */}
            <DateField
              label="Publish Date" value={createForm.publish_date}
              onChange={(d) => { setCreateForm((p) => ({ ...p, publish_date: d })); if (createErrors.publish_date) setCreateErrors((p) => ({ ...p, publish_date: "" })); }}
              minimumDate={todayStart()} error={createErrors.publish_date} required
              hint={`Today: ${formatDateObj(todayStart())}`}
            />

            {/* Expiry Date */}
            <DateField
              label="Expiry Date" value={createForm.expiry_date}
              onChange={(d) => { setCreateForm((p) => ({ ...p, expiry_date: d })); if (createErrors.expiry_date) setCreateErrors((p) => ({ ...p, expiry_date: "" })); }}
              minimumDate={tomorrowStart()} error={createErrors.expiry_date}  required
              hint="Must be after today"
            />

            {/* Attachment */}
            <View>
              <Text className="text-[#2D3A5D] text-sm font-semibold mb-2">
                Attachment <Text className="text-gray-400 font-normal">(optional)</Text>
              </Text>
              {attachedFile ? (
                <View className="flex-row items-center justify-between bg-[#FBB017]/10 border border-[#FBB017]/30 rounded-xl px-4 py-3">
                  <View className="flex-row items-center gap-3 flex-1">
                    <File size={16} color="#FBB017" />
                    <Text className="text-[#2D3A5D] text-sm font-medium flex-1" numberOfLines={1}>{attachedFile.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setAttachedFile(null)} className="p-1">
                    <X size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => pickFile(false)}
                  className="flex-row items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-xl py-4"
                >
                  <Paperclip size={18} color="#9CA3AF" />
                  <Text className="text-gray-400 text-sm font-medium">Tap to attach a file</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity onPress={() => setView("list")} className="flex-1 border border-gray-200 py-4 rounded-xl items-center">
                <Text className="text-gray-400 font-bold text-sm">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreate} disabled={createLoading}
                className="flex-1 bg-[#FBB017] py-4 rounded-xl items-center"
                style={{ opacity: createLoading ? 0.7 : 1 }}
              >
                {createLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-bold text-sm">Publish</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Edit View ────────────────────────────────────────────
  if (view === "edit" && editAnn) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA]">
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => setView("list")} className="flex-row items-center gap-2 mb-6">
            <ArrowLeft size={18} color="#9CA3AF" />
            <Text className="text-gray-400 font-bold text-sm">Back</Text>
          </TouchableOpacity>
          <View className="bg-white rounded-2xl p-6 mb-8 gap-5">
            <Text className="text-[#2D3A5D] font-black text-xl">Edit Announcement</Text>

            {/* Title */}
            <View>
              <Text className="text-[#2D3A5D] text-sm font-semibold mb-2">Title <Text className="text-red-500">*</Text></Text>
              <TextInput
                value={editForm.title}
                onChangeText={(v) => { setEditForm((p) => ({ ...p, title: v })); if (editErrors.title) setEditErrors((p) => ({ ...p, title: "" })); }}
                placeholder="Enter announcement title"
                placeholderTextColor="#9CA3AF"
                maxLength={255}
                className={`rounded-xl px-4 py-3 text-sm text-[#2D3A5D] border ${editErrors.title ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"}`}
              />
              {editErrors.title !== "" && <Text className="text-red-500 text-xs mt-1 pl-1">{editErrors.title}</Text>}
              <Text className="text-gray-400 text-xs mt-1 text-right">{editForm.title.length}/255</Text>
            </View>

            {/* Content */}
            <View>
              <Text className="text-[#2D3A5D] text-sm font-semibold mb-2">Description <Text className="text-red-500">*</Text></Text>
              <TextInput
                value={editForm.content}
                onChangeText={(v) => { setEditForm((p) => ({ ...p, content: v })); if (editErrors.content) setEditErrors((p) => ({ ...p, content: "" })); }}
                placeholder="Enter announcement content"
                placeholderTextColor="#9CA3AF"
                multiline textAlignVertical="top"
                className={`rounded-xl px-4 py-3 text-sm text-[#2D3A5D] border ${editErrors.content ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"}`}
                style={{ minHeight: 100 }}
              />
              {editErrors.content !== "" && <Text className="text-red-500 text-xs mt-1 pl-1">{editErrors.content}</Text>}
            </View>

            {/* Category */}
            <CategoryPicker
              value={editForm.priority}
              onChange={(v) => { setEditForm((p) => ({ ...p, priority: v })); if (editErrors.priority) setEditErrors((p) => ({ ...p, priority: "" })); }}
              error={editErrors.priority}
            />

            {/* Publish Date — READ ONLY, cannot be changed */}
            <DateField
              label="Publish Date"
              value={new Date(editAnn.publish_date)}
              onChange={() => {}}
              minimumDate={new Date(editAnn.publish_date)}
              error=""
              disabled
            />

            {/* Expiry Date — editable, must be after today (not today) */}
            <DateField
              label="Expiry Date"
              value={editForm.expiry_date}
              onChange={(d) => { setEditForm((p) => ({ ...p, expiry_date: d })); if (editErrors.expiry_date) setEditErrors((p) => ({ ...p, expiry_date: "" })); }}
              minimumDate={tomorrowStart()} required
              error={editErrors.expiry_date}
              hint="must be after today (not today)"
            />

            {/* Existing attachments */}
            {editAnn.attachments?.length > 0 && (
              <View>
                <Text className="text-[#2D3A5D] text-sm font-semibold mb-2">Existing Attachments</Text>
                {editAnn.attachments.map((att) => (
                  <TouchableOpacity
                    key={att._id}
                    onPress={() => downloadAttachment(att.file_path)}
                    className="flex-row items-center gap-3 bg-[#FBB017]/10 border border-[#FBB017]/20 rounded-xl px-4 py-3 mb-2"
                  >
                    <Paperclip size={14} color="#FBB017" />
                    <Text className="text-[#2D3A5D] text-sm flex-1" numberOfLines={1}>{att.original_name}</Text>
                    <View className="flex-row items-center gap-1">
                      <Download size={12} color="#FBB017" />
                      <Text className="text-[#FBB017] text-[10px] font-bold">Open</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Add new attachment */}
            <View>
              <Text className="text-[#2D3A5D] text-sm font-semibold mb-2">
                Add New Attachment <Text className="text-gray-400 font-normal">(optional)</Text>
              </Text>
              {editNewFile ? (
                <View className="flex-row items-center justify-between bg-[#FBB017]/10 border border-[#FBB017]/30 rounded-xl px-4 py-3">
                  <View className="flex-row items-center gap-3 flex-1">
                    <File size={16} color="#FBB017" />
                    <Text className="text-[#2D3A5D] text-sm font-medium flex-1" numberOfLines={1}>{editNewFile.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setEditNewFile(null)} className="p-1">
                    <X size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => pickFile(true)}
                  className="flex-row items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-xl py-4"
                >
                  <Paperclip size={18} color="#9CA3AF" />
                  <Text className="text-gray-400 text-sm font-medium">Tap to attach a new file</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity onPress={() => setView("list")} className="flex-1 border border-gray-200 py-4 rounded-xl items-center">
                <Text className="text-gray-400 font-bold text-sm">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEditSave} disabled={editLoading}
                className="flex-1 bg-[#FBB017] py-4 rounded-xl items-center"
                style={{ opacity: editLoading ? 0.7 : 1 }}
              >
                {editLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-bold text-sm">Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  
  if (view === "detail" && selected) {
    const sc = STATUS_COLOR[selected.status] ?? STATUS_COLOR.draft;
    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA]">
        <DeleteModal />
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => setView("list")} className="flex-row items-center gap-2 mb-6">
            <ArrowLeft size={18} color="#9CA3AF" />
            <Text className="text-gray-400 font-bold text-sm">Back</Text>
          </TouchableOpacity>

          <View className="flex-row flex-wrap items-center gap-2 mb-4">
            <View className="bg-[#FBB017] px-3 py-1.5 rounded-full">
              <Text className="text-white text-[11px] font-bold">{formatDate(selected.publish_date)}</Text>
            </View>
            <View className="border border-[#FBB017] px-3 py-1 rounded-full">
              <Text className="text-[#FBB017] text-[11px] font-bold">{PRIORITY_LABELS[selected.priority]}</Text>
            </View>
            <View className="px-2 py-1 rounded-full" style={{ backgroundColor: sc.bg }}>
              <Text className="text-xs font-bold capitalize" style={{ color: sc.text }}>{selected.status}</Text>
            </View>
            {selected.expiry_date && (
              <Text className="text-gray-400 text-xs">Expires: {formatDate(selected.expiry_date)}</Text>
            )}
          </View>

          <Text className="text-2xl font-black text-[#2D3A5D] mb-2">{selected.title}</Text>

          {/* Created time */}
          {selected.createdAt && (
            <Text className="text-gray-400 text-xs mb-4">
              Posted: {formatDateTime(selected.createdAt)}
            </Text>
          )}

          <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
            <Text className="text-[#2D3A5D] text-sm leading-relaxed">{selected.content}</Text>
          </View>

          {/* Attachments with download */}
          {selected.attachments?.length > 0 && (
            <AttachmentsList attachments={selected.attachments} />
          )}

          <View className="flex-row gap-3 mb-8">
            <TouchableOpacity
              onPress={() => openEdit(selected)}
              className="flex-1 border border-[#FBB017] py-3 rounded-xl items-center flex-row justify-center gap-2"
            >
              <Pencil size={16} color="#FBB017" />
              <Text className="text-[#FBB017] font-bold text-sm">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setDeleteId(selected._id)}
              className="flex-1 border border-red-400 py-3 rounded-xl items-center flex-row justify-center gap-2"
            >
              <Trash2 size={16} color="#f87171" />
              <Text className="text-red-400 font-bold text-sm">Delete</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}