/**
 * JWT persistence helpers built on top of AsyncStorage.
 *
 * The access token has a short TTL and is refreshed automatically via
 * useRefreshToken() in hooks/auth.js.  The refresh token has a long TTL
 * and is kept until the user explicitly signs out.
 *
 * Both tokens are stored under fixed string keys so they can be retrieved
 * from anywhere in the app without passing them through React props.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persist both JWT tokens to device storage after a successful sign-in
 * or token refresh.
 *
 * @param {string} accessToken  - Short-lived access JWT.
 * @param {string} refreshToken - Long-lived refresh JWT.
 */
export const saveTokens = async (accessToken, refreshToken) => {
  await AsyncStorage.setItem('accessToken', accessToken);
  await AsyncStorage.setItem('refreshToken', refreshToken);
};

/**
 * Retrieve the stored access token.
 *
 * @returns {Promise<string|null>} The access token, or null if not set.
 */
export const getAccessToken = async () => {
  return await AsyncStorage.getItem('accessToken');
};

/**
 * Retrieve the stored refresh token.
 *
 * @returns {Promise<string|null>} The refresh token, or null if not set.
 */
export const getRefreshToken = async () => {
  return await AsyncStorage.getItem('refreshToken');
};

/**
 * Remove both tokens from device storage on sign-out.
 *
 * Errors are caught and logged rather than thrown so that the sign-out
 * flow can continue even if storage is unavailable.
 */
export const clearTokens = async () => {
  try {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
  } catch (e) {
    console.warn('clearTokens: nothing to clear or storage error', e);
  }
};
