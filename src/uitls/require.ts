import axios from "axios";
import {getGost} from './server';

const require = axios.create()
require.interceptors.request.use((config)=>{
    const gost = getGost();
    config.baseURL = gost?.addr
    config.auth = gost?.auth;
    return config;
})
export default require;