import API_URL from './config';
const API_URL = import.meta.env.PROD ? '' : `${API_URL}`;
export default API_URL;
