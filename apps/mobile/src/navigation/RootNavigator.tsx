import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { ActivityIndicator, View } from "react-native";

import LoginScreen from "../screens/auth/LoginScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import StudentTabs from "./StudentTabs";
import LecturerTabs from "./LecturerTabs";
import AdminTabs from "./AdminTabs";
import JobProviderTabs from "./JobProviderTabs";
import LecturerModuleViewScreen from "../screens/lecturer/LecturerModuleViewScreen";
import StudentModuleViewScreen from "../screens/student/StudentModuleViewScreen";
import EnrollmentManagementScreen from "../screens/admin/EnrollmentManagementScreen";

import SavedJobsScreen from "../screens/student/SavedJobsScreen";
import AppliedJobsScreen from "../screens/student/AppliedJobsScreen";
import AdminApprovedJobsScreen from "../screens/admin/AdminApprovedJobsScreen";
import AdminRejectedJobsScreen from "../screens/admin/AdminRejectedJobsScreen";

import JobProviderEditScreen from "../screens/jobprovider/JobProviderEditScreen";
import AdminAllJobsScreen from "../screens/admin/AdminAllJobsScreen";

import ClubPresidentTabs from "./ClubPresidentTabs";
import EventDetailScreen from "../screens/shared/EventDetailScreen";
import CreateEventScreen from "../screens/shared/CreateEventScreen";
import EditEventScreen from "../screens/shared/EditEventScreen";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  StudentTabs: undefined;
  LecturerTabs: undefined;
  AdminTabs: undefined;
  JobProviderTabs: undefined;
  SavedJobs: undefined;      
  AppliedJobs: undefined;
  AdminApprovedJobs: undefined;
  AdminRejectedJobs: undefined;
  EditJobPost: { jobId: string };
  AdminAllJobs: undefined;
  LecturerModuleView: { moduleId: string };
  StudentModuleView: { moduleId: string };
  EnrollmentManagement: { moduleId: string };
  ClubPresidentTabs: undefined;
  EventDetail:       { eventId: string };
  CreateEvent:       undefined;
  EditEvent:         { eventId: string };
  
};

interface JwtPayload {
  id: string;
  role: "superadmin" | "student" | "lecturer" | "jobprovider" | "clubpresident";
  exp: number;
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8F9FA" }}>
      <ActivityIndicator size="large" color="#FBB017" />
    </View>
  );
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [initialRoute, setInitialRoute] =
    useState<keyof RootStackParamList>("Login");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const decoded = jwtDecode<JwtPayload>(token);

        if (decoded.exp * 1000 < Date.now()) {
          await AsyncStorage.removeItem("token");
          return;
        }

        if (decoded.role === "superadmin") setInitialRoute("AdminTabs");
        else if (decoded.role === "lecturer") setInitialRoute("LecturerTabs");
        else if (decoded.role === "jobprovider") setInitialRoute("JobProviderTabs");
        else if (decoded.role === "clubpresident") setInitialRoute("ClubPresidentTabs");
        else setInitialRoute("StudentTabs");
      } catch (error) {
        console.error("Token validation error:", error);
      } finally {
        setLoading(false);
      }
    };
    checkToken();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={loading ? "Login" : initialRoute}
        screenOptions={{ headerShown: false }}
      >
        {loading ? (
          <Stack.Screen name="Login" component={LoadingScreen} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="StudentTabs" component={StudentTabs} />
            <Stack.Screen name="LecturerTabs" component={LecturerTabs} />
            <Stack.Screen name="AdminTabs" component={AdminTabs} />
            <Stack.Screen name="JobProviderTabs" component={JobProviderTabs} />
            <Stack.Screen name="SavedJobs" component={SavedJobsScreen} />
            <Stack.Screen name="AppliedJobs" component={AppliedJobsScreen} />
            <Stack.Screen name="AdminApprovedJobs" component={AdminApprovedJobsScreen} />
            <Stack.Screen name="AdminRejectedJobs" component={AdminRejectedJobsScreen} />
            <Stack.Screen name="EditJobPost" component={JobProviderEditScreen} />
            <Stack.Screen name="AdminAllJobs" component={AdminAllJobsScreen} />
            <Stack.Screen name="LecturerModuleView" component={LecturerModuleViewScreen} />
            <Stack.Screen name="StudentModuleView" component={StudentModuleViewScreen} />
            <Stack.Screen name="EnrollmentManagement" component={EnrollmentManagementScreen} />
            <Stack.Screen name="ClubPresidentTabs" component={ClubPresidentTabs} />
            <Stack.Screen name="EventDetail"       component={EventDetailScreen} />
            <Stack.Screen name="CreateEvent"       component={CreateEventScreen} />
            <Stack.Screen name="EditEvent"         component={EditEventScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}