// Authentication utilities with best practices
export interface User {
  id: number;
  email: string;
  fullName: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Get user from localStorage
export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error parsing stored user:', error);
    return null;
  }
};

// Store user in localStorage with remember me option
export const storeUser = (user: User, rememberMe: boolean = false): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('auth_user', JSON.stringify(user));
    
    // If remember me is enabled, also store a flag
    if (rememberMe) {
      localStorage.setItem('auth_remember_me', 'true');
      console.log('User stored with remember me enabled');
    } else {
      localStorage.removeItem('auth_remember_me');
      console.log('User stored with session-based storage');
    }
  } catch (error) {
    console.error('Error storing user:', error);
  }
};

// Remove user from localStorage
export const removeUser = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_remember_me');
    console.log('User data removed from storage');
  } catch (error) {
    console.error('Error removing user:', error);
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return getStoredUser() !== null;
};

// Check if remember me is enabled
export const isRememberMeEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    return localStorage.getItem('auth_remember_me') === 'true';
  } catch (error) {
    console.error('Error checking remember me status:', error);
    return false;
  }
};

// Get authentication state
export const getAuthState = (): AuthState => {
  const user = getStoredUser();
  return {
    user,
    isAuthenticated: user !== null,
    isLoading: false
  };
}; 