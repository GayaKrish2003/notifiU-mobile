import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { createJobPost, DEFAULT_BASE_URL } from "@notifiu/shared";
import { getToken } from "@notifiu/shared";
import { ChevronDown, Calendar, Paperclip, X, FileText } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";

const JOB_TYPES = ["full-time", "part-time", "internship", "remote"] as const;
type JobType = typeof JOB_TYPES[number];

interface PickedFile {
  uri:  string;
  name: string;
  size?: number;
  mimeType?: string;
}

const InputField = ({
  label, value, onChangeText, placeholder, required = false,
  multiline = false, keyboardType = "default" as any
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; required?: boolean; multiline?: boolean; keyboardType?: any;
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
      keyboardType={keyboardType}
      numberOfLines={multiline ? 4 : 1}
      textAlignVertical={multiline ? "top" : "center"}
      className={`bg-[#F0F2F5] rounded-2xl px-4 py-4 text-sm text-[#2D3A5D] ${multiline ? "min-h-[100px]" : ""}`}
    />
  </View>
);

function formatBytes(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function JobProviderCreateScreen() {
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobType, setJobType]         = useState<JobType>("internship");
  const [location, setLocation]       = useState("");
  const [skills, setSkills]           = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [applicationLink, setApplicationLink] = useState("");
  const [deadline, setDeadline]       = useState(new Date());
  const [showDatePicker, setShowDatePicker]     = useState(false);
  const [showJobTypeDropdown, setShowJobTypeDropdown] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [pickedFile, setPickedFile]   = useState<PickedFile | null>(null);

  // ── PDF Picker ───────────────────────────────────────────────
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setPickedFile({
        uri:      file.uri,
        name:     file.name,
        size:     file.size,
        mimeType: file.mimeType ?? "application/pdf",
      });
    } catch {
      Alert.alert("Error", "Failed to pick file.");
    }
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !companyName.trim() || !applicationLink.trim()) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    if (!applicationLink.startsWith("http://") && !applicationLink.startsWith("https://")) {
      Alert.alert("Invalid URL", "Application link must start with http:// or https://");
      return;
    }
    if (deadline <= new Date()) {
      Alert.alert("Invalid Deadline", "Deadline must be a future date.");
      return;
    }

    setSubmitting(true);
    try {
      const skillsArray = skills.split(",").map(s => s.trim()).filter(Boolean);

      // Build FormData so we can attach the PDF alongside text fields
      const formData = new FormData();
      formData.append("title",           title);
      formData.append("description",     description);
      formData.append("companyName",     companyName);
      formData.append("jobType",         jobType);
      formData.append("location",        location);
      formData.append("salaryRange",     salaryRange);
      formData.append("applicationLink", applicationLink);
      formData.append("deadline",        deadline.toISOString());
      skillsArray.forEach(s => formData.append("skills[]", s));

      if (pickedFile) {
        formData.append("attachment", {
          uri:  pickedFile.uri,
          name: pickedFile.name,
          type: pickedFile.mimeType ?? "application/pdf",
        } as any);
      }

      // Get token for auth header
      const token = await getToken();

      await fetch(`${DEFAULT_BASE_URL}/jobs`, {
        method:  "POST",
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      Alert.alert(
        "Success!",
        "Your job post has been submitted for admin approval.",
        [{ text: "OK", onPress: resetForm }]
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create job post.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setCompanyName("");
    setJobType("internship"); setLocation(""); setSkills("");
    setSalaryRange(""); setApplicationLink("");
    setDeadline(new Date()); setPickedFile(null);
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

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
          <Text className="text-2xl font-black text-[#2D3A5D] mb-1">Post a Job</Text>
          <Text className="text-gray-400 text-sm mb-6">
            Fill in the details below. Your post will be reviewed by the admin before going live.
          </Text>

          <InputField label="Job Title"    value={title}       onChangeText={setTitle}       placeholder="e.g. Frontend Developer Intern" required />
          <InputField label="Company Name" value={companyName} onChangeText={setCompanyName} placeholder="e.g. TechCorp Pvt Ltd"           required />
          <InputField label="Description"  value={description} onChangeText={setDescription} placeholder="Describe the role and responsibilities..." required multiline />

          {/* Job Type Dropdown */}
          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-semibold mb-2">
              Job Type <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowJobTypeDropdown(!showJobTypeDropdown)}
              className="bg-[#F0F2F5] rounded-2xl px-4 py-4 flex-row items-center justify-between"
            >
              <Text className="text-[#2D3A5D] text-sm capitalize">{jobType}</Text>
              <ChevronDown size={18} color="#9CA3AF" />
            </TouchableOpacity>
            {showJobTypeDropdown && (
              <View className="bg-white rounded-2xl mt-1 border border-gray-100 overflow-hidden">
                {JOB_TYPES.map(type => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => { setJobType(type); setShowJobTypeDropdown(false); }}
                    className={`px-4 py-3 ${jobType === type ? "bg-[#FBB017]/10" : ""}`}
                  >
                    <Text className={`text-sm capitalize ${jobType === type ? "text-[#FBB017] font-bold" : "text-[#2D3A5D]"}`}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <InputField label="Location"          value={location}        onChangeText={setLocation}        placeholder="e.g. Colombo, Sri Lanka" />
          <InputField label="Skills Required"   value={skills}          onChangeText={setSkills}          placeholder="e.g. React, Node.js, MongoDB" />
          <Text className="text-gray-400 text-xs -mt-3 mb-4">Separate with commas</Text>
          <InputField label="Salary Range"      value={salaryRange}     onChangeText={setSalaryRange}     placeholder="e.g. LKR 50,000 - 80,000" />
          <InputField label="Application Link"  value={applicationLink} onChangeText={setApplicationLink} placeholder="https://company.com/apply" required />

          {/* Deadline Picker */}
          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-semibold mb-2">
              Application Deadline <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="bg-[#F0F2F5] rounded-2xl px-4 py-4 flex-row items-center gap-3"
            >
              <Calendar size={18} color="#9CA3AF" />
              <Text className="text-[#2D3A5D] text-sm">
                {deadline.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={deadline}
              mode="date"
              minimumDate={minDate}
              display="default"
              onChange={(_, selected) => {
                setShowDatePicker(false);
                if (selected) setDeadline(selected);
              }}
            />
          )}

          {/* PDF Attachment */}
          <View className="mb-6">
            <Text className="text-gray-700 text-sm font-semibold mb-2">
              Job Description PDF{" "}
              <Text className="text-gray-400 font-normal">(optional)</Text>
            </Text>

            {pickedFile ? (
              // Show picked file with remove button
              <View className="bg-[#FBB017]/10 border border-[#FBB017]/30 rounded-2xl px-4 py-3 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <FileText size={18} color="#FBB017" />
                  <View className="flex-1">
                    <Text className="text-[#2D3A5D] text-sm font-bold" numberOfLines={1}>
                      {pickedFile.name}
                    </Text>
                    {pickedFile.size ? (
                      <Text className="text-gray-400 text-xs mt-0.5">
                        {formatBytes(pickedFile.size)}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setPickedFile(null)}
                  className="bg-red-50 p-2 rounded-full ml-2"
                >
                  <X size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              // Show pick button
              <TouchableOpacity
                onPress={handlePickFile}
                className="bg-[#F0F2F5] rounded-2xl px-4 py-4 flex-row items-center gap-3 border border-dashed border-gray-300"
              >
                <Paperclip size={18} color="#9CA3AF" />
                <Text className="text-gray-400 text-sm">Tap to attach a PDF</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            className="bg-[#FBB017] rounded-2xl py-4 items-center"
            style={{ opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-black text-base">Submit for Approval</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}