import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Button,
} from "react-native";
import { BarChart, PieChart } from "react-native-chart-kit";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addDays, addMonths, format } from "date-fns";
import { useCurrencyPreference } from "@/hooks/data";
import { useFocusEffect } from "@react-navigation/native";

const screenW  = Dimensions.get("window").width;
const palette  = ["#4e8cff", "#ffca3a", "#8ac926", "#ff595e", "#1982c4", "#6a4c93"];

const firstOfMonthShift = (d, n) => {
  const tmp = new Date(d.getFullYear(), d.getMonth(), 1);
  tmp.setMonth(tmp.getMonth() + n);
  return tmp;
};

export default function AnalyticsScreen() {
  const { data: currency, loading: preferenceCurrencyLoading, refetch: refetchCurrency } = useCurrencyPreference();
  const [period,  setPeriod]  = useState("weekly");
  const [refDate, setRef]     = useState(new Date());

  const { expenses, categories, loading, error, reload } = useAnalytics(period, refDate);

   // Reload whenever access this screen
  useFocusEffect(
    React.useCallback(() => {
      refetchCurrency();
      reload();
      setPeriod("weekly");
    }, [refetchCurrency])
  );

  if ( loading || preferenceCurrencyLoading ) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  /* ---------- BarChart data ---------- */
  const labels = expenses.map((e) =>
    format(new Date(e.date), period === "weekly" ? "E" : "d")
  );
  const totals = expenses.map((e) => e.total);

  const shiftDate = (dir) =>
    setRef((d) =>
      period === "weekly" ? addDays(d, dir * 7) : firstOfMonthShift(d, dir)
    );

  const rangeText = (() => {
    if (!expenses.length) return "";
    const first = format(new Date(expenses[0].date), "dd MMM");
    const last  = format(new Date(expenses[expenses.length - 1].date), "dd MMM");
    return `${first} – ${last}`;
  })();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff'}}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* ===== Title ===== */}
        <Text style={styles.screenTitle}>Analytics</Text>
        <Text style={styles.chartTitle}>Spending amount</Text>
        {/* ===== Header controls ===== */}
        <View style={styles.row}>
          <Button title="<" onPress={() => shiftDate(-1)} />
          <Text
            style={styles.modeTitle}
            onPress={() =>
              setPeriod((p) => (p === "weekly" ? "monthly" : "weekly"))
            }>
            {period === "weekly" ? "Weekly" : "Monthly"}
          </Text>
          <Button title=">" onPress={() => shiftDate(1)} />
        </View>

        {!!rangeText && (
          <Text style={{ textAlign: "center", marginBottom: 8 }}>{rangeText}</Text>
        )}

        {loading && <ActivityIndicator size="large" style={{ marginTop: 40 }} />}
        {error   && <Text style={{ color: "red" }}>{error.message}</Text>}

        {/* ===== BarChart ===== */}
        {!loading && !error && !!expenses.length && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={{ labels, datasets: [{ data: totals }] }}
              width={Math.max(labels.length * 60, screenW - 32)}
              height={220}
              yAxisSuffix={!currency ? ' SGD' : ' ' + currency}
              fromZero
              showValuesOnTopOfBars={false}
              chartConfig={chartCfg}
              withInnerLines={true}                
            />
          </ScrollView>
        )}

        <Text style={styles.chartTitle}>Spending categories</Text>
        {/* ===== PieChart ===== */}
        {!loading && !error && !!categories.length && (
          <>
            <PieChart
              data={categories.map((c, idx) => ({
                name: c.category,
                population: c.amount,
                color: palette[idx % palette.length],
                legendFontColor: "#333",
                legendFontSize: 12,
              }))}
              width={screenW}
              height={220}
              hasLegend={true}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="16"
              chartConfig={{ color: () => "#000", decimalPlaces: 0 }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ----- styles & chart config ----- */
const chartCfg = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo:   "#fff",
  decimalPlaces: 0,
  barPercentage: 0.6,
  color: () => "#4b006e",
  fillShadowGradient: '#4e8cff',
  fillShadowGradientOpacity: 1,
  labelColor: () => "#333",
  propsForBackgroundLines: { 
    strokeWidth: 0.5,
    stroke: "#d9d9d9",
  },
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop:40, },
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  modeTitle: { fontSize: 18, fontWeight: "600" },
  swatch: { width: 10, height: 10, marginRight: 4 },
    chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'left',   
    marginTop: 16,
  },
});

