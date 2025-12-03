// app/add.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Linking,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AddReceiptScreen() {
  const [receipt, setReceipt] = useState({
    storeName: "",
    receiptNumber: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
    items: [{ id: 1, name: "", quantity: "", price: "", total: "" }],
    subtotal: "",
    tax: "",
    serviceCharge: "",
    rounding: "",
    total: "",
    paymentMethod: "Cash",
    customerName: "",
    customerIC: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showOCRProcessing, setShowOCRProcessing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;

  // Stripe Payment Link (Replace with your actual payment link)
  const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_00g6rN7dM6ivhqU7ss"; // Test payment link

  // Check premium status on mount
  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const premiumStatus = await AsyncStorage.getItem("@premium_user");
      setIsPremium(premiumStatus === "true");
    } catch (error) {
      console.error("Error checking premium status:", error);
    }
  };

  // Calculate item total
  const calculateItemTotal = (quantity, price) => {
    const qty = parseFloat(quantity) || 0;
    const prc = parseFloat(price) || 0;
    return (qty * prc).toFixed(2);
  };

  // Calculate grand total
  const calculateTotals = () => {
    const itemsTotal = receipt.items.reduce((sum, item) => {
      return sum + (parseFloat(item.total) || 0);
    }, 0);

    const subtotal = parseFloat(receipt.subtotal) || itemsTotal;
    const tax = parseFloat(receipt.tax) || 0;
    const serviceCharge = parseFloat(receipt.serviceCharge) || 0;
    const rounding = parseFloat(receipt.rounding) || 0;

    const total = subtotal + tax + serviceCharge + rounding;

    setReceipt((prev) => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      serviceCharge: serviceCharge.toFixed(2),
      rounding: rounding.toFixed(2),
      total: total.toFixed(2),
    }));
  };

  useEffect(() => {
    calculateTotals();
  }, [
    receipt.items,
    receipt.subtotal,
    receipt.tax,
    receipt.serviceCharge,
    receipt.rounding,
  ]);

  // Handle item updates
  const updateItem = (id, field, value) => {
    const updatedItems = receipt.items.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === "quantity" || field === "price") {
          updatedItem.total = calculateItemTotal(
            field === "quantity" ? value : item.quantity,
            field === "price" ? value : item.price
          );
        }
        return updatedItem;
      }
      return item;
    });

    setReceipt((prev) => ({ ...prev, items: updatedItems }));
  };

  // Add new item
  const addNewItem = () => {
    const newId =
      receipt.items.length > 0
        ? Math.max(...receipt.items.map((i) => i.id)) + 1
        : 1;
    setReceipt((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: newId, name: "", quantity: "", price: "", total: "" },
      ],
    }));
  };

  // Remove item
  const removeItem = (id) => {
    if (receipt.items.length > 1) {
      setReceipt((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== id),
      }));
    }
  };

  // Handle Premium Upgrade with Stripe Payment Link
  const handlePremiumUpgrade = async () => {
    try {
      setIsProcessingPayment(true);

      // Open Stripe Payment Link in browser
      const result = await WebBrowser.openBrowserAsync(STRIPE_PAYMENT_LINK, {
        toolbarColor: "#27AE60",
        controlsColor: "#FFFFFF",
        enableBarCollapsing: true,
        showTitle: true,
      });

      // After returning from browser, check payment status
      if (result.type === "dismiss" || result.type === "cancel") {
        // User might have completed payment, check backend
        await verifyPaymentStatus();
      }
    } catch (error) {
      console.error("Error opening payment link:", error);
      Alert.alert("Error", "Unable to open payment page. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Verify payment status (you would call your backend here)
  const verifyPaymentStatus = async () => {
    try {
      // In production, call your backend to verify payment
      // For demo, we'll simulate a successful payment
      const paymentVerified = await simulateBackendVerification();

      if (paymentVerified) {
        await AsyncStorage.setItem("@premium_user", "true");
        setIsPremium(true);

        // Show success animation
        Animated.sequence([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(2000),
          Animated.timing(slideAnim, {
            toValue: 300,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();

        Alert.alert(
          "🎉 Premium Unlocked!",
          "You now have access to all premium features including OCR receipt scanning!",
          [{ text: "Got it", style: "default" }]
        );
      } else {
        Alert.alert(
          "Payment Pending",
          "Your payment is still being processed. Premium features will be unlocked once payment is confirmed."
        );
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
    }
  };

  // Simulate backend payment verification
  const simulateBackendVerification = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // For demo, assume 80% success rate
        resolve(Math.random() > 0.2);
      }, 1000);
    });
  };

  // Pick image for OCR (Premium feature)
  const pickImage = async () => {
    if (!isPremium) {
      Alert.alert(
        "🔒 Premium Feature",
        "OCR receipt scanning is available to premium users only.\n\nUpgrade now to:",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "View Plans",
            onPress: () => showPremiumPlans(),
            style: "default",
          },
          {
            text: "Upgrade Now",
            onPress: () => handlePremiumUpgrade(),
            style: "destructive",
          },
        ]
      );
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant photo library access to scan receipts."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      processOCR(result.assets[0].uri);
    }
  };

  // Show premium plans modal
  const showPremiumPlans = () => {
    Alert.alert(
      "📊 Premium Plans",
      "Choose your plan:\n\n" +
        "💰 Monthly: RM 9.99/month\n" +
        "🎯 Yearly: RM 99.99/year (Save 16%)\n" +
        "🏆 Lifetime: RM 299.99 (One-time payment)\n\n" +
        "All plans include:\n" +
        "• Unlimited OCR scanning\n" +
        "• Advanced analytics\n" +
        "• Export to Excel/PDF\n" +
        "• Priority support",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Monthly", onPress: () => handlePremiumUpgrade() },
        { text: "Yearly", onPress: () => handlePremiumUpgrade() },
        { text: "Lifetime", onPress: () => handlePremiumUpgrade() },
      ]
    );
  };

  // Simulate OCR Processing
  const processOCR = async (imageUri) => {
    setShowOCRProcessing(true);

    // Simulate OCR processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock OCR results for Malaysian receipt
    const mockOCRResult = {
      storeName: "AEON BIG",
      receiptNumber: "INV-2024-001234",
      date: "2024-03-15",
      time: "14:30",
      items: [
        {
          name: "Nasi Lemak Ayam",
          quantity: "2",
          price: "6.50",
          total: "13.00",
        },
        { name: "Teh Tarik", quantity: "1", price: "3.50", total: "3.50" },
        { name: "Roti Canai", quantity: "2", price: "2.50", total: "5.00" },
      ],
      subtotal: "21.50",
      tax: "1.29", // 6% GST
      serviceCharge: "2.15", // 10% Service Charge
      rounding: "-0.01",
      total: "24.93",
      paymentMethod: "Cash",
    };

    // Update form with OCR results
    setReceipt((prev) => ({
      ...prev,
      storeName: mockOCRResult.storeName,
      receiptNumber: mockOCRResult.receiptNumber,
      date: mockOCRResult.date,
      time: mockOCRResult.time,
      items: mockOCRResult.items.map((item, index) => ({
        id: index + 1,
        ...item,
      })),
      subtotal: mockOCRResult.subtotal,
      tax: mockOCRResult.tax,
      serviceCharge: mockOCRResult.serviceCharge,
      rounding: mockOCRResult.rounding,
      total: mockOCRResult.total,
      paymentMethod: mockOCRResult.paymentMethod,
    }));

    setShowOCRProcessing(false);
    Alert.alert(
      "✅ Success",
      "Receipt scanned successfully! Data has been auto-filled."
    );
  };

  // Handle Save Receipt
  const handleSave = async () => {
    // Validation
    if (!receipt.storeName.trim()) {
      Alert.alert("⚠️ Missing Information", "Please enter store name");
      return;
    }

    const invalidItems = receipt.items.filter(
      (item) => !item.name.trim() || !item.quantity || !item.price
    );
    if (invalidItems.length > 0) {
      Alert.alert(
        "⚠️ Incomplete Items",
        "Please fill all fields for each item"
      );
      return;
    }

    setIsLoading(true);

    try {
      // Save to AsyncStorage
      const savedReceipts = await AsyncStorage.getItem("@receipts");
      const receipts = savedReceipts ? JSON.parse(savedReceipts) : [];
      const newReceipt = {
        ...receipt,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isClaimable: true,
      };
      receipts.push(newReceipt);
      await AsyncStorage.setItem("@receipts", JSON.stringify(receipts));

      // Show success animation
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(slideAnim, {
            toValue: 300,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }, 2000);
      });

      Alert.alert("✅ Saved!", "Receipt has been saved successfully.");

      // Reset form
      setReceipt({
        storeName: "",
        receiptNumber: "",
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),
        items: [{ id: 1, name: "", quantity: "", price: "", total: "" }],
        subtotal: "",
        tax: "",
        serviceCharge: "",
        rounding: "",
        total: "",
        paymentMethod: "Cash",
        customerName: "",
        customerIC: "",
      });
      setSelectedImage(null);
    } catch (error) {
      Alert.alert("❌ Error", "Failed to save receipt. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#27AE60" barStyle="light-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Receipt</Text>
            <Text style={styles.headerSubtitle}>
              Malaysian Shopping Receipt
            </Text>
          </View>

          {/* Premium Banner */}
          {!isPremium && (
            <TouchableOpacity
              style={styles.premiumBanner}
              onPress={showPremiumPlans}
              activeOpacity={0.8}
            >
              <View style={styles.premiumContent}>
                <Ionicons name="sparkles" size={24} color="#FFD700" />
                <View style={styles.premiumTextContainer}>
                  <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                  <Text style={styles.premiumSubtitle}>
                    Unlock OCR scanning & advanced features
                  </Text>
                </View>
                <MaterialIcons
                  name="arrow-forward-ios"
                  size={20}
                  color="#FFFFFF"
                />
              </View>
            </TouchableOpacity>
          )}

          {/* Premium Status Badge */}
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="shield-checkmark" size={20} color="#FFD700" />
              <Text style={styles.premiumBadgeText}>Premium User</Text>
            </View>
          )}

          {/* OCR Scan Button */}
          <TouchableOpacity
            style={[styles.ocrButton, !isPremium && styles.ocrButtonLocked]}
            onPress={pickImage}
            activeOpacity={0.8}
            disabled={!isPremium && isProcessingPayment}
          >
            <View style={styles.ocrButtonContent}>
              <Ionicons
                name={isPremium ? "camera" : "lock-closed"}
                size={24}
                color={isPremium ? "#27AE60" : "#95A5A6"}
              />
              <View style={styles.ocrTextContainer}>
                <Text
                  style={[
                    styles.ocrTitle,
                    !isPremium && styles.ocrTitleDisabled,
                  ]}
                >
                  {isPremium ? "📸 Scan Receipt" : "🔒 Premium Feature"}
                </Text>
                <Text style={styles.ocrSubtitle}>
                  {isPremium
                    ? "Tap to scan receipt with OCR"
                    : "Upgrade to unlock OCR scanning"}
                </Text>
              </View>
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.previewImage}
                />
              )}
            </View>
          </TouchableOpacity>

          {/* OCR Processing Indicator */}
          {showOCRProcessing && (
            <View style={styles.ocrProcessing}>
              <Animated.View style={styles.ocrLoading}>
                <Ionicons name="scan" size={40} color="#27AE60" />
              </Animated.View>
              <Text style={styles.ocrProcessingText}>Scanning Receipt...</Text>
              <Text style={styles.ocrProcessingSubtext}>
                Extracting data from image
              </Text>
            </View>
          )}

          {/* Store Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏪 Store Details</Text>
            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Store Name*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., AEON, Tesco, 7-Eleven"
                  value={receipt.storeName}
                  onChangeText={(text) =>
                    setReceipt((prev) => ({ ...prev, storeName: text }))
                  }
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Receipt No.</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Receipt number"
                  value={receipt.receiptNumber}
                  onChangeText={(text) =>
                    setReceipt((prev) => ({ ...prev, receiptNumber: text }))
                  }
                />
              </View>
            </View>
            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>📅 Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={receipt.date}
                  onChangeText={(text) =>
                    setReceipt((prev) => ({ ...prev, date: text }))
                  }
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>🕒 Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  value={receipt.time}
                  onChangeText={(text) =>
                    setReceipt((prev) => ({ ...prev, time: text }))
                  }
                />
              </View>
            </View>
          </View>

          {/* Items Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🛒 Items Purchased</Text>
              <TouchableOpacity
                onPress={addNewItem}
                style={styles.addItemButton}
              >
                <Ionicons name="add-circle" size={24} color="#27AE60" />
                <Text style={styles.addItemText}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {receipt.items.map((item, index) => (
              <View key={item.id} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemNumber}>Item {index + 1}</Text>
                  {receipt.items.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeItem(item.id)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close-circle" size={20} color="#E74C3C" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.itemRow}>
                  <View style={[styles.inputContainer, { flex: 2 }]}>
                    <Text style={styles.inputLabel}>Item Name*</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Nasi Lemak"
                      value={item.name}
                      onChangeText={(text) => updateItem(item.id, "name", text)}
                    />
                  </View>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Qty*</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="1"
                      keyboardType="numeric"
                      value={item.quantity}
                      onChangeText={(text) =>
                        updateItem(item.id, "quantity", text)
                      }
                    />
                  </View>
                </View>

                <View style={styles.itemRow}>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Price (RM)*</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      value={item.price}
                      onChangeText={(text) =>
                        updateItem(item.id, "price", text)
                      }
                    />
                  </View>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Total (RM)</Text>
                    <TextInput
                      style={[styles.input, styles.totalInput]}
                      value={item.total}
                      editable={false}
                      placeholder="0.00"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Payment Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💳 Payment Details</Text>

            <View style={styles.totalsGrid}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal (RM)</Text>
                <TextInput
                  style={styles.totalInput}
                  keyboardType="decimal-pad"
                  value={receipt.subtotal}
                  onChangeText={(text) =>
                    setReceipt((prev) => ({ ...prev, subtotal: text }))
                  }
                  placeholder="0.00"
                />
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax (RM)</Text>
                <TextInput
                  style={styles.totalInput}
                  keyboardType="decimal-pad"
                  value={receipt.tax}
                  onChangeText={(text) =>
                    setReceipt((prev) => ({ ...prev, tax: text }))
                  }
                  placeholder="0.00"
                />
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Service Charge (RM)</Text>
                <TextInput
                  style={styles.totalInput}
                  keyboardType="decimal-pad"
                  value={receipt.serviceCharge}
                  onChangeText={(text) =>
                    setReceipt((prev) => ({ ...prev, serviceCharge: text }))
                  }
                  placeholder="0.00"
                />
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Rounding (RM)</Text>
                <TextInput
                  style={styles.totalInput}
                  keyboardType="decimal-pad"
                  value={receipt.rounding}
                  onChangeText={(text) =>
                    setReceipt((prev) => ({ ...prev, rounding: text }))
                  }
                  placeholder="0.00"
                />
              </View>

              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>TOTAL (RM)</Text>
                <TextInput
                  style={styles.grandTotalInput}
                  keyboardType="decimal-pad"
                  value={receipt.total}
                  onChangeText={(text) =>
                    setReceipt((prev) => ({ ...prev, total: text }))
                  }
                  placeholder="0.00"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Payment Method</Text>
              <View style={styles.paymentMethodContainer}>
                {[
                  "Cash",
                  "Credit Card",
                  "Debit Card",
                  "TNG eWallet",
                  "Boost",
                  "GrabPay",
                ].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.paymentMethodButton,
                      receipt.paymentMethod === method &&
                        styles.paymentMethodButtonSelected,
                    ]}
                    onPress={() =>
                      setReceipt((prev) => ({ ...prev, paymentMethod: method }))
                    }
                  >
                    <Text
                      style={[
                        styles.paymentMethodText,
                        receipt.paymentMethod === method &&
                          styles.paymentMethodTextSelected,
                      ]}
                    >
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Customer Details (Optional) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              👤 Customer Details (Optional)
            </Text>
            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Customer Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  value={receipt.customerName}
                  onChangeText={(text) =>
                    setReceipt((prev) => ({ ...prev, customerName: text }))
                  }
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>IC Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="XXXXXX-XX-XXXX"
                  value={receipt.customerIC}
                  onChangeText={(text) =>
                    setReceipt((prev) => ({ ...prev, customerIC: text }))
                  }
                />
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <Ionicons
                name="refresh"
                size={24}
                color="#FFFFFF"
                style={styles.loadingIcon}
              />
            ) : (
              <Ionicons
                name="save"
                size={24}
                color="#FFFFFF"
                style={styles.saveIcon}
              />
            )}
            <Text style={styles.saveButtonText}>
              {isLoading ? "Saving..." : "💾 Save Receipt"}
            </Text>
          </TouchableOpacity>

          {/* Success Animation */}
          <Animated.View
            style={[
              styles.successOverlay,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.successContent}>
              <Ionicons name="checkmark-circle" size={60} color="#27AE60" />
              <Text style={styles.successText}>✅ Receipt Saved!</Text>
              <Text style={styles.successSubtext}>Ready for claiming</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: "#27AE60",
    paddingHorizontal: 20,
    paddingVertical: 25,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#D5FFE4",
    opacity: 0.9,
  },
  premiumBanner: {
    backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  premiumContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  premiumTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  premiumSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  premiumBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFD700",
    marginLeft: 8,
  },
  ocrButton: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: "#27AE60",
  },
  ocrButtonLocked: {
    borderColor: "#E0E0E0",
    opacity: 0.9,
  },
  ocrButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  ocrTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  ocrTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 2,
  },
  ocrTitleDisabled: {
    color: "#95A5A6",
  },
  ocrSubtitle: {
    fontSize: 12,
    color: "#7F8C8D",
  },
  previewImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginLeft: 8,
  },
  ocrProcessing: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  ocrLoading: {
    marginBottom: 16,
  },
  ocrProcessingText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  ocrProcessingSubtext: {
    fontSize: 12,
    color: "#7F8C8D",
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#2C3E50",
    backgroundColor: "#F8F9FA",
  },
  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#27AE60",
    marginLeft: 6,
  },
  itemContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#27AE60",
  },
  removeButton: {
    padding: 4,
  },
  itemRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  totalInput: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#2C3E50",
    backgroundColor: "#F8F9FA",
    fontWeight: "bold",
    textAlign: "right",
  },
  totalsGrid: {
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: "#27AE60",
    borderBottomWidth: 0,
    marginTop: 10,
    paddingTop: 15,
  },
  totalLabel: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  grandTotalInput: {
    borderWidth: 2,
    borderColor: "#27AE60",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "bold",
    color: "#27AE60",
    backgroundColor: "#F8F9FA",
    minWidth: 120,
    textAlign: "right",
  },
  paymentMethodContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  paymentMethodButton: {
    backgroundColor: "#F8F9FA",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  paymentMethodButtonSelected: {
    backgroundColor: "#27AE60",
    borderColor: "#27AE60",
  },
  paymentMethodText: {
    fontSize: 13,
    color: "#7F8C8D",
    fontWeight: "500",
  },
  paymentMethodTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#27AE60",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 40,
    paddingVertical: 18,
    borderRadius: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  saveButtonDisabled: {
    backgroundColor: "#A9DFBF",
  },
  loadingIcon: {
    marginRight: 12,
    transform: [{ rotate: "45deg" }],
  },
  saveIcon: {
    marginRight: 12,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  successOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  successContent: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 40,
    borderRadius: 24,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  successText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#27AE60",
    marginTop: 16,
  },
  successSubtext: {
    fontSize: 16,
    color: "#7F8C8D",
    marginTop: 8,
  },
});
