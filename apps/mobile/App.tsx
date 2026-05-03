/// <reference path="./nativewind-env.d.ts" />
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { initTokenStorage, setBaseURL } from "@notifiu/shared";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RootNavigator from "./src/navigation/RootNavigator";


const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  
  const hostUri: string =
    Constants.expoConfig?.hostUri ??
    (Constants as Record<string, unknown>).manifest?.debuggerHost ??
    "";

  if (hostUri) {
    const host = hostUri.split(":")[0]; 
    return `http://${host}:5005/api`;
  }

  return "http://localhost:5005/api";
};


setBaseURL(getApiBaseUrl());


initTokenStorage({
  getToken: async () => await AsyncStorage.getItem("token"),
  setToken: async (token: string) => await AsyncStorage.setItem("token", token),
  removeToken: async () => await AsyncStorage.removeItem("token"),
});

export default function App() {
  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
  );
}