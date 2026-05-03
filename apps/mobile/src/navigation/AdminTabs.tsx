import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Users, HelpCircle, User, BookOpen } from "lucide-react-native";

import AdminHomeScreen from "../screens/admin/AdminHomeScreen";
import AdminTicketsScreen from "../screens/admin/AdminTicketsScreen";
import AdminProfileScreen from "../screens/admin/AdminProfileScreen";
import AdminModuleStack from "./AdminModuleStack";
import AdminJobsScreen from "../screens/admin/AdminJobsScreen";
import { Briefcase } from "lucide-react-native";
import AdminEventsScreen from "../screens/admin/AdminEventsScreen";
import { Calendar } from "lucide-react-native";

const Tab = createBottomTabNavigator();

export default function AdminTabs() {
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
          if (route.name === "Users") return <Users color={color} size={size} />;
          if (route.name === "Jobs") return <Briefcase color={color} size={size} />;
          if (route.name === "Tickets") return <HelpCircle color={color} size={size} />;
          if (route.name === "Modules") return <BookOpen color={color} size={size} />;
          if (route.name === "Events") return <Calendar color={color} size={size} />;
          if (route.name === "Profile") return <User color={color} size={size} />;
          return <Users color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Users" component={AdminHomeScreen} />
      <Tab.Screen name="Tickets" component={AdminTicketsScreen} />
      <Tab.Screen name="Modules" component={AdminModuleStack} />
      <Tab.Screen name="Jobs" component={AdminJobsScreen} />
      <Tab.Screen name="Events" component={AdminEventsScreen} />
      <Tab.Screen name="Profile" component={AdminProfileScreen} />
    </Tab.Navigator>
  );
}