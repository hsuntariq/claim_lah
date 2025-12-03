import React, { useEffect } from "react";
import { Image, StyleSheet, View, Text } from "react-native";
import { Tabs } from "expo-router";
import * as NavigationBar from "expo-navigation-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Optional: Use vector icons for better scalability (recommended)
import { Ionicons } from "@expo/vector-icons";

const TabsLayout = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: "",
        tabBarInactiveTintColor: theme.textSecondary,
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
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={26}
              color={tabIconColor(focused)}
            />
          ),
        }}
      />

      {/* 📑 View Expenses */}
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Expenses",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "receipt" : "receipt-outline"}
              size={26}
              color={tabIconColor(focused)}
            />
          ),
        }}
      />

      {/* ➕ Add Expense */}
      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                backgroundColor: "",
                width: 56,
                height: 56,
                borderRadius: 28,
                justifyContent: "center",
                alignItems: "center",
                top: -12,
                shadowColor: "",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 10,
              }}
            >
              <Ionicons name="add" size={32} color="#fff" />
            </View>
          ),
          tabBarLabel: () => null, // Hide label for floating button
        }}
      />

      {/* 📤 Export */}
      <Tabs.Screen
        name="export"
        options={{
          title: "Export",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "download" : "download-outline"}
              size={26}
              color={tabIconColor(focused)}
            />
          ),
        }}
      />

      {/* ⚙️ Settings */}
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={26}
              color={tabIconColor(focused)}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
