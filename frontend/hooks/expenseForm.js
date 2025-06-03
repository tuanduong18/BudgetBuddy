import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { useExpenseTypes, useCurrencyTypes, useUpdatingExpense, useCurrencyPreference } from "./data";

export function useExpenseForm(func, id = null) {
    // 1. form state
    const [category, setCategory]           = useState("");
    const [optional_cat, setOptionalCat]    = useState("");
    const [amount, setAmount]               = useState("");
    const [currency, setCurrency]           = useState("");
    const [description, setDescription]     = useState("");
    const [day, setDay]                     = useState("");
    const [month, setMonth]                 = useState("");
    const [year, setYear]                   = useState("");

    // 2. load data hooks
    const { data: expense_types, loading: load1 }           = useExpenseTypes();
    const { data: currency_types, loading: load2 }          = useCurrencyTypes();
    const { data: currency_preference, loading: load3 }     = useCurrencyPreference();

    // 3. set defaults when loaded
    if(id == null){
        const today = new Date()
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
        const {data: expense, loading: load4} = useUpdatingExpense({id: id});
        useEffect(() => {
            if (!load4) {
                setCategory((expense.category).toString());
                setOptionalCat((expense.optional_cat).toString());
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
    // 4. validate + submit
    const submit = async () => {
        // all required fields filled?
        if (![category, amount, currency, day, month, year].every(Boolean)) {
        return Alert.alert("Please fill out all compulsory fields");
        }

        // build date
        const dt = new Date(+year, +month - 1, +day+1);
        if (isNaN(dt.getTime())) {
            return Alert.alert("Invalid date");
        }

        // amount parse
        const amt = parseFloat(amount);
        if (isNaN(amt)) {
            return Alert.alert("Invalid amount");
        }

        await func({
            id,
            category,
            optional_cat,
            amount: amt,
            currency,
            description,
            time: dt.toISOString(),
        });
    };

    return {
        // state + setters
        category, setCategory,
        optional_cat, setOptionalCat,
        amount,   setAmount,
        currency, setCurrency,
        description, setDescription,
        day,      setDay,
        month,    setMonth,
        year,     setYear,

        // data
        expense_types, currency_types,

        // loading flags
        load1, load2,

        // submit fn
        submit,
    };
}
