import axios from 'axios'

export const API_BASE_URL = 'http://localhost:7200'

const api = axios.create({ baseURL: `${API_BASE_URL}/api/` })

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
