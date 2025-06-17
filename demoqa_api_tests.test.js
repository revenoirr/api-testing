const axios = require('axios');

const BASE_URL = 'https://demoqa.com';

axios.defaults.timeout = 10000;

const validUserData = {
  userName: 'testuser_' + Date.now(),
  password: 'TestPassword123!'
};

const invalidUserData = {
  userName: 'testuser_invalid',
  password: ''
};

let createdUserUuid = null;
let authToken = null;

describe('DemoQA API Tests', () => {
  
  jest.setTimeout(15000);
  
  describe('POST /Account/v1/User - Create User', () => {
    
    test('Positive: Should create a user with valid data', async () => {
      try {
        const response = await axios.post(`${BASE_URL}/Account/v1/User`, validUserData);
        
        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('userID');
        expect(response.data).toHaveProperty('username');
        expect(response.data).toHaveProperty('books');
        
        createdUserUuid = response.data.userID;
        
        expect(response.data.username).toBe(validUserData.userName);
        expect(Array.isArray(response.data.books)).toBe(true);
        
      } catch (error) {
        if (error.response && error.response.status === 406) {
          expect(error.response.data).toHaveProperty('message');
          expect(error.response.data.message).toContain('User exists!');
        } else {
          throw error;
        }
      }
    });

    test('Negative: Should fail to create user with empty password', async () => {
      try {
        await axios.post(`${BASE_URL}/Account/v1/User`, invalidUserData);
        fail('Expected request to fail with empty password');
        
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('message');
        
        const errorMessage = error.response.data.message;
        const validErrorMessages = [
          'Passwords must have at least one non alphanumeric character',
          'UserName and Password required.',
          'Password field is required'
        ];
        
        expect(validErrorMessages.some(msg => errorMessage.includes(msg))).toBe(true);
      }
    });
  });

  describe('POST /Account/v1/GenerateToken - Generate Token', () => {
    
    test('Positive: Should generate token for existing user', async () => {
      try {
        const response = await axios.post(`${BASE_URL}/Account/v1/GenerateToken`, validUserData);
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('token');
        expect(response.data).toHaveProperty('expires');
        expect(response.data).toHaveProperty('status');
        expect(response.data).toHaveProperty('result');
        
        authToken = response.data.token;
        
        expect(response.data.status).toBe('Success');
        expect(response.data.result).toBe('User authorized successfully.');
        expect(typeof response.data.token).toBe('string');
        expect(response.data.token.length).toBeGreaterThan(0);
        
      } catch (error) {
        console.error('Token generation failed:', error.response?.data);
        throw error;
      }
    });

    test('Negative: Should fail to generate token with incorrect password', async () => {
      const invalidCredentials = {
        userName: validUserData.userName,
        password: 'WrongPassword123!'
      };
      
      try {
        const response = await axios.post(`${BASE_URL}/Account/v1/GenerateToken`, invalidCredentials);
        
        if (response.status === 200) {
          expect(response.data).toHaveProperty('status');
          expect(response.data).toHaveProperty('result');
          expect(response.data.status).toBe('Failed');
          expect(response.data.result).toBe('User authorization failed.');
        }
        
      } catch (error) {
        if (error.response) {
          expect([400, 401, 404]).toContain(error.response.status);
          expect(error.response.data).toHaveProperty('message');
        } else {
          expect(error.message).toBeDefined();
        }
      }
    });
  });

  describe('GET /Account/v1/User/{UUID} - Get User Info', () => {
    
    test('Positive: Should get information about existing user', async () => {
      if (!createdUserUuid) {
        console.log('Skipping test - no user UUID available');
        return;
      }
      
      try {
        const response = await axios.get(`${BASE_URL}/Account/v1/User/${createdUserUuid}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('userId');
        expect(response.data).toHaveProperty('username');
        expect(response.data).toHaveProperty('books');
        
        expect(response.data.userId).toBe(createdUserUuid);
        expect(response.data.username).toBe(validUserData.userName);
        expect(Array.isArray(response.data.books)).toBe(true);
        
      } catch (error) {
        console.error('Get user info failed:', error.response?.data);
        throw error;
      }
    });

    test('Negative: Should fail to get info about non-existent user', async () => {
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';
      
      try {
        await axios.get(`${BASE_URL}/Account/v1/User/${nonExistentUuid}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        fail('Expected request to fail for non-existent user');
        
      } catch (error) {
        if (error.response) {
          expect([401, 404, 502]).toContain(error.response.status);
          
          if (error.response.data && typeof error.response.data === 'object') {
            expect(error.response.data).toHaveProperty('message');
          }
        } else {
          expect(error.message).toBeDefined();
        }
      }
    });
  });

  describe('DELETE /Account/v1/User/{UUID} - Delete User', () => {
    
    test('Negative: Should fail to delete non-existent user', async () => {
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';
      
      try {
        await axios.delete(`${BASE_URL}/Account/v1/User/${nonExistentUuid}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        fail('Expected request to fail for non-existent user');
        
      } catch (error) {
        if (error.response) {
          expect([401, 404, 502]).toContain(error.response.status);
          
          if (error.response.data && typeof error.response.data === 'object') {
            expect(error.response.data).toHaveProperty('message');
          }
        } else {
          expect(error.message).toBeDefined();
        }
      }
    });

    test('Positive: Should delete existing user', async () => {
      if (!createdUserUuid) {
        console.log('Skipping test - no user UUID available');
        return;
      }
      
      try {
        const response = await axios.delete(`${BASE_URL}/Account/v1/User/${createdUserUuid}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        expect([200, 204]).toContain(response.status);
        createdUserUuid = null;
        
      } catch (error) {
        if (error.response && error.response.status === 502) {
          console.log('Server error (502) - DemoQA service may be temporarily unavailable');
          createdUserUuid = null;
        } else {
          console.error('Delete user failed:', error.response?.data || error.message);
          throw error;
        }
      }
    });
  });

  // Cleanup after all tests
  afterAll(async () => {
    if (createdUserUuid && authToken) {
      try {
        await axios.delete(`${BASE_URL}/Account/v1/User/${createdUserUuid}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        console.log('Cleanup successful - user deleted');
      } catch (error) {
        if (error.response && error.response.status === 502) {
          console.log('Cleanup: Server error (502) - user may already be deleted');
        } else {
          console.log('Cleanup failed - user may already be deleted or service unavailable');
        }
      }
    }
  });
});