// Simple in-memory auth store for mock credentials
export interface User {
  name: string;
  mobile: string;
  password?: string;
}

// Pre-seed with a default user for easy testing
const usersMap = new Map<string, User>([
  ['1234567890', { name: 'Demo User', mobile: '1234567890', password: 'password123' }]
]);

export const AuthStore = {
  register: (name: string, mobile: string, password?: string): boolean => {
    if (!mobile || !password) return false;
    usersMap.set(mobile, { name, mobile, password });
    return true;
  },
  
  login: (mobile: string, password?: string): User | null => {
    if (!mobile || !password) return null;
    const user = usersMap.get(mobile);
    if (user && user.password === password) {
      return { name: user.name, mobile: user.mobile };
    }
    return null;
  },

  userExists: (mobile: string): boolean => {
    return usersMap.has(mobile);
  },

  resetPassword: (mobile: string, newPassword?: string): boolean => {
    if (!mobile || !newPassword) return false;
    const user = usersMap.get(mobile);
    if (user) {
      user.password = newPassword;
      usersMap.set(mobile, user);
      return true;
    }
    return false;
  }
};
