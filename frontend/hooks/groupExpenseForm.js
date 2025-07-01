import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { useExpenseTypes, useCurrencyTypes, useUpdatingLimit, useCurrencyPreference } from "./data";

export function useGroupExpenseForm(group_id, members, func, id = null) {
    // 1. form state
    const [rows, setRows]                       = useState([]);
    const [note, setNote]                       = useState("");
    const [amount, setAmount]                   = useState("");
    const [currency, setCurrency]               = useState("");
    const [time, setTime]                       = useState(new Date());
    const [showDatePicker, setShowDatePicker]   = useState(false);

    const selectedMembers = rows.map(r => r.member).filter(Boolean)
    const total = rows.reduce((sum, row) => sum + (parseFloat(row.value) || 0), 0)

    // 1.2 Functions
    const handleAddRow = () => {
        if (rows.length >= members.length) return
        setRows(prev => [...prev, { member: null, value: '' }])
    }
    const handleRemoveRow = index => {
        setRows(prev => prev.filter((_, i) => i !== index))
    }
    const handleChangeRow = (index, key, newValue) => {
        setRows(prev =>
        prev.map((row, i) => (i === index ? { ...row, [key]: newValue } : row))
        )
    }
    const onDateChange = (event, selectedDate) => {
      setShowDatePicker(false);
      if (selectedDate) {
        setTime(selectedDate);
      }
    };

    const handleDivideEqually = () => {
        const n = rows.length
        if (n !== 0) {        
        const total = parseFloat(amount) || 0
        const per = (total / n).toString()
        setRows(rows.map(r => ({ ...r, value: per })))
        }
    }

    // 2. load data hooks
    const { data: currency_types, loading: load2 }        = useCurrencyTypes();
    const { data: currency_preference, loading: load3 }   = useCurrencyPreference();

    // 3. set defaults when loaded
    if(id == null){
        useEffect(() => {
            if (!load2 && !load3) {
                setCurrency((currency_preference == null ? "SGD" : currency_preference));
            }
        }, [load2, load3, currency_types, currency_preference]);
    }

    // 4. validate + submit
    //  @params
    //    group_id: string
    //    amount: float
    //    curency: string(3)
    //    note: string
    //    time: string in isoformat
    //    owes: list[{username(string), amount(float)}]
    const submit = async () => {
        // all required fields filled?
        if (![rows, note, amount, currency, time].every(Boolean)) {
            return Alert.alert("Please fill out all compulsory fields");
        }

        const amt = parseFloat(amount);
        const tot = parseFloat(total);
        if (isNaN(amt)) {
            return Alert.alert("Invalid amount");
        }

        if(amt !== tot){
            return Alert.alert("Unmatched total expense and splits")
        }

        let owes = [];
        for (let i = 0; i < rows.length; i++) {
            let temp_name = rows[i].member;
            let val = parseFloat(rows[i].value);
            if (isNaN(val)) {
                return Alert.alert("Invalid amount");
            }
            if (!temp_name) {
                return Alert.alert("Invalid member");
            }
            owes.push({
                username: temp_name,
                amount: val,
            })
        }
        

        await func({
            group_id,
            amount: amt,
            currency,
            note,
            time: time.toISOString(),
            owes
        });
    };

    return {
        // state + setters
        rows,       
        note,       setNote,
        amount,     setAmount,
        currency,   setCurrency,
        selectedMembers,
        total,
        time,
        showDatePicker, setShowDatePicker,
        handleAddRow,
        handleChangeRow,
        handleRemoveRow,
        onDateChange,
        handleDivideEqually,

        currency_types,

        // loading flags
        load3, load2,

        // submit fn
        submit,
    };
}
