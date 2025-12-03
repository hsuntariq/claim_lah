// context/ExpenseContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ExpenseContext = createContext();

export const useExpense = () => useContext(ExpenseContext);

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([
    {
      id: "1",
      name: "Food",
      color: "#2ECC71",
      icon: "restaurant",
      budget: 1000,
    },
    { id: "2", name: "Transport", color: "#3498DB", icon: "car", budget: 500 },
    { id: "3", name: "Shopping", color: "#9B59B6", icon: "cart", budget: 800 },
    {
      id: "4",
      name: "Bills",
      color: "#E74C3C",
      icon: "document-text",
      budget: 1500,
    },
    {
      id: "5",
      name: "Entertainment",
      color: "#F39C12",
      icon: "film",
      budget: 300,
    },
    {
      id: "6",
      name: "Healthcare",
      color: "#1ABC9C",
      icon: "medical",
      budget: 200,
    },
  ]);
  const [budgets, setBudgets] = useState({ monthly: 3000 });
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [expensesData, premiumData, budgetsData] = await Promise.all([
        AsyncStorage.getItem("@expenses"),
        AsyncStorage.getItem("@premium_user"),
        AsyncStorage.getItem("@budgets"),
      ]);

      if (expensesData) setExpenses(JSON.parse(expensesData));
      if (premiumData) setIsPremium(premiumData === "true");
      if (budgetsData) setBudgets(JSON.parse(budgetsData));
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const addExpense = async (expense) => {
    const newExpense = {
      ...expense,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      isClaimable: true,
    };
    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses);
    await AsyncStorage.setItem("@expenses", JSON.stringify(updatedExpenses));
    return newExpense;
  };

  const updateExpense = async (id, updates) => {
    const updatedExpenses = expenses.map((expense) =>
      expense.id === id ? { ...expense, ...updates } : expense
    );
    setExpenses(updatedExpenses);
    await AsyncStorage.setItem("@expenses", JSON.stringify(updatedExpenses));
  };

  const deleteExpense = async (id) => {
    const updatedExpenses = expenses.filter((expense) => expense.id !== id);
    setExpenses(updatedExpenses);
    await AsyncStorage.setItem("@expenses", JSON.stringify(updatedExpenses));
  };

  const addCategory = async (category) => {
    const newCategory = {
      ...category,
      id: Date.now().toString(),
    };
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    await AsyncStorage.setItem(
      "@categories",
      JSON.stringify(updatedCategories)
    );
  };

  const updateBudget = async (budgetData) => {
    const updatedBudgets = { ...budgets, ...budgetData };
    setBudgets(updatedBudgets);
    await AsyncStorage.setItem("@budgets", JSON.stringify(updatedBudgets));
  };

  const setPremium = async (value) => {
    setIsPremium(value);
    await AsyncStorage.setItem("@premium_user", value.toString());
  };

  const calculateStats = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyExpenses = expenses
      .filter((expense) => {
        const expenseDate = new Date(expense.date || expense.createdAt);
        return (
          expenseDate.getMonth() === currentMonth &&
          expenseDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, expense) => sum + parseFloat(expense.total || 0), 0);

    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + parseFloat(expense.total || 0),
      0
    );

    const currentDay = new Date().getDate();
    const dailyAverage = monthlyExpenses / currentDay;

    // Calculate category spending
    const categorySpending = {};
    expenses.forEach((expense) => {
      const category = expense.category || "Other";
      categorySpending[category] =
        (categorySpending[category] || 0) + parseFloat(expense.total || 0);
    });

    let highestCategory = "N/A";
    let highestAmount = 0;
    Object.entries(categorySpending).forEach(([category, amount]) => {
      if (amount > highestAmount) {
        highestAmount = amount;
        highestCategory = category;
      }
    });

    const budgetUsed = ((monthlyExpenses / budgets.monthly) * 100).toFixed(1);

    return {
      totalExpenses,
      monthlyExpenses,
      dailyAverage: isNaN(dailyAverage) ? 0 : dailyAverage,
      highestCategory,
      budgetUsed: parseFloat(budgetUsed),
      receiptsCount: expenses.length,
    };
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        categories,
        budgets,
        isPremium,
        addExpense,
        updateExpense,
        deleteExpense,
        addCategory,
        updateBudget,
        setPremium,
        calculateStats,
        loadData,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};
