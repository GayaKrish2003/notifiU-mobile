import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getEventById,DEFAULT_BASE_URL, getToken } from "@notifiu/shared";
import type { Event } from "@notifiu/shared/src/types/auth";
import { ChevronLeft, ChevronDown, Calendar, Clock, Image as ImageIcon, X } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import * as ImagePicker from "expo-image-picker";

type RouteType = RouteProp<RootStackParamList, "EditEvent">;

const CATEGORIES = ["Workshop", "Seminar", "Club Activity", "Sports", "Musical"] as const;
const TYPES      = ["Event", "Workshop"] as const;
const PRIORITIES = ["Normal", "Urgent"] as const;

const InputField = ({
  label, value, onChangeText, placeholder, required = false, multiline = false,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; required?: boolean; multiline?: boolean;
}) => (
  <View className="mb-4">
    <Text className="text-gray-700 text-sm font-semibold mb-2">
      {label} {required && <Text className="text-red-500">*</Text>}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      textAlignVertical={multiline ? "top" : "center"}
      className={`bg-[#F0F2F5] rounded-2xl px-4 py-4 text-sm text-[#2D3A5D] ${multiline ? "min-h-[100px]" : ""}`}
    />
  </View>
);

const DropdownField = ({
  label, value, options, onSelect,
}: {
  label: string; value: string; options: readonly string[];
  onSelect: (v: any) => void;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <View className="mb-4">
      <Text className="text-gray-700 text-sm font-semibold mb-2">{label}</Text>
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        className="bg-[#F0F2F5] rounded-2xl px-4 py-4 flex-row items-center justify-between"
      >
        <Text className="text-[#2D3A5D] text-sm">{value}</Text>
        <ChevronDown size={18} color="#9CA3AF" />
      </TouchableOpacity>
      {open && (
        <View className="bg-white rounded-2xl mt-1 border border-gray-100 overflow-hidden">
          {options.map(opt => (
            <TouchableOpacity
              key={opt}
              onPress={() => { onSelect(opt); setOpen(false); }}
              className={`px-4 py-3 ${value === opt ? "bg-[#FBB017]/10" : ""}`}
            >
              <Text className={`text-sm ${value === opt ? "text-[#FBB017] font-bold" : "text-[#2D3A5D]"}`}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default function EditEventScreen() {
  const navigation = useNavigation();
  const route      = useRoute<RouteType>();
  const { eventId } = route.params;

  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle]                   = useState("");
  const [description, setDescription]       = useState("");
  const [location, setLocation]             = useState("");
  const [organizingClub, setOrganizingClub] = useState("");
  const [category, setCategory]             = useState("Workshop");
  const [type, setType]                     = useState("Event");
  const [priority, setPriority]             = useState("Normal");
  const [seatLimit, setSeatLimit]           = useState("0");
  const [date, setDate]                     = useState(new Date());
  const [time, setTime]                     = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Poster state
  const [existingPoster, setExistingPoster] = useState<string | null>(null);
  const [newPosterUri, setNewPosterUri]     = useState<string | null>(null);
  const [newPosterMime, setNewPosterMime]   = useState("image/jpeg");
  const [newPosterName, setNewPosterName]   = useState("poster.jpg");

  useEffect(() => {
    getEventById(eventId).then(res => {
      const e: Event = res.data.data;
      setTitle(e.title);
      setDescription(e.description);
      setLocation(e.location);
      setOrganizingClub(e.organizingClub);
      setCategory(e.category);
      setType(e.type);
      setPriority(e.priority);
      setSeatLimit(String(e.seatLimit));
      setDate(new Date(e.date));
      // Parse time string "HH:MM" into a Date
      const [h, m] = e.time.split(":").map(Number);
      const t = new Date(); t.setHours(h, m, 0, 0);
      setTime(t);
      setExistingPoster(e.posterImage);
    }).catch(() => {
      Alert.alert("Error", "Failed to load event.");
      navigation.goBack();
    }).finally(() => setLoading(false));
  }, [eventId]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setNewPosterUri(asset.uri);
      setNewPosterMime(asset.mimeType ?? "image/jpeg");
      setNewPosterName(asset.fileName ?? "poster.jpg");
      setExistingPoster(null);
    }
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !location.trim() || !organizingClub.trim()) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const dateStr = date.toISOString().split("T")[0];
      const timeStr = time.toTimeString().slice(0, 5);

      const formData = new FormData();
      formData.append("title",          title);
      formData.append("description",    description);
      formData.append("location",       location);
      formData.append("organizingClub", organizingClub);
      formData.append("category",       category);
      formData.append("type",           type);
      formData.append("priority",       priority);
      formData.append("seatLimit",      seatLimit || "0");
      formData.append("date",           dateStr);
      formData.append("time",           timeStr);

      if (newPosterUri) {
        formData.append("posterImage", {
          uri:  newPosterUri,
          name: newPosterName,
          type: newPosterMime,
        } as any);
      }

      const token = await getToken();
      await fetch(`${DEFAULT_BASE_URL}/events/${eventId}`, {
        method:  "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });

      Alert.alert("Updated!", "Event updated successfully.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update event.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA] items-center justify-center">
        <ActivityIndicator size="large" color="#FBB017" />
      </SafeAreaView>
    );
  }

  const posterToShow = newPosterUri ?? existingPoster;

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-gray-100 p-2 rounded-full self-start mb-4"
          >
            <ChevronLeft size={20} color="#2D3A5D" />
          </TouchableOpacity>
          <Text className="text-2xl font-black text-[#2D3A5D] mb-1">Edit Event</Text>
          <Text className="text-gray-400 text-sm mb-6">Update the event details below.</Text>

          {/* Poster */}
          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-semibold mb-2">
              Event Poster{" "}
              <Text className="text-gray-400 font-normal">(optional)</Text>
            </Text>
            {posterToShow ? (
              <View className="rounded-2xl overflow-hidden">
                <Image
                  source={{ uri: posterToShow }}
                  className="w-full h-48 rounded-2xl"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => { setNewPosterUri(null); setExistingPoster(null); }}
                  className="absolute top-2 right-2 bg-red-500 p-2 rounded-full"
                >
                  <X size={14} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handlePickImage}
                className="bg-[#F0F2F5] rounded-2xl h-40 items-center justify-center border border-dashed border-gray-300"
              >
                <ImageIcon size={28} color="#9CA3AF" />
                <Text className="text-gray-400 text-sm mt-2">Tap to upload poster</Text>
              </TouchableOpacity>
            )}
          </View>

          <InputField label="Event Title"            value={title}          onChangeText={setTitle}          placeholder="e.g. Annual Tech Symposium"  required />
          <InputField label="Description"            value={description}    onChangeText={setDescription}    placeholder="Describe the event..."       required multiline />
          <InputField label="Location / Venue"       value={location}       onChangeText={setLocation}       placeholder="e.g. Main Hall A"            required />
          <InputField label="Organizing Club / Dept" value={organizingClub} onChangeText={setOrganizingClub} placeholder="e.g. IT Club"               required />

          {/* Date */}
          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-semibold mb-2">Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="bg-[#F0F2F5] rounded-2xl px-4 py-4 flex-row items-center gap-3"
            >
              <Calendar size={18} color="#9CA3AF" />
              <Text className="text-[#2D3A5D] text-sm">{formatDate(date)}</Text>
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={date} mode="date" display="default"
              onChange={(_, d) => { setShowDatePicker(false); if (d) setDate(d); }}
            />
          )}

          {/* Time */}
          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-semibold mb-2">Time</Text>
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              className="bg-[#F0F2F5] rounded-2xl px-4 py-4 flex-row items-center gap-3"
            >
              <Clock size={18} color="#9CA3AF" />
              <Text className="text-[#2D3A5D] text-sm">{formatTime(time)}</Text>
            </TouchableOpacity>
          </View>
          {showTimePicker && (
            <DateTimePicker
              value={time} mode="time" display="default"
              onChange={(_, t) => { setShowTimePicker(false); if (t) setTime(t); }}
            />
          )}

          <DropdownField label="Category" value={category} options={CATEGORIES} onSelect={setCategory} />
          <DropdownField label="Type"     value={type}     options={TYPES}      onSelect={setType} />
          <DropdownField label="Priority" value={priority} options={PRIORITIES} onSelect={setPriority} />

          <View className="mb-6">
            <Text className="text-gray-700 text-sm font-semibold mb-2">
              Seat Limit <Text className="text-gray-400 font-normal">(0 = Unlimited)</Text>
            </Text>
            <TextInput
              value={seatLimit}
              onChangeText={setSeatLimit}
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
              className="bg-[#F0F2F5] rounded-2xl px-4 py-4 text-sm text-[#2D3A5D]"
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            className="bg-[#FBB017] rounded-2xl py-4 items-center"
            style={{ opacity: submitting ? 0.7 : 1 }}
          >
            {submitting
              ? <ActivityIndicator color="white" />
              : <Text className="text-white font-black text-base">Save Changes</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}