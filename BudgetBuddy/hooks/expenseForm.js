/**
 * Expense form state management hook.
 *
 * Encapsulates all form fields, validation, and submission logic for both
 * the "add expense" and "update expense" flows.  When `id` is null the form
 * initialises with today's date and the user's currency preference; when
 * `id` is provided the existing expense is fetched and the fields are
 * pre-populated.
 *
 * @param {Function}    func - The CRUD action callback (useAddExpense or useUpdateExpense).
 * @param {number|null} id   - Expense ID for updates, or null for new entries.
 */
import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { useExpenseTypes, useCurrencyTypes, useUpdatingExpense, useCurrencyPreference } from "./data";

export function useExpenseForm(func, id = null) {
    // Form state — each field maps 1-to-1 with the API request body.
    const [category, setCategory]           = useState("");
    const [amount, setAmount]               = useState("");
    const [currency, setCurrency]           = useState("");
    const [description, setDescription]     = useState("");
    const [day, setDay]                     = useState("");
    const [month, setMonth]                 = useState("");
    const [year, setYear]                   = useState("");

    // Reference data used by dropdowns / pickers.
    const { data: expense_types, loading: load1 }           = useExpenseTypes();
    const { data: currency_types, loading: load2 }          = useCurrencyTypes();
    const { data: currency_preference, loading: load3 }     = useCurrencyPreference();

    // Initialise defaults once reference data finishes loading.
    if (id == null) {
        const today = new Date();
        useEffect(() => {
            if (!load1 && !load2 && !load3) {
                setCategory((expense_types[0]).toString());
                setCurrency((currency_preference == null ? "SGD" : currency_preference).toString());
                setDay((today.getDate()).toString());
                setMonth((today.getMonth() + 1).toString());
                setYear((today.getFullYear()).toString());
            }
        }, [load1, load2, load3, expense_types, currency_types, currency_preference]);
    } else {
        // Pre-populate all fields from the existing expense being edited.
        const { data: expense, loading: load4 } = useUpdatingExpense({ id });
        useEffect(() => {
            if (!load4) {
                setCategory((expense.category).toString());
                setAmount((parseFloat(expense.amount)).toString());
                setCurrency((expense.currency).toString());
                setDescription((expense.description).toString());
                const time = new Date(expense.time);
                setDay((time.getDate()).toString());
                setMonth((time.getMonth() + 1).toString());
                setYear((time.getFullYear()).toString());
            }
        }, [load4, expense]);
    }

    /**
     * Validate all required fields, build the ISO date, parse the amount,
     * then delegate to the provided CRUD action callback.
     */
    const submit = async () => {
        if (![category, amount, currency, day, month, year].every(Boolean)) {
            return Alert.alert("Please fill out all compulsory fields");
        }

        const dt = new Date(+year, +month - 1, +day + 1);
        if (isNaN(dt.getTime())) {
            return Alert.alert("Invalid date");
        }

        const amt = parseFloat(amount);
        if (isNaN(amt) || amt < 0) {
            return Alert.alert("Invalid amount");
        }

        await func({
            id,
            category,
            amount: amt,
            currency,
            description,
            time: dt.toISOString(),
        });
    };

    return {
        // Form state + setters
        category, setCategory,
        amount,   setAmount,
        currency, setCurrency,
        description, setDescription,
        day,      setDay,
        month,    setMonth,
        year,     setYear,

        // Reference data for dropdowns
        expense_types, currency_types,

        // Loading flags (exposed so screens can show a spinner)
        load1, load2,

        // Submit handler
        submit,
    };
}
