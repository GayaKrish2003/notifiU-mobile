import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Briefcase, Plus, User } from "lucide-react-native";

import JobProviderHomeScreen from "../screens/jobprovider/JobProviderHomeScreen";
import JobProviderPostsScreen from "../screens/jobprovider/JobProviderPostsScreen";
import JobProviderCreateScreen from "../screens/jobprovider/JobProviderCreateScreen";
import SharedProfileScreen from "../screens/shared/SharedProfileScreen";

const Tab = createBottomTabNavigator();

export default function JobProviderTabs() {
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
          if (route.name === "Home")   return <Home color={color} size={size} />;
          if (route.name === "Posts")  return <Briefcase color={color} size={size} />;
          if (route.name === "Post")   return <Plus color={color} size={size} />;
          if (route.name === "Profile") return <User color={color} size={size} />;
          return <Home color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Home"    component={JobProviderHomeScreen} />
      <Tab.Screen name="Posts"   component={JobProviderPostsScreen} />
      <Tab.Screen name="Post"    component={JobProviderCreateScreen} options={{ tabBarLabel: "Post a Job" }} />
      <Tab.Screen name="Profile" component={SharedProfileScreen} />
    </Tab.Navigator>
  );
}