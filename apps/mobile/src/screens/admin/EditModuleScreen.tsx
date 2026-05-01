import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, BookOpen, Layers3, CalendarDays } from "lucide-react-native";
import api from "../../services/api";

type Props = {
  route: any;
  navigation: any;
};

export default function EditModuleScreen({ route, navigation }: Props) {
  const { moduleId } = route.params;

  const [moduleName, setModuleName] = useState("");
  const [moduleCode, setModuleCode] = useState("");
  const [semester, setSemester] = useState("");
  const [academicYear, setAcademicYear] = useState("");

  useEffect(() => {
    fetchModule();
  }, []);

  const fetchModule = async () => {
    try {
      const res = await api.get(`/modules/${moduleId}`);
      const m = res.data;

      setModuleName(m.moduleName || "");
      setModuleCode(m.moduleCode || "");
      setSemester(m.semester || "");
      setAcademicYear(m.academicYear || "");
    } catch {
      Alert.alert("Error", "Failed to load module");
    }
  };

  const handleUpdate = async () => {
    const trimmedModuleCode = moduleCode.trim().toUpperCase();
    const trimmedModuleName = moduleName.trim();
    const trimmedAcademicYear = academicYear.trim();

    if (!trimmedModuleName || !trimmedModuleCode || !semester || !trimmedAcademicYear) {
      Alert.alert("Missing Fields", "Please fill all required fields");
      return;
    }

    const moduleCodePattern = /^[A-Z]{2,}\d{3,}$/;
    if (!moduleCodePattern.test(trimmedModuleCode)) {
      Alert.alert("Invalid Module Code", "Use format like SE2030");
      return;
    }

    const academicYearPattern = /^(\d{4}|\d{4}\/\d{4})$/;
    if (!academicYearPattern.test(trimmedAcademicYear)) {
      Alert.alert("Invalid Academic Year", "Use format like 2025 or 2025/2026");
      return;
    }

    try {
      await api.put(`/modules/${moduleId}`, {
        moduleName: trimmedModuleName,
        moduleCode: trimmedModuleCode,
        semester,
        academicYear: trimmedAcademicYear,
      });

      Alert.alert("Success", "Module updated successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Update failed"
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>

        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="flex-row items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl mb-4 self-start"
        >
          <ArrowLeft size={16} color="#2D3A5D" />
          <Text className="text-[#2D3A5D] font-bold text-sm">Back</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text className="text-xl font-bold text-[#2D3A5D] mb-5">
          Edit Module
        </Text>

        {/* Card */}
        <View className="bg-white rounded-3xl p-5 border border-gray-100">

          {/* Module Name */}
          <View className="mb-4">
            <Text className="text-gray-400 text-[11px] font-black uppercase mb-2">
              Module Name *
            </Text>

            <View className="flex-row items-center bg-[#F8F9FA] border border-gray-200 rounded-2xl px-4">
              <Layers3 size={16} color="#9CA3AF" />
              <TextInput
                value={moduleName}
                onChangeText={setModuleName}
                placeholder="Enter module name"
                placeholderTextColor="#9CA3AF"
                className="flex-1 py-3.5 px-3 text-sm text-[#2D3A5D]"
              />
            </View>
          </View>

          {/* Module Code */}
          <View className="mb-4">
            <Text className="text-gray-400 text-[11px] font-black uppercase mb-2">
              Module Code *
            </Text>

            <View className="flex-row items-center bg-[#F8F9FA] border border-gray-200 rounded-2xl px-4">
              <BookOpen size={16} color="#9CA3AF" />
              <TextInput
                value={moduleCode}
                onChangeText={(text) => setModuleCode(text.toUpperCase())}
                placeholder="e.g. SE2030"
                placeholderTextColor="#9CA3AF"
                className="flex-1 py-3.5 px-3 text-sm text-[#2D3A5D]"
              />
            </View>
          </View>

          {/* Semester */}
          <View className="mb-4">
            <Text className="text-gray-400 text-[11px] font-black uppercase mb-2">
              Semester *
            </Text>

            <View className="flex-row items-center bg-[#F8F9FA] border border-gray-200 rounded-2xl px-4">
              <CalendarDays size={16} color="#9CA3AF" />
              <TextInput
                value={semester}
                onChangeText={setSemester}
                placeholder="e.g. Year 1 Semester 1"
                placeholderTextColor="#9CA3AF"
                className="flex-1 py-3.5 px-3 text-sm text-[#2D3A5D]"
              />
            </View>
          </View>

          {/* Academic Year */}
          <View className="mb-2">
            <Text className="text-gray-400 text-[11px] font-black uppercase mb-2">
              Academic Year *
            </Text>

            <View className="flex-row items-center bg-[#F8F9FA] border border-gray-200 rounded-2xl px-4">
              <CalendarDays size={16} color="#9CA3AF" />
              <TextInput
                value={academicYear}
                onChangeText={setAcademicYear}
                placeholder="e.g. 2025"
                placeholderTextColor="#9CA3AF"
                className="flex-1 py-3.5 px-3 text-sm text-[#2D3A5D]"
              />
            </View>
          </View>

          {/* Buttons */}
          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="flex-1 bg-gray-100 py-3.5 rounded-2xl items-center border border-gray-200"
            >
              <Text className="text-gray-600 font-bold text-sm">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleUpdate}
              className="flex-1 bg-[#1A1C2C] py-3.5 rounded-2xl items-center"
            >
              <Text className="text-white font-bold text-sm">Update</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}