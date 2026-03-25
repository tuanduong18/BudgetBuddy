/**
 * Application-wide shared styles.
 *
 * Components import these tokens via `GlobalStyles as GS` and compose them
 * with local overrides so that typography, colour, and spacing are consistent
 * across screens without duplicating StyleSheet definitions.
 *
 * Colour values are sourced from the centralised `Colors` palette so that
 * theming changes propagate everywhere automatically.
 */
import { StyleSheet } from 'react-native';
import { Colors } from './Colors';

export const GlobalStyles = StyleSheet.create({
  /** Full-screen scrollable/flex container with standard page padding. */
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },

  /** Elevated white card used for forms and summary panels. */
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

  /** Standard text input field with a rounded border. */
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

  /** Full-width primary action button (max 300 px wide, centred). */
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

  /** Label text rendered inside a `button`. */
  buttonText: {
    fontSize: 16,
    color: Colors.buttonText,
    fontFamily: 'Inter_400Regular',
  },

  /** Bold screen/section heading. */
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.text,
  },

  /** Secondary supporting text rendered beneath a title or button. */
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    marginBottom: 10,
  },

  /** Inline hyperlink-style text (e.g. "Sign In" / "Sign Up" navigation links). */
  link: {
    color: Colors.mutedText,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },

  /** Inline validation or API error message displayed in red. */
  errorText: {
    color: Colors.errorText,
    marginBottom: 2,
  },

  /** Default placeholder colour for TextInput components. */
  placeholder: '#757575',
});
