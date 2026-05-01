import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { getMyEvents } from "@notifiu/shared";
import type { Event } from "@notifiu/shared/src/types/auth";
import { Calendar, MapPin, Users, CheckCircle } from "lucide-react-native";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function ClubPresidentHistoryScreen() {
  const navigation = useNavigation<NavProp>();

  const [events, setEvents]         = useState<Event[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await getMyEvents({ status: "History" });
      setEvents(res.data.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchEvents(); }, [fetchEvents]));

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric"
    });

  const renderEvent = ({ item }: { item: Event }) => {
    const attended = item.attendanceList.length;
    const rsvped   = item.rsvpList.length;
    const rate     = rsvped > 0 ? Math.round((attended / rsvped) * 100) : 0;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate("EventDetail", { eventId: item._id })}
        className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
        activeOpacity={0.85}
      >
        <View className="flex-row gap-3">
          {item.posterImage ? (
            <Image
              source={{ uri: item.posterImage }}
              className="w-16 h-16 rounded-xl"
              resizeMode="cover"
            />
          ) : (
            <View className="w-16 h-16 rounded-xl bg-gray-100 items-center justify-center">
              <Text className="text-2xl opacity-20">
                {item.type === "Workshop" ? "🛠️" : "🎈"}
              </Text>
            </View>
          )}
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                <Text className="text-gray-500 text-[9px] font-black uppercase">Past Event</Text>
              </View>
              <View className="bg-[#FBB017]/10 px-2 py-0.5 rounded-full">
                <Text className="text-[#FBB017] text-[9px] font-black uppercase">{item.type}</Text>
              </View>
            </View>
            <Text className="text-[#2D3A5D] font-bold text-sm mb-1" numberOfLines={1}>
              {item.title}
            </Text>
            <View className="flex-row items-center gap-1 mb-0.5">
              <Calendar size={10} color="#9CA3AF" />
              <Text className="text-gray-400 text-xs">{formatDate(item.date)}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <MapPin size={10} color="#9CA3AF" />
              <Text className="text-gray-400 text-xs" numberOfLines={1}>{item.location}</Text>
            </View>
          </View>
        </View>

        {/* Attendance stats */}
        <View className="mt-3 pt-3 border-t border-gray-100 flex-row gap-3">
          <View className="flex-1 bg-[#F0F2F5] rounded-xl p-2.5 items-center">
            <View className="flex-row items-center gap-1">
              <Users size={12} color="#FBB017" />
              <Text className="text-[#2D3A5D] font-black text-sm">{rsvped}</Text>
            </View>
            <Text className="text-gray-400 text-[9px] uppercase tracking-wide mt-0.5">RSVPs</Text>
          </View>
          <View className="flex-1 bg-[#F0F2F5] rounded-xl p-2.5 items-center">
            <View className="flex-row items-center gap-1">
              <CheckCircle size={12} color="#10B981" />
              <Text className="text-[#2D3A5D] font-black text-sm">{attended}</Text>
            </View>
            <Text className="text-gray-400 text-[9px] uppercase tracking-wide mt-0.5">Attended</Text>
          </View>
          <View className="flex-1 bg-[#F0F2F5] rounded-xl p-2.5 items-center">
            <Text className="text-[#2D3A5D] font-black text-sm">{rate}%</Text>
            <Text className="text-gray-400 text-[9px] uppercase tracking-wide mt-0.5">Rate</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <View className="px-6 pt-4 pb-4">
        <Text className="text-2xl font-black text-[#2D3A5D]">Event History</Text>
        <Text className="text-gray-400 text-sm">{events.length} past events</Text>
      </View>

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
            <View className="items-center mt-20">
              <Text className="text-5xl mb-4">📖</Text>
              <Text className="text-gray-300 text-base font-bold">No past events yet</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}