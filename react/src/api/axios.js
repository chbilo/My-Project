import axios from 'axios'

const configuredApiUrl =
  import.meta.env.VITE_API_URL?.trim() || 'https://my-project-ah0h.onrender.com'

export const API_BASE_URL = configuredApiUrl
  .replace(/\/+$/, '')
  .replace(/(?:\/api)+$/i, '')
export const API_ROOT_URL = `${API_BASE_URL}/api`

const api = axios.create({ baseURL: `${API_ROOT_URL}/` })

export const getUploadUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('[axios] request:', config.method, config.url)
    return config
  },
  (error) => {
    console.error('[axios] request error:', error)
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    console.log('[axios] response:', response.status, response.config.url, response.data)
    return response
  },
  (error) => {
    console.error('[axios] response error:', error.response || error)
    return Promise.reject(error)
  }
)

export default api
