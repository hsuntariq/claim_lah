// app/dashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  RefreshControl,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const [user, setUser] = useState({ name: "User" });
  const [receipts, setReceipts] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState(3000);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    monthlyExpenses: 0,
    weeklyExpenses: 0,
    dailyAverage: 0,
    highestCategory: "N/A",
    savingsRate: 0,
    receiptsCount: 0,
    budgetUsed: 0,
  });
  const [recentReceipts, setRecentReceipts] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Load all data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Animate in when loaded
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  const loadAllData = async () => {
    try {
      const [savedUser, savedBudget, savedReceipts] = await Promise.all([
        AsyncStorage.getItem("@user_profile"),
        AsyncStorage.getItem("@monthly_budget"),
        AsyncStorage.getItem("@receipts"),
      ]);

      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedBudget) setMonthlyBudget(parseFloat(savedBudget));
      if (savedReceipts) {
        const parsed = JSON.parse(savedReceipts);
        setReceipts(parsed);
        calculateAllStats(parsed);
        updateRecentAndCategories(parsed);
      }
    } catch (error) {
      console.error("Failed to load data", error);
    }
  };

  const saveReceipts = async (newReceipts) => {
    try {
      await AsyncStorage.setItem("@receipts", JSON.stringify(newReceipts));
      setReceipts(newReceipts);
      calculateAllStats(newReceipts);
      updateRecentAndCategories(newReceipts);
    } catch (error) {
      Alert.alert("Error", "Failed to save receipt");
    }
  };

  const calculateAllStats = (receiptList) => {
    if (!receiptList || receiptList.length === 0) {
      setStats({
        totalExpenses: 0,
        monthlyExpenses: 0,
        weeklyExpenses: 0,
        dailyAverage: 0,
        highestCategory: "N/A",
        savingsRate: 100,
        receiptsCount: 0,
        budgetUsed: 0,
      });
      return;
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    let monthlyTotal = 0;
    let weeklyTotal = 0;
    let total = 0;
    const categories = {};

    receiptList.forEach((r) => {
      const amount = parseFloat(r.total) || 0;
      total += amount;
      const date = new Date(r.date || r.createdAt);

      if (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      ) {
        monthlyTotal += amount;
      }
      if (date >= startOfWeek) {
        weeklyTotal += amount;
      }

      // Category aggregation from items
      (r.items || []).forEach((item) => {
        const itemAmt = parseFloat(item.total) || 0;
        const cat = determineCategory(item.name || "");
        categories[cat] = (categories[cat] || 0) + itemAmt;
      });
    });

    const dayOfMonth = now.getDate();
    const dailyAvg = dayOfMonth > 0 ? monthlyTotal / dayOfMonth : 0;
    const budgetUsed = ((monthlyTotal / monthlyBudget) * 100).toFixed(1);
    const savingsRate =
      monthlyBudget > 0
        ? (((monthlyBudget - monthlyTotal) / monthlyBudget) * 100).toFixed(1)
        : 100;

    let highestCat = "N/A";
    let max = 0;
    Object.entries(categories).forEach(([cat, amt]) => {
      if (amt > max) {
        max = amt;
        highestCat = cat;
      }
    });

    setStats({
      totalExpenses: total,
      monthlyExpenses: monthlyTotal,
      weeklyExpenses: weeklyTotal,
      dailyAverage: dailyAvg,
      highestCategory: highestCat,
      savingsRate: parseFloat(savingsRate),
      receiptsCount: receiptList.length,
      budgetUsed: parseFloat(budgetUsed),
      monthlyBudget,
    });
  };

  const updateRecentAndCategories = (list) => {
    const recent = [...list]
      .sort(
        (a, b) =>
          new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
      )
      .slice(0, 3);
    setRecentReceipts(recent);

    const catMap = {};
    list.forEach((r) => {
      (r.items || []).forEach((item) => {
        const cat = determineCategory(item.name || "");
        catMap[cat] = (catMap[cat] || 0) + (parseFloat(item.total) || 0);
      });
    });

    const sorted = Object.entries(catMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
    setTopCategories(sorted);
  };

  const determineCategory = (name) => {
    const n = (name || "").toLowerCase();
    if (
      n.includes("food") ||
      n.includes("nasi") ||
      n.includes("restaurant") ||
      n.includes("cafe") ||
      n.includes("makan")
    )
      return "Food";
    if (
      n.includes("grab") ||
      n.includes("petrol") ||
      n.includes("taxi") ||
      n.includes("lrt") ||
      n.includes("transport")
    )
      return "Transport";
    if (
      n.includes("shopping") ||
      n.includes("shopee") ||
      n.includes("lazada") ||
      n.includes("mall")
    )
      return "Shopping";
    if (
      n.includes("bill") ||
      n.includes("electric") ||
      n.includes("internet") ||
      n.includes("telco")
    )
      return "Bills";
    if (
      n.includes("movie") ||
      n.includes("netflix") ||
      n.includes("game") ||
      n.includes("entertainment")
    )
      return "Entertainment";
    return "Other";
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const formatCurrency = (val) => `RM ${(parseFloat(val) || 0).toFixed(2)}`;
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const getBudgetColor = (p) =>
    p < 60 ? "#2ECC71" : p < 85 ? "#F39C12" : "#E74C3C";
  const getCategoryIcon = (c) => {
    const map = {
      Food: "restaurant",
      Transport: "car",
      Shopping: "cart",
      Bills: "document-text",
      Entertainment: "film",
      Other: "cube",
    };
    return map[c] || "cube";
  };
  const getCategoryColor = (c) => {
    const map = {
      Food: "#2ECC71",
      Transport: "#3498DB",
      Shopping: "#9B59B6",
      Bills: "#E74C3C",
      Entertainment: "#F39C12",
      Other: "#95A5A6",
    };
    return map[c] || "#95A5A6";
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#27AE60" barStyle="light-content" />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>Claim Lah</Text>
            <Text style={styles.headerSubtitle}>
              Hello, {user.name.split(" ")[0]}!
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#27AE60"]}
            />
          }
        >
          {/* Welcome Card */}
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeContent}>
              <View>
                <Text style={styles.welcomeTitle}>Welcome back!</Text>
                <Text style={styles.welcomeText}>
                  Ready to track today's expenses?
                </Text>
              </View>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={32} color="#FFF" />
                </View>
              </Animated.View>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="wallet" size={28} color="#27AE60" />
              <Text style={styles.statValue}>
                {formatCurrency(stats.monthlyExpenses)}
              </Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="receipt" size={28} color="#3498DB" />
              <Text style={styles.statValue}>{stats.receiptsCount}</Text>
              <Text style={styles.statLabel}>Receipts</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={28} color="#9B59B6" />
              <Text style={styles.statValue}>
                {formatCurrency(stats.dailyAverage)}
              </Text>
              <Text style={styles.statLabel}>Daily Avg</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="pie-chart" size={28} color="#F39C12" />
              <Text style={styles.statValue}>{stats.highestCategory}</Text>
              <Text style={styles.statLabel}>Top Category</Text>
            </View>
          </View>

          {/* Budget Progress */}
          <View style={styles.budgetCard}>
            <Text style={styles.budgetTitle}>Monthly Budget</Text>
            <Text style={styles.budgetAmount}>
              {formatCurrency(stats.monthlyExpenses)} /{" "}
              {formatCurrency(monthlyBudget)}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(stats.budgetUsed, 100)}%`,
                    backgroundColor: getBudgetColor(stats.budgetUsed),
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.budgetPercentage,
                { color: getBudgetColor(stats.budgetUsed) },
              ]}
            >
              {stats.budgetUsed}% used
            </Text>
          </View>

          {/* Top Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Categories</Text>
            {topCategories.length > 0 ? (
              <View style={styles.categoriesRow}>
                {topCategories.map((cat, i) => (
                  <View key={i} style={styles.categoryPill}>
                    <Ionicons
                      name={getCategoryIcon(cat.name)}
                      size={20}
                      color={getCategoryColor(cat.name)}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        { color: getCategoryColor(cat.name) },
                      ]}
                    >
                      {cat.name}
                    </Text>
                    <Text style={styles.categoryAmount}>
                      {formatCurrency(cat.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No spending data yet</Text>
            )}
          </View>

          {/* Recent Receipts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Receipts</Text>
            {recentReceipts.length > 0 ? (
              recentReceipts.map((r, i) => (
                <View key={i} style={styles.receiptItem}>
                  <Ionicons name="receipt" size={24} color="#27AE60" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.receiptStore}>
                      {r.storeName || "Receipt"}
                    </Text>
                    <Text style={styles.receiptDate}>
                      {formatDate(r.date || r.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.receiptAmount}>
                    {formatCurrency(r.total)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No receipts added yet</Text>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

// Clean, modern styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  content: { flex: 1 },
  header: {
    backgroundColor: "#27AE60",
    padding: 20,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  appName: { fontSize: 30, fontWeight: "bold", color: "#fff" },
  headerSubtitle: { fontSize: 16, color: "#d0f9e0", marginTop: 4 },
  refreshButton: { backgroundColor: "#1e8449", padding: 12, borderRadius: 30 },
  welcomeCard: {
    backgroundColor: "#fff",
    margin: 20,
    marginTop: 10,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeTitle: { fontSize: 26, fontWeight: "bold", color: "#2c3e50" },
  welcomeText: { fontSize: 15, color: "#7f8c8d", marginTop: 6 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#27AE60",
    justifyContent: "center",
    alignItems: "center",
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", padding: 10, gap: 12 },
  statCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    width: (width - 52) / 2,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 10,
  },
  statLabel: { fontSize: 13, color: "#95a5a6", marginTop: 4 },
  budgetCard: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  budgetTitle: { fontSize: 20, fontWeight: "bold", color: "#2c3e50" },
  budgetAmount: { fontSize: 16, color: "#7f8c8d", marginTop: 8 },
  progressBar: {
    height: 12,
    backgroundColor: "#eee",
    borderRadius: 6,
    marginVertical: 16,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 6 },
  budgetPercentage: { fontSize: 28, fontWeight: "bold", textAlign: "center" },
  section: { marginHorizontal: 20, marginTop: 20 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 16,
  },
  categoriesRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  categoryPill: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryText: { fontWeight: "600" },
  categoryAmount: { fontWeight: "bold", marginLeft: 8 },
  receiptItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    elevation: 3,
  },
  receiptStore: { fontSize: 16, fontWeight: "600" },
  receiptDate: { fontSize: 13, color: "#95a5a6" },
  receiptAmount: { fontSize: 18, fontWeight: "bold", color: "#27AE60" },
  emptyText: {
    textAlign: "center",
    color: "#95a5a6",
    fontSize: 15,
    marginTop: 20,
  },
});
