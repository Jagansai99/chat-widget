import axios from "axios";

const API = axios.create({
  baseURL: "https://sherley-ascosporic-euna.ngrok-free.dev",
//    withCredentials: true,
});

API.interceptors.request.use((req) => {
  return req;
});

export default API;
