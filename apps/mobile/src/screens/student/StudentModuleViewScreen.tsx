import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import { ArrowLeft, FileText, Download } from "lucide-react-native";
import api from "../../services/api";

export default function StudentModuleViewScreen({ route, navigation }: any) {
  const { moduleId } = route.params;

  const [moduleData, setModuleData] = useState<any>(null);

  const fetchModule = async () => {
    try {
      const res = await api.get(`/modules/${moduleId}`);
      setModuleData(res.data);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to load module");
    }
  };

  useEffect(() => {
    fetchModule();
  }, []);

  const openFile = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open file");
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to open file");
    }
  };

  if (!moduleData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#E5E7EB",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 16,
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={16} color="#2D3A5D" />
          <Text
            style={{
              color: "#2D3A5D",
              fontWeight: "700",
              fontSize: 14,
              marginLeft: 8,
            }}
          >
            Back
          </Text>
        </TouchableOpacity>

        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "900",
              color: "#2D3A5D",
            }}
          >
            {moduleData.moduleName}
          </Text>
          <Text
            style={{
              color: "#9CA3AF",
              fontSize: 14,
              marginTop: 4,
            }}
          >
            {moduleData.moduleCode}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            padding: 20,
            borderWidth: 1,
            borderColor: "#F3F4F6",
          }}
        >
          <Text
            style={{
              color: "#2D3A5D",
              fontWeight: "900",
              fontSize: 16,
              marginBottom: 16,
            }}
          >
            Lecture Materials
          </Text>

          {moduleData.files?.length > 0 ? (
            moduleData.files.map((file: any, index: number) => (
              <View
                key={index}
                style={{
                  backgroundColor: "#F8F9FA",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      backgroundColor: "#FFF4D6",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <FileText size={16} color="#FBB017" />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: "#2D3A5D",
                        fontWeight: "700",
                        fontSize: 14,
                      }}
                    >
                      {file.displayName}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => openFile(file.url)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    alignSelf: "flex-start",
                    backgroundColor: "#1A1C2C",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                  }}
                >
                  <Download size={14} color="#FFFFFF" />
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: "700",
                      marginLeft: 8,
                    }}
                  >
                    Open / Download
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <Text
                style={{
                  color: "#D1D5DB",
                  fontWeight: "700",
                  letterSpacing: 1,
                }}
              >
                No files available
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}