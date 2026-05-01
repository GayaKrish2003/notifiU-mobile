import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Image, ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { getEvents, deleteEvent } from "@notifiu/shared";
import type { Event } from "@notifiu/shared/src/types/auth";
import {
  Plus, Trash2, Eye, Calendar,
  MapPin, Users, AlertCircle
} from "lucide-react-native";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

type TabType = "Upcoming" | "History";

export default function AdminEventsScreen() {
  const navigation = useNavigation<NavProp>();

  const [events, setEvents]         = useState<Event[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab]   = useState<TabType>("Upcoming");
  const [stats, setStats]           = useState({
    total: 0, upcoming: 0, history: 0, urgent: 0,
  });

  const fetchEvents = useCallback(async () => {
    try {
      // Fetch both for stats, filtered for list
      const [upcomingRes, historyRes] = await Promise.all([
        getEvents({ status: "Upcoming" }),
        getEvents({ status: "History" }),
      ]);
      const upcoming: Event[] = upcomingRes.data.data || [];
      const history:  Event[] = historyRes.data.data  || [];
      const all = [...upcoming, ...history];

      setStats({
        total:    all.length,
        upcoming: upcoming.length,
        history:  history.length,
        urgent:   all.filter(e => e.priority === "Urgent").length,
      });

      setEvents(activeTab === "Upcoming" ? upcoming : history);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useFocusEffect(useCallback(() => { fetchEvents(); }, [fetchEvents]));

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      "Delete Event",
      `Are you sure you want to delete "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteEvent(id);
              fetchEvents();
            } catch {
              Alert.alert("Error", "Failed to delete event.");
            }
          },
        },
      ]
    );
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric"
    });

  const renderEvent = ({ item }: { item: Event }) => {
    const attended = item.attendanceList.length;
    const rsvped   = item.rsvpList.length;
    const rate     = rsvped > 0 ? Math.round((attended / rsvped) * 100) : 0;

    return (
      <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
        <View className="flex-row gap-3">
          {/* Poster thumbnail */}
          {item.posterImage ? (
            <Image
              source={{ uri: item.posterImage }}
              className="w-16 h-16 rounded-xl"
              resizeMode="cover"
            />
          ) : (
            <View className="w-16 h-16 rounded-xl bg-[#FBB017]/10 items-center justify-center">
              <Text className="text-2xl opacity-20">
                {item.type === "Workshop" ? "🛠️" : "🎈"}
              </Text>
            </View>
          )}

          <View className="flex-1">
            {/* Badges */}
            <View className="flex-row flex-wrap gap-1.5 mb-1">
              <View className="bg-[#FBB017] px-2 py-0.5 rounded-full">
                <Text className="text-white text-[9px] font-black uppercase">{item.type}</Text>
              </View>
              <View className="bg-[#1A1C2C] px-2 py-0.5 rounded-full">
                <Text className="text-white text-[9px] font-black uppercase">{item.category}</Text>
              </View>
              {item.priority === "Urgent" && (
                <View className="bg-red-100 px-2 py-0.5 rounded-full">
                  <Text className="text-red-600 text-[9px] font-black">🔴 Urgent</Text>
                </View>
              )}
            </View>

            <Text className="text-[#2D3A5D] font-bold text-sm mb-1" numberOfLines={1}>
              {item.title}
            </Text>
            <View className="flex-row items-center gap-1 mb-0.5">
              <Calendar size={10} color="#9CA3AF" />
              <Text className="text-gray-400 text-xs">
                {formatDate(item.date)} · {item.time}
              </Text>
            </View>
            <View className="flex-row items-center gap-1 mb-0.5">
              <MapPin size={10} color="#9CA3AF" />
              <Text className="text-gray-400 text-xs" numberOfLines={1}>
                {item.location}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Users size={10} color="#9CA3AF" />
              <Text className="text-gray-400 text-xs">
                {rsvped}{item.seatLimit > 0 ? ` / ${item.seatLimit}` : ""} RSVPs
                {activeTab === "History" && ` · ${attended} attended (${rate}%)`}
              </Text>
            </View>
          </View>
        </View>

        {/* Creator info */}
        <View className="mt-2 mb-3">
          <Text className="text-gray-300 text-[10px]">
            By: {item.creatorRole} · {item.organizingClub}
          </Text>
        </View>

        {/* Actions */}
        <View className="flex-row gap-2 pt-3 border-t border-gray-100">
          <TouchableOpacity
            onPress={() => navigation.navigate("EventDetail", { eventId: item._id })}
            className="flex-1 bg-[#1A1C2C] py-2 rounded-xl items-center flex-row justify-center gap-1"
          >
            <Eye size={13} color="white" />
            <Text className="text-white text-xs font-black">View</Text>
          </TouchableOpacity>
          {activeTab === "Upcoming" && (
            <TouchableOpacity
              onPress={() => navigation.navigate("EditEvent", { eventId: item._id })}
              className="flex-1 bg-[#FBB017]/10 py-2 rounded-xl items-center"
            >
              <Text className="text-[#FBB017] text-xs font-black">Edit</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => handleDelete(item._id, item.title)}
            className="flex-1 bg-red-50 py-2 rounded-xl items-center flex-row justify-center gap-1"
          >
            <Trash2 size={13} color="#EF4444" />
            <Text className="text-red-500 text-xs font-black">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      {/* Header */}
      <View className="px-6 pt-4 pb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-black text-[#2D3A5D]">Events</Text>
          <Text className="text-gray-400 text-sm">
            {activeTab === "Upcoming" ? stats.upcoming : stats.history} {activeTab.toLowerCase()}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("CreateEvent")}
          className="bg-[#FBB017] px-4 py-2.5 rounded-xl flex-row items-center gap-2"
        >
          <Plus size={16} color="white" />
          <Text className="text-white font-black text-sm">Create</Text>
        </TouchableOpacity>
      </View>

      {/* Stats tiles */}
      <View className="flex-row px-6 gap-3 mb-4">
        {[
          { label: "Total",    value: stats.total,    bg: "bg-[#1A1C2C]", text: "text-white",      sub: "text-white/50"      },
          { label: "Upcoming", value: stats.upcoming,  bg: "bg-[#FBB017]", text: "text-[#2D3A5D]", sub: "text-[#2D3A5D]/60"  },
          { label: "Past",     value: stats.history,   bg: "bg-gray-200",  text: "text-[#2D3A5D]", sub: "text-[#2D3A5D]/50"  },
          { label: "Urgent",   value: stats.urgent,    bg: "bg-red-500",   text: "text-white",      sub: "text-white/70"      },
        ].map(({ label, value, bg, text, sub }) => (
          <View key={label} className={`flex-1 ${bg} rounded-2xl p-3`}>
            <Text className={`${text} font-black text-lg`}>{value}</Text>
            <Text className={`${sub} text-[8px] font-bold uppercase tracking-widest mt-0.5`}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View className="px-6 mb-4">
        <View className="flex-row bg-[#F0F2F5] p-1 rounded-2xl">
          {(["Upcoming", "History"] as TabType[]).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => { setActiveTab(tab); setLoading(true); }}
              className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === tab ? "bg-white" : ""}`}
            >
              <Text className={`text-xs font-black ${activeTab === tab ? "text-[#FBB017]" : "text-gray-400"}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Urgent notice */}
      {activeTab === "Upcoming" && stats.urgent > 0 && (
        <View className="mx-6 mb-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex-row items-center gap-2">
          <AlertCircle size={14} color="#EF4444" />
          <Text className="text-red-500 text-xs font-bold flex-1">
            {stats.urgent} urgent event{stats.urgent > 1 ? "s" : ""} need attention
          </Text>
        </View>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FBB017" />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => item._id}
          renderItem={renderEvent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchEvents(); }}
            />
          }
          ListEmptyComponent={() => (
            <View className="items-center mt-16">
              <Text className="text-5xl mb-4">
                {activeTab === "Upcoming" ? "📅" : "📖"}
              </Text>
              <Text className="text-gray-300 text-base font-bold">
                No {activeTab.toLowerCase()} events
              </Text>
              {activeTab === "Upcoming" && (
                <Text className="text-gray-200 text-sm mt-1">
                  Tap Create to post the first event
                </Text>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}