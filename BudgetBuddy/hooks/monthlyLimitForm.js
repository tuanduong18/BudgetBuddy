/**
 * Monthly budget limit form state management hook.
 *
 * Mirrors the pattern of useExpenseForm: when `id` is null the form is
 * initialised for creation; when `id` is provided the existing limit is
 * loaded and pre-populated for editing.
 *
 * @param {Function}    func - The CRUD action callback (useAddLimit or useUpdateLimit).
 * @param {number|null} id   - Limit ID for updates, or null for new entries.
 */
import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { useExpenseTypes, useCurrencyTypes, useUpdatingLimit, useCurrencyPreference } from "./data";

export function useMonthlyLimitForm(func, id = null) {
    // Form state
    const [types, setTypes]                 = useState([]);
    const [amount, setAmount]               = useState("");
    const [currency, setCurrency]           = useState("");

    // Reference data for the category and currency dropdowns.
    const { data: expense_types,  loading: load1 } = useExpenseTypes();
    const { data: currency_types, loading: load2 } = useCurrencyTypes();
    const { data: currency_preference, loading: load3 } = useCurrencyPreference();

    // Initialise defaults once reference data finishes loading.
    if (id == null) {
        useEffect(() => {
            if (!load1 && !load2 && !load3) {
                setCurrency((currency_preference == null ? "SGD" : currency_preference));
            }
        }, [load1, load2, load3, expense_types, currency_types, currency_preference]);
    } else {
        // Pre-populate fields from the existing limit being edited.
        const { data: lim, loading: load4 } = useUpdatingLimit({ id });
        useEffect(() => {
            if (!load4) {
                setAmount((parseFloat(lim.amount)).toString());
                setCurrency(lim.currency);
                setTypes(lim.types);
            }
        }, [load4, lim]);
    }

    /**
     * Validate required fields, parse the amount, then delegate to the
     * provided CRUD action callback.
     */
    const submit = async () => {
        if (![amount, currency].every(Boolean) || types.length == 0) {
            return Alert.alert("Please fill out all compulsory fields");
        }

        const amt = parseFloat(amount);
        if (isNaN(amt) || amt <= 0) {
            return Alert.alert("Invalid amount");
        }

        await func({
            id,
            amount: amt,
            currency,
            types,
        });
    };

    return {
        // Form state + setters
        types,      setTypes,
        amount,     setAmount,
        currency,   setCurrency,

        // Reference data for dropdowns
        expense_types, currency_types,

        // Loading flags
        load1, load2,

        // Submit handler
        submit,
    };
}
