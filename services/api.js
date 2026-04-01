import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE = 'https://business.folinko.com';
const TOKEN_KEY = '@business_token';

// Global navigation reference for redirects
let navigationRef = null;
let pendingAuthRedirect = false;

export const setNavigationRef = (ref) => {
  navigationRef = ref;

  if (pendingAuthRedirect) {
    // Try to complete any pending redirect once navigator mounts.
    try {
      if (navigationRef?.isReady?.()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        pendingAuthRedirect = false;
      }
    } catch (e) {
      // ignore and keep pending
    }
  }
};

const safeRedirectToLogin = () => {
  try {
    if (navigationRef?.isReady?.()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      pendingAuthRedirect = false;
      return;
    }
  } catch (e) {
    // fall through to pending
  }

  pendingAuthRedirect = true;

  // Retry shortly in case navigator is still mounting.
  setTimeout(() => {
    try {
      if (pendingAuthRedirect && navigationRef?.isReady?.()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        pendingAuthRedirect = false;
      }
    } catch (e) {
      // ignore and keep pending
    }
  }, 250);
};

export const setAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const removeAuthToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

const parseUploadResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json().catch(() => ({}));
  }

  return response.text().catch(() => '');
};

const uploadRequest = async (endpoint, formData) => {
  console.log('ready to call uploadRequest======', endpoint);
  const url = `${API_BASE}${endpoint}`;
  const token = await getAuthToken();
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  console.log('url==========', url);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    const responseData = await parseUploadResponse(response);
    console.log('response json==========', responseData);


    if (!response.ok) {
      if (response.status === 401) {
        await removeAuthToken();
        safeRedirectToLogin();
        console.warn('Authentication expired - redirecting to login');
        return;
      }

      throw new Error((typeof responseData === 'string' ? responseData : responseData.message) || `HTTP error! status: ${response.status}`);
    }

    return responseData;
  } catch (error) {
    console.error('Upload request error:', error);

    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      await removeAuthToken();
      safeRedirectToLogin();
      console.warn('Authentication error - redirecting to login');
      return;
    }

    throw error;
  }
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const rawErrorMessage = errorData.message || errorData.error || errorData.code || '';
      const normalizedErrorMessage = String(rawErrorMessage).toLowerCase();
      const isExpectedAuthFailure =
        normalizedErrorMessage.includes('invalid_credentials') ||
        normalizedErrorMessage.includes('invalid credential') ||
        normalizedErrorMessage.includes('wrong password') ||
        normalizedErrorMessage.includes('user not found') ||
        normalizedErrorMessage.includes('invalid password') ||
        normalizedErrorMessage.includes('invalid email') ||
        (response.status === 401 && !token);
      const errorMessage =
        isExpectedAuthFailure
          ? 'Incorrect email or password'
          : rawErrorMessage ||
        (response.status === 401 && !token
          ? 'Invalid email or password'
          : `HTTP error! status: ${response.status}`);
      
      // Handle authentication errors (401 Unauthorized)
      if (response.status === 401 && token) {
        await removeAuthToken();
        // Navigate to LoginScreen
        safeRedirectToLogin();
        console.warn('Authentication expired - redirecting to login');
        return;
      }
      
      const requestError = new Error(errorMessage);
      requestError.suppressLogging = isExpectedAuthFailure;
      throw requestError;
    }

    if (response.status === 204) {
      return null;
    }

    // Handle different response types
    const contentType = response.headers.get('content-type') || '';
    const contentLength = response.headers.get('content-length');

    if (contentLength === '0' || !contentType) {
      const textResponse = await response.text().catch(() => '');
      return textResponse ? textResponse : null;
    }
    
    if (contentType.includes('svg')) {
        return response.text();
    } else {
      // For JSON responses, parse as JSON
      return await response.json();
    }
  } catch (error) {
    if (!error?.suppressLogging) {
      console.error('API request error:', error);
    }
    
    // Handle network errors or other auth-related issues
    if (token && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
      await removeAuthToken();
      // Navigate to LoginScreen
      safeRedirectToLogin();
      console.warn('Authentication error - redirecting to login');
      return;
    }
    
    throw error;
  }
};

