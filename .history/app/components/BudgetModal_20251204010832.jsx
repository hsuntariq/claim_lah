// components/BudgetModal.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useExpense } from "../context/ExpenseContext";

const BudgetModal = ({ visible, onClose, onSave }) => {
  const { budgets, categories, updateBudget } = useExpense();
  const [budgetData, setBudgetData] = useState({
    monthly: "",
    weekly: "",
    daily: "",
    categories: {},
  });

  useEffect(() => {
    // Initialize form with current budget data
    setBudgetData({
      monthly: budgets.monthly?.toString() || "3000",
      weekly: budgets.weekly?.toString() || "750",
      daily: budgets.daily?.toString() || "107",
      categories: categories.reduce((acc, category) => {
        acc[category.id] = category.budget?.toString() || "";
        return acc;
      }, {}),
    });
  }, [budgets, categories]);

  const handleSave = async () => {
    try {
      const updatedBudgets = {
        monthly: parseFloat(budgetData.monthly) || 0,
        weekly: parseFloat(budgetData.weekly) || 0,
        daily: parseFloat(budgetData.daily) || 0,
      };

      await updateBudget(updatedBudgets);
      Alert.alert("Success", "Budgets updated successfully!");
      onSave();
    } catch (error) {
      Alert.alert("Error", "Failed to update budgets");
    }
  };

  const updateCategoryBudget = (categoryId, value) => {
    setBudgetData((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryId]: value,
      },
    }));
  };

  const calculateAutoBudgets = (type, value) => {
    const numValue = parseFloat(value) || 0;

    if (type === "monthly") {
      setBudgetData((prev) => ({
        ...prev,
        monthly: value,
        weekly: (numValue / 4).toFixed(0),
        daily: (numValue / 28).toFixed(0),
      }));
    } else if (type === "weekly") {
      setBudgetData((prev) => ({
        ...prev,
        monthly: (numValue * 4).toFixed(0),
        weekly: value,
        daily: (numValue / 7).toFixed(0),
      }));
    } else if (type === "daily") {
      setBudgetData((prev) => ({
        ...prev,
        monthly: (numValue * 28).toFixed(0),
        weekly: (numValue * 7).toFixed(0),
        daily: value,
      }));
    }
  };

  const formatCurrency = (value) => {
    return `RM ${parseFloat(value || 0).toFixed(2)}`;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Set Budgets</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Main Budget Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💰 Overall Budget</Text>
              <Text style={styles.sectionSubtitle}>
                Set your overall spending limits
              </Text>

              <View style={styles.budgetCard}>
                <View style={styles.budgetRow}>
                  <View style={styles.budgetLabelContainer}>
                    <Ionicons name="calendar" size={20} color="#2ECC71" />
                    <Text style={styles.budgetLabel}>Monthly Budget</Text>
                  </View>
                  <View style={styles.budgetInputContainer}>
                    <Text style={styles.currencySymbol}>RM</Text>
                    <TextInput
                      style={styles.budgetInput}
                      value={budgetData.monthly}
                      onChangeText={(text) =>
                        calculateAutoBudgets("monthly", text)
                      }
                      keyboardType="decimal-pad"
                      placeholder="3000"
                    />
                  </View>
                </View>

                <View style={styles.budgetRow}>
                  <View style={styles.budgetLabelContainer}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#3498DB"
                    />
                    <Text style={styles.budgetLabel}>Weekly Budget</Text>
                  </View>
                  <View style={styles.budgetInputContainer}>
                    <Text style={styles.currencySymbol}>RM</Text>
                    <TextInput
                      style={styles.budgetInput}
                      value={budgetData.weekly}
                      onChangeText={(text) =>
                        calculateAutoBudgets("weekly", text)
                      }
                      keyboardType="decimal-pad"
                      placeholder="750"
                    />
                  </View>
                </View>

                <View style={styles.budgetRow}>
                  <View style={styles.budgetLabelContainer}>
                    <Ionicons name="today" size={20} color="#9B59B6" />
                    <Text style={styles.budgetLabel}>Daily Budget</Text>
                  </View>
                  <View style={styles.budgetInputContainer}>
                    <Text style={styles.currencySymbol}>RM</Text>
                    <TextInput
                      style={styles.budgetInput}
                      value={budgetData.daily}
                      onChangeText={(text) =>
                        calculateAutoBudgets("daily", text)
                      }
                      keyboardType="decimal-pad"
                      placeholder="107"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.budgetSummary}>
                <Text style={styles.summaryTitle}>Budget Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Monthly:</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(budgetData.monthly)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Weekly:</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(budgetData.weekly)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Daily:</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(budgetData.daily)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Category Budgets */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏷️ Category Budgets</Text>
              <Text style={styles.sectionSubtitle}>
                Set individual budgets for each category
              </Text>

              {categories.map((category) => (
                <View key={category.id} style={styles.categoryBudgetCard}>
                  <View style={styles.categoryHeader}>
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: category.color },
                      ]}
                    >
                      <Ionicons
                        name={category.icon}
                        size={18}
                        color="#FFFFFF"
                      />
                    </View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>

                  <View style={styles.categoryBudgetInput}>
                    <Text style={styles.currencySymbol}>RM</Text>
                    <TextInput
                      style={styles.categoryInput}
                      value={budgetData.categories[category.id] || ""}
                      onChangeText={(text) =>
                        updateCategoryBudget(category.id, text)
                      }
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                  </View>
                </View>
              ))}

              <View style={styles.categoryTotal}>
                <Text style={styles.totalLabel}>Total Category Budgets:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(
                    Object.values(budgetData.categories).reduce(
                      (sum, value) => sum + (parseFloat(value) || 0),
                      0
                    )
                  )}
                </Text>
              </View>
            </View>

            {/* Tips */}
            <View style={styles.tipsCard}>
              <Ionicons name="bulb-outline" size={24} color="#F39C12" />
              <View style={styles.tipsContent}>
                <Text style={styles.tipsTitle}>Budgeting Tips</Text>
                <Text style={styles.tipsText}>
                  • Start with a realistic budget based on your income{"\n"}•
                  Track your spending daily{"\n"}• Adjust budgets based on
                  actual spending{"\n"}• Save 20% of your income when possible
                </Text>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Ionicons name="save" size={24} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Budgets</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    elevation: 24,
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
  modalContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 16,
  },
  budgetCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  budgetLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  budgetLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginLeft: 12,
  },
  budgetInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    overflow: "hidden",
    minWidth: 120,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7F8C8D",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F8F9FA",
  },
  budgetInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: "right",
    minWidth: 80,
  },
  budgetSummary: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#27AE60",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#7F8C8D",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27AE60",
  },
  categoryBudgetCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryHeader: {
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
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
  },
  categoryBudgetInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    overflow: "hidden",
    minWidth: 100,
  },
  categoryInput: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: "right",
    minWidth: 60,
  },
  categoryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#E0E0E0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#27AE60",
  },
  tipsCard: {
    backgroundColor: "#FFF9E6",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: "#F39C12",
  },
  tipsContent: {
    flex: 1,
    marginLeft: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: "#7F8C8D",
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: "#27AE60",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    elevation: 4,
    marginBottom: 40,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
};

export default BudgetModal;
