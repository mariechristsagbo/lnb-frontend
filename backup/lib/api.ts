import axios from "axios";

const api = axios.create({
  baseURL: "https://www.backend.lnb-intranet.globalitnet.org", // Remplace par l'URL de ton backend
});

api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response && error.response.status === 401) {
      const refreshToken = JSON.parse(localStorage.getItem("authTokens") || "null")?.refresh;
      if (refreshToken) {
        try {
          const response = await axios.post<{ access: string }>("/api/token/refresh/", { refresh: refreshToken });
          const storedTokens = JSON.parse(localStorage.getItem("authTokens") || "{}");
          const newTokens = { ...storedTokens, access: response.data.access };
          localStorage.setItem("authTokens", JSON.stringify(newTokens));
          api.defaults.headers.common["Authorization"] = `Bearer ${response.data.access}`;
          return api(error.config);
        } catch (refreshError) {
          console.error("Session expirée, veuillez vous reconnecter.", refreshError);
          localStorage.removeItem("authTokens");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;