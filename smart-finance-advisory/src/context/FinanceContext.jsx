import React, { createContext, useContext, useState, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const FinanceContext = createContext(null)

export function FinanceProvider({ children }) {
  const [transactions, setTransactions] = useState([])
  const [budgets,      setBudgets]      = useState([])
  const [summary,      setSummary]      = useState(null)
  const [prediction,   setPrediction]   = useState(null)
  const [healthScore,  setHealthScore]  = useState(null)
  const [loading,      setLoading]      = useState(false)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/transactions')
      setTransactions(res.data)
    } catch (err) {
      console.error('fetchTransactions error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const addTransaction = useCallback(async (data) => {
    try {
      const res = await axios.post('/api/transactions', data)
      setTransactions(prev => [res.data, ...prev])
      toast.success('Transaction added!')
      return res.data
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add transaction')
    }
  }, [])

  const deleteTransaction = useCallback(async (id) => {
    try {
      await axios.delete(`/api/transactions/${id}`)
      setTransactions(prev => prev.filter(t => t._id !== id))
      toast.success('Transaction deleted!')
    } catch (err) {
      toast.error('Failed to delete transaction')
    }
  }, [])

  const fetchSummary = useCallback(async () => {
    try {
      const res = await axios.get('/api/analytics/summary')
      setSummary(res.data)
      return res.data
    } catch (err) {
      console.error('fetchSummary error:', err)
    }
  }, [])

  const fetchPrediction = useCallback(async () => {
    try {
      const res = await axios.get('/api/ml/predict')
      setPrediction(res.data)
      return res.data
    } catch (err) {
      console.error('fetchPrediction error:', err)
    }
  }, [])

  const fetchHealthScore = useCallback(async () => {
    try {
      const res = await axios.get('/api/ml/health')
      setHealthScore(res.data)
      return res.data
    } catch (err) {
      console.error('fetchHealthScore error:', err)
    }
  }, [])

  const fetchBudgets = useCallback(async () => {
    try {
      const res = await axios.get('/api/budgets')
      setBudgets(res.data)
      return res.data
    } catch (err) {
      console.error('fetchBudgets error:', err)
    }
  }, [])

  const saveBudget = useCallback(async (data) => {
    try {
      const res = await axios.post('/api/budgets', data)
      toast.success('Budget saved!')
      return res.data
    } catch (err) {
      toast.error('Failed to save budget')
    }
  }, [])

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await axios.get('/api/analytics/monthly')
      return res.data
    } catch (err) {
      console.error('fetchAnalytics error:', err)
    }
  }, [])

  return (
    <FinanceContext.Provider value={{
      transactions, budgets, summary, prediction, healthScore, loading,
      fetchTransactions, addTransaction, deleteTransaction,
      fetchSummary, fetchPrediction, fetchHealthScore,
      fetchBudgets, saveBudget, fetchAnalytics,
    }}>
      {children}
    </FinanceContext.Provider>
  )
}

export const useFinance = () => useContext(FinanceContext)