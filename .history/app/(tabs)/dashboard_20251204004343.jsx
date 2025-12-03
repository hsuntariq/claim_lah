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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LineChart, BarChart, PieChart } from "expo-charts";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const [stats, setStats] = useState({
    totalExpenses: 0,
    monthlyExpenses: 0,
    weeklyExpenses: 0,
    dailyAverage: 0,
    highestCategory: "N/A",
    savingsRate: 0,
  });

  const [timeframe, setTimeframe] = useState("month");
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Load expenses on mount
  useEffect(() => {
    loadExpenses();
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
      ]).start();
    }
  }, [isLoading]);

  const loadExpenses = async () => {
    try {
      const storedExpenses = await AsyncStorage.getItem("@receipts");
      if (storedExpenses !== null) {
        const parsedExpenses = JSON.parse(storedExpenses);
        setExpenses(parsedExpenses);
        calculateStatistics(parsedExpenses);
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStatistics = (expensesList) => {
    if (!expensesList || expensesList.length === 0) {
      setStats({
        totalExpenses: 0,
        monthlyExpenses: 0,
        weeklyExpenses: 0,
        dailyAverage: 0,
        highestCategory: "N/A",
        savingsRate: 0,
      });
      return;
    }

    // Calculate total expenses
    const totalExpenses = expensesList.reduce((sum, expense) => {
      return sum + parseFloat(expense.total || 0);
    }, 0);

    // Calculate current month expenses
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyExpenses = expensesList
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
    const weeklyExpenses = expensesList
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
    expensesList.forEach((expense) => {
      expense.items?.forEach((item) => {
        if (item.name && item.total) {
          const category = item.name.split(" ")[0]; // Simple category extraction
          categories[category] =
            (categories[category] || 0) + parseFloat(item.total);
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

    setStats({
      totalExpenses,
      monthlyExpenses,
      weeklyExpenses,
      dailyAverage: isNaN(dailyAverage) ? 0 : dailyAverage,
      highestCategory,
      savingsRate,
    });
  };

  // Weekly data for line chart
  const getWeeklyData = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const weeklyData = days.map((day, index) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + index);

      const dayExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date || expense.createdAt);
        return expenseDate.toDateString() === dayDate.toDateString();
      });

      const total = dayExpenses.reduce((sum, expense) => {
        return sum + parseFloat(expense.total || 0);
      }, 0);

      return { x: day, y: total };
    });

    return weeklyData;
  };

  // Monthly data for bar chart
  const getMonthlyData = () => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentYear = new Date().getFullYear();

    const monthlyData = months.map((month, index) => {
      const monthExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date || expense.createdAt);
        return (
          expenseDate.getMonth() === index &&
          expenseDate.getFullYear() === currentYear
        );
      });

      const total = monthExpenses.reduce((sum, expense) => {
        return sum + parseFloat(expense.total || 0);
      }, 0);

      return { x: month, y: total };
    });

    return monthlyData;
  };

  // Category data for pie chart
  const getCategoryData = () => {
    const categories = {
      Food: { value: 0, color: "#2ECC71" },
      Transport: { value: 0, color: "#27AE60" },
      Shopping: { value: 0, color: "#229954" },
      Bills: { value: 0, color: "#1E8449" },
      Entertainment: { value: 0, color: "#196F3D" },
      Other: { value: 0, color: "#145A32" },
    };

    expenses.forEach((expense) => {
      expense.items?.forEach((item) => {
        if (item.name && item.total) {
          const amount = parseFloat(item.total);
          let category = "Other";

          // Simple category detection (in real app, use actual categories)
          const name = item.name.toLowerCase();
          if (
            name.includes("food") ||
            name.includes("nasi") ||
            name.includes("restaurant") ||
            name.includes("makan")
          ) {
            category = "Food";
          } else if (
            name.includes("transport") ||
            name.includes("petrol") ||
            name.includes("grab") ||
            name.includes("train")
          ) {
            category = "Transport";
          } else if (
            name.includes("shopping") ||
            name.includes("clothes") ||
            name.includes("electronics") ||
            name.includes("mall")
          ) {
            category = "Shopping";
          } else if (
            name.includes("bill") ||
            name.includes("electric") ||
            name.includes("water") ||
            name.includes("internet")
          ) {
            category = "Bills";
          } else if (
            name.includes("movie") ||
            name.includes("entertainment") ||
            name.includes("game") ||
            name.includes("hobby")
          ) {
            category = "Entertainment";
          }

          categories[category].value += amount;
        }
      });
    });

    // Convert to array and filter out zero values
    return Object.entries(categories)
      .filter(([_, data]) => data.value > 0)
      .map(([name, data]) => ({
        name,
        value: data.value,
        color: data.color,
      }));
  };

  const formatCurrency = (value) => {
    return `RM ${parseFloat(value).toFixed(2)}`;
  };

  const weeklyData = getWeeklyData();
  const monthlyData = getMonthlyData();
  const categoryData = getCategoryData();

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
            <Text style={styles.headerSubtitle}>Expense Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={loadExpenses}>
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Stats Overview */}
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>📊 Financial Overview</Text>

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
                <Text style={styles.statValue}>
                  {formatCurrency(stats.totalExpenses)}
                </Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>

              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: "rgba(34, 153, 84, 0.1)" },
                  ]}
                >
                  <Ionicons name="trending-up" size={24} color="#229954" />
                </View>
                <Text style={styles.statValue}>
                  {formatCurrency(stats.dailyAverage)}
                </Text>
                <Text style={styles.statLabel}>Daily Average</Text>
              </View>

              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: "rgba(25, 111, 61, 0.1)" },
                  ]}
                >
                  <Ionicons name="pie-chart" size={24} color="#196F3D" />
                </View>
                <Text style={styles.statValue}>{stats.highestCategory}</Text>
                <Text style={styles.statLabel}>Top Category</Text>
              </View>
            </View>
          </View>

          {/* Timeframe Selector */}
          <View style={styles.timeframeContainer}>
            {["week", "month", "year"].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.timeframeButton,
                  timeframe === period && styles.timeframeButtonActive,
                ]}
                onPress={() => setTimeframe(period)}
              >
                <Text
                  style={[
                    styles.timeframeText,
                    timeframe === period && styles.timeframeTextActive,
                  ]}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Line Chart - Weekly Expenses */}
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>📈 Weekly Spending Trend</Text>
              <TouchableOpacity>
                <Text style={styles.viewDetails}>View Details</Text>
              </TouchableOpacity>
            </View>

            <LineChart
              style={{ height: 200, width: width - 60 }}
              data={weeklyData}
              onTooltip={({ x, y, index }) => {
                return {
                  x: weeklyData[index]?.x,
                  y: `RM ${weeklyData[index]?.y.toFixed(2)}`,
                };
              }}
              lineColor="#27AE60"
              lineWidth={3}
              dotColor="#2ECC71"
              dotSize={6}
              areaGradient={[
                "rgba(39, 174, 96, 0.1)",
                "rgba(39, 174, 96, 0.01)",
              ]}
              xAxisColor="#E0E0E0"
              yAxisColor="#E0E0E0"
              xAxisLabelColor="#7F8C8D"
              yAxisLabelColor="#7F8C8D"
              verticalLinesColor="#F0F0F0"
              horizontalLinesColor="#F0F0F0"
              hideTooltipOnDragEnd
            />
          </View>

          {/* Bar Chart - Monthly Comparison */}
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>📊 Monthly Expenses</Text>
              <TouchableOpacity>
                <Text style={styles.viewDetails}>View Details</Text>
              </TouchableOpacity>
            </View>

            <BarChart
              style={{ height: 200, width: width - 60 }}
              data={monthlyData}
              onTooltip={({ x, y, index }) => {
                return {
                  x: monthlyData[index]?.x,
                  y: `RM ${monthlyData[index]?.y.toFixed(2)}`,
                };
              }}
              barColor="#2ECC71"
              barWidth={20}
              barRadius={4}
              barGradient={["#2ECC71", "#27AE60"]}
              xAxisColor="#E0E0E0"
              yAxisColor="#E0E0E0"
              xAxisLabelColor="#7F8C8D"
              yAxisLabelColor="#7F8C8D"
              verticalLinesColor="#F0F0F0"
              horizontalLinesColor="#F0F0F0"
            />
          </View>

          {/* Pie Chart - Category Breakdown */}
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>🥧 Spending by Category</Text>
              <TouchableOpacity>
                <Text style={styles.viewDetails}>View Details</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pieChartContainer}>
              {categoryData.length > 0 ? (
                <PieChart
                  style={{ height: 200, width: width - 60 }}
                  data={categoryData}
                  onTooltip={({ name, value, percentage }) => {
                    return {
                      x: name,
                      y: `${percentage.toFixed(1)}% (RM ${value.toFixed(2)})`,
                    };
                  }}
                  innerRadius={40}
                  labelRadius={70}
                  labelColor="#2C3E50"
                  labelPosition="outside"
                  strokeColor="#FFFFFF"
                  strokeWidth={2}
                  hideLabels={false}
                  sort="desc"
                />
              ) : (
                <View style={styles.emptyChart}>
                  <Ionicons
                    name="pie-chart-outline"
                    size={48}
                    color="#D5D5D5"
                  />
                  <Text style={styles.emptyChartText}>No category data</Text>
                  <Text style={styles.emptyChartSubtext}>
                    Add receipts to see breakdown
                  </Text>
                </View>
              )}
            </View>

            {/* Legend */}
            {categoryData.length > 0 && (
              <View style={styles.legendContainer}>
                {categoryData.map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendColor,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <Text style={styles.legendLabel} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.legendValue}>
                      RM {item.value.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Insights & Tips */}
          <View style={styles.insightsContainer}>
            <Text style={styles.sectionTitle}>💡 Insights & Tips</Text>

            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <Ionicons name="bulb-outline" size={24} color="#27AE60" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Savings Rate</Text>
                <Text style={styles.insightText}>
                  Your current savings rate is{" "}
                  <Text style={styles.highlight}>{stats.savingsRate}%</Text>.
                  Try to maintain at least 20% savings rate.
                </Text>
              </View>
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <Ionicons
                  name="alert-circle-outline"
                  size={24}
                  color="#E67E22"
                />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Highest Spending</Text>
                <Text style={styles.insightText}>
                  Most of your expenses are in{" "}
                  <Text style={styles.highlight}>{stats.highestCategory}</Text>.
                  Consider setting a budget for this category.
                </Text>
              </View>
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <Ionicons
                  name="trending-up-outline"
                  size={24}
                  color="#3498DB"
                />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Weekly Trend</Text>
                <Text style={styles.insightText}>
                  {weeklyData[weeklyData.length - 1]?.y > weeklyData[0]?.y
                    ? "Spending increased"
                    : "Spending decreased"}
                  by{" "}
                  <Text style={styles.highlight}>
                    {Math.abs(
                      ((weeklyData[weeklyData.length - 1]?.y -
                        weeklyData[0]?.y) /
                        weeklyData[0]?.y) *
                        100 || 0
                    ).toFixed(1)}
                    %
                  </Text>{" "}
                  this week.
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
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
                  <Ionicons name="document-text" size={28} color="#27AE60" />
                </View>
                <Text style={styles.actionText}>View Reports</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: "rgba(34, 153, 84, 0.1)" },
                  ]}
                >
                  <Ionicons name="settings" size={28} color="#229954" />
                </View>
                <Text style={styles.actionText}>Set Budget</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: "rgba(25, 111, 61, 0.1)" },
                  ]}
                >
                  <Ionicons name="share-social" size={28} color="#196F3D" />
                </View>
                <Text style={styles.actionText}>Export Data</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    paddingVertical: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
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
  refreshButton: {
    backgroundColor: "#1E8449",
    borderRadius: 50,
    padding: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    width: "48%",
    marginHorizontal: "1%",
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#7F8C8D",
  },
  timeframeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  timeframeButtonActive: {
    backgroundColor: "#27AE60",
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7F8C8D",
  },
  timeframeTextActive: {
    color: "#FFFFFF",
  },
  chartContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  viewDetails: {
    color: "#27AE60",
    fontWeight: "600",
    fontSize: 14,
  },
  pieChartContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
  },
  emptyChart: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyChartText: {
    fontSize: 16,
    color: "#7F8C8D",
    marginTop: 16,
    fontWeight: "500",
  },
  emptyChartSubtext: {
    fontSize: 14,
    color: "#BDC3C7",
    marginTop: 4,
  },
  legendContainer: {
    marginTop: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    color: "#2C3E50",
  },
  legendValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E50",
  },
  insightsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  insightCard: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: "#7F8C8D",
    lineHeight: 20,
  },
  highlight: {
    color: "#27AE60",
    fontWeight: "600",
  },
  actionsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 40,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
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
    marginBottom: 8,
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
});
