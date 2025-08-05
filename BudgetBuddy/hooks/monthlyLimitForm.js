import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { useExpenseTypes, useCurrencyTypes, useUpdatingLimit, useCurrencyPreference } from "./data";

export function useMonthlyLimitForm(func, id = null) {
    // 1. form state
    const [types, setTypes]                 = useState([]);
    const [amount, setAmount]               = useState("");
    const [currency, setCurrency]           = useState("");

    // 2. load data hooks
    const { data: expense_types,  loading: load1 }   = useExpenseTypes();
    const { data: currency_types, loading: load2 }   = useCurrencyTypes();
    const { data: currency_preference, loading: load3 }   = useCurrencyPreference();

    // 3. set defaults when loaded
    if(id == null){
        useEffect(() => {
            if (!load1 && !load2 && !load3) {
                setCurrency((currency_preference == null ? "SGD" : currency_preference));
            }
        }, [load1, load2, load3, expense_types, currency_types, currency_preference]);
    } else {
        const {data: lim, loading: load4} = useUpdatingLimit({id: id});
        useEffect(() => {
            if (!load4) {
                setAmount((parseFloat(lim.amount)).toString());
                setCurrency((lim.currency) );
                setTypes(lim.types)
            }
        }, [load4, lim]);
    }
    // 4. validate + submit
    const submit = async () => {
        // all required fields filled?
        if (![amount, currency].every(Boolean) || types.length == 0) {
        return Alert.alert("Please fill out all compulsory fields");
        }

        // amount parse
        const amt = parseFloat(amount);
        if (isNaN(amt) || amt <= 0) {
            return Alert.alert("Invalid amount");
        }

        await func({
            id,
            amount: amt,
            currency,
            types: types,
        });
    };

    return {
        // state + setters
        types,      setTypes,
        amount,     setAmount,
        currency,   setCurrency,

        // data
        expense_types, currency_types,

        // loading flags
        load1, load2,

        // submit fn
        submit,
    };
}
