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
import { Picker } from "@react-native-picker/picker";

const { width } = Dimensions.get("window");

const CATEGORIES = [
  { name: "Food", icon: "restaurant", color: "#FF6B6B" },
  { name: "Transport", icon: "car", color: "#4ECDC4" },
  { name: "Shopping", icon: "bag", color: "#45B7D1" },
  { name: "Bills", icon: "receipt", color: "#9B59B6" },
  { name: "Entertainment", icon: "game-controller", color: "#F7DC6F" },
  { name: "Other", icon: "ellipsis-horizontal", color: "#95A5A6" },
];

export default function ExpenseDashboard({ onLogout }) {
  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [dailyAverage, setDailyAverage] = useState(0);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadExpenses();
    animateIn();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [expenses]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadExpenses = async () => {
    try {
      const data = await AsyncStorage.getItem("@expenses");
      if (data) setExpenses(JSON.parse(data));
    } catch (e) {
      console.error("Failed to load expenses", e);
    }
  };

  const saveExpenses = async (list) => {
    try {
      await AsyncStorage.setItem("@expenses", JSON.stringify(list));
    } catch (e) {
      Alert.alert("Error", "Failed to save expense");
    }
  };

  const calculateStats = () => {
    const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    setTotalExpenses(total);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTotal = expenses
      .filter((e) => new Date(e.date) >= monthStart)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    setMonthlyExpenses(monthTotal);

    const dayOfMonth = now.getDate();
    setDailyAverage(dayOfMonth > 0 ? monthTotal / dayOfMonth : 0);
  };

  const addExpense = () => {
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      Alert.alert(
        "Invalid Input",
        "Please enter a valid description and amount"
      );
      return;
    }

    const newExpense = {
      id: Date.now().toString(),
      description: description.trim(),
      amount: parseFloat(amount).toFixed(2),
      category,
      date: new Date().toISOString(),
    };

    const updated = [...expenses, newExpense];
    setExpenses(updated);
    saveExpenses(updated);

    // Reset form
    setDescription("");
    setAmount("");
    setCategory("Food");
    setModalVisible(false);
  };

  const deleteExpense = (id) => {
    Alert.alert("Delete Expense", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
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

  const formatCurrency = (val) => `$${Number(val).toFixed(2)}`;
  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      weekday: "short",
    });

  const getCategoryInfo = (name) =>
    CATEGORIES.find((c) => c.name === name) || CATEGORIES[5];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4ECDC4" />

      <Animated.View
        style={[
          styles.animatedContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Claim Lah</Text>
            <Text style={styles.subtitle}>Track smarter, spend wiser</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.fab}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={onLogout}>
              <Ionicons name="log-out-outline" size={26} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Stats Cards */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: "#4ECDC4" }]}>
              <Ionicons name="calendar-outline" size={28} color="white" />
              <Text style={styles.statValue}>
                {formatCurrency(monthlyExpenses)}
              </Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: "#FF6B6B" }]}>
              <Ionicons name="wallet-outline" size={28} color="white" />
              <Text style={styles.statValue}>
                {formatCurrency(totalExpenses)}
              </Text>
              <Text style={styles.statLabel}>All Time</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: "#9B59B6" }]}>
              <Ionicons name="trending-up-outline" size={28} color="white" />
              <Text style={styles.statValue}>
                {formatCurrency(dailyAverage)}
              </Text>
              <Text style={styles.statLabel}>Daily Average</Text>
            </View>
          </View>

          {/* Recent Expenses */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>

            {expenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={64} color="#ddd" />
                <Text style={styles.emptyText}>No expenses yet</Text>
                <Text style={styles.emptySubtext}>
                  Tap + to add your first expense
                </Text>
              </View>
            ) : (
              <View style={styles.expenseList}>
                {expenses
                  .slice()
                  .reverse()
                  .slice(0, 8)
                  .map((expense) => {
                    const cat = getCategoryInfo(expense.category);
                    return (
                      <TouchableOpacity
                        key={expense.id}
                        style={styles.expenseItem}
                        onLongPress={() => deleteExpense(expense.id)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.categoryIcon,
                            { backgroundColor: cat.color + "22" },
                          ]}
                        >
                          <Ionicons
                            name={cat.icon}
                            size={24}
                            color={cat.color}
                          />
                        </View>
                        <View style={styles.expenseDetails}>
                          <Text style={styles.expenseDescription}>
                            {expense.description}
                          </Text>
                          <Text style={styles.expenseMeta}>
                            {cat.name} • {formatDate(expense.date)}
                          </Text>
                        </View>
                        <Text style={styles.expenseAmount}>
                          {formatCurrency(expense.amount)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Add Expense Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Expense</Text>

            <TextInput
              style={styles.input}
              placeholder="What did you spend on?"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
            />

            <TextInput
              style={styles.input}
              placeholder="Amount (e.g. 12.50)"
              placeholderTextColor="#999"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={setCategory}
                style={styles.picker}
              >
                {CATEGORIES.map((c) => (
                  <Picker.Item key={c.name} label={c.name} value={c.name} />
                ))}
              </Picker>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addBtn} onPress={addExpense}>
                <Text style={styles.addBtnText}>Add Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  animatedContainer: { flex: 1 },
  header: {
    backgroundColor: "#4ECDC4",
    padding: 24,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: { fontSize: 34, fontWeight: "800", color: "white" },
  subtitle: { fontSize: 16, color: "rgba(255,255,255,0.9)", marginTop: 4 },
  headerButtons: { flexDirection: "row", alignItems: "center", gap: 16 },
  fab: {
    backgroundColor: "rgba(255,255,255,0.25)",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBtn: { padding: 8 },

  statsGrid: { flexDirection: "row", padding: 20, gap: 12, flexWrap: "wrap" },
  statCard: {
    flex: 1,
    minWidth: width / 3.5,
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statValue: { fontSize: 22, fontWeight: "bold", color: "white", marginTop: 8 },
  statLabel: { fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 4 },

  section: { padding: 20 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 16,
  },

  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 18, color: "#95a5a6", marginTop: 16 },
  emptySubtext: { fontSize: 14, color: "#bdc3c7", marginTop: 8 },

  expenseList: { gap: 12 },
  expenseItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  expenseDetails: { flex: 1 },
  expenseDescription: { fontSize: 16, fontWeight: "600", color: "#2c3e50" },
  expenseMeta: { fontSize: 13, color: "#95a5a6", marginTop: 4 },
  expenseAmount: { fontSize: 18, fontWeight: "bold", color: "#4ECDC4" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
    color: "#2c3e50",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
    marginBottom: 24,
  },
  picker: { height: 50 },
  modalButtons: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#eee",
    alignItems: "center",
  },
  cancelText: { fontSize: 16, fontWeight: "600", color: "#666" },
  addBtn: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#4ECDC4",
    alignItems: "center",
  },
  addBtnText: { fontSize: 16, fontWeight: "bold", color: "white" },
});
