import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ModuleDashboardScreen from "../screens/admin/ModuleDashboardScreen";
import CreateModuleScreen from "../screens/admin/CreateModuleScreen";

// create these files later
import AssignLecturerScreen from "../screens/admin/AssignLecturerScreen";
import EditModuleScreen from "../screens/admin/EditModuleScreen";
import EnrollmentManagementScreen from "../screens/admin/EnrollmentManagementScreen";
import ReportsScreen from "../screens/admin/ReportsScreen";

const Stack = createNativeStackNavigator();

export default function AdminModuleStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ModuleDashboard" component={ModuleDashboardScreen} />
      <Stack.Screen name="CreateModule" component={CreateModuleScreen} />
      <Stack.Screen name="AssignLecturer" component={AssignLecturerScreen} />
      <Stack.Screen name="EditModule" component={EditModuleScreen} />
      <Stack.Screen name="Enrollments" component={EnrollmentManagementScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
    </Stack.Navigator>
  );
}