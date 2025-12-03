// app/expenses.jsx
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useExpense } from "../context/ExpenseContext";
import { router } from "expo-router";

export default function ExpensesScreen({ navigation }) {
  const { expenses, deleteExpense } = useExpense();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredExpenses, setFilteredExpenses] = useState(expenses);
  const [sortBy, setSortBy] = useState("date");
  const [filterCategory, setFilterCategory] = useState("All");

  useEffect(() => {
    filterAndSortExpenses();
  }, [expenses, searchQuery, sortBy, filterCategory]);

  const filterAndSortExpenses = () => {
    let result = [...expenses];

    // Filter by search query
    if (searchQuery) {
      result = result.filter(
        (expense) =>
          expense.storeName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          expense.receiptNumber
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          expense.items?.some((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Filter by category
    if (filterCategory !== "All") {
      result = result.filter((expense) => expense.category === filterCategory);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "date") {
        return (
          new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
        );
      } else if (sortBy === "amount") {
        return parseFloat(b.total) - parseFloat(a.total);
      } else if (sortBy === "store") {
        return a.storeName?.localeCompare(b.storeName);
      }
      return 0;
    });

    setFilteredExpenses(result);
  };

  const handleDeleteExpense = (id) => {
    Alert.alert(
      "Delete Receipt",
      "Are you sure you want to delete this receipt?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteExpense(id),
        },
      ]
    );
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

  const getUniqueCategories = () => {
    const categories = [
      "All",
      ...new Set(expenses.map((e) => e.category).filter(Boolean)),
    ];
    return categories;
  };

  const getTotalAmount = () => {
    return filteredExpenses.reduce(
      (sum, expense) => sum + parseFloat(expense.total || 0),
      0
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#27AE60" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Receipts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/addReceipt")}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#7F8C8D"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search receipts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#95A5A6"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#95A5A6" />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              sortBy === "date" && styles.filterButtonActive,
            ]}
            onPress={() => setSortBy("date")}
          >
            <Ionicons
              name="calendar"
              size={16}
              color={sortBy === "date" ? "#FFFFFF" : "#27AE60"}
            />
            <Text
              style={[
                styles.filterText,
                sortBy === "date" && styles.filterTextActive,
              ]}
            >
              Date
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              sortBy === "amount" && styles.filterButtonActive,
            ]}
            onPress={() => setSortBy("amount")}
          >
            <Ionicons
              name="cash"
              size={16}
              color={sortBy === "amount" ? "#FFFFFF" : "#27AE60"}
            />
            <Text
              style={[
                styles.filterText,
                sortBy === "amount" && styles.filterTextActive,
              ]}
            >
              Amount
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              sortBy === "store" && styles.filterButtonActive,
            ]}
            onPress={() => setSortBy("store")}
          >
            <Ionicons
              name="business"
              size={16}
              color={sortBy === "store" ? "#FFFFFF" : "#27AE60"}
            />
            <Text
              style={[
                styles.filterText,
                sortBy === "store" && styles.filterTextActive,
              ]}
            >
              Store
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
          {getUniqueCategories().map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                filterCategory === category && styles.categoryButtonActive,
              ]}
              onPress={() => setFilterCategory(category)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  filterCategory === category &&
                    styles.categoryButtonTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Receipts</Text>
          <Text style={styles.summaryValue}>{filteredExpenses.length}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(getTotalAmount())}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Average</Text>
          <Text style={styles.summaryValue}>
            {filteredExpenses.length > 0
              ? formatCurrency(getTotalAmount() / filteredExpenses.length)
              : "RM 0.00"}
          </Text>
        </View>
      </View>

      {/* Receipts List */}
      <ScrollView style={styles.receiptsList}>
        {filteredExpenses.length > 0 ? (
          filteredExpenses.map((expense) => (
            <TouchableOpacity
              key={expense.id}
              style={styles.receiptCard}
              onPress={() => router.push("/receiptDetail", { id: expense.id })}
            >
              <View style={styles.receiptLeft}>
                <View
                  style={[
                    styles.receiptIcon,
                    {
                      backgroundColor: expense.category ? "#27AE60" : "#95A5A6",
                    },
                  ]}
                >
                  <Ionicons name="receipt" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.receiptInfo}>
                  <Text style={styles.receiptStore} numberOfLines={1}>
                    {expense.storeName || "Unknown Store"}
                  </Text>
                  <Text style={styles.receiptDetails}>
                    {formatDate(expense.date || expense.createdAt)} •{" "}
                    {expense.category || "Uncategorized"}
                    {expense.receiptNumber && ` • #${expense.receiptNumber}`}
                  </Text>
                </View>
              </View>
              <View style={styles.receiptRight}>
                <Text style={styles.receiptAmount}>
                  {formatCurrency(expense.total)}
                </Text>
                <TouchableOpacity
                  style={styles.receiptAction}
                  onPress={() => handleDeleteExpense(expense.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#BDC3C7" />
            <Text style={styles.emptyStateText}>
              {searchQuery || filterCategory !== "All"
                ? "No matching receipts found"
                : "No receipts yet"}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || filterCategory !== "All"
                ? "Try adjusting your search or filters"
                : "Add your first receipt to get started"}
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => router.push("/addReceipt")}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.emptyStateButtonText}>Add First Receipt</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
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
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  addButton: {
    backgroundColor: "#1E8449",
    borderRadius: 50,
    padding: 10,
    elevation: 4,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    marginBottom: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#2C3E50",
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderWidth: 1.5,
    borderColor: "#27AE60",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: "#27AE60",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#27AE60",
    marginLeft: 6,
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryButton: {
    backgroundColor: "#F8F9FA",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: "#27AE60",
    borderColor: "#27AE60",
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7F8C8D",
  },
  categoryButtonTextActive: {
    color: "#FFFFFF",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 6,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#7F8C8D",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  receiptsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
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
  receiptInfo: {
    flex: 1,
  },
  receiptStore: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 4,
  },
  receiptDetails: {
    fontSize: 13,
    color: "#7F8C8D",
  },
  receiptRight: {
    alignItems: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  receiptAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  receiptAction: {
    padding: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
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
    marginBottom: 24,
    textAlign: "center",
  },
  emptyStateButton: {
    backgroundColor: "#27AE60",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    elevation: 4,
  },
  emptyStateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
