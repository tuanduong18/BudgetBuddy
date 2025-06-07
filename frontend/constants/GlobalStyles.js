/** This file contains styles that are used across the application. */

import { StyleSheet } from 'react-native';
import { Colors } from './Colors';

export const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.inputBackground,
    borderRadius: 20,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
  },
  button: {
    width: '100%',              
    maxWidth: 300,              
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: Colors.buttonBackground,
    borderColor: Colors.text,
    borderWidth: 1,
    marginBottom: 20,
    alignSelf: 'center',        
  },
  buttonText: {
    fontSize: 16,
    color: Colors.buttonText,
    fontFamily: 'Inter_400Regular',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.text,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    marginBottom: 10,
  },
  link: {
    color: Colors.mutedText,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: Colors.errorText,
    marginBottom: 2,
  },
});
