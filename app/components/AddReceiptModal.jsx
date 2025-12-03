// components/AddReceiptModal.js
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

const AddReceiptModal = ({ visible, onClose, onSave }) => {
  const { addExpense, categories } = useExpense();
  const [receipt, setReceipt] = useState({
    storeName: "",
    receiptNumber: "",
    date: new Date().toISOString().split("T")[0],
    total: "",
    category: "",
    items: [],
    isClaimable: true,
  });
  const [currentItem, setCurrentItem] = useState({
    name: "",
    price: "",
    quantity: "1",
  });
  const [items, setItems] = useState([]);

  const handleAddItem = () => {
    if (!currentItem.name || !currentItem.price) {
      Alert.alert("Error", "Please enter item name and price");
      return;
    }
    const newItem = {
      ...currentItem,
      total: (
        parseFloat(currentItem.price) * parseInt(currentItem.quantity)
      ).toFixed(2),
    };
    setItems([...items, newItem]);

    // Update receipt total
    const newTotal = [...items, newItem].reduce(
      (sum, item) => sum + parseFloat(item.total),
      0
    );
    setReceipt((prev) => ({ ...prev, total: newTotal.toFixed(2) }));

    // Clear current item
    setCurrentItem({ name: "", price: "", quantity: "1" });
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    const newTotal = newItems.reduce(
      (sum, item) => sum + parseFloat(item.total),
      0
    );
    setReceipt((prev) => ({ ...prev, total: newTotal.toFixed(2) }));
  };

  const handleSave = async () => {
    if (!receipt.storeName || !receipt.total || !receipt.category) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    if (items.length === 0) {
      Alert.alert("Error", "Please add at least one item");
      return;
    }

    try {
      const fullReceipt = {
        ...receipt,
        items,
      };
      await addExpense(fullReceipt);
      Alert.alert("Success", "Receipt added successfully!");
      onSave();
      resetForm();
    } catch (error) {
      Alert.alert("Error", "Failed to save receipt");
    }
  };

  const resetForm = () => {
    setReceipt({
      storeName: "",
      receiptNumber: "",
      date: new Date().toISOString().split("T")[0],
      total: "",
      category: "",
      items: [],
      isClaimable: true,
    });
    setItems([]);
    setCurrentItem({ name: "", price: "", quantity: "1" });
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
            <Text style={styles.modalTitle}>Add New Receipt</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Store Details */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Store Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., AEON, Tesco, 7-Eleven"
                value={receipt.storeName}
                onChangeText={(text) =>
                  setReceipt((prev) => ({ ...prev, storeName: text }))
                }
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Receipt Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Receipt number"
                  value={receipt.receiptNumber}
                  onChangeText={(text) =>
                    setReceipt((prev) => ({ ...prev, receiptNumber: text }))
                  }
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={receipt.date}
                  onChangeText={(text) =>
                    setReceipt((prev) => ({ ...prev, date: text }))
                  }
                />
              </View>
            </View>

            {/* Category Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category *</Text>
              <View style={styles.categoryGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      receipt.category === category.name &&
                        styles.categoryButtonSelected,
                    ]}
                    onPress={() =>
                      setReceipt((prev) => ({
                        ...prev,
                        category: category.name,
                      }))
                    }
                  >
                    <Ionicons
                      name={category.icon}
                      size={20}
                      color={
                        receipt.category === category.name
                          ? "#FFFFFF"
                          : category.color
                      }
                    />
                    <Text
                      style={[
                        styles.categoryButtonText,
                        receipt.category === category.name &&
                          styles.categoryButtonTextSelected,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Add Items Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Items *</Text>
              <View style={styles.itemInputRow}>
                <TextInput
                  style={[styles.input, { flex: 2, marginRight: 8 }]}
                  placeholder="Item name"
                  value={currentItem.name}
                  onChangeText={(text) =>
                    setCurrentItem((prev) => ({ ...prev, name: text }))
                  }
                />
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="Qty"
                  value={currentItem.quantity}
                  onChangeText={(text) =>
                    setCurrentItem((prev) => ({ ...prev, quantity: text }))
                  }
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="Price"
                  value={currentItem.price}
                  onChangeText={(text) =>
                    setCurrentItem((prev) => ({ ...prev, price: text }))
                  }
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity
                  style={styles.addItemButton}
                  onPress={handleAddItem}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Items List */}
            {items.length > 0 && (
              <View style={styles.itemsList}>
                {items.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemDetails}>
                        {item.quantity} x RM {parseFloat(item.price).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.itemActions}>
                      <Text style={styles.itemTotal}>RM {item.total}</Text>
                      <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#E74C3C"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <TextInput
                style={styles.totalInput}
                value={receipt.total}
                onChangeText={(text) =>
                  setReceipt((prev) => ({ ...prev, total: text }))
                }
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Ionicons name="save" size={24} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Receipt</Text>
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
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
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
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  categoryButtonSelected: {
    backgroundColor: "#27AE60",
    borderColor: "#27AE60",
  },
  categoryButtonText: {
    fontSize: 14,
    color: "#7F8C8D",
    fontWeight: "500",
    marginLeft: 8,
  },
  categoryButtonTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  itemInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  addItemButton: {
    backgroundColor: "#27AE60",
    borderRadius: 12,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  itemsList: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27AE60",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 2,
    borderTopColor: "#E0E0E0",
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  totalInput: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#27AE60",
    textAlign: "right",
    minWidth: 120,
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

export default AddReceiptModal;
