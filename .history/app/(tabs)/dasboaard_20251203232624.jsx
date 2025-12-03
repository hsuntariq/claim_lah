// screens/ExpenseDashboard.js
import React, { useState, useEffect } from "react";
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
import {
  VictoryChart,
  VictoryLine,
  VictoryBar,
  VictoryPie,
  VictoryTheme,
  VictoryAxis,
  VictoryLabel,
  VictoryTooltip,
} from "victory-native";

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
  const pieData = categories.filter((cat) => cat.value > 0);

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
            <Text style={styles.headerSubtitle}>
              Expense Tracking Dashboard
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add-circle" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Stats Overview */}
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

          {/* Weekly Chart */}
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Weekly Expenses</Text>
            <View style={styles.chartWrapper}>
              <VictoryChart
                theme={VictoryTheme.material}
                width={width - 60}
                height={220}
                padding={{ top: 20, bottom: 40, left: 40, right: 20 }}
              >
                <VictoryAxis
                  tickValues={[1, 2, 3, 4, 5, 6, 7]}
                  tickFormat={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
                  style={{
                    axis: { stroke: "#BDC3C7" },
                    tickLabels: { fontSize: 12, padding: 5, fill: "#7F8C8D" },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    axis: { stroke: "#BDC3C7" },
                    tickLabels: { fontSize: 12, padding: 5, fill: "#7F8C8D" },
                  }}
                />
                <VictoryLine
                  data={weeklyData}
                  x="day"
                  y="amount"
                  style={{
                    data: { stroke: "#27AE60", strokeWidth: 3 },
                    parent: { border: "1px solid #ccc" },
                  }}
                  interpolation="natural"
                />
                <VictoryBar
                  data={weeklyData}
                  x="day"
                  y="amount"
                  style={{
                    data: { fill: "#2ECC71", width: 20, opacity: 0.6 },
                  }}
                  cornerRadius={{ top: 5 }}
                />
              </VictoryChart>
            </View>
          </View>

          {/* Category Breakdown */}
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            <View style={styles.pieChartWrapper}>
              {pieData.length > 0 ? (
                <VictoryPie
                  data={pieData}
                  x="name"
                  y="value"
                  colorScale={pieData.map((cat) => cat.color)}
                  width={width - 60}
                  height={200}
                  padding={{ top: 0, bottom: 40, left: 40, right: 40 }}
                  innerRadius={40}
                  labels={({ datum }) =>
                    `${datum.name}: ${formatCurrency(datum.value)}`
                  }
                  labelRadius={({ innerRadius }) => innerRadius + 45}
                  style={{
                    labels: { fontSize: 11, fill: "#2C3E50", padding: 5 },
                    data: { stroke: "#FFFFFF", strokeWidth: 2 },
                  }}
                />
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
            {pieData.length > 0 && (
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
            )}
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
                      <View>
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
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Expense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Lunch at Restaurant"
                  value={description}
                  onChangeText={setDescription}
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
              >
                <Text style={styles.submitButtonText}>Add Expense</Text>
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
  header: {
    backgroundColor: "#27AE60",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#D5FFE4",
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  addButton: {
    backgroundColor: "#1E8449",
    borderRadius: 50,
    padding: 10,
    elevation: 3,
  },
  logoutButton: {
    backgroundColor: "#1E8449",
    borderRadius: 50,
    padding: 10,
    marginLeft: 10,
    elevation: 3,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#7F8C8D",
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginTop: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  pieChartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  emptyChart: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
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
  categoryLegend: {
    marginTop: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
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
  expensesContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  viewAllText: {
    color: "#27AE60",
    fontWeight: "600",
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  expenseLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2C3E50",
  },
  expenseCategory: {
    fontSize: 12,
    color: "#7F8C8D",
    marginTop: 2,
  },
  expenseRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
    marginRight: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#7F8C8D",
    marginTop: 16,
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
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#F8F9FA",
  },
  categoryButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -5,
  },
  categoryButton: {
    backgroundColor: "#F8F9FA",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  categoryButtonSelected: {
    backgroundColor: "#27AE60",
    borderColor: "#27AE60",
  },
  categoryButtonText: {
    color: "#7F8C8D",
    fontWeight: "500",
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
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#F8F9FA",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#2C3E50",
    marginLeft: 10,
  },
  submitButton: {
    backgroundColor: "#27AE60",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
