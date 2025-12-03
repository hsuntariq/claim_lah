// app/dashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useExpense } from "../context/ExpenseContext";
import AddReceiptModal from "../components/AddReceiptModal";
import CategoryModal from "../components/CategoryModal";
import BudgetModal from "../components/BudgetModal";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

export default function DashboardScreen({ navigation }) {
  const {
    expenses,
    categories,
    budgets,
    isPremium,
    calculateStats,
    loadData,
    setPremium,
  } = useExpense();

  const [stats, setStats] = useState(calculateStats());
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    updateDashboard();
  }, [expenses]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const updateDashboard = () => {
    const newStats = calculateStats();
    setStats(newStats);

    // Get recent expenses
    const sortedExpenses = [...expenses]
      .sort(
        (a, b) =>
          new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
      )
      .slice(0, 3);
    setRecentExpenses(sortedExpenses);

    // Calculate top categories
    const categoryTotals = {};
    expenses.forEach((expense) => {
      const category = expense.category || "Other";
      categoryTotals[category] =
        (categoryTotals[category] || 0) + parseFloat(expense.total || 0);
    });

    const sortedCategories = Object.entries(categoryTotals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);

    setTopCategories(sortedCategories);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (value) => {
    return `RM ${parseFloat(value).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getBudgetColor = (percentage) => {
    if (percentage < 60) return "#2ECC71";
    if (percentage < 80) return "#F39C12";
    return "#E74C3C";
  };

  const getCategoryIcon = (categoryName) => {
    const category = categories.find((c) => c.name === categoryName);
    return category ? category.icon : "cube";
  };

  const getCategoryColor = (categoryName) => {
    const category = categories.find((c) => c.name === categoryName);
    return category ? category.color : "#95A5A6";
  };

  const handlePremiumUpgrade = () => {
    Alert.alert(
      "Upgrade to Premium",
      "Unlock advanced features including:\n\n• OCR Receipt Scanning\n• Unlimited Categories\n• Advanced Analytics\n• Priority Support\n\nContinue to payment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Upgrade Now",
          style: "destructive",
          onPress: () => router.push("/premium"),
        },
      ]
    );
  };

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
            <Text style={styles.headerSubtitle}>Track • Claim • Save</Text>
          </View>
          <View style={styles.headerActions}>
            {isPremium && (
              <View style={styles.premiumCrown}>
                <FontAwesome5 name="crown" size={16} color="#FFD700" />
              </View>
            )}
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#27AE60"
              colors={["#27AE60"]}
            />
          }
        >
          {/* Welcome Card with Quick Add */}
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeContent}>
              <View>
                <Text style={styles.welcomeTitle}>Welcome back! 👋</Text>
                <Text style={styles.welcomeText}>
                  {expenses.length > 0
                    ? `You have ${expenses.length} receipts`
                    : "Add your first receipt to get started"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.quickAddButton}
                onPress={() => setActiveModal("receipt")}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.quickAddText}>Quick Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Overview */}
          <View style={styles.statsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📊 Financial Overview</Text>
              <TouchableOpacity onPress={() => router.push("/analytics")}>
                <Text style={styles.viewAllText}>View Details</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsGrid}>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => router.push("/expenses")}
              >
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: "rgba(46, 204, 113, 0.1)" },
                  ]}
                >
                  <Ionicons name="calendar" size={24} color="#2ECC71" />
                </View>
                <Text style={styles.statValue}>
                  {formatCurrency(stats.monthlyExpenses)}
                </Text>
                <Text style={styles.statLabel}>This Month</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => router.push("/expenses")}
              >
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: "rgba(39, 174, 96, 0.1)" },
                  ]}
                >
                  <Ionicons name="receipt" size={24} color="#27AE60" />
                </View>
                <Text style={styles.statValue}>{stats.receiptsCount}</Text>
                <Text style={styles.statLabel}>Total Receipts</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => setActiveModal("budget")}
              >
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: "rgba(52, 152, 219, 0.1)" },
                  ]}
                >
                  <Ionicons name="trending-up" size={24} color="#3498DB" />
                </View>
                <Text style={styles.statValue}>
                  {formatCurrency(stats.dailyAverage)}
                </Text>
                <Text style={styles.statLabel}>Daily Average</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => router.push("/categories")}
              >
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: "rgba(155, 89, 182, 0.1)" },
                  ]}
                >
                  <Ionicons name="pie-chart" size={24} color="#9B59B6" />
                </View>
                <Text style={styles.statValue}>{stats.highestCategory}</Text>
                <Text style={styles.statLabel}>Top Category</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Budget Progress */}
          <TouchableOpacity
            style={styles.budgetCard}
            onPress={() => setActiveModal("budget")}
          >
            <View style={styles.budgetHeader}>
              <View>
                <Text style={styles.budgetTitle}>Monthly Budget</Text>
                <Text style={styles.budgetAmount}>
                  {formatCurrency(stats.monthlyExpenses)} /{" "}
                  {formatCurrency(budgets.monthly)}
                </Text>
              </View>
              <Text
                style={[
                  styles.budgetPercentage,
                  { color: getBudgetColor(stats.budgetUsed) },
                ]}
              >
                {stats.budgetUsed}%
              </Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(stats.budgetUsed, 100)}%`,
                    backgroundColor: getBudgetColor(stats.budgetUsed),
                  },
                ]}
              />
            </View>

            <View style={styles.budgetInfo}>
              <Text style={styles.budgetInfoText}>
                {stats.budgetUsed < 60
                  ? "💰 You're under budget!"
                  : stats.budgetUsed < 80
                  ? "⚠️ Approaching budget limit"
                  : "🚨 Over budget!"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Recent Receipts */}
          <View style={styles.receiptsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📋 Recent Receipts</Text>
              <TouchableOpacity onPress={() => router.push("/expenses")}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentExpenses.length > 0 ? (
              recentExpenses.map((expense, index) => (
                <TouchableOpacity
                  key={expense.id}
                  style={styles.receiptCard}
                  onPress={() =>
                    router.push("/receiptDetail", { id: expense.id })
                  }
                >
                  <View style={styles.receiptLeft}>
                    <View
                      style={[
                        styles.receiptIcon,
                        { backgroundColor: getCategoryColor(expense.category) },
                      ]}
                    >
                      <Ionicons
                        name={getCategoryIcon(expense.category)}
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>
                    <View>
                      <Text style={styles.receiptStore} numberOfLines={1}>
                        {expense.storeName || "Unknown Store"}
                      </Text>
                      <Text style={styles.receiptDate}>
                        {formatDate(expense.date || expense.createdAt)} •{" "}
                        {expense.category || "Uncategorized"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.receiptRight}>
                    <Text style={styles.receiptAmount}>
                      {formatCurrency(expense.total)}
                    </Text>
                    <View
                      style={[
                        styles.receiptStatus,
                        {
                          backgroundColor: expense.isClaimable
                            ? "#2ECC7120"
                            : "#F39C1220",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.receiptStatusText,
                          {
                            color: expense.isClaimable ? "#2ECC71" : "#F39C12",
                          },
                        ]}
                      >
                        {expense.isClaimable ? "Claimable" : "Processing"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <TouchableOpacity
                style={styles.emptyReceipts}
                onPress={() => setActiveModal("receipt")}
              >
                <Ionicons name="receipt-outline" size={48} color="#BDC3C7" />
                <Text style={styles.emptyReceiptsText}>No receipts yet</Text>
                <Text style={styles.emptyReceiptsSubtext}>
                  Tap to add your first receipt
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>

            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setActiveModal("receipt")}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: "rgba(46, 204, 113, 0.1)" },
                  ]}
                >
                  <Ionicons name="add-circle" size={28} color="#2ECC71" />
                </View>
                <Text style={styles.actionText}>Add Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  isPremium ? setActiveModal("scan") : handlePremiumUpgrade()
                }
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: "rgba(39, 174, 96, 0.1)" },
                  ]}
                >
                  <Ionicons
                    name="scan"
                    size={28}
                    color={isPremium ? "#27AE60" : "#95A5A6"}
                  />
                  {!isPremium && (
                    <View style={styles.crownBadge}>
                      <FontAwesome5 name="crown" size={12} color="#FFD700" />
                    </View>
                  )}
                </View>
                <Text
                  style={[styles.actionText, !isPremium && styles.premiumText]}
                >
                  Scan Receipt
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setActiveModal("category")}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: "rgba(52, 152, 219, 0.1)" },
                  ]}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={28}
                    color="#3498DB"
                  />
                </View>
                <Text style={styles.actionText}>Add Category</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/reports")}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: "rgba(155, 89, 182, 0.1)" },
                  ]}
                >
                  <Ionicons name="document-text" size={28} color="#9B59B6" />
                </View>
                <Text style={styles.actionText}>Reports</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Premium CTA */}
          {!isPremium && (
            <TouchableOpacity
              style={styles.premiumCard}
              onPress={handlePremiumUpgrade}
            >
              <View style={styles.premiumContent}>
                <View style={styles.premiumBadge}>
                  <FontAwesome5 name="crown" size={16} color="#FFD700" />
                  <Text style={styles.premiumBadgeText}>PRO</Text>
                </View>
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
        </ScrollView>

        {/* Modals */}
        <AddReceiptModal
          visible={activeModal === "receipt"}
          onClose={() => setActiveModal(null)}
          onSave={() => {
            setActiveModal(null);
            updateDashboard();
          }}
        />

        <CategoryModal
          visible={activeModal === "category"}
          onClose={() => setActiveModal(null)}
          onSave={() => {
            setActiveModal(null);
            updateDashboard();
          }}
        />

        <BudgetModal
          visible={activeModal === "budget"}
          onClose={() => setActiveModal(null)}
          onSave={() => {
            setActiveModal(null);
            updateDashboard();
          }}
        />

        {/* OCR Scan Modal (Premium Only) */}
        {isPremium && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={activeModal === "scan"}
            onRequestClose={() => setActiveModal(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>📸 Scan Receipt</Text>
                  <TouchableOpacity onPress={() => setActiveModal(null)}>
                    <Ionicons name="close" size={24} color="#2C3E50" />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalContent}>
                  <Ionicons
                    name="camera"
                    size={60}
                    color="#27AE60"
                    style={styles.scanIcon}
                  />
                  <Text style={styles.scanTitle}>Premium OCR Scanner</Text>
                  <Text style={styles.scanText}>
                    Take a photo of your receipt to automatically extract all
                    details
                  </Text>
                  <TouchableOpacity style={styles.scanButton}>
                    <Ionicons name="camera-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.scanButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.galleryButton}>
                    <Ionicons name="images-outline" size={24} color="#27AE60" />
                    <Text style={styles.galleryButtonText}>
                      Choose from Gallery
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </Animated.View>
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
    paddingBottom: 40,
  },
  header: {
    backgroundColor: "#27AE60",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  premiumCrown: {
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    borderRadius: 12,
    padding: 8,
  },
  refreshButton: {
    backgroundColor: "#1E8449",
    borderRadius: 20,
    padding: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  welcomeCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    padding: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  welcomeContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  quickAddButton: {
    backgroundColor: "#27AE60",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  quickAddText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  statsSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  viewAllText: {
    color: "#27AE60",
    fontWeight: "600",
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    width: "48%",
    marginHorizontal: "1%",
    marginBottom: 12,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#7F8C8D",
  },
  budgetCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    padding: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  budgetTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  budgetAmount: {
    fontSize: 16,
    color: "#7F8C8D",
  },
  budgetPercentage: {
    fontSize: 28,
    fontWeight: "bold",
  },
  progressBar: {
    height: 12,
    backgroundColor: "#F0F0F0",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 20,
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  budgetInfo: {
    flexDirection: "row",
    justifyContent: "center",
  },
  budgetInfoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E50",
  },
  receiptsSection: {
    marginHorizontal: 20,
    marginTop: 24,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
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
  receiptStore: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 4,
  },
  receiptDate: {
    fontSize: 13,
    color: "#7F8C8D",
  },
  receiptRight: {
    alignItems: "flex-end",
  },
  receiptAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 8,
  },
  receiptStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  receiptStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyReceipts: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  emptyReceiptsText: {
    fontSize: 18,
    color: "#7F8C8D",
    marginTop: 20,
    fontWeight: "500",
  },
  emptyReceiptsSubtext: {
    fontSize: 14,
    color: "#BDC3C7",
    marginTop: 8,
  },
  actionsSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  actionButton: {
    width: "48%",
    marginHorizontal: "1%",
    marginBottom: 12,
    alignItems: "center",
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: "relative",
  },
  crownBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FFD700",
    borderRadius: 8,
    padding: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E50",
    textAlign: "center",
  },
  premiumText: {
    color: "#95A5A6",
  },
  premiumCard: {
    backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 40,
    borderRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  premiumContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 16,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFD700",
    marginLeft: 4,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
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
  modalContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
  },
  scanIcon: {
    marginBottom: 20,
  },
  scanTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 12,
    textAlign: "center",
  },
  scanText: {
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  scanButton: {
    backgroundColor: "#27AE60",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: "100%",
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  scanButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
  galleryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: "100%",
    borderWidth: 2,
    borderColor: "#27AE60",
  },
  galleryButtonText: {
    color: "#27AE60",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
});
