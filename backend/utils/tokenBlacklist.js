// utils/tokenBlacklist.js
const blacklistedTokens = new Map();
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

/**
 * Add a token to the blacklist
 * @param {string} token - The token to blacklist
 */
const addToBlacklist = (token) => {
  blacklistedTokens.set(token, Date.now() + TOKEN_EXPIRY);
  // Clean up expired tokens
  for (const [token, expiry] of blacklistedTokens.entries()) {
    if (expiry < Date.now()) {
      blacklistedTokens.delete(token);
    }
  }
};

/**
 * Check if a token is blacklisted
 * @param {string} token - The token to check
 * @returns {boolean} True if the token is blacklisted
 */
const isBlacklisted = (token) => {
  return blacklistedTokens.has(token);
};

export { addToBlacklist, isBlacklisted };
