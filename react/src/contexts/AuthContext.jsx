import { createContext, useEffect, useState } from 'react'
import api from '../api/axios'

const AuthContext = createContext({
    user: null,
    token: null,
    login: async () => { },
    register: async () => { },
    logout: () => { }
})

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(null)

    const saveToken = (accessToken) => {
        localStorage.setItem('accessToken', accessToken)
        setToken(accessToken)
    }

    const logout = () => {
        localStorage.removeItem('accessToken')
        setToken(null)
        setUser(null)
    }

    const fetchUser = async (accessToken) => {
        const authToken = accessToken || localStorage.getItem('accessToken')
        if (!authToken) return null

        try {
            const response = await api.get('users/me')
            setUser(response.data)
            return response.data
        } catch (err) {
            logout()
            const msg = err.response?.data?.message || err.message || 'שגיאת שליפת משתמש'
            throw new Error(msg)
        }
    }

    useEffect(() => {
        const savedToken = localStorage.getItem('accessToken')
        if (savedToken) {
            saveToken(savedToken)
            fetchUser(savedToken).catch(() => { })
        }
    }, [])

    const login = async (data) => {
        try {
            const response = await api.post('auth/login', data)
            saveToken(response.data.accessToken)
            await fetchUser(response.data.accessToken)
            return response.data
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'שגיאת התחברות'
            throw new Error(msg)
        }
    }

    const register = async (data) => {
        try {
            const response = await api.post('auth/register', data)
            saveToken(response.data.accessToken)
            await fetchUser(response.data.accessToken)
            return response.data
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'שגיאת הרשמה'
            throw new Error(msg)
        }
    }

    const updateProfile = async (updates) => {
        if (!user) throw new Error('No authenticated user')
        try {
            const payload = { id: user._id, ...updates }
            const response = await api.put('users', payload)
            const updated = response.data
            setUser(updated)
            return updated
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'שגיאת עדכון פרופיל'
            throw new Error(msg)
        }
    }

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export { AuthContext, AuthProvider }
