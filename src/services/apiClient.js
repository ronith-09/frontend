import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 10000
});

client.interceptors.response.use(
  response => response,
  error => {
    console.warn('API fallback triggered:', error?.message);
    throw error;
  }
);

export async function safeGet(url, fallback = []) {
  try {
    const { data } = await client.get(url);
    return data;
  } catch (error) {
    return fallback;
  }
}

export async function safePost(url, payload, fallback = {}) {
  try {
    const { data } = await client.post(url, payload);
    return data;
  } catch (error) {
    return fallback;
  }
}

export default client;

