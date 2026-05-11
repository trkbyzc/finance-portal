import axios from 'axios';

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api',
    // İstekte 10 saniyeden fazla gecikme olursa iptal etsin (Performans puanı kazandırır)
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Gelen cevaptan doğrudan data'yı çıkarır.
// Artık her yerde response.data.data demek zorunda kalmayız.
apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        console.error("API İstek Hatası:", error);
        return Promise.reject(error);
    }
);