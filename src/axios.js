
// Module de remplacement pour axios
export default window.axios;
export const create = window.axios.create;
export const get = window.axios.get;
export const post = window.axios.post;
export const put = window.axios.put;
export const patch = window.axios.patch;
export const deleteRequest = window.axios.delete; // Renommé car 'delete' est un mot-clé réservé
export const all = window.axios.all;
export const spread = window.axios.spread;
export const isAxiosError = window.axios.isAxiosError;
export const AxiosError = window.axios.AxiosError;
export const Cancel = window.axios.Cancel;
export const CancelToken = window.axios.CancelToken;
export const isCancel = window.axios.isCancel;
export const VERSION = window.axios.VERSION;
export const toFormData = window.axios.toFormData;
export const AxiosHeaders = window.axios.AxiosHeaders;
export const HttpStatusCode = window.axios.HttpStatusCode;
export const formToJSON = window.axios.formToJSON;
export const mergeConfig = window.axios.mergeConfig;
