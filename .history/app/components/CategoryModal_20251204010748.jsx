// components/CategoryModal.js
import React, { useState } from "react";
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

const CategoryModal = ({ visible, onClose, onSave }) => {
  const { categories, addCategory } = useExpense();
  const [category, setCategory] = useState({
    name: "",
    budget: "",
    color: "#2ECC71",
    icon: "restaurant",
  });

  const colors = [
    "#2ECC71", // Green
    "#3498DB", // Blue
    "#9B59B6", // Purple
    "#E74C3C", // Red
    "#F39C12", // Orange
    "#1ABC9C", // Teal
    "#34495E", // Dark Blue
    "#E67E22", // Dark Orange
  ];

  const icons = [
    "restaurant",
    "car",
    "cart",
    "document-text",
    "film",
    "medical",
    "home",
    "airplane",
    "shirt",
    "wine",
    "game-controller",
    "book",
    "barbell",
    "musical-notes",
    "cut",
    "flower",
    "cafe",
    "bus",
  ];

  const handleSave = async () => {
    if (!category.name.trim()) {
      Alert.alert("Error", "Please enter category name");
      return;
    }

    // Check if category already exists
    const exists = categories.some(
      (c) => c.name.toLowerCase() === category.name.toLowerCase()
    );

    if (exists) {
      Alert.alert("Error", "Category already exists");
      return;
    }

    try {
      await addCategory({
        ...category,
        budget: category.budget ? parseFloat(category.budget) : 0,
      });
      Alert.alert("Success", "Category added successfully!");
      onSave();
      resetForm();
    } catch (error) {
      Alert.alert("Error", "Failed to add category");
    }
  };

  const resetForm = () => {
    setCategory({
      name: "",
      budget: "",
      color: "#2ECC71",
      icon: "restaurant",
    });
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
            <Text style={styles.modalTitle}>Add New Category</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Category Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Food, Transport, Shopping"
                value={category.name}
                onChangeText={(text) =>
                  setCategory((prev) => ({ ...prev, name: text }))
                }
              />
            </View>

            {/* Monthly Budget */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Monthly Budget (Optional)</Text>
              <View style={styles.budgetInputContainer}>
                <Text style={styles.currencySymbol}>RM</Text>
                <TextInput
                  style={styles.budgetInput}
                  placeholder="0.00"
                  value={category.budget}
                  onChangeText={(text) =>
                    setCategory((prev) => ({ ...prev, budget: text }))
                  }
                  keyboardType="decimal-pad"
                />
              </View>
              <Text style={styles.hintText}>
                Set a monthly spending limit for this category
              </Text>
            </View>

            {/* Color Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Color</Text>
              <View style={styles.colorGrid}>
                {colors.map((color, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      category.color === color && styles.colorButtonSelected,
                    ]}
                    onPress={() => setCategory((prev) => ({ ...prev, color }))}
                  >
                    {category.color === color && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Icon Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Icon</Text>
              <View style={styles.iconGrid}>
                {icons.map((icon, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.iconButton,
                      category.icon === icon && styles.iconButtonSelected,
                    ]}
                    onPress={() => setCategory((prev) => ({ ...prev, icon }))}
                  >
                    <Ionicons
                      name={icon}
                      size={24}
                      color={
                        category.icon === icon ? "#FFFFFF" : category.color
                      }
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preview */}
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Preview</Text>
              <View style={styles.previewContent}>
                <View
                  style={[
                    styles.previewIcon,
                    { backgroundColor: category.color },
                  ]}
                >
                  <Ionicons name={category.icon} size={24} color="#FFFFFF" />
                </View>
                <View style={styles.previewText}>
                  <Text style={styles.previewName}>
                    {category.name || "Category Name"}
                  </Text>
                  <Text style={styles.previewBudget}>
                    {category.budget
                      ? `Budget: RM ${category.budget}`
                      : "No budget set"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Ionicons name="add-circle" size={24} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Add Category</Text>
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
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#2C3E50",
    backgroundColor: "#F8F9FA",
  },
  budgetInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    overflow: "hidden",
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7F8C8D",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F0F0F0",
  },
  budgetInput: {
    flex: 1,
    fontSize: 16,
    color: "#2C3E50",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  hintText: {
    fontSize: 12,
    color: "#95A5A6",
    marginTop: 6,
    fontStyle: "italic",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  colorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    margin: 4,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  colorButtonSelected: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
    elevation: 4,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    margin: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  iconButtonSelected: {
    backgroundColor: "#27AE60",
    borderColor: "#27AE60",
  },
  previewCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 16,
  },
  previewContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  previewText: {
    flex: 1,
  },
  previewName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  previewBudget: {
    fontSize: 14,
    color: "#7F8C8D",
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

export default CategoryModal;