// Health check
export const healthCheck = () => apiRequest('/api/health');

// Business Auth
export const businessAuth = {
  register: (email, password) => 
    apiRequest('/api/business/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: async (email, password) => {
    const response = await apiRequest('/api/business/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response?.access_token) {
      await setAuthToken(response.access_token);
    }
    
    return response;
  },

  getMe: () => apiRequest('/api/business/auth/me'),

  updateMe: (profileData) =>
    apiRequest('/api/business/auth/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  deleteMe: () =>
    apiRequest('/api/business/auth/me', {
      method: 'DELETE',
    }),

  changePassword: ({ current_password, new_password }) =>
    apiRequest('/api/business/auth/me/password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
    }),
};

// Shop Management
export const shop = {
  getMyShop: () => apiRequest('/api/business/shops/me'),

  createOrUpdateShop: (shopData) => 
    apiRequest('/api/business/shops/me', {
      method: 'POST',
      body: JSON.stringify(shopData),
    }),

  getQRCode: () => apiRequest('/api/business/shops/me/qr'),
};

// Inventory Posts
export const inventory = {
  getPosts: (page = 1, pageSize = 20) => 
    apiRequest(`/api/business/inventory/posts?page=${page}&page_size=${pageSize}`),

  createPost: (postData) => 
    apiRequest('/api/business/inventory/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    }),

  getPost: (postId) => 
    apiRequest(`/api/business/inventory/posts/${postId}`),

  updatePost: (postId, postData) => 
    apiRequest(`/api/business/inventory/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    }),

  deletePost: (postId) => 
    apiRequest(`/api/business/inventory/posts/${postId}`, {
      method: 'DELETE',
    }),

  incrementShareCount: (postId) => 
    apiRequest(`/api/business/inventory/posts/${postId}/share`, {
      method: 'POST',
    }),
};

// Verification
export const verification = {
  getVerificationStatus: () => apiRequest('/api/business/verification/me'),

  saveDraft: (verificationData) => 
    apiRequest('/api/business/verification/draft', {
      method: 'POST',
      body: JSON.stringify(verificationData),
    }),

  submitForReview: (verificationData) => 
    apiRequest('/api/business/verification/submit', {
      method: 'POST',
      body: JSON.stringify(verificationData),
    }),
};

// Analytics
export const analytics = {
  getSummary: () => apiRequest('/api/business/analytics/summary'),

  getOverview: () => apiRequest('/api/business/analytics/overview'),
};

// Orders
export const orders = {
  getOrders: (page = 1, pageSize = 20) => 
    apiRequest(`/api/business/orders?page=${page}&page_size=${pageSize}`),

  getOrder: (orderId) => 
    apiRequest(`/api/business/orders/${orderId}`),

  updateFulfillment: (orderId, fulfillmentData) => 
    apiRequest(`/api/business/orders/${orderId}/fulfillment`, {
      method: 'PUT',
      body: JSON.stringify(fulfillmentData),
    }),
};

// Feed
export const feed = {
  getFeed: (limit = 50) => 
    apiRequest(`/api/business/feed?limit=${limit}`),
};

// Payouts
export const payouts = {
  getPayouts: () => apiRequest('/api/business/payouts/me'),
};

// Uploads
export const uploads = {
  uploadInventoryImage: (fileAsset) => {
    const formData = new FormData();
    formData.append('file', fileAsset);
    return uploadRequest('/api/business/uploads/inventory-image', formData);
  },

  uploadShopPhoto: (fileAsset) => {
    const formData = new FormData();
    formData.append('file', fileAsset);
    return uploadRequest('/api/business/uploads/shop-photo', formData);
  },
};

// Export all services as default
export default {
  healthCheck,
  businessAuth,
  shop,
  inventory,
  verification,
  analytics,
  orders,
  feed,
  payouts,
  uploads,
  setAuthToken,
  getAuthToken,
  removeAuthToken,
};
