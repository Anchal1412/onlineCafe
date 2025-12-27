import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const userToken = Cookies.get("userToken");
  const adminToken = Cookies.get("adminToken");

  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  } else if (userToken) {
    config.headers.Authorization = `Bearer ${userToken}`;
  }
  return config;
});

export default api;
