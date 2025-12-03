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

// Official Expo Charts (native performance)
import { LineChart, PieChart } from "expo-charts";

const { width } = Dimensions.get("window");
const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  color: (opacity = 1) => `rgba(39, 174, 96, ${opacity})`, // #27AE60
  labelColor: () => "#7f8c8d",
  strokeWidth: 3,
  barPercentage: 0.7,
  decimalPlaces: 0,
};

export default function ExpenseDashboard({ onLogout }) {
  // All your existing state
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

  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Food");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadExpenses();
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

  useEffect(() => {
    calculateStatistics();
  }, [expenses]);

  // [Keep all your existing functions unchanged]
  // loadExpenses, saveExpenses, calculateStatistics, getWeeklyData, etc.
  // They are perfect — just paste them back in

  const loadExpenses = async () => {
    try {
      const stored = await AsyncStorage.getItem("@expenses");
      if (stored) setExpenses(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  };

  const saveExpenses = async (list) => {
    try {
      await AsyncStorage.setItem("@expenses", JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const calculateStatistics = () => {
    const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    setTotalExpenses(total);

    const now = new Date();
    const monthExpenses = expenses
      .filter(
        (e) =>
          new Date(e.date).getMonth() === now.getMonth() &&
          new Date(e.date).getFullYear() === now.getFullYear()
      )
      .reduce((s, e) => s + parseFloat(e.amount), 0);
    setMonthlyExpenses(monthExpenses);

    const dayOfMonth = now.getDate();
    setDailyAverage(dayOfMonth > 0 ? monthExpenses / dayOfMonth : 0);

    const updated = categories.map((cat) => ({ ...cat, value: 0 }));
    expenses.forEach((e) => {
      const cat = updated.find((c) => c.name === e.category);
      if (cat) cat.value += parseFloat(e.amount);
    });
    setCategories(updated);
  };

  const getWeeklyData = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + 1); // Monday

    return days.map((day, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dayTotal = expenses
        .filter((e) => new Date(e.date).toDateString() === date.toDateString())
        .reduce((s, e) => s + parseFloat(e.amount), 0);
      return { day, value: dayTotal };
    });
  };

  const handleAddExpense = () => {
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please fill in valid description and amount");
      return;
    }

    const newExp = {
      id: Date.now().toString(),
      description: description.trim(),
      amount: parseFloat(amount).toFixed(2),
      category: selectedCategory,
      date: date.toISOString(),
    };

    const updated = [...expenses, newExp];
    setExpenses(updated);
    saveExpenses(updated);

    setDescription("");
    setAmount("");
    setModalVisible(false);
    Alert.alert("Success", "Expense added!");
  };

  const handleDeleteExpense = (id) => {
    Alert.alert("Delete", "Remove this expense?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const filtered = expenses.filter((e) => e.id !== id);
          setExpenses(filtered);
          saveExpenses(filtered);
        },
      },
    ]);
  };

  const formatCurrency = (v) => `$${parseFloat(v).toFixed(2)}`;
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const weeklyData = getWeeklyData();
  const pieData = categories.filter((c) => c.value > 0);

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
            <Text style={styles.headerSubtitle}>Expense Dashboard</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add-circle" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Stats */}
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Overview</Text>
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
                <Text style={styles.statLabel}>Daily Avg</Text>
              </View>
            </View>
          </View>

          {/* Weekly Line Chart - Native Expo Charts */}
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Weekly Spending</Text>
            {weeklyData.some((d) => d.value > 0) ? (
              <LineChart
                data={{
                  labels: weeklyData.map((d) => d.day),
                  datasets: [{ data: weeklyData.map((d) => d.value) }],
                }}
                width={width - 60}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={{ borderRadius: 16 }}
              />
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="trending-up" size={48} color="#ddd" />
                <Text style={styles.emptyText}>No data this week</Text>
              </View>
            )}
          </View>

          {/* Pie Chart - Native Expo Charts */}
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>By Category</Text>
            {pieData.length > 0 ? (
              <>
                <PieChart
                  data={pieData.map((c) => ({
                    name: c.name,
                    value: c.value,
                    color: c.color,
                  }))}
                  width={width - 60}
                  height={240}
                  chartConfig={chartConfig}
                  accessor="value"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
                <View style={styles.legend}>
                  {pieData.map((c, i) => (
                    <View key={i} style={styles.legendItem}>
                      <View
                        style={[styles.legendDot, { backgroundColor: c.color }]}
                      />
                      <Text style={styles.legendText}>{c.name}</Text>
                      <Text style={styles.legendValue}>
                        {formatCurrency(c.value)}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="pie-chart-outline" size={48} color="#ddd" />
                <Text style={styles.emptyText}>No expenses yet</Text>
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
