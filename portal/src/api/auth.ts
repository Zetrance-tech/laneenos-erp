import axios from 'axios';
// Define the base URL from environment variable
const API_BASE_URL = `${process.env.REACT_APP_URL}/api`;

// Define the register request payload type
interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'parent' | 'teacher';
}

// Register user
export const registerUser = async (data: RegisterRequest) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/signup`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

// Login user
export const loginUser = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

// // Forgot password
// export const forgotPassword = async (email: string) => {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/forgot-password`, { email });
//     return response.data;
//   } catch (error: any) {
//     throw new Error(error.response?.data?.message || 'Password reset failed');
//   }
// };