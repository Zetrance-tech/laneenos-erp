// // import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
// // import { loginUser, registerUser } from '../api/auth'; 

// // interface User {
// //   name: string;
// //   email: string;
// //   role: 'admin' | 'student' | 'parent' | 'teacher';
// // }

// // interface AuthContextType {
// //   user: User | null;
// //   token: string | null;
// //   login: (email: string, password: string) => Promise<void>;
// //   register: (name: string, email: string, password: string, role: 'student' | 'parent' | 'teacher') => Promise<void>;
// //   logout: () => void;
// // }

// // const AuthContext = createContext<AuthContextType | undefined>(undefined);

// // export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
// //   const [user, setUser] = useState<User | null>(null);
// //   const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

// //   useEffect(() => {
// //     const storedToken = localStorage.getItem('token');
// //     const storedUser = localStorage.getItem('user');
// //     if (storedToken && storedUser) {
// //       setToken(storedToken);
// //       setUser(JSON.parse(storedUser));
// //     }
// //   }, []);

// //   const login = async (email: string, password: string) => {
// //     try {
// //       const response = await loginUser(email, password);
// //       const { user, token } = response;
// //       setUser(user);
// //       setToken(token);
// //       localStorage.setItem('token', token);
// //       localStorage.setItem('user', JSON.stringify(user));
// //     } catch (error) {
// //       throw new Error('Invalid Credentials');
// //     }
// //   };

// //   const register = async (name: string, email: string, password: string, role: 'student' | 'parent' | 'teacher') => {
// //     try {
// //       const response = await registerUser({ name, email, password, role });
// //       const { user, token } = response;
// //       setUser(user);
// //       setToken(token);
// //       localStorage.setItem('token', token);
// //       localStorage.setItem('user', JSON.stringify(user));
// //     } catch (error) {
// //       throw new Error('Registration failed');
// //     }
// //   };

// //   const logout = () => {
// //     setUser(null);
// //     setToken(null);
// //     localStorage.removeItem('token');
// //     localStorage.removeItem('user');
// //   };

// //   return (
// //     <AuthContext.Provider value={{ user, token, login, register, logout }}>
// //       {children}
// //     </AuthContext.Provider>
// //   );
// // };

// // export const useAuth = () => {
// //   const context = useContext(AuthContext);
// //   if (!context) {
// //     throw new Error('useAuth must be used within an AuthProvider');
// //   }
// //   return context;
// // };

// import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
// import { loginUser, registerUser } from '../api/auth';

// interface User {
//   name: string;
//   email: string;
//   role: 'admin' | 'student' | 'parent' | 'teacher' | 'superadmin';
//   branchId:string | null;
// }

// interface AuthContextType {
//   user: User | null;
//   token: string | null;
//   isLoading: boolean; // Add loading state
//   login: (email: string, password: string) => Promise<void>;
//   register: (name: string, email: string, password: string, role: 'student' | 'parent' | 'teacher') => Promise<void>;
//   logout: () => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [token, setToken] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(true); // Initialize as true

//   useEffect(() => {
//     const storedToken = localStorage.getItem('token');
//     // console.log("useAuth",storedToken)
//     const storedUser = localStorage.getItem('user');
//     if (storedToken && storedUser) {
//       setToken(storedToken);
//       setUser(JSON.parse(storedUser));
//     }
//     setIsLoading(false); // Set loading to false after checking localStorage
//   }, []);

//   const login = async (email: string, password: string) => {
//     try {
//       const response = await loginUser(email, password);
//       const { user, token } = response;
//       setUser(user);
//       setToken(token);
//       localStorage.setItem('token', token);
//       localStorage.setItem('user', JSON.stringify(user));
//     } catch (error) {
//       throw new Error('Invalid Credentials');
//     }
//   };

//   const register = async (name: string, email: string, password: string, role: 'student' | 'parent' | 'teacher') => {
//     try {
//       const response = await registerUser({ name, email, password, role });
//       const { user, token } = response;
//       setUser(user);
//       setToken(token);
//       localStorage.setItem('token', token);
//       localStorage.setItem('user', JSON.stringify(user));
//     } catch (error) {
//       throw new Error('Registration failed');
//     }
//   };

//   const logout = () => {
//     setUser(null);
//     setToken(null);
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//   };

//   return (
//     <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { loginUser, registerUser } from '../api/auth';

interface User {
  id: string; // Added id to match backend user._id
  name: string;
  email: string;
  role: 'admin' | 'superadmin' | 'student' | 'parent' | 'teacher';
  branchId: string | null; // MongoDB Branch._id, optional for non-admins
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'student' | 'parent' | 'teacher') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser({
          id: parsedUser.id,
          name: parsedUser.name,
          email: parsedUser.email,
          role: parsedUser.role,
          branchId: parsedUser.branchId || null, // Ensure branchId is included
        });
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await loginUser(email, password);
      const { user, token } = response;
      const userData: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId || null, // Store Branch._id or null
      };
      setUser(userData);
      setToken(token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      throw new Error('Invalid Credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: 'student' | 'parent' | 'teacher') => {
    try {
      setIsLoading(true);
      const response = await registerUser({ name, email, password, role });
      const { user, token } = response;
      const userData: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId || null, // Store Branch._id or null
      };
      setUser(userData);
      setToken(token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      throw new Error('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};