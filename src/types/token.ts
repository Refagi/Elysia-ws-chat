interface TokenTypes {
  ACCESS: string;
  REFRESH: string;
  RESET_PASSWORD: string;
  VERIFY_EMAIL: string;
}

export const tokenTypes: TokenTypes = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  RESET_PASSWORD: 'resetPassword',
  VERIFY_EMAIL: 'verifyEmail'
};