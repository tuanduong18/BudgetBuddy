/**
 * Theme-aware style factory for auth screens.
 *
 * Returns a StyleSheet whose colours adapt to the current colour scheme
 * (light/dark).  This is not currently used by sign_in.jsx or sign_up.jsx
 * (which use GlobalStyles), but is retained for future theming support.
 *
 * @param {object} theme       - Colour palette with `background`, `text`, `button` keys.
 * @param {string} colorScheme - "dark" or "light".
 * @returns {StyleSheet}
 */
import { StyleSheet } from "react-native";

export default function createStyles(theme, colorScheme) {
    return StyleSheet.create({
        container: {
            flex: 1,
            width: '100%',
            backgroundColor: theme.background,
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
            color: theme.text,
        },
        saveButton: {
            backgroundColor: theme.button,
            borderRadius: 5,
            padding: 10,
        },
        saveButtonText: {
            fontSize: 18,
            color: colorScheme === 'dark' ? 'black' : 'white',
        },
    });
}