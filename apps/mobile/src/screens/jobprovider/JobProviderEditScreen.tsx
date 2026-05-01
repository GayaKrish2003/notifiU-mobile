import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getMyJobPosts, updateJobPost } from "@notifiu/shared";
import type { JobPost } from "@notifiu/shared/src/types/auth";
import { ChevronDown, Calendar, ChevronLeft } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/RootNavigator";

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RoutePropType = RouteProp<RootStackParamList, "EditJobPost">;

const JOB_TYPES = ["full-time", "part-time", "internship", "remote"] as const;
type JobType = typeof JOB_TYPES[number];

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

export default function JobProviderEditScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { jobId } = route.params;

  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);

  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [companyName, setCompanyName]   = useState("");
  const [jobType, setJobType]           = useState<JobType>("internship");
  const [location, setLocation]         = useState("");
  const [skills, setSkills]             = useState("");
  const [salaryRange, setSalaryRange]   = useState("");
  const [applicationLink, setApplicationLink] = useState("");
  const [deadline, setDeadline]         = useState(new Date());
  const [showDatePicker, setShowDatePicker]   = useState(false);
  const [showJobTypeDropdown, setShowJobTypeDropdown] = useState(false);

  // Load existing post data to pre-fill the form
  useEffect(() => {
    getMyJobPosts().then(res => {
      const posts: JobPost[] = res.data.data || [];
      const post = posts.find(p => p._id === jobId);
      if (!post) {
        Alert.alert("Error", "Post not found.");
        navigation.goBack();
        return;
      }
      setTitle(post.title);
      setDescription(post.description);
      setCompanyName(post.companyName);
      setJobType(post.jobType);
      setLocation(post.location);
      setSkills(post.skills.join(", "));
      setSalaryRange(post.salaryRange);
      setApplicationLink(post.applicationLink);
      setDeadline(new Date(post.deadline));
    }).catch(() => {
      Alert.alert("Error", "Failed to load post.");
      navigation.goBack();
    }).finally(() => setLoading(false));
  }, [jobId]);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !companyName.trim() || !applicationLink.trim()) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    if (!applicationLink.startsWith("http://") && !applicationLink.startsWith("https://")) {
      Alert.alert("Invalid URL", "Application link must start with http:// or https://");
      return;
    }

    setSubmitting(true);
    try {
      const skillsArray = skills.split(",").map(s => s.trim()).filter(Boolean);
      await updateJobPost(jobId, {
        title,
        description,
        companyName,
        jobType,
        location,
        skills: skillsArray,
        salaryRange,
        applicationLink,
        deadline: deadline.toISOString(),
      });
      Alert.alert(
        "Updated!",
        "Your post has been updated and re-submitted for admin approval.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to update post.");
    } finally {
      setSubmitting(false);
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA] items-center justify-center">
        <ActivityIndicator size="large" color="#FBB017" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
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

          <Text className="text-2xl font-black text-[#2D3A5D] mb-1">Edit Job Post</Text>
          <Text className="text-gray-400 text-sm mb-6">
            Changes will reset the post to pending and require re-approval.
          </Text>

          <InputField label="Job Title"    value={title}       onChangeText={setTitle}       placeholder="e.g. Frontend Developer Intern" required />
          <InputField label="Company Name" value={companyName} onChangeText={setCompanyName} placeholder="e.g. TechCorp Pvt Ltd"           required />
          <InputField label="Description"  value={description} onChangeText={setDescription} placeholder="Describe the role..."            required multiline />

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

          <InputField label="Location"         value={location}         onChangeText={setLocation}         placeholder="e.g. Colombo, Sri Lanka" />
          <InputField label="Skills Required"  value={skills}           onChangeText={setSkills}           placeholder="e.g. React, Node.js, MongoDB" />
          <Text className="text-gray-400 text-xs -mt-3 mb-4">Separate with commas</Text>
          <InputField label="Salary Range"     value={salaryRange}      onChangeText={setSalaryRange}      placeholder="e.g. LKR 50,000 - 80,000" />
          <InputField label="Application Link" value={applicationLink}  onChangeText={setApplicationLink}  placeholder="https://company.com/apply" required />

          {/* Deadline Picker */}
          <View className="mb-6">
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
              <Text className="text-white font-black text-base">Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}