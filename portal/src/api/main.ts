import { useAuth } from "../context/AuthContext";
import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Define interfaces for API responses and data structures
// Student Interface (from your student data)
interface Student {
  fatherInfo: {
    name: string;
    email: string;
    phoneNumber: string;
    occupation: string;
  };
  motherInfo: {
    name: string;
    email: string;
    phoneNumber: string;
    occupation: string;
  };
  guardianInfo: {
    name: string;
    relation: string;
    phoneNumber: string;
    email: string;
    occupation: string;
  };
  transportInfo: {
    route: string;
    vehicleNumber: string;
    pickupPoint: string;
  };
  medicalHistory: {
    condition: string;
    allergies: string[];
    medications: string[];
  };
  previousSchool: {
    name: string;
    address: string;
  };
  _id: string;
  academicYear: string;
  admissionNumber: string;
  admissionDate: string;
  status: 'active' | 'inactive';
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  bloodGroup: string;
  religion: string;
  category: string;
  motherTongue: string;
  languagesKnown: string[];
  currentAddress: string;
  permanentAddress: string;
  email: string;
  password: string;
  role: 'student';
  __v: number;
}

// Event Interface (from your Event model)
interface Event {
  _id: string;
  eventFor: 'All' | 'Students' | 'Staffs';
  eventTitle: string;
  eventCategory: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  attachment?: {
    fileName: string;
    filePath: string;
    fileSize: number;
    fileFormat: string;
  };
  __v?: number;
}

// FormData for adding an event (matches the frontend form)
interface AddEventFormData {
  eventFor: 'All' | 'Students' | 'Staffs';
  eventTitle: string;
  eventCategory: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  attachment?: File | undefined;
}

// API response types
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface EventsResponse {
  message: string;
  count: number;
  events: Event[];
}

interface EventResponse {
  message: string;
  event: Event;
}

// Create an Axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: `${process.env.REACT_APP_URL || 'http://localhost:5000'}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add Authorization header with token (if available)
apiClient.interceptors.request.use(
  (config) => {
    // Note: We can't directly use useAuth here because interceptors run outside of React components
    // Instead, we'll pass the token as a parameter to API calls that need it
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API service class
const apiService = {
  // Students API Calls
  getAllStudents: async (token?: string): Promise<Student[]> => {
    try {
      const response: AxiosResponse<Student[]> = await apiClient.get('/student', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch students');
    }
  },

  // Events API Calls
  addEvent: async (eventData: AddEventFormData, token?: string): Promise<Event> => {
    try {
      const formattedData = {
        ...eventData,
        attachment: undefined, // Set to undefined since we're not handling files yet
      };
  
      const response: AxiosResponse<ApiResponse<Event>> = await apiClient.post(
        '/events/add',
        formattedData,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
  
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
  
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create event');
    }
  },

  getAllEvents: async (token?: string): Promise<Event[]> => {
    try {
      const response: AxiosResponse<EventsResponse> = await apiClient.get('/events/get', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data.events;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch events');
    }
  },

  getEventById: async (id: string, token?: string): Promise<Event> => {
    try {
      const response: AxiosResponse<EventResponse> = await apiClient.get(`/events/get/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data.event;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch event');
    }
  },

  getEventsByCategory: async (category: string, token?: string): Promise<Event[]> => {
    try {
      const response: AxiosResponse<EventsResponse> = await apiClient.get(
        `/events/get/category/${category}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      return response.data.events;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch events by category');
    }
  },
};

export default apiService;