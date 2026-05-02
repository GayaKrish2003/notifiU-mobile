import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, ArrowRight } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import api from "../../services/api";

type Props = {
  navigation: any;
};

type JwtPayload = {
  id: string;
  role: string;
  exp: number;
};

export default function LecturerModulesScreen({ navigation }: Props) {
  const [modules, setModules] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

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
      const userData = await AsyncStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;

      let loggedInLecturerId = user?._id || user?.id;

      if (!loggedInLecturerId && user?.accessToken) {
        const decoded = jwtDecode<JwtPayload>(user.accessToken);
        loggedInLecturerId = decoded?.id;
      }

      console.log("USER:", user);
      console.log("LOGGED IN ID:", loggedInLecturerId);

      const res = await api.get("/modules");

      const lecturerModules = res.data.filter((m: any) => {
        if (m.archived) return false;

        const moduleLecturerId = m.lecturerId?._id || m.lecturerId || "";

        console.log(
          "MODULE:",
          m.moduleName,
          "MODULE LECTURER ID:",
          moduleLecturerId
        );

        return String(moduleLecturerId) === String(loggedInLecturerId || "");
      });

      setModules(lecturerModules);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to load modules");
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

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
      >
        <Text className="text-xl font-bold text-[#2D3A5D] mb-4">
          My Modules
        </Text>

        <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 mb-3">
          <Search size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search modules..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 py-3.5 px-3 text-sm text-[#2D3A5D]"
          />
        </View>

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

        {filteredModules.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-gray-300 font-bold tracking-widest">
              No modules assigned
            </Text>
          </View>
        ) : (
          <View className="gap-3 pb-8">
            {filteredModules.map((m: any) => (
              <View
                key={m._id}
                className="bg-white rounded-2xl p-4 border border-gray-100"
              >
                <Text className="text-[#2D3A5D] font-bold text-sm">
                  {m.moduleName}
                </Text>

                <Text className="text-gray-400 text-xs mt-1">
                  {m.moduleCode}
                </Text>

                <Text className="text-gray-300 text-[10px] mt-1 font-bold uppercase">
                  {m.semester}
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("LecturerModuleView", {
                      moduleId: m._id,
                    })
                  }
                  className="flex-row items-center gap-2 mt-3 bg-[#1A1C2C] px-4 py-2.5 rounded-xl self-start"
                >
                  <Text className="text-white text-xs font-bold">
                    Open Module
                  </Text>
                  <ArrowRight size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}