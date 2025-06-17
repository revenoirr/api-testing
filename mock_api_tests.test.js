const axios = require('axios');

jest.mock('axios');
const mockedAxios = axios;

const mockSuccessfulUserData = {
  id: 1,
  name: "John Doe",
  email: "john.doe@example.com",
  username: "johndoe",
  phone: "+1-555-123-4567",
  address: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipcode: "10001",
    country: "USA"
  },
  company: {
    name: "Doe Enterprises",
    industry: "Technology",
    position: "Software Engineer"
  },
  dob: "1990-05-15",
  profile_picture_url: "https://example.com/images/johndoe.jpg",
  is_active: true,
  created_at: "2023-01-01T12:00:00Z",
  updated_at: "2023-10-01T12:00:00Z",
  preferences: {
    language: "en",
    timezone: "America/New_York",
    notifications_enabled: true
  }
};

const mockErrorResponses = {
  403: {
    error: "Forbidden",
    details: "You do not have permission to access this resource",
    status: 403,
    timestamp: "2023-12-01T12:00:00Z"
  },
  404: {
    error: "Not Found",
    details: "User with the specified ID was not found",
    status: 404,
    timestamp: "2023-12-01T12:00:00Z"
  },
  502: {
    error: "Bad Gateway",
    details: "The server received an invalid response from the upstream server",
    status: 502,
    timestamp: "2023-12-01T12:00:00Z"
  }
};

const getUserById = async (userId) => {
  try {
    const response = await axios.get(`https://api.example.com/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

describe('Mock API Tests - User Endpoint', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Response (200)', () => {
    
    test('Should return user data with valid structure for existing user', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockSuccessfulUserData
      });

      const result = await getUserById(1);

      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.example.com/users/1');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      
      // Basic fields
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('phone');
      
      // Nested objects
      expect(result).toHaveProperty('address');
      expect(result.address).toHaveProperty('street');
      expect(result.address).toHaveProperty('city');
      expect(result.address).toHaveProperty('state');
      expect(result.address).toHaveProperty('zipcode');
      expect(result.address).toHaveProperty('country');
      
      expect(result).toHaveProperty('company');
      expect(result.company).toHaveProperty('name');
      expect(result.company).toHaveProperty('industry');
      expect(result.company).toHaveProperty('position');
      
      expect(result).toHaveProperty('preferences');
      expect(result.preferences).toHaveProperty('language');
      expect(result.preferences).toHaveProperty('timezone');
      expect(result.preferences).toHaveProperty('notifications_enabled');
      
      // Data types
      expect(typeof result.id).toBe('number');
      expect(typeof result.name).toBe('string');
      expect(typeof result.email).toBe('string');
      expect(typeof result.username).toBe('string');
      expect(typeof result.phone).toBe('string');
      expect(typeof result.is_active).toBe('boolean');
      expect(typeof result.preferences.notifications_enabled).toBe('boolean');
      
      // Specific data
      expect(result.id).toBe(1);
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john.doe@example.com');
      expect(result.is_active).toBe(true);
    });
    
    test('Should validate date format for timestamps', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockSuccessfulUserData
      });

      const result = await getUserById(1);
      
      expect(result.dob).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      expect(result.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });
  });

  describe('No Content Response (204)', () => {
    
    test('Should handle 204 response correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        status: 204,
        data: null
      });

      const result = await getUserById(1);
      
      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.example.com/users/1');
      expect(result).toBeNull();
    });
  });

  describe('Error Response (403 - Forbidden)', () => {
    
    test('Should handle 403 Forbidden error correctly', async () => {
      const errorResponse = {
        response: {
          status: 403,
          data: mockErrorResponses[403]
        }
      };
      
      mockedAxios.get.mockRejectedValueOnce(errorResponse);

      try {
        await getUserById(1);
        fail('Expected function to throw an error');
      } catch (error) {
        expect(error.response.status).toBe(403);
        expect(error.response.data).toHaveProperty('error');
        expect(error.response.data).toHaveProperty('details');
        expect(error.response.data).toHaveProperty('status');
        expect(error.response.data).toHaveProperty('timestamp');
        
        expect(error.response.data.error).toBe('Forbidden');
        expect(error.response.data.details).toContain('permission');
        expect(error.response.data.status).toBe(403);
      }
    });
  });

  describe('Error Response (404 - Not Found)', () => {
    
    test('Should handle 404 Not Found error correctly', async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: mockErrorResponses[404]
        }
      };
      
      mockedAxios.get.mockRejectedValueOnce(errorResponse);

      try {
        await getUserById(999);
        fail('Expected function to throw an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data).toHaveProperty('error');
        expect(error.response.data).toHaveProperty('details');
        expect(error.response.data).toHaveProperty('status');
        
        expect(error.response.data.error).toBe('Not Found');
        expect(error.response.data.details).toContain('not found');
        expect(error.response.data.status).toBe(404);
      }
    });
  });

  describe('Error Response (502 - Bad Gateway)', () => {
    
    test('Should handle 502 Bad Gateway error correctly', async () => {
      const errorResponse = {
        response: {
          status: 502,
          data: mockErrorResponses[502]
        }
      };
      
      mockedAxios.get.mockRejectedValueOnce(errorResponse);

      try {
        await getUserById(1);
        fail('Expected function to throw an error');
      } catch (error) {
        expect(error.response.status).toBe(502);
        expect(error.response.data).toHaveProperty('error');
        expect(error.response.data).toHaveProperty('details');
        expect(error.response.data).toHaveProperty('status');
        
        expect(error.response.data.error).toBe('Bad Gateway');
        expect(error.response.data.details).toContain('upstream server');
        expect(error.response.data.status).toBe(502);
      }
    });
  });

  describe('Error Handling Validation', () => {
    
    test('Should properly handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockedAxios.get.mockRejectedValueOnce(networkError);

      try {
        await getUserById(1);
        fail('Expected function to throw an error');
      } catch (error) {
        expect(error.message).toBe('Network Error');
        expect(error.response).toBeUndefined();
      }
    });
    
    test('Should validate all error response structures', async () => {
      const statusCodes = [403, 404, 502];
      
      for (const statusCode of statusCodes) {
        const errorResponse = {
          response: {
            status: statusCode,
            data: mockErrorResponses[statusCode]
          }
        };
        
        mockedAxios.get.mockRejectedValueOnce(errorResponse);

        try {
          await getUserById(1);
          fail(`Expected function to throw an error for status ${statusCode}`);
        } catch (error) {
          expect(error.response.data).toHaveProperty('error');
          expect(error.response.data).toHaveProperty('details');
          expect(error.response.data).toHaveProperty('status');
          expect(error.response.data).toHaveProperty('timestamp');
          
          expect(typeof error.response.data.error).toBe('string');
          expect(typeof error.response.data.details).toBe('string');
          expect(typeof error.response.data.status).toBe('number');
          expect(typeof error.response.data.timestamp).toBe('string');
          
          expect(error.response.data.status).toBe(statusCode);
        }
        
        jest.clearAllMocks();
      }
    });
  });

  describe('Mock Validation Tests', () => {
    
    test('Should return successful response when valid user ID (1) is provided', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/users/1')) {
          return Promise.resolve({
            status: 200,
            data: mockSuccessfulUserData
          });
        } else {
          return Promise.reject({
            response: {
              status: 404,
              data: mockErrorResponses[404]
            }
          });
        }
      });

      const result = await getUserById(1);
      expect(result).toEqual(mockSuccessfulUserData);
      
      try {
        await getUserById(999);
        fail('Expected function to throw an error for invalid user ID');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });
  });
});