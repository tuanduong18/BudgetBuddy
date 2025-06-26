import { Platform, View, Text, ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

const isWeb = Platform.OS === 'web';
const {
  VictoryChart,
  VictoryBar,
  VictoryAxis,
  VictoryPie
} = isWeb
  ? require('victory')            // Web build (victory)
  : require('victory-native');    // Native build (victory-native)

import React, { useState, useEffect } from 'react';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useAnalyticsExpenses, useAnalyticsCategories, useAnalyticsBudgetsSavings } from '@/hooks/data';
import { useFonts, Inter_500Medium } from '@expo-google-fonts/inter';


export default function Analytics() {
  // period state: determines if we show 'weekly' or 'monthly' view
  const [period, setPeriod] = useState('weekly');
  // refDate state: the "anchor" date (ISO YYYY-MM-DD) that defines the current period window
  //   • Initially set to today's date when the screen mounts
  //   • For 'weekly', this date determines which Monday–Sunday week to show
  //   • For 'monthly', this date determines which calendar month to show
  const [refDate, setRefDate] = useState(new Date().toISOString().slice(0, 10));

  // Fetch data using custom hook; params become POST body
  // expenses
  const { data: expenses, loading: expLoading } =
    useAnalyticsExpenses({ period, referenceDate: refDate });
  
  // category
  const { data: categories, loading: catLoading } =
    useAnalyticsCategories({ period, referenceDate: refDate });
  
  // budgets/savings
  const { data: summary, loading: sumLoading } =
    useAnalyticsBudgetsSavings({ period, referenceDate: refDate });

  useEffect(() => {
    console.log('🔍 expenses:',   expenses);
    console.log('🔍 categories:', categories);
    console.log('🔍 summary:',    summary);
  }, [expenses, categories, summary]);

  // Load the custom font; returns boolean loaded
  const [fontsLoaded] = useFonts({ Inter_500Medium });
  // If font isn't loaded yet, render nothing 
  if (!fontsLoaded) return null;

  // Handlers to shift the refDate backward by one week or one month
  const handlePrev = () => {
    const dt = new Date(refDate);  // parse current refDate
    if (period === 'weekly') {
      dt.setDate(dt.getDate() - 7); // go back 7 days
    } else {
      dt.setMonth(dt.getMonth() - 1); // go back 1 month
    }
    setRefDate(dt.toISOString().slice(0, 10)); // update state
  };
  
  // Handlers to shift the refDate forward by one week or one month
  const handleNext = () => {
    const dt = new Date(refDate);  // parse current refDate
    if (period === 'weekly') {
      dt.setDate(dt.getDate() + 7); // advance 7 days
    } else {
      dt.setMonth(dt.getMonth() + 1); // advance 1 month
    }
    setRefDate(dt.toISOString().slice(0, 10)); // update state
  };

  // Helper to format the period label for UI (e.g., "Week 6/1/24 - 6/7/24" or "June 2025")
  const formatLabel = () => {
    // parse refDate
    const dt = new Date(refDate); 

    // If weekly view, compute the start and end of the week
    if (period === 'weekly') {
      // getDay(): 0=Sunday, 1=Monday, etc.
      const day = dt.getDay();

      // Compute the difference of reference date to the start of the week (Monday)
      // Subtract that difference from the reference date to get the Monday of that week
      const diffToMon = day === 0 ? -6 : 1 - day;

      // add the difference to set to Monday of that week
      const mon = new Date(dt);
      mon.setDate(dt.getDate() + diffToMon); 

      // add 6 days to Monday to set to Sunday of that week
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);       

      // Return date range from mon to sun
      return `Week ${mon.toLocaleDateString()} - ${sun.toLocaleDateString()}`;
    
    } else {
      // Monthly view: show full month and year
      return dt.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
  };

  // If any data is still loading, show a spinner
  if (expLoading || catLoading || sumLoading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  // Prepare bar chart data: map each expense row to { x: weekday-label, y: total }
  const barData = expenses.map(({ date, total }) => {
    const d = new Date(date); // parse ISO date
    const label = d.toLocaleDateString(undefined, { weekday: 'short' });
    return { x: label, y: total };
  });

  // Prepare pie chart data: map each category row to { x: label, y: percent }
  const pieData = categories.map(c => ({ x: `${c.category} ${c.percent}%`, y: c.percent }));

  // Render the full Analytics UI inside a scrolling container
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Screen title */}
      <Text style={styles.title}>Analytics</Text>

      {/* Header row: period picker + navigation arrows + period label */}
      <View style={styles.headerRow}>
        {/* Dropdown to switch between weekly/monthly */}
        <Picker selectedValue={period} onValueChange={setPeriod} style={styles.picker}>
          <Picker.Item label="Weekly" value="weekly" />
          <Picker.Item label="Monthly" value="monthly" />
        </Picker>
        {/* Prev/Next buttons with label */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={handlePrev}><Ionicons name="chevron-back" size={24} /></TouchableOpacity>
          <Text style={styles.periodLabel}>{formatLabel()}</Text>
          <TouchableOpacity onPress={handleNext}><Ionicons name="chevron-forward" size={24} /></TouchableOpacity>
        </View>
      </View>

      {/* Bar chart for daily spending: horizontally scrollable */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <VictoryChart domainPadding={10} width={barData.length * 40} height={200}>
          <VictoryAxis style={{ tickLabels: { fontSize: 10 } }} /> {/* X-axis (days) */}
          <VictoryAxis dependentAxis />                               {/* Y-axis (amount) */}
          {/* Bars all filled with a single color (blue)*/}
          <VictoryBar data={barData} style={{ data: { fill: '#4f8ef7' } }} /> 
        </VictoryChart>
      </ScrollView>

      {/* Donut chart with legend: side-by-side */}
      <View style={styles.blockRow}>
        {/* Donut chart inside a scroll view for future multi-window support */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pieScroll}>
          <VictoryPie data={pieData} innerRadius={50} labels={() => null} width={200} height={200} />
        </ScrollView>
        {/* Legend listing each category and its percent */}
        <View style={styles.legend}>
          {categories.map(c => (
            <View key={c.category} style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: '#'+((1<<24)*Math.random()|0).toString(16) }]} />
              <Text style={styles.legendText}>{c.category} ({c.percent}%)</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Two summary cards: budgets on track and savings completed */}
      <View style={styles.cardRow}>
        <View style={[styles.card, styles.cardBudget]}>
          <Text style={styles.cardTitle}>Budget on Track</Text>
          <Text style={styles.cardValue}>{summary.budgetsOnTrack} / {summary.totalBudgets}</Text>
        </View>
        <View style={[styles.card, styles.cardSaving]}>
          <Text style={styles.cardTitle}>Savings Completed</Text>
          <Text style={styles.cardValue}>{summary.savingsCompleted} / {summary.totalSavings}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// StyleSheet for screen components
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },      // full-screen white background
  content:   { padding: 16 },                           // padding around content
  title:     { fontSize: 24, fontWeight: 'bold', marginBottom: 16, alignSelf: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  picker:    { flex: 1 },                                // grow to fill horizontal space
  navRow:    { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  periodLabel: { marginHorizontal: 8, fontSize: 14 },
  blockRow:    { flexDirection: 'row', marginTop: 24, alignItems: 'center' },
  pieScroll:   { flex: 2 },                             // donut chart area
  legend:      { flex: 1, paddingLeft: 16 },             // legend area
  legendItem:  { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  legendSwatch:{ width: 12, height: 12, marginRight: 8 },
  legendText:  { fontSize: 12 },
  cardRow:     { flexDirection: 'row', marginTop: 32, justifyContent: 'space-between' },
  card:        { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', marginHorizontal: 4 },
  cardBudget:  { backgroundColor: '#e0d4f7' },           // purple
  cardSaving:  { backgroundColor: '#f7d4d4' },           // pink
  cardTitle:   { fontSize: 14, marginBottom: 8 },
  cardValue:   { fontSize: 20, fontWeight: 'bold' },
});


