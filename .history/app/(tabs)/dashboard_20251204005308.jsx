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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const [stats, setStats] = useState({
    totalExpenses: 0,
    monthlyExpenses: 0,
    weeklyExpenses: 0,
    dailyAverage: 0,
    highestCategory: "N/A",
    savingsRate: 0,
    receiptsCount: 0,
    monthlyBudget: 3000,
    budgetUsed: 0,
  });

  const [recentReceipts, setRecentReceipts] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Start entrance animations
  useEffect(() => {
    if (!isLoading) {
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
              toValue: 1.05,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    }
  }, [isLoading]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const storedReceipts = await AsyncStorage.getItem("@receipts");
      const receipts = storedReceipts ? JSON.parse(storedReceipts) : [];

      calculateStatistics(receipts);
      getRecentReceipts(receipts);
      getTopCategories(receipts);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const calculateStatistics = (receipts) => {
    if (!receipts || receipts.length === 0) {
      setStats((prev) => ({
        ...prev,
        totalExpenses: 0,
        monthlyExpenses: 0,
        weeklyExpenses: 0,
        dailyAverage: 0,
        highestCategory: "N/A",
        savingsRate: 0,
        receiptsCount: 0,
        budgetUsed: 0,
      }));
      return;
    }

    // Calculate total expenses
    const totalExpenses = receipts.reduce((sum, expense) => {
      return sum + parseFloat(expense.total || 0);
    }, 0);

    // Calculate current month expenses
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyExpenses = receipts
      .filter((expense) => {
        const expenseDate = new Date(expense.date || expense.createdAt);
        return (
          expenseDate.getMonth() === currentMonth &&
          expenseDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, expense) => sum + parseFloat(expense.total || 0), 0);

    // Calculate weekly expenses
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const weeklyExpenses = receipts
      .filter((expense) => {
        const expenseDate = new Date(expense.date || expense.createdAt);
        return expenseDate >= startOfWeek;
      })
      .reduce((sum, expense) => sum + parseFloat(expense.total || 0), 0);

    // Calculate daily average for current month
    const currentDay = new Date().getDate();
    const dailyAverage = monthlyExpenses / currentDay;

    // Calculate category breakdown
    const categories = {};
    receipts.forEach((expense) => {
      expense.items?.forEach((item) => {
        if (item.name && item.total) {
          const amount = parseFloat(item.total);
          const category = determineCategory(item.name);
          categories[category] = (categories[category] || 0) + amount;
        }
      });
    });

    // Find highest spending category
    let highestCategory = "N/A";
    let highestAmount = 0;
    Object.entries(categories).forEach(([category, amount]) => {
      if (amount > highestAmount) {
        highestAmount = amount;
        highestCategory = category;
      }
    });

    // Calculate savings rate (mock calculation)
    const income = 5000; // Mock monthly income
    const savingsRate = (((income - monthlyExpenses) / income) * 100).toFixed(
      1
    );

    // Budget usage
    const budgetUsed = ((monthlyExpenses / stats.monthlyBudget) * 100).toFixed(
      1
    );

    setStats({
      totalExpenses,
      monthlyExpenses,
      weeklyExpenses,
      dailyAverage: isNaN(dailyAverage) ? 0 : dailyAverage,
      highestCategory,
      savingsRate,
      receiptsCount: receipts.length,
      monthlyBudget: 3000,
      budgetUsed: parseFloat(budgetUsed),
    });
  };

  const determineCategory = (itemName) => {
    const name = itemName.toLowerCase();
    if (
      name.includes("food") ||
      name.includes("nasi") ||
      name.includes("restaurant") ||
      name.includes("makan")
    ) {
      return "Food";
    } else if (
      name.includes("transport") ||
      name.includes("petrol") ||
      name.includes("grab") ||
      name.includes("train")
    ) {
      return "Transport";
    } else if (
      name.includes("shopping") ||
      name.includes("clothes") ||
      name.includes("electronics") ||
      name.includes("mall")
    ) {
      return "Shopping";
    } else if (
      name.includes("bill") ||
      name.includes("electric") ||
      name.includes("water") ||
      name.includes("internet")
    ) {
      return "Bills";
    } else if (
      name.includes("movie") ||
      name.includes("entertainment") ||
      name.includes("game") ||
      name.includes("hobby")
    ) {
      return "Entertainment";
    }
    return "Other";
  };

  const getRecentReceipts = (receipts) => {
    const sortedReceipts = [...receipts]
      .sort(
        (a, b) =>
          new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
      )
      .slice(0, 3);

    setRecentReceipts(sortedReceipts);
  };

  const getTopCategories = (receipts) => {
    const categories = {};
    receipts.forEach((expense) => {
      expense.items?.forEach((item) => {
        if (item.name && item.total) {
          const amount = parseFloat(item.total);
          const category = determineCategory(item.name);
          categories[category] = (categories[category] || 0) + amount;
        }
      });
    });

    const sortedCategories = Object.entries(categories)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);

    setTopCategories(sortedCategories);
  };

  const formatCurrency = (value) => {
    return `RM ${parseFloat(value).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getBudgetColor = (percentage) => {
    if (percentage < 60) return "#2ECC71";
    if (percentage < 80) return "#F39C12";
    return "#E74C3C";
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Food":
        return "restaurant";
      case "Transport":
        return "car";
      case "Shopping":
        return "cart";
      case "Bills":
        return "document-text";
      case "Entertainment":
        return "film";
      default:
        return "cube";
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "Food":
        return "#2ECC71";
      case "Transport":
        return "#3498DB";
      case "Shopping":
        return "#9B59B6";
      case "Bills":
        return "#E74C3C";
      case "Entertainment":
        return "#F39C12";
      default:
        return "#95A5A6";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#27AE60" barStyle="light-content" />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>Claim Lah</Text>
            <Text style={styles.headerSubtitle}>Track • Claim • Save</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => {
                /* Navigate to notifications */
              }}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#FFFFFF"
              />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadDashboardData}
            >
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#27AE60"
              colors={["#27AE60"]}
            />
          }
        >
          {/* Welcome Card */}
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeContent}>
              <View>
                <Text style={styles.welcomeTitle}>Welcome back! 👋</Text>
                <Text style={styles.welcomeText}>
                  Track your expenses and maximize your claims
                </Text>
              </View>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={32} color="#FFFFFF" />
                </View>
              </Animated.View>
            </View>
            <TouchableOpacity style={styles.quickAddButton}>
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.quickAddText}>Quick Add</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Overview */}
          <View style={styles.statsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📊 Financial Overview</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View Details</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: "rgba(46, 204, 113, 0.1)" },
                  ]}
                >
                  <Ionicons name="calendar" size={24} color="#2ECC71" />
                </View>
                <Text style={styles.statValue}>
                  {formatCurrency(stats.monthlyExpenses)}
                </Text>
                <Text style={styles.statLabel}>This Month</Text>
                <View style={styles.statTrend}>
                  <Ionicons name="trending-up" size={14} color="#2ECC71" />
                  <Text style={styles.statTrendText}>12% from last month</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: "rgba(39, 174, 96, 0.1)" },
                  ]}
                >
                  <Ionicons name="cash" size={24} color="#27AE60" />
                </View>
                <Text style={styles.statValue}>{stats.receiptsCount}</Text>
                <Text style={styles.statLabel}>Total Receipts</Text>
                <View style={styles.statTrend}>
                  <Ionicons name="document-text" size={14} color="#27AE60" />
                  <Text style={styles.statTrendText}>
                    {stats.receiptsCount > 0
                      ? "Ready to claim"
                      : "Add receipts"}
                  </Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: "rgba(52, 152, 219, 0.1)" },
                  ]}
                >
                  <Ionicons name="trending-up" size={24} color="#3498DB" />
                </View>
                <Text style={styles.statValue}>
                  {formatCurrency(stats.dailyAverage)}
                </Text>
                <Text style={styles.statLabel}>Daily Average</Text>
                <View style={styles.statTrend}>
                  <Ionicons name="time" size={14} color="#3498DB" />
                  <Text style={styles.statTrendText}>Per day spending</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: "rgba(155, 89, 182, 0.1)" },
                  ]}
                >
                  <Ionicons name="pie-chart" size={24} color="#9B59B6" />
                </View>
                <Text style={styles.statValue}>{stats.highestCategory}</Text>
                <Text style={styles.statLabel}>Top Category</Text>
                <View style={styles.statTrend}>
                  <Ionicons name="star" size={14} color="#9B59B6" />
                  <Text style={styles.statTrendText}>Most spending</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Budget Progress */}
          <View style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <View>
                <Text style={styles.budgetTitle}>Monthly Budget</Text>
                <Text style={styles.budgetAmount}>
                  {formatCurrency(stats.monthlyExpenses)} /{" "}
                  {formatCurrency(stats.monthlyBudget)}
                </Text>
              </View>
              <Text
                style={[
                  styles.budgetPercentage,
                  { color: getBudgetColor(stats.budgetUsed) },
                ]}
              >
                {stats.budgetUsed}%
              </Text>
            </View>

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

            <View style={styles.budgetInfo}>
              <View style={styles.budgetInfoItem}>
                <View
                  style={[styles.budgetDot, { backgroundColor: "#2ECC71" }]}
                />
                <Text style={styles.budgetInfoText}>Under Budget</Text>
              </View>
              <View style={styles.budgetInfoItem}>
                <View
                  style={[styles.budgetDot, { backgroundColor: "#F39C12" }]}
                />
                <Text style={styles.budgetInfoText}>Moderate</Text>
              </View>
              <View style={styles.budgetInfoItem}>
                <View
                  style={[styles.budgetDot, { backgroundColor: "#E74C3C" }]}
                />
                <Text style={styles.budgetInfoText}>Over Budget</Text>
              </View>
            </View>
          </View>

          {/* Top Categories */}
          <View style={styles.categoriesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏷️ Top Categories</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.categoriesGrid}>
              {topCategories.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.categoryCard}
                  onPress={() => {
                    /* Navigate to category details */
                  }}
                >
                  <View
                    style={[
                      styles.categoryIconContainer,
                      {
                        backgroundColor: `${getCategoryColor(category.name)}20`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={getCategoryIcon(category.name)}
                      size={24}
                      color={getCategoryColor(category.name)}
                    />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text
                    style={[
                      styles.categoryAmount,
                      { color: getCategoryColor(category.name) },
                    ]}
                  >
                    {formatCurrency(category.amount)}
                  </Text>
                </TouchableOpacity>
              ))}

              {topCategories.length === 0 && (
                <View style={styles.emptyCategory}>
                  <Ionicons
                    name="pie-chart-outline"
                    size={32}
                    color="#BDC3C7"
                  />
                  <Text style={styles.emptyCategoryText}>No data yet</Text>
                  <Text style={styles.emptyCategorySubtext}>
                    Add receipts to see categories
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Recent Receipts */}
          <View style={styles.receiptsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📋 Recent Receipts</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentReceipts.length > 0 ? (
              recentReceipts.map((receipt, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.receiptCard}
                  onPress={() => {
                    /* Navigate to receipt details */
                  }}
                >
                  <View style={styles.receiptLeft}>
                    <View
                      style={[
                        styles.receiptIcon,
                        {
                          backgroundColor: getCategoryColor(
                            receipt.storeName?.includes("Food")
                              ? "Food"
                              : "Shopping"
                          ),
                        },
                      ]}
                    >
                      <Ionicons name="receipt" size={20} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={styles.receiptStore} numberOfLines={1}>
                        {receipt.storeName || "Unknown Store"}
                      </Text>
                      <Text style={styles.receiptDate}>
                        {formatDate(receipt.date || receipt.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.receiptRight}>
                    <Text style={styles.receiptAmount}>
                      {formatCurrency(receipt.total)}
                    </Text>
                    <View
                      style={[
                        styles.receiptStatus,
                        {
                          backgroundColor: receipt.isClaimable
                            ? "#2ECC7120"
                            : "#F39C1220",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.receiptStatusText,
                          {
                            color: receipt.isClaimable ? "#2ECC71" : "#F39C12",
                          },
                        ]}
                      >
                        {receipt.isClaimable ? "Claimable" : "Processing"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyReceipts}>
                <Ionicons name="receipt-outline" size={48} color="#BDC3C7" />
                <Text style={styles.emptyReceiptsText}>No receipts yet</Text>
                <Text style={styles.emptyReceiptsSubtext}>
                  Add your first receipt to get started
                </Text>
                <TouchableOpacity style={styles.addFirstReceiptButton}>
                  <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.addFirstReceiptText}>
                    Add First Receipt
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>

            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionButton}>
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: "rgba(46, 204, 113, 0.1)" },
                  ]}
                >
                  <Ionicons name="add-circle" size={28} color="#2ECC71" />
                </View>
                <Text style={styles.actionText}>Add Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: "rgba(39, 174, 96, 0.1)" },
                  ]}
                >
                  <Ionicons name="scan" size={28} color="#27AE60" />
                </View>
                <Text style={styles.actionText}>Scan Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: "rgba(52, 152, 219, 0.1)" },
                  ]}
                >
                  <Ionicons name="document-text" size={28} color="#3498DB" />
                </View>
                <Text style={styles.actionText}>View Reports</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: "rgba(155, 89, 182, 0.1)" },
                  ]}
                >
                  <Ionicons name="settings" size={28} color="#9B59B6" />
                </View>
                <Text style={styles.actionText}>Settings</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Premium CTA */}
          <TouchableOpacity style={styles.premiumCard}>
            <View style={styles.premiumContent}>
              <View style={styles.premiumBadge}>
                <Ionicons name="sparkles" size={20} color="#FFD700" />
                <Text style={styles.premiumBadgeText}>PRO</Text>
              </View>
              <View style={styles.premiumTextContainer}>
                <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                <Text style={styles.premiumSubtitle}>
                  Unlock advanced features and priority support
                </Text>
              </View>
              <MaterialIcons
                name="arrow-forward-ios"
                size={20}
                color="#FFFFFF"
              />
            </View>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: "#27AE60",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    marginBottom: 4,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#D5FFE4",
    marginTop: 2,
    opacity: 0.9,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notificationButton: {
    position: "relative",
    padding: 8,
  },
  notificationBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E74C3C",
  },
  refreshButton: {
    backgroundColor: "#1E8449",
    borderRadius: 20,
    padding: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  welcomeCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    padding: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  welcomeContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#27AE60",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  quickAddButton: {
    backgroundColor: "#27AE60",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  quickAddText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  statsSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  viewAllText: {
    color: "#27AE60",
    fontWeight: "600",
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    width: "48%",
    marginHorizontal: "1%",
    marginBottom: 12,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#7F8C8D",
    marginBottom: 8,
  },
  statTrend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statTrendText: {
    fontSize: 12,
    color: "#95A5A6",
  },
  budgetCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    padding: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  budgetTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  budgetAmount: {
    fontSize: 16,
    color: "#7F8C8D",
  },
  budgetPercentage: {
    fontSize: 28,
    fontWeight: "bold",
  },
  progressBar: {
    height: 12,
    backgroundColor: "#F0F0F0",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 20,
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  budgetInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  budgetInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  budgetDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  budgetInfoText: {
    fontSize: 12,
    color: "#7F8C8D",
  },
  categoriesSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  categoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    width: "48%",
    marginHorizontal: "1%",
    marginBottom: 12,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 4,
    textAlign: "center",
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyCategory: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 40,
    width: "100%",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  emptyCategoryText: {
    fontSize: 16,
    color: "#7F8C8D",
    marginTop: 16,
    fontWeight: "500",
  },
  emptyCategorySubtext: {
    fontSize: 14,
    color: "#BDC3C7",
    marginTop: 4,
  },
  receiptsSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  receiptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  receiptLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  receiptIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  receiptStore: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 4,
  },
  receiptDate: {
    fontSize: 13,
    color: "#7F8C8D",
  },
  receiptRight: {
    alignItems: "flex-end",
  },
  receiptAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 8,
  },
  receiptStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  receiptStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyReceipts: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  emptyReceiptsText: {
    fontSize: 18,
    color: "#7F8C8D",
    marginTop: 20,
    fontWeight: "500",
  },
  emptyReceiptsSubtext: {
    fontSize: 14,
    color: "#BDC3C7",
    marginTop: 8,
    marginBottom: 20,
  },
  addFirstReceiptButton: {
    backgroundColor: "#27AE60",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addFirstReceiptText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  actionsSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  actionButton: {
    width: "48%",
    marginHorizontal: "1%",
    marginBottom: 12,
    alignItems: "center",
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E50",
    textAlign: "center",
  },
  premiumCard: {
    backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 40,
    borderRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  premiumContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 16,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFD700",
    marginLeft: 4,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
  },
});
