import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,KeyboardAvoidingView, Platform, Keyboard,
  Alert, TextInput, Modal, Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getEventById, rsvpEvent, markAttendance } from "@notifiu/shared";
import type { Event } from "@notifiu/shared/src/types/auth";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import {
  ChevronLeft, Calendar, MapPin, Users, Tag,
  CheckCircle, Clock, AlertCircle
} from "lucide-react-native";

type RouteType = RouteProp<RootStackParamList, "EventDetail">;

const CategoryBadge = ({ label, color }: { label: string; color: string }) => (
  <View className={`px-3 py-1 rounded-full self-start ${color}`}>
    <Text className="text-[10px] font-black uppercase text-white">{label}</Text>
  </View>
);

export default function EventDetailScreen() {
  const navigation = useNavigation();
  const route      = useRoute<RouteType>();
  const { eventId } = route.params;

  const [event, setEvent]       = useState<Event | null>(null);
  const [loading, setLoading]   = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [role, setRole]         = useState<string>("");

  // RSVP modal state
  const [showRsvpModal, setShowRsvpModal]   = useState(false);
  const [contactNumber, setContactNumber]   = useState("");
  const [rsvpLoading, setRsvpLoading]       = useState(false);

  // Attendance state
  const [attendLoading, setAttendLoading]   = useState(false);

  const load = useCallback(async () => {
    try {
      const [eventRes, cached] = await Promise.all([
        getEventById(eventId),
        AsyncStorage.getItem("user"),
      ]);
      setEvent(eventRes.data.data);
      if (cached) {
        const u = JSON.parse(cached);
        setUserData(u);
        setRole(u.role || "student");
        setContactNumber(u.phonenumber || u.phone || "");
      }
    } catch {
      Alert.alert("Error", "Failed to load event.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading || !event) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA] items-center justify-center">
        <ActivityIndicator size="large" color="#FBB017" />
      </SafeAreaView>
    );
  }

  const studentId     = userData?.studentId || userData?._id || "";
  const studentName   = userData?.name || "";
  const alreadyRsvped = event.rsvpList.some(r => r.studentId === studentId);
  const alreadyAttended = event.attendanceList.some(a => a.studentId === studentId);
  const isFullyBooked = event.seatLimit > 0 && event.rsvpList.length >= event.seatLimit;
  const seatsLeft     = event.seatLimit > 0 ? event.seatLimit - event.rsvpList.length : null;

  // Check if attendance window is active
  const now           = new Date();
  const windowStart   = event.startTime ? new Date(new Date(event.startTime).getTime() - 15 * 60 * 1000) : null;
  const windowEnd     = event.endTime   ? new Date(event.endTime) : null;
  const attendanceActive = windowStart && windowEnd
    ? now >= windowStart && now <= windowEnd
    : false;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const handleRsvp = async () => {
    if (!contactNumber.trim() || contactNumber.length !== 10 || !contactNumber.startsWith("07")) {
      Alert.alert("Invalid Number", "Contact number must start with 07 and be 10 digits.");
      return;
    }
    setRsvpLoading(true);
    try {
      await rsvpEvent(eventId, {
        name:          studentName,
        studentId,
        contactNumber,
      });
      setShowRsvpModal(false);
      Alert.alert("Success!", "You're registered for this event.");
      load();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to RSVP.");
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    setAttendLoading(true);
    try {
      await markAttendance(eventId, { studentId });
      Alert.alert("Done!", "Your attendance has been marked.");
      load();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to mark attendance.");
    } finally {
      setAttendLoading(false);
    }
  };

  const canViewAttendees = role === "superadmin" || role === "clubpresident" ||
    (role === "lecturer" && event.type === "Workshop");

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">

      <Modal
  visible={showRsvpModal}
  transparent
  animationType="fade"
  onRequestClose={() => setShowRsvpModal(false)}
>
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    className="flex-1"
  >
    <TouchableOpacity
      className="flex-1 bg-black/40 items-center justify-center px-6"
      activeOpacity={1}
      onPress={() => Keyboard.dismiss()}
    >
      <TouchableOpacity activeOpacity={1} className="bg-white rounded-3xl p-6 w-full">
        <Text className="text-[#2D3A5D] font-black text-lg mb-1">RSVP</Text>
        <Text className="text-[#FBB017] font-black text-xs uppercase tracking-widest mb-5">
          {event.title}
        </Text>

        <Text className="text-gray-500 text-xs font-semibold mb-1">Full Name</Text>
        <View className="bg-green-50 rounded-2xl px-4 py-3 mb-3">
          <Text className="text-green-700 font-bold text-sm">{studentName || "—"}</Text>
        </View>
        <Text className="text-gray-500 text-xs font-semibold mb-1">Student ID</Text>
        <View className="bg-green-50 rounded-2xl px-4 py-3 mb-3">
          <Text className="text-green-700 font-bold text-sm">{studentId || "—"}</Text>
        </View>

        <Text className="text-gray-500 text-xs font-semibold mb-1">
          Contact Number <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          value={contactNumber}
          onChangeText={setContactNumber}
          placeholder="07xxxxxxxx"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          maxLength={10}
          className="bg-[#F0F2F5] rounded-2xl px-4 py-3 text-sm text-[#2D3A5D] mb-5"
        />

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => setShowRsvpModal(false)}
            className="flex-1 border border-gray-200 py-3 rounded-2xl items-center"
          >
            <Text className="text-gray-500 font-bold">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRsvp}
            disabled={rsvpLoading}
            className="flex-1 bg-[#FBB017] py-3 rounded-2xl items-center"
            style={{ opacity: rsvpLoading ? 0.6 : 1 }}
          >
            {rsvpLoading
              ? <ActivityIndicator color="white" size="small" />
              : <Text className="text-white font-bold">Confirm RSVP</Text>
            }
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  </KeyboardAvoidingView>
</Modal>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Poster */}
        {event.posterImage ? (
          <Image
            source={{ uri: event.posterImage }}
            className="w-full h-56"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-44 bg-[#FBB017]/10 items-center justify-center">
            <Text className="text-5xl opacity-20">{event.type === "Workshop" ? "🛠️" : "🎈"}</Text>
          </View>
        )}

        <View className="px-6 py-5">
          {/* Back button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-gray-100 p-2 rounded-full self-start mb-4"
          >
            <ChevronLeft size={20} color="#2D3A5D" />
          </TouchableOpacity>

          {/* Badges */}
          <View className="flex-row flex-wrap gap-2 mb-3">
            <CategoryBadge label={event.type}     color="bg-[#FBB017]" />
            <CategoryBadge label={event.category} color="bg-[#2D3A5D]" />
            {event.priority === "Urgent" && (
              <CategoryBadge label="🔴 Urgent" color="bg-red-500" />
            )}
            {event.status === "History" && (
              <CategoryBadge label="Past Event" color="bg-gray-400" />
            )}
          </View>

          <Text className="text-[#2D3A5D] font-black text-2xl mb-4">{event.title}</Text>

          {/* Meta */}
          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
            {[
              { icon: <Calendar size={14} color="#FBB017" />, text: formatDate(event.date) },
              { icon: <Clock    size={14} color="#FBB017" />, text: `${event.time} (ends ~2hrs later)` },
              { icon: <MapPin   size={14} color="#FBB017" />, text: event.location },
              { icon: <Tag      size={14} color="#FBB017" />, text: event.organizingClub },
              { icon: <Users    size={14} color="#FBB017" />, text: event.seatLimit > 0
                  ? `${event.rsvpList.length} / ${event.seatLimit} attending`
                  : `${event.rsvpList.length} attending (unlimited)` },
            ].map(({ icon, text }, i) => (
              <View key={i} className="flex-row items-center gap-3 py-2 border-b border-gray-50">
                {icon}
                <Text className="text-[#2D3A5D] text-sm font-medium flex-1">{text}</Text>
              </View>
            ))}
          </View>

          {/* Seats left badge */}
          {event.seatLimit > 0 && event.status === "Upcoming" && (
            <View className={`px-4 py-2 rounded-xl self-start mb-4 ${isFullyBooked ? "bg-red-50" : "bg-green-50"}`}>
              <Text className={`text-xs font-black ${isFullyBooked ? "text-red-500" : "text-green-600"}`}>
                {isFullyBooked ? "🔴 Fully Booked" : `🟢 ${seatsLeft} seats left`}
              </Text>
            </View>
          )}

          {/* Description */}
          <Text className="text-gray-500 text-sm leading-relaxed mb-5">{event.description}</Text>

          {/* Student Actions */}
          {role === "student" && event.status === "Upcoming" && (
            <View className="gap-3 mb-5">
              {/* RSVP button */}
              {alreadyRsvped ? (
                <View className="bg-green-50 border border-green-200 rounded-2xl py-4 items-center flex-row justify-center gap-2">
                  <CheckCircle size={16} color="#10B981" />
                  <Text className="text-green-600 font-black">You're Registered</Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setShowRsvpModal(true)}
                  disabled={isFullyBooked}
                  className="bg-[#FBB017] rounded-2xl py-4 items-center"
                  style={{ opacity: isFullyBooked ? 0.5 : 1 }}
                >
                  <Text className="text-white font-black">
                    {isFullyBooked ? "Fully Booked" : "RSVP Now"}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Attendance button */}
              {alreadyRsvped && (
                alreadyAttended ? (
                  <View className="bg-green-50 border border-green-200 rounded-2xl py-4 items-center flex-row justify-center gap-2">
                    <CheckCircle size={16} color="#10B981" />
                    <Text className="text-green-600 font-black">Attendance Marked</Text>
                  </View>
                ) : attendanceActive ? (
                  <TouchableOpacity
                    onPress={handleMarkAttendance}
                    disabled={attendLoading}
                    className="bg-[#1A1C2C] rounded-2xl py-4 items-center"
                    style={{ opacity: attendLoading ? 0.6 : 1 }}
                  >
                    {attendLoading
                      ? <ActivityIndicator color="white" size="small" />
                      : <Text className="text-white font-black">Mark Attendance</Text>
                    }
                  </TouchableOpacity>
                ) : (
                  <View className="bg-gray-50 border border-gray-200 rounded-2xl py-4 items-center flex-row justify-center gap-2">
                    <AlertCircle size={14} color="#9CA3AF" />
                    <Text className="text-gray-400 font-bold text-sm">
                      Attendance opens 15 min before event
                    </Text>
                  </View>
                )
              )}
            </View>
          )}

          {/* Attendee list — admin, club president, lecturer (workshops only) */}
          {canViewAttendees && event.rsvpList.length > 0 && (
            <View className="mb-6">
              <Text className="text-[#FBB017] font-black text-xs uppercase tracking-widest mb-3">
                Registered Students ({event.rsvpList.length})
              </Text>
              {event.rsvpList.map((r, i) => {
                const attended = event.attendanceList.some(
                  a => String(a.studentId) === String(r.studentId)
                );
                return (
                  <View key={i} className="bg-white rounded-2xl px-4 py-3 mb-2 border border-gray-100 flex-row items-center justify-between">
                    <View>
                      <Text className="text-[#2D3A5D] font-bold text-sm">{r.name || "—"}</Text>
                      <Text className="text-gray-400 text-xs">{r.studentId} · {r.contactNumber}</Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${attended ? "bg-green-100" : "bg-gray-100"}`}>
                      <Text className={`text-[10px] font-black uppercase ${attended ? "text-green-700" : "text-gray-400"}`}>
                        {attended ? "Attended" : "Absent"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}