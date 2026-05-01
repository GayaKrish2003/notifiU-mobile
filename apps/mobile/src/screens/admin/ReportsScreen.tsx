import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Download, Eye } from "lucide-react-native";
import api from "../../services/api";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export default function ReportsScreen({ navigation }: any) {
  const [workload, setWorkload] = useState<any[]>([]);
  const [semesterReport, setSemesterReport] = useState<any[]>([]);

  const [showAllWorkload, setShowAllWorkload] = useState(false);
  const [showAllSemester, setShowAllSemester] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const workloadRes = await api.get("/reports/workload");
      const semesterRes = await api.get("/reports/semester");

      setWorkload(workloadRes.data);
      setSemesterReport(semesterRes.data);
    } catch {
      Alert.alert("Error", "Failed to load reports");
    }
  };

  const displayedWorkload = showAllWorkload ? workload : workload.slice(0, 5);
  const displayedSemester = showAllSemester
    ? semesterReport
    : semesterReport.slice(0, 5);

  const exportCSV = async (rows: string[][], fileName: string) => {
    try {
      const csvContent = rows.map((row) => row.join(",")).join("\n");
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Saved", `File saved to:\n${fileUri}`);
      }
    } catch {
      Alert.alert("Error", "Failed to export report");
    }
  };

  const handleExportWorkload = async () => {
    const csvRows = [
      ["Lecturer Name", "Module ID", "Module Name", "Semester"],
      ...workload.map((row) => [
        row.lecturerName,
        row.moduleCode,
        row.moduleName,
        row.semester,
      ]),
    ];

    await exportCSV(csvRows, "lecturer_workload_report.csv");
  };

  const handleExportSemester = async () => {
    const csvRows = [
      ["Semester", "Module Name", "Module ID"],
      ...semesterReport.map((row) => [
        row.semester,
        row.moduleName,
        row.moduleCode,
      ]),
    ];

    await exportCSV(csvRows, "semester_module_report.csv");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>

        {/* Back */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="flex-row items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl mb-4 self-start"
        >
          <ArrowLeft size={16} color="#2D3A5D" />
          <Text className="text-[#2D3A5D] font-bold text-sm">Back</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text className="text-xl font-bold text-[#2D3A5D] mb-4">
          Reports
        </Text>

        {/* WORKLOAD */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">

          {/* Header */}
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-[#2D3A5D] font-bold">
              Lecturer Workload
            </Text>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setShowAllWorkload(!showAllWorkload)}
                className="flex-row items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-xl"
              >
                <Eye size={12} color="#2D3A5D" />
                <Text className="text-xs font-bold text-[#2D3A5D]">
                  {showAllWorkload ? "Hide" : "View"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleExportWorkload}
                className="flex-row items-center gap-1 bg-[#FBB017] px-3 py-1.5 rounded-xl"
              >
                <Download size={12} color="#fff" />
                <Text className="text-xs font-bold text-white">
                  Export
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {displayedWorkload.map((item, index) => (
            <View key={index} className="border-b border-gray-100 pb-3 mb-3">
              <Text className="text-[#2D3A5D] font-bold text-sm">
                {item.lecturerName}
              </Text>

              <Text className="text-gray-400 text-xs mt-1">
                {item.moduleName} ({item.moduleCode})
              </Text>

              <Text className="text-gray-300 text-[10px] mt-1 font-bold uppercase">
                {item.semester}
              </Text>
            </View>
          ))}

          <Text className="text-gray-300 text-xs text-center mt-2">
            Showing {displayedWorkload.length} of {workload.length}
          </Text>
        </View>

        {/* SEMESTER */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-6">

          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-[#2D3A5D] font-bold">
              Semester Modules
            </Text>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setShowAllSemester(!showAllSemester)}
                className="flex-row items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-xl"
              >
                <Eye size={12} color="#2D3A5D" />
                <Text className="text-xs font-bold text-[#2D3A5D]">
                  {showAllSemester ? "Hide" : "View"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleExportSemester}
                className="flex-row items-center gap-1 bg-[#FBB017] px-3 py-1.5 rounded-xl"
              >
                <Download size={12} color="#fff" />
                <Text className="text-xs font-bold text-white">
                  Export
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {displayedSemester.map((item, index) => (
            <View key={index} className="border-b border-gray-100 pb-3 mb-3">
              <Text className="text-[#2D3A5D] font-bold text-sm">
                {item.semester}
              </Text>

              <Text className="text-gray-400 text-xs mt-1">
                {item.moduleName} ({item.moduleCode})
              </Text>
            </View>
          ))}

          <Text className="text-gray-300 text-xs text-center mt-2">
            Showing {displayedSemester.length} of {semesterReport.length}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}