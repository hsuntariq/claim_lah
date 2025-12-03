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
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { BarChart, PieChart } from "expo-charts";

const { width } = Dimensions.get("window");

const CATEGORIES = [
  { name: "Food", color: "#FF6B6B" },
  { name: "Transport", color: "#4ECDC4" },
  { name: "Shopping", color: "#45B7D1" },
  { name: "Bills", color: "#96CEB4" },
  { name: "Entertainment", color: "#F7DC6F" },
];

export default function ExpenseDashboard({ onLogout }) {
  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [dailyAverage, setDailyAverage] = useState(0);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(new Date());

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    loadExpenses();
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
  }, []);

  useEffect(() => {
    calculateStats();
  }, [expenses]);

  const loadExpenses = async () => {
    try {
      const data = await AsyncStorage.getItem("@expenses");
      if (data) setExpenses(JSON.parse(data));
    } catch (e) {
      console.error(e);
    }
  };

  const saveExpenses = async (list) => {
    await AsyncStorage.setItem("@expenses", JSON.stringify(list));
  };

  const calculateStats = () => {
    const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    setTotalExpenses(total);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthExpenses = expenses
      .filter((e) => new Date(e.date) >= monthStart)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    setMonthlyExpenses(monthExpenses);

    const dayOfMonth = now.getDate();
    setDailyAverage(dayOfMonth ? monthExpenses / dayOfMonth : 0);
  };

  const getPieData = () => {
    return CATEGORIES.map((cat) => ({
      name: cat.name,
      value: expenses
        .filter((e) => e.category === cat.name)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0),
      color: cat.color,
    })).filter((item) => item.value > 0);
  };

  const getBarData = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dayStr = date.toISOString().slice(0, 10);

      const total = expenses
        .filter((e) => e.date.startsWith(dayStr))
        .reduce((s, e) => s + parseFloat(e.amount), 0);

      return {
        value: total,
        label: days[date.getDay()],
      };
    });
  };

  const addExpense = () => {
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please fill all fields correctly");
      return;
    }

    const newExp = {
      id: Date.now().toString(),
      description: description.trim(),
      amount: parseFloat(amount).toFixed(2),
      category,
      date: date.toISOString(),
    };

    const updated = [...expenses, newExp];
    setExpenses(updated);
    saveExpenses(updated);

    // Reset
    setDescription("");
    setAmount("");
    setCategory("Food");
    setDate(new Date());
    setModalVisible(false);
  };

  const deleteExpense = (id) => {
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

  const formatCurrency = (val) => `$${Number(val).toFixed(2)}`;
  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

  const pieData = getPieData();
  const barData = getBarData();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4ECDC4" barStyle="light-content" />

      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Claim Lah</Text>
            <Text style={styles.subtitle}>Track expenses effortlessly</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={onLogout}>
              <Ionicons name="log-out-outline" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {/* Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.card}>
              <Text style={styles.cardValue}>
                {formatCurrency(monthlyExpenses)}
              </Text>
              <Text style={styles.cardLabel}>This Month</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardValue}>
                {formatCurrency(totalExpenses)}
              </Text>
              <Text style={styles.cardLabel}>All Time</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardValue}>
                {formatCurrency(dailyAverage)}
              </Text>
              <Text style={styles.cardLabel}>Daily Avg</Text>
            </View>
          </View>

          {/* Weekly Bar Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>This Week</Text>
            <BarChart
              data={barData}
              width={width - 60}
              height={220}
              chartConfig={{
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                color: () => "#4ECDC4",
                labelColor: () => "#666",
                barPercentage: 0.6,
                decimalPlaces: 0,
              }}
              showValuesOnTopOfBars
              fromZero
              withHorizontalLabels
              withInnerLines={false}
            />
          </View>

          {/* Pie Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>By Category</Text>
            {pieData.length > 0 ? (
              <PieChart
                data={pieData}
                width={width - 60}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="value"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            ) : (
              <View style={styles.empty}>
                <Text>No data yet</Text>
              </View>
            )}
          </View>

          {/* Recent Expenses */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Recent Expenses</Text>
            {expenses.length === 0 ? (
              <Text
                style={{ textAlign: "center", color: "#999", marginTop: 20 }}
              >
                No expenses added yet
              </Text>
            ) : (
              expenses
                .slice(-5)
                .reverse()
                .map((e) => (
                  <TouchableOpacity
                    key={e.id}
                    style={styles.expenseRow}
                    onLongPress={() => deleteExpense(e.id)}
                  >
                    <View>
                      <Text style={styles.expenseDesc}>{e.description}</Text>
                      <Text style={styles.expenseMeta}>
                        {e.category} • {formatDate(e.date)}
                      </Text>
                    </View>
                    <Text style={styles.expenseAmt}>
                      {formatCurrency(e.amount)}
                    </Text>
                  </TouchableOpacity>
                ))
            )}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Expense</Text>

            <TextInput
              style={styles.input}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
            />
            <TextInput
              style={styles.input}
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <Picker selectedValue={category} onValueChange={setCategory}>
              {CATEGORIES.map((c) => (
                <Picker.Item key={c.name} label={c.name} value={c.name} />
              ))}
            </Picker>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: "#333" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={addExpense}>
                <Text style={{ color: "white", fontWeight: "bold" }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Styles remain almost the same — just cleaner
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#4ECDC4",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 32, fontWeight: "bold", color: "white" },
  subtitle: { color: "#fff", opacity: 0.9 },
  iconBtn: { padding: 8 },
  statsGrid: { flexDirection: "row", padding: 20, gap: 10 },
  card: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardValue: { fontSize: 20, fontWeight: "bold", color: "#333" },
  cardLabel: { fontSize: 12, color: "#666", marginTop: 4 },
  chartCard: {
    backgroundColor: "white",
    margin: 20,
    marginBottom: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  chartTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  expenseDesc: { fontWeight: "500" },
  expenseMeta: { fontSize: 12, color: "#888" },
  expenseAmt: { fontWeight: "bold", color: "#4ECDC4" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: "#4ECDC4",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: "#eee",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
});
