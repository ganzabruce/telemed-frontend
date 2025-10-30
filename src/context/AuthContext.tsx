// src/context/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from "react"
import type { ReactNode } from 'react'

export type UserRole = "ADMIN" | "HOSPITAL_ADMIN" | "DOCTOR" | "RECEPTIONIST" | "PATIENT"

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED"

export interface User {
  id: string
  fullName: string
  email: string
  phone?: string
  role: UserRole
  status?: UserStatus
  isEmailVerified?: boolean
  createdAt?: string
  updatedAt?: string
  token?: string
}

type AuthState = {
  user: User | null
  isLoading: boolean
}

type AuthAction =
  | { type: "LOGIN"; payload: User }
  | { type: "LOGOUT" }
  | { type: "RESTORE"; payload: User | null }
  | { type: "SET_LOADING"; payload: boolean }

const initialState: AuthState = { 
  user: null,
  isLoading: true
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN":
      localStorage.setItem("user", JSON.stringify(action.payload))
      return { ...state, user: action.payload, isLoading: false }
    case "LOGOUT":
      localStorage.removeItem("user")
      return { ...state, user: null, isLoading: false }
    case "RESTORE":
      return { ...state, user: action.payload, isLoading: false }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    default:
      return state
  }
}

export const AuthContext = createContext<{
  state: AuthState
  dispatch: React.Dispatch<AuthAction>
}>({
  state: initialState,
  dispatch: () => {},
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    const restoreUser = () => {
      try {
        const stored = localStorage.getItem("user")
        if (stored) {
          const user = JSON.parse(stored)
          dispatch({ type: "RESTORE", payload: user })
        } else {
          dispatch({ type: "SET_LOADING", payload: false })
        }
      } catch (error) {
        console.error("Error restoring user:", error)
        localStorage.removeItem("user")
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }

    restoreUser()
  }, [])
  console.log(state)
  return <AuthContext.Provider value={{ state, dispatch }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)