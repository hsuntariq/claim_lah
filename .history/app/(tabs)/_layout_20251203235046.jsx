import React, { useEffect } from "react";
import { Image, StyleSheet, View, Text } from "react-native";
import { Tabs } from "expo-router";
import * as NavigationBar from "expo-navigation-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const TabsLayout = () => {
  const insets = useSafeAreaInsets();

  // Set Android navigation bar color
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync("#27AE60");
      NavigationBar.setButtonStyleAsync("light");
    }
  }, []);

  const tabIconColor = (focused) => (focused ? "#27AE60" : "#7F8C8D");

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: "#E0E0E0",
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: "#27AE60",
        tabBarInactiveTintColor: "#7F8C8D",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 4,
        },
      }}
    >
      {/* 📊 Dashboard */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused, color, size }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons
                name={focused ? "analytics" : "analytics-outline"}
                size={24}
                color={tabIconColor(focused)}
              />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />

      {/* 📑 View Expenses */}
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Expenses",
          tabBarIcon: ({ focused, color, size }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons
                name={focused ? "receipt" : "receipt-outline"}
                size={24}
                color={tabIconColor(focused)}
              />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />

      {/* ➕ Add Expense */}
      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
          tabBarIcon: ({ focused }) => (
            <View style={styles.floatingButton}>
              <Ionicons name="add" size={32} color="#FFFFFF" />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />

      {/* 📊 Reports */}
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ focused, color, size }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons
                name={focused ? "pie-chart" : "pie-chart-outline"}
                size={24}
                color={tabIconColor(focused)}
              />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />

      {/* 👤 Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color, size }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={24}
                color={tabIconColor(focused)}
              />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    top: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#27AE60",
  },
  floatingButton: {
    backgroundColor: "#27AE60",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    top: -20,
    shadowColor: "#27AE60",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
});

export default TabsLayout;
