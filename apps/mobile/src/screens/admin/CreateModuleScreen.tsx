import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, BookOpen, CalendarDays, Layers3 } from "lucide-react-native";
import api from "../../services/api";

type Props = {
  navigation: any;
};

export default function CreateModuleScreen({ navigation }: Props) {
  const [moduleCode, setModuleCode] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [semester, setSemester] = useState("");
  const [academicYear, setAcademicYear] = useState("");

  const handleSubmit = async () => {
    const trimmedModuleCode = moduleCode.trim().toUpperCase();
    const trimmedModuleName = moduleName.trim();
    const trimmedAcademicYear = academicYear.trim();

    if (!trimmedModuleCode || !trimmedModuleName || !semester || !trimmedAcademicYear) {
      Alert.alert("Missing Fields", "Please fill all required fields");
      return;
    }

    const moduleCodePattern = /^[A-Z]{2,}\d{3,}$/;
    if (!moduleCodePattern.test(trimmedModuleCode)) {
      Alert.alert("Invalid Module Code", "Module code should look like SE2030 or IT1102");
      return;
    }

    const academicYearPattern = /^(\d{4}|\d{4}\/\d{4})$/;
    if (!academicYearPattern.test(trimmedAcademicYear)) {
      Alert.alert("Invalid Academic Year", "Use format like 2025 or 2025/2026");
      return;
    }

    try {
      console.log("CREATE PAYLOAD:", {
        moduleCode: trimmedModuleCode,
        moduleName: trimmedModuleName,
        semester,
        academicYear: trimmedAcademicYear,
      });

      await api.post("/modules", {
        moduleCode: trimmedModuleCode,
        moduleName: trimmedModuleName,
        semester,
        academicYear: trimmedAcademicYear,
      });

      Alert.alert("Success", "Module created successfully", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.log("CREATE ERROR:", error);
      console.log("CREATE RESPONSE:", error?.response?.data);

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          JSON.stringify(error?.response?.data) ||
          "Failed to create module"
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <ScrollView
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="self-start flex-row items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl mb-4"
        >
          <ArrowLeft size={16} color="#2D3A5D" />
          <Text className="text-[#2D3A5D] font-bold text-sm">Back</Text>
        </TouchableOpacity>

        <View className="mb-5">
          <Text className="text-2xl font-black text-[#2D3A5D]">Create Module</Text>
          <Text className="text-gray-400 text-sm mt-1">
            Add a new module to the system
          </Text>
        </View>

        <View className="bg-white rounded-3xl p-5 border border-gray-100">
          <View className="mb-4">
            <Text className="text-gray-400 text-[11px] font-black uppercase tracking-widest mb-2">
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

          <View className="mb-4">
            <Text className="text-gray-400 text-[11px] font-black uppercase tracking-widest mb-2">
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

          <View className="mb-4">
            <Text className="text-gray-400 text-[11px] font-black uppercase tracking-widest mb-2">
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

          <View className="mb-2">
            <Text className="text-gray-400 text-[11px] font-black uppercase tracking-widest mb-2">
              Academic Year *
            </Text>
            <View className="flex-row items-center bg-[#F8F9FA] border border-gray-200 rounded-2xl px-4">
              <CalendarDays size={16} color="#9CA3AF" />
              <TextInput
                value={academicYear}
                onChangeText={setAcademicYear}
                placeholder="e.g. 2026"
                placeholderTextColor="#9CA3AF"
                className="flex-1 py-3.5 px-3 text-sm text-[#2D3A5D]"
              />
            </View>
          </View>

          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="flex-1 bg-gray-100 py-3.5 rounded-2xl items-center border border-gray-200"
            >
              <Text className="text-gray-600 font-bold text-sm">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              className="flex-1 bg-[#1A1C2C] py-3.5 rounded-2xl items-center"
            >
              <Text className="text-white font-bold text-sm">Save Module</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}