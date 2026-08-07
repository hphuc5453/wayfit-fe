import Axios, { InternalAxiosRequestConfig } from 'axios';

import { useNotifications } from '@/components/ui/notifications';
import { env } from '@/config/env';
import { paths } from '@/config/paths';

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  if (config.headers) {
    config.headers.Accept = 'application/json';
  }

  config.withCredentials = true;
  return config;
}

export const api = Axios.create({
  baseURL: env.API_URL,
});

api.interceptors.request.use(authRequestInterceptor);
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Request kiểm tra phiên đăng nhập: lỗi (401 hoặc network) là bình thường
    // khi chưa đăng nhập / backend chưa sẵn sàng -> không báo lỗi, không redirect.
    const isAuthCheck = error.config?.url === '/auth/me';

    if (!isAuthCheck) {
      const message = error.response?.data?.message || error.message;
      useNotifications.getState().addNotification({
        type: 'error',
        title: 'Error',
        message,
      });

      if (error.response?.status === 401) {
        const searchParams = new URLSearchParams();
        const redirectTo =
          searchParams.get('redirectTo') || window.location.pathname;
        window.location.href = paths.auth.login.getHref(redirectTo);
      }
    }

    return Promise.reject(error);
  },
);
