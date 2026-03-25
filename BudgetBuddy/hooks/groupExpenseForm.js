/**
 * Group expense form state management hook.
 *
 * Manages the dynamic "split among" rows where each row maps a group member
 * to their share of the total amount.  Also provides a "divide equally"
 * convenience function.
 *
 * @param {string}   group_id - ID of the group this expense belongs to.
 * @param {string[]} members  - List of member usernames in the group.
 * @param {Function} func     - The CRUD action callback (useAddGroupExpense).
 * @param {number|null} id    - Expense ID for updates (currently unused, reserved).
 */
import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { useCurrencyTypes, useCurrencyPreference } from "./data";

export function useGroupExpenseForm(group_id, members, func, id = null) {
    // Form state
    const [rows, setRows]                       = useState([]);
    const [note, setNote]                       = useState("");
    const [amount, setAmount]                   = useState("");
    const [currency, setCurrency]               = useState("");
    const [time, setTime]                       = useState(new Date());
    const [showDatePicker, setShowDatePicker]   = useState(false);

    // Derived values used by the UI to show selection state and running total.
    const selectedMembers = rows.map(r => r.member).filter(Boolean);
    const total = rows.reduce((sum, row) => sum + (parseFloat(row.value) || 0), 0);

    // ── Row manipulation helpers ───────────────────────────────────────────
    /** Add a new empty split row (capped at the number of group members). */
    const handleAddRow = () => {
        if (rows.length >= members.length) return;
        setRows(prev => [...prev, { member: null, value: '' }]);
    };

    /** Remove the split row at the given index. */
    const handleRemoveRow = index => {
        setRows(prev => prev.filter((_, i) => i !== index));
    };

    /** Update a single field (`member` or `value`) in the row at `index`. */
    const handleChangeRow = (index, key, newValue) => {
        setRows(prev =>
            prev.map((row, i) => (i === index ? { ...row, [key]: newValue } : row))
        );
    };

    /** Sync the date picker selection back to state. */
    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setTime(selectedDate);
        }
    };

    /** Distribute the total amount equally across all current rows. */
    const handleDivideEqually = () => {
        const n = rows.length;
        if (n !== 0) {
            const total = parseFloat(amount) || 0;
            const per = (total / n).toString();
            setRows(rows.map(r => ({ ...r, value: per })));
        }
    };

    // Reference data for the currency dropdown.
    const { data: currency_types, loading: load2 }        = useCurrencyTypes();
    const { data: currency_preference, loading: load3 }   = useCurrencyPreference();

    // Initialise the currency with the user's saved preference.
    if (id == null) {
        useEffect(() => {
            if (!load2 && !load3) {
                setCurrency((currency_preference == null ? "SGD" : currency_preference));
            }
        }, [load2, load3, currency_types, currency_preference]);
    }

    /**
     * Validate all fields, then build the request payload and delegate to the CRUD action.
     *
     * Request body shape:
     *   group_id  {string}           - Group PK.
     *   amount    {number}           - Total expense amount.
     *   currency  {string}           - ISO 4217 currency code.
     *   note      {string}           - Short description.
     *   time      {string}           - ISO 8601 date string.
     *   owes      {Array<{username, amount}>} - Per-member split.
     */
    const submit = async () => {
        if (![rows, note, amount, currency, time].every(Boolean)) {
            return Alert.alert("Please fill out all compulsory fields");
        }

        const amt = parseFloat(amount);
        const tot = parseFloat(total);
        if (isNaN(amt) || amt <= 0 || isNaN(tot)) {
            return Alert.alert("Invalid amount");
        }

        // Ensure the sum of individual splits equals the total expense.
        if (amt !== tot) {
            return Alert.alert("Unmatched total expense and splits");
        }

        let owes = [];
        for (let i = 0; i < rows.length; i++) {
            let memberName = rows[i].member;
            let val = parseFloat(rows[i].value);
            if (isNaN(val)) {
                return Alert.alert("Invalid amount");
            }
            if (!memberName) {
                return Alert.alert("Invalid member");
            }
            owes.push({
                username: memberName,
                amount: val,
            });
        }

        await func({
            group_id,
            amount: amt,
            currency,
            note,
            time: time.toISOString(),
            owes,
        });
    };

    return {
        // Form state + setters
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

        // Reference data
        currency_types,

        // Loading flags
        load3, load2,

        // Submit handler
        submit,
    };
}
