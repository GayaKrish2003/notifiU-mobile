import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Search, ArrowRight, Plus } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import api from "../../services/api";

type JwtPayload = {
  id: string;
  role: string;
  exp: number;
};

export default function StudentModulesScreen({ navigation }: any) {
  const [modules, setModules] = useState<any[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [user, setUser] = useState<any>(null);

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

  const loadUser = async () => {
    try {
      const data = await AsyncStorage.getItem("user");

      if (data) {
        const parsedUser = JSON.parse(data);

        let resolvedId = parsedUser?._id || parsedUser?.id;

        if (!resolvedId && parsedUser?.accessToken) {
          const decoded = jwtDecode<JwtPayload>(parsedUser.accessToken);
          resolvedId = decoded?.id;
        }

        const finalUser = {
          ...parsedUser,
          resolvedId,
        };

        console.log("STUDENT USER:", finalUser);
        setUser(finalUser);
      }
    } catch (err) {
      console.log("USER LOAD ERROR:", err);
      Alert.alert("Error", "Failed to load user");
    }
  };

  const fetchData = async (currentUser: any) => {
    try {
      console.log("STUDENT ID:", currentUser?.resolvedId);

      const modulesRes = await api.get("/modules");
      const enrollmentsRes = await api.get("/my-enrollments", {
        params: { studentId: currentUser?.resolvedId },
      });

      console.log("MODULES RESPONSE:", modulesRes.data);
      console.log("ENROLLMENTS RESPONSE:", enrollmentsRes.data);

      setModules((modulesRes.data || []).filter((m: any) => !m.archived));
      setMyEnrollments(enrollmentsRes.data || []);
    } catch (err: any) {
      console.log("FETCH ERROR:", err);
      console.log("FETCH ERROR RESPONSE:", err?.response?.data);
      Alert.alert("Error", "Failed to load modules");
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData(user);
    }
  }, [user]);

  const isEnrolled = (moduleId: string) => {
    return myEnrollments.some(
      (e: any) => String(e.moduleId) === String(moduleId)
    );
  };

  const handleEnroll = async (id: string) => {
    try {
      await api.post(`/modules/${id}/enroll`, {
        studentId: user?.resolvedId,
        studentName: user?.name,
      });

      Alert.alert("Success", "You enrolled successfully");
      fetchData(user);
    } catch (err: any) {
      console.log("ENROLL ERROR:", err?.response?.data || err);
      Alert.alert(
        "Enroll Failed",
        err?.response?.data?.message || "Enroll failed"
      );
    }
  };

  const filteredModules = modules
    .filter((m: any) => {
      if (!search) return true;

      return (
        String(m.moduleName || "").toLowerCase().includes(search.toLowerCase()) ||
        String(m.moduleCode || "").toLowerCase().includes(search.toLowerCase())
      );
    })
    .filter((m: any) => {
      if (!semesterFilter) return true;

      return (
        String(m.semester || "").trim().toLowerCase() ===
        String(semesterFilter).trim().toLowerCase()
      );
    });

  console.log("MODULES STATE:", modules);
  console.log("ENROLLMENTS STATE:", myEnrollments);
  console.log("FILTERED MODULES:", filteredModules);
  console.log("SELECTED FILTER:", semesterFilter);

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#2D3A5D", fontSize: 14, fontWeight: "600" }}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: "#2D3A5D",
            marginBottom: 16,
          }}
        >
          Modules
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#E5E7EB",
            borderRadius: 16,
            paddingHorizontal: 16,
            marginBottom: 12,
          }}
        >
          <Search size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search modules..."
            placeholderTextColor="#9CA3AF"
            style={{
              flex: 1,
              paddingVertical: 14,
              paddingHorizontal: 12,
              fontSize: 14,
              color: "#2D3A5D",
            }}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 16 }}
        >
          <TouchableOpacity
            onPress={() => setSemesterFilter("")}
            style={{
              marginRight: 8,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: semesterFilter === "" ? "#1A1C2C" : "#E5E7EB",
              backgroundColor: semesterFilter === "" ? "#1A1C2C" : "#FFFFFF",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: semesterFilter === "" ? "#FFFFFF" : "#2D3A5D",
              }}
            >
              All
            </Text>
          </TouchableOpacity>

          {semesters.map((sem) => (
            <TouchableOpacity
              key={sem}
              onPress={() => setSemesterFilter(sem)}
              style={{
                marginRight: 8,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: semesterFilter === sem ? "#1A1C2C" : "#E5E7EB",
                backgroundColor: semesterFilter === sem ? "#1A1C2C" : "#FFFFFF",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: semesterFilter === sem ? "#FFFFFF" : "#2D3A5D",
                }}
              >
                {sem}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredModules.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 64 }}>
            <Text
              style={{
                color: "#9CA3AF",
                fontWeight: "700",
                letterSpacing: 1,
              }}
            >
              No modules found
            </Text>
          </View>
        ) : (
          filteredModules.map((m: any) => (
            <View
              key={m._id}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "#F3F4F6",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: "#2D3A5D",
                  fontWeight: "700",
                  fontSize: 14,
                }}
              >
                {m.moduleName}
              </Text>

              <Text
                style={{
                  color: "#9CA3AF",
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                {m.moduleCode}
              </Text>

              <Text
                style={{
                  color: "#D1D5DB",
                  fontSize: 10,
                  marginTop: 4,
                  fontWeight: "700",
                  textTransform: "uppercase",
                }}
              >
                {m.semester}
              </Text>

              {isEnrolled(m._id) ? (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("StudentModuleView", {
                      moduleId: m._id,
                    })
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    alignSelf: "flex-start",
                    backgroundColor: "#1A1C2C",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    marginTop: 12,
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: "700",
                      marginRight: 8,
                    }}
                  >
                    Open Module
                  </Text>
                  <ArrowRight size={14} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => handleEnroll(m._id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    alignSelf: "flex-start",
                    backgroundColor: "#FBB017",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    marginTop: 12,
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: "700",
                      marginRight: 8,
                    }}
                  >
                    Enroll
                  </Text>
                  <Plus size={14} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}