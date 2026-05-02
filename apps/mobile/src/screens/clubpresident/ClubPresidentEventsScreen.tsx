import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Image, ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { getEvents } from "@notifiu/shared";
import type { Event } from "@notifiu/shared/src/types/auth";
import { Search, Calendar, MapPin, Users, Tag } from "lucide-react-native";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES = ["All", "Workshop", "Seminar", "Club Activity", "Sports", "Musical"] as const;

export default function ClubPresidentEventsScreen() {
  const navigation  = useNavigation<NavProp>();
  const [events, setEvents]       = useState<Event[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("All");

  const fetchEvents = useCallback(async () => {
    try {
      const params: Record<string, string> = { status: "Upcoming" };
      if (category !== "All") params.category = category;
      const res = await getEvents(params);
      setEvents(res.data.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category]);

  useFocusEffect(useCallback(() => { fetchEvents(); }, [fetchEvents]));

  const filtered = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric"
    });

  const renderEvent = ({ item }: { item: Event }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("EventDetail", { eventId: item._id })}
      className="bg-white rounded-3xl mb-4 border border-gray-100 overflow-hidden"
      activeOpacity={0.85}
    >
      {item.posterImage ? (
        <Image source={{ uri: item.posterImage }} className="w-full h-40" resizeMode="cover" />
      ) : (
        <View className="w-full h-28 bg-[#FBB017]/10 items-center justify-center">
          <Text className="text-4xl opacity-20">{item.type === "Workshop" ? "🛠️" : "🎈"}</Text>
        </View>
      )}
      <View className="p-4">
        <View className="flex-row flex-wrap gap-2 mb-2">
          <View className="bg-[#FBB017] px-3 py-0.5 rounded-full">
            <Text className="text-white text-[9px] font-black uppercase">{item.category}</Text>
          </View>
          {item.priority === "Urgent" && (
            <View className="bg-red-100 px-3 py-0.5 rounded-full">
              <Text className="text-red-600 text-[9px] font-black uppercase">🔴 Urgent</Text>
            </View>
          )}
        </View>
        <Text className="text-[#2D3A5D] font-black text-base mb-3" numberOfLines={2}>
          {item.title}
        </Text>
        <View className="gap-1.5 mb-3">
          <View className="flex-row items-center gap-2">
            <Calendar size={12} color="#FBB017" />
            <Text className="text-gray-400 text-xs">{formatDate(item.date)} at {item.time}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <MapPin size={12} color="#FBB017" />
            <Text className="text-gray-400 text-xs" numberOfLines={1}>{item.location}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Tag size={12} color="#FBB017" />
            <Text className="text-gray-400 text-xs">{item.organizingClub}</Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
          <View className="flex-row items-center gap-2">
            <Users size={13} color="#FBB017" />
            <Text className="text-[#2D3A5D] text-xs font-bold">
              {item.rsvpList.length}
              {item.seatLimit > 0 ? ` / ${item.seatLimit}` : ""} attending
            </Text>
          </View>
          <View className="bg-[#1A1C2C] px-4 py-2 rounded-xl">
            <Text className="text-white text-[10px] font-black">View Details</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-black text-[#2D3A5D]">Events</Text>
        <Text className="text-gray-400 text-sm">{filtered.length} upcoming</Text>
      </View>

      <View className="px-6 mb-3">
        <View className="flex-row items-center bg-white rounded-2xl border border-gray-100 px-4 gap-2">
          <Search size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search events..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 py-3 text-sm text-[#2D3A5D]"
          />
        </View>
      </View>

      <View className="mb-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl ${category === cat ? "bg-[#FBB017]" : "bg-white border border-gray-100"}`}
            >
              <Text className={`text-xs font-black ${category === cat ? "text-white" : "text-gray-400"}`}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FBB017" />
        </View>
      ) : (
        <FlatList
          data={filtered}
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
            <View className="items-center mt-20">
              <Text className="text-5xl mb-4">📅</Text>
              <Text className="text-gray-300 text-base font-bold">No events found</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}