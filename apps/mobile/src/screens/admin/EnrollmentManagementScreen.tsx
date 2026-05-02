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
import { ArrowLeft, Search, Trash2 } from "lucide-react-native";
import api from "../../services/api";

type Props = {
  navigation: any;
  route: any;
};

export default function EnrollmentManagementScreen({ navigation, route }: Props) {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const moduleId = route?.params?.moduleId;

  useEffect(() => {
    fetchEnrollments();
  }, [moduleId]);

  const fetchEnrollments = async () => {
    try {
      const res = await api.get("/enrollments");
      const allEnrollments = res.data || [];

      const filteredByModule = moduleId
        ? allEnrollments.filter((e: any) => String(e.moduleId) === String(moduleId))
        : allEnrollments;

      setEnrollments(filteredByModule);
    } catch (err) {
      Alert.alert("Error", "Failed to load enrollments");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/enrollments/${id}`);
      Alert.alert("Success", "Enrollment deleted successfully");
      fetchEnrollments();
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to delete enrollment"
      );
    }
  };

  const filtered = enrollments.filter((e: any) =>
    String(e.studentId || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="flex-row items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl mb-4 self-start"
        >
          <ArrowLeft size={16} color="#2D3A5D" />
          <Text className="text-[#2D3A5D] font-bold text-sm">Back</Text>
        </TouchableOpacity>

        <Text className="text-xl font-bold text-[#2D3A5D] mb-4">
          Enrollment Management
        </Text>

        <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 mb-4">
          <Search size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by Student ID..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 py-3.5 px-3 text-sm text-[#2D3A5D]"
          />
        </View>

        {filtered.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-gray-300 font-bold tracking-widest">
              No enrollments found
            </Text>
          </View>
        ) : (
          <View className="gap-3 pb-8">
            {filtered.map((e: any) => (
              <View
                key={e._id}
                className="bg-white rounded-2xl p-4 border border-gray-100"
              >
                <View className="flex-row justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-[#2D3A5D] font-bold text-sm">
                      {e.studentName}
                    </Text>

                    <Text className="text-gray-400 text-xs mt-1">
                      ID: {String(e.studentId)}
                    </Text>

                    <Text className="text-gray-300 text-[10px] mt-1 font-bold uppercase">
                      {e.moduleCode}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                  <TouchableOpacity
                    onPress={() => handleDelete(e._id)}
                    className="flex-row items-center gap-1 ml-auto"
                  >
                    <Trash2 size={13} color="#f87171" />
                    <Text className="text-red-400 text-xs">Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}