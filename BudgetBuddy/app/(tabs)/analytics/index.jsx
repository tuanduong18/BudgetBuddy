import React, { useState, useMemo } from "react";
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
import { addDays, format } from "date-fns";
import { useCurrencyPreference } from "@/hooks/data";
import { useFocusEffect } from "@react-navigation/native";
import numeral from 'numeral';

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

  // Re-fetch data and reset the period to 'weekly' each time the tab is focused,
  // ensuring charts always reflect live data rather than a stale cached state.
  useFocusEffect(
    React.useCallback(() => {
      refetchCurrency();
      reload();
      setPeriod("weekly");
    }, [refetchCurrency])
  );

  // Derive BarChart labels (day abbreviation or day-of-month) and totals from the API response.
  const labels = expenses.map((e) =>
    format(new Date(e.date), period === "weekly" ? "E" : "d")
  );
  const totals = expenses.map((e) => e.total);

  const shiftDate = (dir) =>
    setRef((d) =>
      period === "weekly" ? addDays(d, dir * 7) : firstOfMonthShift(d, dir)
    );

  // Build a human-readable date range label (e.g. "01 Jan – 07 Jan").
  const rangeText = (() => {
    if (!expenses.length) return "";
    const first = format(new Date(expenses[0].date), "dd MMM");
    const last  = format(new Date(expenses[expenses.length - 1].date), "dd MMM");
    return `${first} – ${last}`;
  })();

  /**
   * Build PieChart data, showing at most 5 slices.
   * Categories are sorted by descending amount so the biggest spenders appear first.
   * If there are more than 5 categories, all remaining ones are aggregated into
   * a neutral grey "Others" slice to keep the chart readable.
   */
  const pieData = useMemo(() => {
    if (!categories.length) return [];

    const sorted = [...categories].sort((a, b) => b.amount - a.amount);
    const MAX_SLICES = 5;

    if (sorted.length <= MAX_SLICES) {
      return sorted.map((c, idx) => ({
        name: c.category,
        population: c.amount,
        color: palette[idx % palette.length],
        legendFontColor: "#333",
        legendFontSize: 12,
      }));
    }

    const major = sorted.slice(0, MAX_SLICES - 1);
    const othersAmount = sorted
      .slice(MAX_SLICES - 1)
      .reduce((sum, c) => sum + c.amount, 0);

    const chartReady = major.map((c, idx) => ({
      name: c.category,
      population: c.amount,
      color: palette[idx % palette.length],
      legendFontColor: "#333",
      legendFontSize: 12,
    }));

    chartReady.push({
      name: "Others",
      population: othersAmount,
      color: "#a0a0a0", // neutral grey for the aggregated "Others" slice
      legendFontColor: "#333",
      legendFontSize: 12,
    });
    return chartReady;
  }, [categories]);

  if ( loading || preferenceCurrencyLoading ) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff'}}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Screen title */}
        <Text style={styles.screenTitle}>Analytics</Text>

        {/* BarChart title */}
        <Text style={styles.chartTitle}>Spending amount</Text>

        {/* Header controls */}
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

        {/* BarChart */}
        {!loading && !error && !!expenses.length && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={{ labels, datasets: [{ data: totals }] }}
              width={Math.max(labels.length * 60, screenW - 32)}
              height={220}
              fromZero
              showValuesOnTopOfBars={false}
              chartConfig={chartCfg}
              withInnerLines={true}
                             
            />
          </ScrollView>
        )}

        {/* PieChart title */}
        <Text style={styles.chartTitle}>Spending categories</Text>

        {/* PieChart */}
        {!loading && !error && !!pieData.length && (
            <PieChart
              data={pieData}
              width={screenW}
              height={220}
              hasLegend={true}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="16"
              chartConfig={{ color: () => "#000", decimalPlaces: 0 }}
            />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * react-native-chart-kit configuration for the spending BarChart.
 * formatYLabel compacts large values (e.g. 1200 → "1.2 k") via numeral.js.
 */
const chartCfg = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo:   "#fff",
  decimalPlaces: 0,
  barPercentage: 0.6,
  color: () => "#4b006e",
  fillShadowGradient: '#4e8cff',
  fillShadowGradientOpacity: 1,
  formatYLabel: (val) => numeral(val).format('0.0 a'),
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

