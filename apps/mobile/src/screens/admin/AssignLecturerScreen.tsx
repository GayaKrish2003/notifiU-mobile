import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, ChevronDown } from "lucide-react-native";
import api from "../../services/api";

type Props = {
  navigation: any;
};

export default function AssignLecturerScreen({ navigation }: Props) {
  const [modules, setModules] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [moduleId, setModuleId] = useState("");
  const [lecturerId, setLecturerId] = useState("");

  const [moduleModalVisible, setModuleModalVisible] = useState(false);
  const [lecturerModalVisible, setLecturerModalVisible] = useState(false);

  useEffect(() => {
    fetchModules();
    fetchLecturers();
  }, []);

  const fetchModules = async () => {
    try {
      const res = await api.get("/modules", {
        params: { role: "superadmin" },
      });
      setModules(res.data.filter((m: any) => !m.archived));
    } catch {
      Alert.alert("Error", "Failed to load modules");
    }
  };

  const fetchLecturers = async () => {
    try {
      const res = await api.get("/users/lecturers");
      setLecturers(res.data);
    } catch {
      Alert.alert("Error", "Failed to load lecturers");
    }
  };

  const selectedModule = modules.find((m: any) => m._id === moduleId);
  const selectedLecturer = lecturers.find((l: any) => l._id === lecturerId);

  const handleAssign = async () => {
    if (!moduleId || !lecturerId) {
      Alert.alert("Missing Selection", "Please select module and lecturer");
      return;
    }

    try {
      await api.put(`/modules/${moduleId}/assign`, { lecturerId });

      Alert.alert("Success", "Lecturer assigned successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Assignment failed"
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
          Assign Lecturer
        </Text>

        {/* Card */}
        <View className="bg-white rounded-3xl p-5 border border-gray-100">

          {/* Module Select */}
          <View className="mb-4">
            <Text className="text-gray-400 text-[11px] font-black uppercase mb-2">
              Module *
            </Text>

            <TouchableOpacity
              onPress={() => setModuleModalVisible(true)}
              className="flex-row justify-between items-center bg-[#F8F9FA] border border-gray-200 px-4 py-3.5 rounded-2xl"
            >
              <Text className={`${selectedModule ? "text-[#2D3A5D]" : "text-gray-400"} text-sm`}>
                {selectedModule
                  ? `${selectedModule.moduleName} (${selectedModule.moduleCode})`
                  : "Select Module"}
              </Text>

              <ChevronDown size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Lecturer Select */}
          <View className="mb-4">
            <Text className="text-gray-400 text-[11px] font-black uppercase mb-2">
              Lecturer *
            </Text>

            <TouchableOpacity
              onPress={() => setLecturerModalVisible(true)}
              className="flex-row justify-between items-center bg-[#F8F9FA] border border-gray-200 px-4 py-3.5 rounded-2xl"
            >
              <Text className={`${selectedLecturer ? "text-[#2D3A5D]" : "text-gray-400"} text-sm`}>
                {selectedLecturer ? selectedLecturer.name : "Select Lecturer"}
              </Text>

              <ChevronDown size={16} color="#9CA3AF" />
            </TouchableOpacity>
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
              onPress={handleAssign}
              className="flex-1 bg-[#1A1C2C] py-3.5 rounded-2xl items-center"
            >
              <Text className="text-white font-bold text-sm">
                Assign Lecturer
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* MODULE MODAL */}
        <Modal visible={moduleModalVisible} transparent animationType="slide">
          <View className="flex-1 bg-black/40 justify-end">
            <View className="bg-white rounded-t-3xl p-5 max-h-[60%]">
              <Text className="text-center text-[#2D3A5D] font-bold mb-4">
                Select Module
              </Text>

              <ScrollView>
                {modules.map((m: any) => (
                  <TouchableOpacity
                    key={m._id}
                    onPress={() => {
                      setModuleId(m._id);
                      setModuleModalVisible(false);
                    }}
                    className="py-3 border-b border-gray-100"
                  >
                    <Text className="text-[#2D3A5D] text-sm">
                      {m.moduleName} ({m.moduleCode})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                onPress={() => setModuleModalVisible(false)}
                className="mt-4 bg-gray-100 py-3 rounded-2xl items-center"
              >
                <Text className="text-gray-600 font-bold">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* LECTURER MODAL */}
        <Modal visible={lecturerModalVisible} transparent animationType="slide">
          <View className="flex-1 bg-black/40 justify-end">
            <View className="bg-white rounded-t-3xl p-5 max-h-[60%]">
              <Text className="text-center text-[#2D3A5D] font-bold mb-4">
                Select Lecturer
              </Text>

              <ScrollView>
                {lecturers.map((l: any) => (
                  <TouchableOpacity
                    key={l._id}
                    onPress={() => {
                      setLecturerId(l._id);
                      setLecturerModalVisible(false);
                    }}
                    className="py-3 border-b border-gray-100"
                  >
                    <Text className="text-[#2D3A5D] text-sm">{l.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                onPress={() => setLecturerModalVisible(false)}
                className="mt-4 bg-gray-100 py-3 rounded-2xl items-center"
              >
                <Text className="text-gray-600 font-bold">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}