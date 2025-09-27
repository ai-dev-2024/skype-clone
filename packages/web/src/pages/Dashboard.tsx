import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { contactsAPI, groupsAPI } from '../services/api'
import { useTheme } from '../contexts/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [contacts, setContacts] = useState([])
  const [groups, setGroups] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [contactsRes, groupsRes] = await Promise.all([
        contactsAPI.getContacts(),
        groupsAPI.getUserGroups()
      ])

      const contactsData = contactsRes.data?.data
      const groupsData = groupsRes.data?.data

      setContacts(Array.isArray(contactsData) ? contactsData : contactsData?.contacts || [])
      setGroups(Array.isArray(groupsData) ? groupsData : groupsData?.groups || [])
    } catch (error: any) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const response = await contactsAPI.searchUsers(query)
      setSearchResults(response.data?.data || [])
    } catch (error: any) {
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }

  const handleSendRequest = async (userId: string) => {
    try {
      await contactsAPI.sendRequest(userId)
      toast.success('Contact request sent!')
      setSearchResults(prev => prev.filter(user => (user.id || user._id) !== userId))
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send request')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
    } catch (error) {
      // Even if logout fails, clear local storage
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <header className="p-4 flex justify-between items-center" style={{ backgroundColor: 'var(--bg-chat-header)' }}>
        <h1 className="text-xl font-bold">Skype Clone</h1>
        <div className="flex items-center space-x-4">
          <span>Welcome, {user?.firstName}!</span>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 p-4 flex flex-col" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                handleSearch(e.target.value)
              }}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-color)'
              }}
            />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm text-gray-400 mb-2">Search Results</h3>
              <div className="space-y-2">
                {searchResults.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                    <div>
                      <div className="font-medium">{user.firstName} {user.lastName}</div>
                      <div className="text-sm text-gray-400">@{user.username}</div>
                    </div>
                    <button
                      onClick={() => handleSendRequest(user.id)}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contacts */}
          <div className="flex-1">
            <h3 className="text-sm text-gray-400 mb-2">Contacts</h3>
            <div className="space-y-2">
              {contacts.map((contact: any) => (
                <div
                  key={contact.contactId?.id || contact.contactId?._id || contact._id}
                  onClick={() => navigate(`/chat/${contact.contactId?.id || contact.contactId?._id || contact._id}`)}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded cursor-pointer"
                >
                  <div className={`w-3 h-3 rounded-full ${contact.contactId?.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <div>
                    <div className="font-medium">{contact.contactId?.firstName} {contact.contactId?.lastName}</div>
                    <div className="text-sm text-gray-400">@{contact.contactId?.username}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Groups */}
          <div className="mt-4">
            <h3 className="text-sm text-gray-400 mb-2">Groups</h3>
            <div className="space-y-2">
              {groups.map((group: any) => (
                <div
                  key={group.id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded cursor-pointer"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{group.name}</div>
                    <div className="text-sm text-gray-400">{group.members.length} members</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl mb-4">Welcome to Skype Clone!</h2>
            <p className="text-gray-400">Select a contact or group to start chatting</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
