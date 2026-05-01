import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, MessageCircleQuestion, User, BookOpen, Briefcase } from "lucide-react-native";

import AnnouncementsScreen from "../screens/shared/AnnouncementsScreen";
import FAQsScreen from "../screens/student/FAQsScreen";
import SharedProfileScreen from "../screens/shared/SharedProfileScreen";
import StudentModulesScreen from "../screens/student/StudentModulesScreen";
import StudentJobsScreen from "../screens/student/StudentJobsScreen";

import StudentEventsScreen from "../screens/student/StudentEventsScreen";
import { Calendar } from "lucide-react-native";

const Tab = createBottomTabNavigator();

export default function StudentTabs() {
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
          if (route.name === "Home")    return <Home color={color} size={size} />;
          if (route.name === "Jobs")    return <Briefcase color={color} size={size} />;
          if (route.name === "Modules") return <BookOpen color={color} size={size} />;
          if (route.name === "FAQs")    return <MessageCircleQuestion color={color} size={size} />;
          if (route.name === "Events") return <Calendar color={color} size={size} />;
          if (route.name === "Profile") return <User color={color} size={size} />;
          return <Home color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Home"    component={AnnouncementsScreen} />
      <Tab.Screen name="Modules" component={StudentModulesScreen} />
      <Tab.Screen name="Jobs"    component={StudentJobsScreen} />
      <Tab.Screen name="FAQs"    component={FAQsScreen} />
      <Tab.Screen name="Events" component={StudentEventsScreen} />
      <Tab.Screen name="Profile" component={SharedProfileScreen} />
    </Tab.Navigator>
  );
}