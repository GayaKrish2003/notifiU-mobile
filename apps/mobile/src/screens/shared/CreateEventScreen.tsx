import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { createEvent, BASE_URL, getToken } from "@notifiu/shared";
import { ChevronLeft, ChevronDown, Calendar, Clock, Image as ImageIcon, X } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

const CATEGORIES = ["Workshop", "Seminar", "Club Activity", "Sports", "Musical"] as const;
const TYPES      = ["Event", "Workshop"] as const;
const PRIORITIES = ["Normal", "Urgent"] as const;

type Category = typeof CATEGORIES[number];
type EventType = typeof TYPES[number];
type Priority  = typeof PRIORITIES[number];

const InputField = ({
  label, value, onChangeText, placeholder,
  required = false, multiline = false,
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
  label, value, options, onSelect, required = false,
}: {
  label: string; value: string; options: readonly string[];
  onSelect: (v: any) => void; required?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <View className="mb-4">
      <Text className="text-gray-700 text-sm font-semibold mb-2">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>
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

export default function CreateEventScreen() {
  const navigation = useNavigation();

  const [title, setTitle]                   = useState("");
  const [description, setDescription]       = useState("");
  const [location, setLocation]             = useState("");
  const [organizingClub, setOrganizingClub] = useState("");
  const [category, setCategory]             = useState<Category>("Workshop");
  const [type, setType]                     = useState<EventType>("Event");
  const [priority, setPriority]             = useState<Priority>("Normal");
  const [seatLimit, setSeatLimit]           = useState("0");
  const [date, setDate]                     = useState(new Date());
  const [time, setTime]                     = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [posterUri, setPosterUri]           = useState<string | null>(null);
  const [posterMime, setPosterMime]         = useState<string>("image/jpeg");
  const [posterName, setPosterName]         = useState<string>("poster.jpg");

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
      setPosterUri(asset.uri);
      setPosterMime(asset.mimeType ?? "image/jpeg");
      setPosterName(asset.fileName ?? "poster.jpg");
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
      const timeStr = time.toTimeString().slice(0, 5); // HH:MM

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

      if (posterUri) {
        formData.append("posterImage", {
          uri:  posterUri,
          name: posterName,
          type: posterMime,
        } as any);
      }

      const token = await getToken();
      await fetch(`${BASE_URL}/events`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });

      Alert.alert("Success!", "Event created successfully.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create event.");
    } finally {
      setSubmitting(false);
    }
  };

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
          {/* Header */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-gray-100 p-2 rounded-full self-start mb-4"
          >
            <ChevronLeft size={20} color="#2D3A5D" />
          </TouchableOpacity>
          <Text className="text-2xl font-black text-[#2D3A5D] mb-1">Create Event</Text>
          <Text className="text-gray-400 text-sm mb-6">
            Fill in the details below to post a new event.
          </Text>

          {/* Poster Image */}
          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-semibold mb-2">
              Event Poster{" "}
              <Text className="text-gray-400 font-normal">(optional)</Text>
            </Text>
            {posterUri ? (
              <View className="rounded-2xl overflow-hidden">
                <Image
                  source={{ uri: posterUri }}
                  className="w-full h-48 rounded-2xl"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setPosterUri(null)}
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
                <Text className="text-gray-300 text-xs mt-1">Recommended: 16:9 ratio</Text>
              </TouchableOpacity>
            )}
          </View>

          <InputField label="Event Title"             value={title}          onChangeText={setTitle}          placeholder="e.g. Annual Tech Symposium"    required />
          <InputField label="Description"             value={description}    onChangeText={setDescription}    placeholder="Describe the event..."         required multiline />
          <InputField label="Location / Venue"        value={location}       onChangeText={setLocation}       placeholder="e.g. Main Hall A"              required />
          <InputField label="Organizing Club / Dept"  value={organizingClub} onChangeText={setOrganizingClub} placeholder="e.g. IT Club"                  required />

          {/* Date Picker */}
          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-semibold mb-2">
              Date <Text className="text-red-500">*</Text>
            </Text>
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
              value={date}
              mode="date"
              minimumDate={new Date()}
              display="default"
              onChange={(_, d) => { setShowDatePicker(false); if (d) setDate(d); }}
            />
          )}

          {/* Time Picker */}
          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-semibold mb-2">
              Time <Text className="text-red-500">*</Text>
            </Text>
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
              value={time}
              mode="time"
              display="default"
              onChange={(_, t) => { setShowTimePicker(false); if (t) setTime(t); }}
            />
          )}

          <DropdownField label="Category" value={category} options={CATEGORIES} onSelect={setCategory} required />
          <DropdownField label="Type"     value={type}     options={TYPES}      onSelect={setType} />
          <DropdownField label="Priority" value={priority} options={PRIORITIES} onSelect={setPriority} />

          {/* Seat Limit */}
          <View className="mb-6">
            <Text className="text-gray-700 text-sm font-semibold mb-2">
              Seat Limit{" "}
              <Text className="text-gray-400 font-normal">(0 = Unlimited)</Text>
            </Text>
            <TextInput
              value={seatLimit}
              onChangeText={setSeatLimit}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              className="bg-[#F0F2F5] rounded-2xl px-4 py-4 text-sm text-[#2D3A5D]"
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            className="bg-[#FBB017] rounded-2xl py-4 items-center"
            style={{ opacity: submitting ? 0.7 : 1 }}
          >
            {submitting
              ? <ActivityIndicator color="white" />
              : <Text className="text-white font-black text-base">Create Event</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}