// screens/ExpenseDashboard.js
import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

// Import Expo Charts
import { LineChart, PieChart } from "expo-charts";

const { width } = Dimensions.get("window");

export default function ExpenseDashboard({ onLogout }) {
  // State variables
  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [dailyAverage, setDailyAverage] = useState(0);
  const [categories, setCategories] = useState([
    { name: "Food", value: 0, color: "#2ECC71" },
    { name: "Transport", value: 0, color: "#27AE60" },
    { name: "Shopping", value: 0, color: "#229954" },
    { name: "Bills", value: 0, color: "#1E8449" },
    { name: "Entertainment", value: 0, color: "#196F3D" },
  ]);

  // Form state
  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Food");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadExpenses();
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Calculate statistics when expenses change
  useEffect(() => {
    calculateStatistics();
  }, [expenses]);

  const loadExpenses = async () => {
    try {
      const storedExpenses = await AsyncStorage.getItem("@expenses");
      if (storedExpenses !== null) {
        const parsedExpenses = JSON.parse(storedExpenses);
        setExpenses(parsedExpenses);
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
    }
  };

  const saveExpenses = async (expensesList) => {
    try {
      await AsyncStorage.setItem("@expenses", JSON.stringify(expensesList));
    } catch (error) {
      console.error("Error saving expenses:", error);
    }
  };

  const calculateStatistics = () => {
    // Calculate total expenses
    const total = expenses.reduce(
      (sum, expense) => sum + parseFloat(expense.amount),
      0
    );
    setTotalExpenses(total);

    // Calculate current month expenses
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthExpenses = expenses
      .filter((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getMonth() === currentMonth &&
          expenseDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    setMonthlyExpenses(monthExpenses);

    // Calculate daily average for current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = new Date().getDate();
    const average = monthExpenses / currentDay;
    setDailyAverage(isNaN(average) ? 0 : average);

    // Update category data
    const updatedCategories = [...categories];
    updatedCategories.forEach((cat) => (cat.value = 0));

    expenses.forEach((expense) => {
      const categoryIndex = updatedCategories.findIndex(
        (cat) => cat.name === expense.category
      );
      if (categoryIndex !== -1) {
        updatedCategories[categoryIndex].value += parseFloat(expense.amount);
      }
    });

    setCategories(updatedCategories);
  };

  const getWeeklyData = () => {
    // Get current week's expenses
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekData = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);

      const dayExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate.toDateString() === day.toDateString();
      });

      const total = dayExpenses.reduce(
        (sum, expense) => sum + parseFloat(expense.amount),
        0
      );

      weekData.push({
        day: weekDays[i],
        amount: total,
        date: day.toLocaleDateString("en-US", { weekday: "short" }),
      });
    }

    return weekData;
  };

  const handleAddExpense = () => {
    if (!description.trim() || !amount.trim() || parseFloat(amount) <= 0) {
      Alert.alert(
        "Invalid Input",
        "Please enter a valid description and amount."
      );
      return;
    }

    const newExpense = {
      id: Date.now().toString(),
      description: description.trim(),
      amount: parseFloat(amount).toFixed(2),
      category: selectedCategory,
      date: date.toISOString(),
    };

    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);

    // Reset form
    setDescription("");
    setAmount("");
    setSelectedCategory("Food");
    setDate(new Date());
    setModalVisible(false);

    Alert.alert("Success", "Expense added successfully!");
  };

  const handleDeleteExpense = (id) => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedExpenses = expenses.filter(
              (expense) => expense.id !== id
            );
            setExpenses(updatedExpenses);
            saveExpenses(updatedExpenses);
          },
        },
      ]
    );
  };

  const formatCurrency = (value) => {
    return `$${parseFloat(value).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const weeklyData = getWeeklyData();
  const pieData = categories
    .filter((cat) => cat.value > 0)
    .map((cat) => ({
      name: cat.name,
      value: cat.value,
      color: cat.color,
    }));

  // Prepare data for Expo LineChart
  const lineChartData = {
    labels: weeklyData.map((d) => d.day),
    datasets: [
      {
        data: weeklyData.map((d) => parseFloat(d.amount.toFixed(2))),
        color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`, // #2ECC71
        strokeWidth: 3,
      },
    ],
  };

  // Prepare data for Expo PieChart
  const pieChartData = pieData.map((item) => ({
    value: item.value,
    color: item.color,
    label: item.name,
  }));

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
        {/* Header - unchanged */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>Claim Lah</Text>
            <Text style={styles.headerSubtitle}>
              Expense Tracking Dashboard
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={onLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Stats Overview - unchanged */}
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Expense Overview</Text>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Ionicons name="calendar" size={24} color="#27AE60" />
                <Text style={styles.statValue}>
                  {formatCurrency(monthlyExpenses)}
                </Text>
                <Text style={styles.statLabel}>This Month</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="cash" size={24} color="#27AE60" />
                <Text style={styles.statValue}>
                  {formatCurrency(totalExpenses)}
                </Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="trending-up" size={24} color="#27AE60" />
                <Text style={styles.statValue}>
                  {formatCurrency(dailyAverage)}
                </Text>
                <Text style={styles.statLabel}>Daily Average</Text>
              </View>
            </View>
          </View>

          {/* Weekly Chart - Now using Expo LineChart */}
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <Text style={styles.sectionTitle}>Weekly Expenses</Text>
              <TouchableOpacity>
                <Text style={styles.viewDetailsText}>View Details</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.chartWrapper}>
              {weeklyData.some((d) => d.amount > 0) ? (
                <LineChart
                  data={lineChartData}
                  width={width - 80}
                  height={220}
                  chartConfig={{
                    backgroundColor: "#F8F9FA",
                    backgroundGradientFrom: "#F8F9FA",
                    backgroundGradientTo: "#F8F9FA",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
                    labelColor: () => `#7F8C8D`,
                    style: { borderRadius: 16 },
                    propsForDots: {
                      r: "6",
                      strokeWidth: "2",
                      stroke: "#27AE60",
                    },
                  }}
                  bezier
                  style={{ borderRadius: 12 }}
                  withHorizontalLabels={true}
                  withVerticalLabels={true}
                  fromZero={true}
                />
              ) : (
                <View style={styles.emptyChart}>
                  <Ionicons name="trending-up" size={48} color="#D5D5D5" />
                  <Text style={styles.emptyChartText}>No weekly data yet</Text>
                </View>
              )}
            </View>
          </View>

          {/* Category Breakdown - Now using Expo PieChart */}
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <Text style={styles.sectionTitle}>Spending by Category</Text>
              <TouchableOpacity>
                <Text style={styles.viewDetailsText}>View Details</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pieChartWrapper}>
              {pieChartData.length > 0 ? (
                <>
                  <PieChart
                    data={pieChartData}
                    width={width - 80}
                    height={220}
                    accessor="value"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute // shows actual values instead of percentage
                  />
                  <View style={styles.categoryLegend}>
                    {pieData.map((category, index) => (
                      <View key={index} style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendColor,
                            { backgroundColor: category.color },
                          ]}
                        />
                        <Text style={styles.legendText}>{category.name}</Text>
                        <Text style={styles.legendAmount}>
                          {formatCurrency(category.value)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <View style={styles.emptyChart}>
                  <Ionicons
                    name="pie-chart-outline"
                    size={48}
                    color="#D5D5D5"
                  />
                  <Text style={styles.emptyChartText}>
                    No category data yet
                  </Text>
                  <Text style={styles.emptyChartSubtext}>
                    Add expenses to see breakdown
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Recent Expenses */}
          <View style={styles.expensesContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Expenses</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {expenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={64} color="#D5D5D5" />
                <Text style={styles.emptyStateText}>
                  No expenses recorded yet
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Add your first expense to get started
                </Text>
              </View>
            ) : (
              expenses
                .slice()
                .reverse()
                .slice(0, 5)
                .map((expense) => (
                  <TouchableOpacity
                    key={expense.id}
                    style={styles.expenseItem}
                    onPress={() => handleDeleteExpense(expense.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.expenseLeft}>
                      <View
                        style={[
                          styles.categoryIcon,
                          {
                            backgroundColor:
                              categories.find(
                                (cat) => cat.name === expense.category
                              )?.color || "#27AE60",
                          },
                        ]}
                      >
                        <Ionicons name="pricetag" size={18} color="#FFFFFF" />
                      </View>
                      <View style={styles.expenseDetails}>
                        <Text style={styles.expenseDescription}>
                          {expense.description}
                        </Text>
                        <Text style={styles.expenseCategory}>
                          {expense.category} • {formatDate(expense.date)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.expenseRight}>
                      <Text style={styles.expenseAmount}>
                        {formatCurrency(expense.amount)}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#BDC3C7"
                      />
                    </View>
                  </TouchableOpacity>
                ))
            )}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Add Expense Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Expense</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#2C3E50" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Lunch at Restaurant"
                  value={description}
                  onChangeText={setDescription}
                  placeholderTextColor="#95A5A6"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount ($)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 25.50"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#95A5A6"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryButtons}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.name}
                      style={[
                        styles.categoryButton,
                        selectedCategory === category.name &&
                          styles.categoryButtonSelected,
                      ]}
                      onPress={() => setSelectedCategory(category.name)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          selectedCategory === category.name &&
                            styles.categoryButtonTextSelected,
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar" size={20} color="#27AE60" />
                  <Text style={styles.dateButtonText}>
                    {date.toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setDate(selectedDate);
                      }
                    }}
                  />
                )}
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddExpense}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>Add Expense</Text>
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color="#FFFFFF"
                  style={styles.submitIcon}
                />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 30,
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  addButton: {
    backgroundColor: "#1E8449",
    borderRadius: 50,
    padding: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  logoutButton: {
    backgroundColor: "#1E8449",
    borderRadius: 50,
    padding: 10,
    marginLeft: 12,
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
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 6,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginTop: 12,
  },
  statLabel: {
    fontSize: 12,
    color: "#7F8C8D",
    marginTop: 6,
  },
  chartContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
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
  viewDetailsText: {
    color: "#27AE60",
    fontWeight: "600",
    fontSize: 14,
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 10,
  },
  pieChartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
  },
  categoryLegend: {
    marginTop: 24,
    width: "100%",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    color: "#2C3E50",
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E50",
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
  expensesContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  viewAllText: {
    color: "#27AE60",
    fontWeight: "600",
    fontSize: 14,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  expenseLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 13,
    color: "#7F8C8D",
  },
  expenseRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
    marginRight: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#7F8C8D",
    marginTop: 20,
    fontWeight: "500",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#BDC3C7",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#2C3E50",
    backgroundColor: "#F8F9FA",
  },
  categoryButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  categoryButton: {
    backgroundColor: "#F8F9FA",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginHorizontal: 6,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  categoryButtonSelected: {
    backgroundColor: "#27AE60",
    borderColor: "#27AE60",
  },
  categoryButtonText: {
    color: "#7F8C8D",
    fontWeight: "500",
    fontSize: 14,
  },
  categoryButtonTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#F8F9FA",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#2C3E50",
    marginLeft: 12,
  },
  submitButton: {
    backgroundColor: "#27AE60",
    borderRadius: 12,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  submitIcon: {
    marginLeft: 10,
  },
});
