import { constants } from '@/configs/constants';
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: constants.GHTK_API_URL,
  headers: {
    Token: constants.GHTK_API_KEY,
  },
});

axiosInstance.interceptors.response.use((res) => {
  return res.data;
});

export default axiosInstance;
