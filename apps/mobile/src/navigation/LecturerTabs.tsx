import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Megaphone, MessageCircleQuestion, User, BookOpen } from "lucide-react-native";

import AnnouncementsScreen from "../screens/shared/AnnouncementsScreen";
import LecturerAnnouncementsScreen from "../screens/lecturer/LecturerAnnouncementsScreen";
import LecturerFAQsScreen from "../screens/lecturer/LecturerFAQsScreen";
import SharedProfileScreen from "../screens/shared/SharedProfileScreen";
import LecturerModulesScreen from "../screens/lecturer/LecturerModulesScreen"; // ✅ ONLY NEW IMPORT

const Tab = createBottomTabNavigator();

export default function LecturerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#FBB017",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#F0F2F5",
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
        tabBarIcon: ({ color, size }) => {
          if (route.name === "Home") return <Home color={color} size={size} />;
          if (route.name === "Modules") return <BookOpen color={color} size={size} />; // ✅ ADD
          if (route.name === "Announcements") return <Megaphone color={color} size={size} />;
          if (route.name === "FAQs") return <MessageCircleQuestion color={color} size={size} />;
          if (route.name === "Profile") return <User color={color} size={size} />;
          return <Home color={color} size={size} />;
        },
      })}
    >
      
      <Tab.Screen name="Home" component={AnnouncementsScreen} />

      
      <Tab.Screen name="Modules" component={LecturerModulesScreen} />

      <Tab.Screen name="Announcements" component={LecturerAnnouncementsScreen} />
      <Tab.Screen name="FAQs" component={LecturerFAQsScreen} />
      <Tab.Screen name="Profile" component={SharedProfileScreen} />
    </Tab.Navigator>
  );
}