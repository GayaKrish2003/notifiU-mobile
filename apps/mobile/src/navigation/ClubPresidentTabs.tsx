import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Calendar, Settings, History, User } from "lucide-react-native";

import ClubPresidentEventsScreen  from "../screens/clubpresident/ClubPresidentEventsScreen";
import ClubPresidentManageScreen  from "../screens/clubpresident/ClubPresidentManageScreen";
import ClubPresidentHistoryScreen from "../screens/clubpresident/ClubPresidentHistoryScreen";
import SharedProfileScreen        from "../screens/shared/SharedProfileScreen";

const Tab = createBottomTabNavigator();

export default function ClubPresidentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   "#FBB017",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor:  "#F0F2F5",
          borderTopWidth:  1,
          paddingBottom:   8,
          paddingTop:      8,
          height:          64,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
        tabBarIcon: ({ color, size }) => {
          if (route.name === "Events")  return <Calendar size={size} color={color} />;
          if (route.name === "Manage")  return <Settings size={size} color={color} />;
          if (route.name === "History") return <History  size={size} color={color} />;
          if (route.name === "Profile") return <User     size={size} color={color} />;
          return <Calendar size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Events"  component={ClubPresidentEventsScreen} />
      <Tab.Screen name="Manage"  component={ClubPresidentManageScreen} />
      <Tab.Screen name="History" component={ClubPresidentHistoryScreen} />
      <Tab.Screen name="Profile" component={SharedProfileScreen} />
    </Tab.Navigator>
  );
}