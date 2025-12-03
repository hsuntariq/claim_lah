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

// Official Expo Charts — Native & Smooth
import { LineChart, PieChart } from "expo-charts";

const { width } = Dimensions.get("window");

// Safe number helper — prevents ALL NaN crashes
const safeNumber = (n) => {
  const num = parseFloat(n);
  return isNaN(num) || num === null || num === undefined
    ? 0
    : Number(num.toFixed(2));
};

export default function ExpenseDashboard({ onLogout }) {
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

  const loadExpenses = async () => {
    try {
      const stored = await AsyncStorage.getItem("@expenses");
      if (stored) {
        const parsed = JSON.parse(stored);
        setExpenses(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.error("Failed to load expenses", e);
      setExpenses([]);
    }
  };

  const saveExpenses = async (list) => {
    try {
      await AsyncStorage.setItem("@expenses", JSON.stringify(list));
    } catch (e) {
      console.error("Failed to save expenses", e);
    }
  };

  const calculateStatistics = () => {
    const total = expenses.reduce((sum, e) => sum + safeNumber(e.amount), 0);
    setTotalExpenses(total);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthExpenses = expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + safeNumber(e.amount), 0);
    setMonthlyExpenses(monthExpenses);

    const dayOfMonth = now.getDate();
    setDailyAverage(dayOfMonth > 0 ? monthExpenses / dayOfMonth : 0);

    const updatedCats = categories.map((cat) => ({ ...cat, value: 0 }));
    expenses.forEach((e) => {
      const cat = updatedCats.find((c) => c.name === e.category);
      if (cat) cat.value += safeNumber(e.amount);
    });
    setCategories(updatedCats);
  };

  // BULLETPROOF weekly data — starts on Monday, never NaN
  const weeklyData = (() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + 1); // Monday

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((label, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);

      const total = expenses
        .filter((e) => new Date(e.date).toDateString() === day.toDateString())
        .reduce((sum, e) => sum + safeNumber(e.amount), 0);

      return { label, value: safeNumber(total) };
    });
  })();

  // Safe pie chart data
  const pieData = categories
    .filter((cat) => cat.value > 0)
    .map((cat) => ({
      label: cat.name,
      value: safeNumber(cat.value),
    }));

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

    const updated = [...expenses, newExpense];
    setExpenses(updated);
    saveExpenses(updated);

    setDescription("");
    setAmount("");
    setSelectedCategory("Food");
    setDate(new Date());
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

  const formatCurrency = (v) => `$${safeNumber(v).toFixed(2)}`;
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#27AE60" barStyle="light-content" />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
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
                <Text style={styles.statLabel}>Total Spent</Text>
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

          {/* Weekly Line Chart — 100% Safe */}
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Weekly Spending</Text>
            {weeklyData.some((d) => d.value > 0) ? (
              <LineChart
                data={weeklyData}
                width={width - 60}
                height={220}
                lineColor="#27AE60"
                accentColor="#2ECC71"
                backgroundColor="#F8F9FA"
                labelColor="#7F8C8D"
                axisColor="#E0E0E0"
                bezier
                showDots
                animate
                fromZero
                yAxisInterval={1}
                segments={4}
                formatValue={(v) => `$${v}`}
              />
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="trending-up" size={48} color="#BDC3C7" />
                <Text style={styles.emptyText}>No spending this week</Text>
              </View>
            )}
          </View>

          {/* Pie Chart */}
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>By Category</Text>
            {pieData.length > 0 ? (
              <>
                <PieChart
                  data={pieData}
                  width={width - 60}
                  height={240}
                  primaryColor="#27AE60"
                  secondaryColor="#2ECC71"
                  animate
                  showValues
                  getSliceColor={(i) =>
                    categories.find((c) => c.name === pieData[i]?.label)
                      ?.color || "#27AE60"
                  }
                />
                <View style={styles.legend}>
                  {categories
                    .filter((c) => c.value > 0)
                    .map((c, i) => (
                      <View key={i} style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendDot,
                            { backgroundColor: c.color },
                          ]}
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
                <Ionicons name="pie-chart-outline" size={48} color="#BDC3C7" />
                <Text style={styles.emptyText}>No expenses yet</Text>
              </View>
            )}
          </View>

          {/* Recent Expenses */}
          <View style={styles.expensesContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Expenses</Text>
              <Text style={styles.viewAllText}>View All</Text>
            </View>
            {expenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={64} color="#BDC3C7" />
                <Text style={styles.emptyStateText}>No expenses recorded</Text>
                <Text style={styles.emptyStateSubtext}>
                  Tap + to add your first one
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
                  >
                    <View style={styles.expenseLeft}>
                      <View
                        style={[
                          styles.categoryIcon,
                          {
                            backgroundColor:
                              categories.find(
                                (c) => c.name === expense.category
                              )?.color || "#27AE60",
                          },
                        ]}
                      >
                        <Ionicons name="pricetag" size={18} color="#fff" />
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
                    <Text style={styles.expenseAmount}>
                      {formatCurrency(expense.amount)}
                    </Text>
                  </TouchableOpacity>
                ))
            )}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Add Expense Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Expense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Grab ride to office"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount ($)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="25.50"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryButtons}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.name}
                      style={[
                        styles.categoryButton,
                        selectedCategory === cat.name &&
                          styles.categoryButtonSelected,
                      ]}
                      onPress={() => setSelectedCategory(cat.name)}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          selectedCategory === cat.name &&
                            styles.categoryButtonTextSelected,
                        ]}
                      >
                        {cat.name}
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
                    {date.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    onChange={(e, d) => {
                      setShowDatePicker(false);
                      if (d) setDate(d);
                    }}
                  />
                )}
              </View>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddExpense}
              >
                <Text style={styles.submitButtonText}>Add Expense</Text>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color="#fff"
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Clean, modern styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: {
    backgroundColor: "#27AE60",
    padding: 20,
    paddingTop: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appName: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  headerSubtitle: { fontSize: 14, color: "#d0f8e0", marginTop: 4 },
  headerRight: { flexDirection: "row", gap: 12 },
  addButton: { backgroundColor: "#1e8449", padding: 12, borderRadius: 50 },
  logoutButton: { backgroundColor: "#1e8449", padding: 12, borderRadius: 50 },
  statsContainer: { padding: 20 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 16,
  },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flex: 1,
    alignItems: "center",
    elevation: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 8,
  },
  statLabel: { fontSize: 12, color: "#7f8c8d", marginTop: 4 },
  chartContainer: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 20,
    padding: 20,
    elevation: 3,
  },
  emptyChart: { alignItems: "center", paddingVertical: 40 },
  emptyText: { marginTop: 16, color: "#95a5a6", fontSize: 16 },
  legend: { marginTop: 20 },
  legendItem: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  legendText: { flex: 1, fontSize: 15, color: "#2c3e50" },
  legendValue: { fontWeight: "600", color: "#2c3e50" },
  expensesContainer: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 20,
    padding: 20,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  viewAllText: { color: "#27AE60", fontWeight: "600" },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  expenseLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  expenseDescription: { fontSize: 16, fontWeight: "600", color: "#2c3e50" },
  expenseCategory: { fontSize: 13, color: "#7f8c8d", marginTop: 4 },
  expenseAmount: { fontSize: 16, fontWeight: "bold", color: "#2c3e50" },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyStateText: { fontSize: 18, color: "#7f8c8d", marginTop: 20 },
  emptyStateSubtext: { fontSize: 14, color: "#bdc3c7", marginTop: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: "#2c3e50" },
  modalContent: { padding: 24 },
  inputGroup: { marginBottom: 24 },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  categoryButtons: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1.5,
    borderColor: "#ddd",
  },
  categoryButtonSelected: {
    backgroundColor: "#27AE60",
    borderColor: "#27AE60",
  },
  categoryButtonText: { fontWeight: "600", color: "#666" },
  categoryButtonTextSelected: { color: "#fff" },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  dateButtonText: { marginLeft: 12, fontSize: 16, color: "#2c3e50" },
  submitButton: {
    backgroundColor: "#27AE60",
    padding: 18,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
