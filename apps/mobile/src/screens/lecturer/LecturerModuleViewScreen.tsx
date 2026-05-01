import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  FileText,
  Pencil,
  Trash2,
  Upload,
  X,
  ArrowRight,
  FolderOpen,
} from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import api from "../../services/api";

export default function LecturerModuleViewScreen({ route, navigation }: any) {
  const { moduleId } = route.params;

  const [moduleData, setModuleData] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [editingStoredName, setEditingStoredName] = useState<string | null>(null);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    try {
      const moduleRes = await api.get(`/modules/${moduleId}`);
      const enrollRes = await api.get("/lecturer/enrollments", {
        params: { moduleId },
      });

      setModuleData(moduleRes.data);
      setEnrollments(enrollRes.data);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to load module");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
        type: "*/*",
      });

      if (!result.canceled) {
        console.log("SELECTED FILES:", result.assets);
        setSelectedFiles(result.assets || []);
      }
    } catch (err) {
      console.log("PICK ERROR:", err);
      Alert.alert("Error", "Failed to choose files");
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert("No Files Selected", "Please choose files before uploading");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      selectedFiles.forEach((file: any, index: number) => {
        console.log("FILE ITEM:", file);

        if (Platform.OS === "web") {
          if (file.file) {
            formData.append("files", file.file, file.name || `file-${index}`);
          } else {
            throw new Error("Web file object missing");
          }
        } else {
          formData.append("files", {
            uri: file.uri,
            name: file.name || `file-${index}`,
            type: file.mimeType || "application/octet-stream",
          } as any);
        }
      });

      const res = await api.post(`/modules/${moduleId}/upload`, formData);

      console.log("UPLOAD SUCCESS:", res.data);
      Alert.alert("Success", "Files uploaded successfully");
      setSelectedFiles([]);
      fetchData();
    } catch (err: any) {
      console.log("UPLOAD ERROR FULL:", err);
      console.log("UPLOAD RESPONSE:", err?.response?.data);
      console.log("UPLOAD STATUS:", err?.response?.status);
      console.log("UPLOAD MESSAGE:", err?.message);

      Alert.alert(
        "Upload Failed",
        err?.response?.data?.message || err?.message || "Upload failed"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleCancelSelection = () => {
    setSelectedFiles([]);
  };

  const handleRemoveFile = async (storedName: string) => {
    try {
      await api.delete(`/modules/${moduleId}/file`, {
        data: { storedName },
      });

      Alert.alert("Success", "File removed successfully");
      fetchData();
    } catch (err: any) {
      console.log(err);
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to remove file"
      );
    }
  };

  const startRename = (file: any) => {
    setEditingStoredName(file.storedName);
    setNewDisplayName(file.displayName);
  };

  const cancelRename = () => {
    setEditingStoredName(null);
    setNewDisplayName("");
  };

  const saveRename = async (storedName: string) => {
    if (!newDisplayName.trim()) {
      Alert.alert("Invalid Name", "Please enter a file name");
      return;
    }

    try {
      await api.put(`/modules/${moduleId}/file/rename`, {
        storedName,
        displayName: newDisplayName.trim(),
      });

      Alert.alert("Success", "File name updated successfully");
      setEditingStoredName(null);
      setNewDisplayName("");
      fetchData();
    } catch (err: any) {
      console.log(err);
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to rename file"
      );
    }
  };

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
      <SafeAreaView className="flex-1 bg-[#F8F9FA]">
        <View className="flex-1 items-center justify-center">
          <Text className="text-[#2D3A5D] text-sm font-semibold">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <ScrollView
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="self-start flex-row items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl mb-4"
        >
          <ArrowLeft size={16} color="#2D3A5D" />
          <Text className="text-[#2D3A5D] font-bold text-sm">Back</Text>
        </TouchableOpacity>

        <View className="mb-5">
          <Text className="text-2xl font-black text-[#2D3A5D]">
            {moduleData.moduleName}
          </Text>
          <Text className="text-gray-400 text-sm mt-1">
            {moduleData.moduleCode}
          </Text>
        </View>

        <View className="bg-white rounded-3xl p-5 border border-gray-100 mb-4">
          <Text className="text-[#2D3A5D] font-black text-base mb-4">
            Lecture Materials
          </Text>

          {moduleData.files?.length > 0 ? (
            moduleData.files.map((file: any, index: number) => (
              <View
                key={index}
                className="bg-[#F8F9FA] border border-gray-200 rounded-2xl p-4 mb-3"
              >
                {editingStoredName === file.storedName ? (
                  <>
                    <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 mb-3">
                      <Pencil size={16} color="#9CA3AF" />
                      <TextInput
                        value={newDisplayName}
                        onChangeText={setNewDisplayName}
                        placeholder="Enter new file name"
                        placeholderTextColor="#9CA3AF"
                        className="flex-1 py-3 px-3 text-sm text-[#2D3A5D]"
                      />
                    </View>

                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => saveRename(file.storedName)}
                        className="bg-[#1A1C2C] px-4 py-2.5 rounded-xl"
                      >
                        <Text className="text-white text-xs font-bold">Save</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={cancelRename}
                        className="bg-gray-100 border border-gray-200 px-4 py-2.5 rounded-xl"
                      >
                        <Text className="text-gray-600 text-xs font-bold">Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <View className="flex-row items-start gap-3 mb-3">
                      <View className="w-9 h-9 rounded-full bg-[#FBB017]/15 items-center justify-center">
                        <FileText size={16} color="#FBB017" />
                      </View>

                      <View className="flex-1">
                        <Text className="text-[#2D3A5D] font-bold text-sm">
                          {file.displayName}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row flex-wrap gap-2">
                      <TouchableOpacity
                        onPress={() => openFile(file.url)}
                        className="flex-row items-center gap-1 bg-[#1A1C2C] px-3 py-2 rounded-xl"
                      >
                        <FolderOpen size={13} color="#fff" />
                        <Text className="text-white text-xs font-bold">Open</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => startRename(file)}
                        className="flex-row items-center gap-1 bg-[#FBB017] px-3 py-2 rounded-xl"
                      >
                        <Pencil size={13} color="#fff" />
                        <Text className="text-white text-xs font-bold">Rename</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleRemoveFile(file.storedName)}
                        className="flex-row items-center gap-1 bg-red-50 border border-red-100 px-3 py-2 rounded-xl"
                      >
                        <Trash2 size={13} color="#ef4444" />
                        <Text className="text-red-500 text-xs font-bold">Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            ))
          ) : (
            <View className="items-center py-6">
              <Text className="text-gray-300 font-bold tracking-widest">
                No files uploaded
              </Text>
            </View>
          )}
        </View>

        <View className="bg-white rounded-3xl p-5 border border-gray-100 mb-4">
          <Text className="text-[#2D3A5D] font-black text-base mb-4">
            Upload New File
          </Text>

          <TouchableOpacity
            onPress={pickFiles}
            className="flex-row items-center justify-center gap-2 bg-white border border-gray-200 py-3.5 rounded-2xl mb-3"
          >
            <Upload size={16} color="#2D3A5D" />
            <Text className="text-[#2D3A5D] font-bold text-sm">Choose Files</Text>
          </TouchableOpacity>

          <Text className="text-gray-400 text-sm mb-2">
            {selectedFiles.length > 0
              ? `${selectedFiles.length} file(s) selected`
              : "No file chosen"}
          </Text>

          {selectedFiles.length > 0 &&
            selectedFiles.map((file: any, index: number) => (
              <View
                key={index}
                className="flex-row items-center gap-2 mb-2 bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2"
              >
                <FileText size={14} color="#9CA3AF" />
                <Text className="flex-1 text-[#2D3A5D] text-xs" numberOfLines={1}>
                  {file.name}
                </Text>
              </View>
            ))}

          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              onPress={handleUpload}
              disabled={uploading}
              className="flex-1 bg-[#1A1C2C] py-3.5 rounded-2xl items-center"
            >
              <Text className="text-white font-bold text-sm">
                {uploading ? "Uploading..." : "Upload"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCancelSelection}
              className="flex-1 bg-gray-100 border border-gray-200 py-3.5 rounded-2xl items-center"
            >
              <Text className="text-gray-600 font-bold text-sm">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="bg-white rounded-3xl p-5 border border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-[#2D3A5D] font-black text-base">
              Students Enrolled
            </Text>
            <View className="bg-[#1A1C2C] px-3 py-1.5 rounded-xl">
              <Text className="text-[#FBB017] text-xs font-black">
                {enrollments.length} total
              </Text>
            </View>
          </View>

          {enrollments.length > 0 ? (
            enrollments.slice(0, 5).map((e: any) => (
              <View
                key={e._id}
                className="bg-[#F8F9FA] border border-gray-200 rounded-2xl p-4 mb-3"
              >
                <Text className="text-[#2D3A5D] font-bold text-sm">
                  {e.studentName}
                </Text>
                <Text className="text-gray-400 text-xs mt-1">
                  Student ID: {e.studentId}
                </Text>
                <Text className="text-gray-300 text-[10px] mt-1 font-bold uppercase">
                  {e.moduleCode}
                </Text>
              </View>
            ))
          ) : (
            <View className="items-center py-6">
              <Text className="text-gray-300 font-bold tracking-widest">
                No students enrolled
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => navigation.navigate("EnrollmentManagement", { moduleId })}
            className="flex-row items-center justify-center gap-2 bg-[#1A1C2C] py-3.5 rounded-2xl mt-2"
          >
            <Text className="text-white font-bold text-sm">
              View Full Enrollments
            </Text>
            <ArrowRight size={15} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}