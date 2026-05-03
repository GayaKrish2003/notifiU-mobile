import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Search, Pencil, Archive, Trash2 } from "lucide-react-native";
import api from "../../services/api";

type Props = {
  navigation: any;
};

export default function ModuleDashboardScreen({ navigation }: Props) {
  const [modules, setModules] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const semesters = [
    "Year 1 Semester 1",
    "Year 1 Semester 2",
    "Year 2 Semester 1",
    "Year 2 Semester 2",
    "Year 3 Semester 1",
    "Year 3 Semester 2",
    "Year 4 Semester 1",
    "Year 4 Semester 2",
  ];

  const fetchModules = async () => {
    try {
      setLoading(true);

      const res = await api.get("/modules", {
        params: { role: "superadmin" },
      });

      setModules(res.data);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to load modules");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchModules();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchModules();
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Delete Module", "Are you sure you want to delete this module?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/modules/${id}`);
            Alert.alert("Success", "Module deleted successfully");
            fetchModules();
          } catch (err: any) {
            Alert.alert(
              "Error",
              err?.response?.data?.message || "Failed to delete module"
            );
          }
        },
      },
    ]);
  };

  const handleArchive = async (id: string, isArchived: boolean) => {
    try {
      await api.put(`/modules/archive/${id}`);
      Alert.alert(
        "Success",
        isArchived ? "Module unarchived successfully" : "Module archived successfully"
      );
      fetchModules();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Action failed");
    }
  };

  const filteredModules = modules
    .filter((m: any) => {
      if (!search) return true;
      return (
        m.moduleName?.toLowerCase().includes(search.toLowerCase()) ||
        m.moduleCode?.toLowerCase().includes(search.toLowerCase())
      );
    })
    .filter((m: any) => {
      if (!semesterFilter) return true;
      return m.semester === semesterFilter;
    });

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <ScrollView
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FBB017"
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-[#2D3A5D]">
            Module Management
          </Text>
          <View className="bg-[#1A1C2C] px-3 py-1.5 rounded-xl">
            <Text className="text-[#FBB017] text-xs font-black">
              {filteredModules.length} total
            </Text>
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 mb-3">
          <Search size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by module name or code..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 py-3.5 px-3 text-sm text-[#2D3A5D]"
          />
        </View>

        {/* Semester Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          <TouchableOpacity
            onPress={() => setSemesterFilter("")}
            className={`mr-2 px-4 py-2 rounded-full border ${
              semesterFilter === ""
                ? "bg-[#1A1C2C] border-[#1A1C2C]"
                : "bg-white border-gray-200"
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                semesterFilter === "" ? "text-white" : "text-[#2D3A5D]"
              }`}
            >
              All
            </Text>
          </TouchableOpacity>

          {semesters.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setSemesterFilter(item)}
              className={`mr-2 px-4 py-2 rounded-full border ${
                semesterFilter === item
                  ? "bg-[#1A1C2C] border-[#1A1C2C]"
                  : "bg-white border-gray-200"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  semesterFilter === item ? "text-white" : "text-[#2D3A5D]"
                }`}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Top Action Buttons */}
        <View className="flex-row flex-wrap gap-2 mb-5">
          <TouchableOpacity
            onPress={() => navigation.navigate("CreateModule")}
            className="bg-[#1A1C2C] px-4 py-3 rounded-2xl"
          >
            <Text className="text-white font-bold text-xs">+ Create Module</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("AssignLecturer")}
            className="bg-[#FBB017] px-4 py-3 rounded-2xl"
          >
            <Text className="text-white font-bold text-xs">Assign Lecturer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Enrollments")}
            className="bg-[#FBB017] px-4 py-3 rounded-2xl"
          >
            <Text className="text-white font-bold text-xs">Enrollments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Reports")}
            className="bg-[#FBB017] px-4 py-3 rounded-2xl"
          >
            <Text className="text-white font-bold text-xs">Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Loading */}
        {loading && <ActivityIndicator color="#FBB017" className="mt-10" />}

        {/* Module List */}
        {!loading && (
          <View className="gap-3 pb-8">
            {filteredModules.map((m: any) => (
              <View
                key={m._id}
                className="bg-white rounded-2xl p-4 border border-gray-100"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text
                      className="text-[#2D3A5D] font-bold text-sm"
                      numberOfLines={1}
                    >
                      {m.moduleName}
                    </Text>
                    <Text
                      className="text-gray-400 text-xs mt-0.5"
                      numberOfLines={1}
                    >
                      {m.moduleCode}
                    </Text>
                    <Text className="text-gray-300 text-[10px] mt-1 font-bold uppercase">
                      {m.semester}
                    </Text>
                  </View>

                  {m.archived && (
                    <View className="px-2 py-1 rounded-full bg-red-50">
                      <Text className="text-red-400 text-[10px] font-bold">
                        Archived
                      </Text>
                    </View>
                  )}
                </View>

                <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("EditModule", { moduleId: m._id })
                    }
                    className="flex-row items-center gap-1"
                  >
                    <Pencil size={13} color="#3B82F6" />
                    <Text className="text-blue-500 text-xs">Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleArchive(m._id, m.archived)}
                    className="flex-row items-center gap-1"
                  >
                    <Archive size={13} color="#FBB017" />
                    <Text className="text-[#FBB017] text-xs">
                      {m.archived ? "Unarchive" : "Archive"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDelete(m._id)}
                    className="flex-row items-center gap-1 ml-auto"
                  >
                    <Trash2 size={13} color="#f87171" />
                    <Text className="text-red-400 text-xs">Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {filteredModules.length === 0 && (
              <View className="items-center py-16">
                <Text className="text-gray-300 font-bold tracking-widest">
                  No modules found.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}