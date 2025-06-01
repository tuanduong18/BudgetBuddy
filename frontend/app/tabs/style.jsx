import { StyleSheet } from "react-native";

export default function createStyles(theme = {}, colorScheme = "light") {
  return StyleSheet.create({
    container: {
      flex: 1,
      width: '100%',
      backgroundColor: '#ffde1a', // static yellow background
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      gap: 6,
      width: '100%',
      maxWidth: 1024,
      marginHorizontal: 'auto',
      pointerEvents: 'auto',
    },
    input: {
      flex: 1,
      borderColor: 'gray',
      borderWidth: 1,
      borderRadius: 5,
      padding: 10,
      marginRight: 10,
      fontSize: 18,
      fontFamily: 'Inter_500Medium',
      minWidth: 0,
      color: '#11181C',  // static dark text
    },
    saveButton: {
      backgroundColor: '#00c897', // green CTA
      borderRadius: 5,
      padding: 10,
    },
    saveButtonText: {
      fontSize: 18,
      color: colorScheme === 'dark' ? 'black' : 'white',
    },
    row: {
      margin: 15,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 2,
    },
    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    dateInput: {
      width: 50,
    },
    dateYearInput: {
      width: 80,
    },
    dateSep: {
      marginHorizontal: 4,
      fontSize: 18,
    },
    pickerWrapper: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 4,
      marginBottom: 12,
      overflow: "hidden",
    },
    picker: {
      height: 50,
      width: "100%",
    },
  });
}
