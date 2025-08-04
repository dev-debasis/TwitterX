import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GoogleLogin from '../components/auth/GoogleLogin.jsx'

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()


  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid'
    if (!formData.username.trim()) newErrors.username = 'Username is required'
    else if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters'
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (validateForm()) {
      setIsLoading(true)
      setErrors({})
      
      try {
        const response = await fetch('https://twitterx-b7xc.onrender.com/api/v1/users/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            username: formData.username,
            password: formData.password
          })
        })

        const data = await response.json()

        if (response.ok) {          
          if (data.token) {
            localStorage.setItem('token', data.token)
          }
          
          navigate('/signin')
          
          alert('Account created successfully! Please sign in.')
          
        } else {
          if (data.errors) {
            const backendErrors = {}
            if (Array.isArray(data.errors)) {
              data.errors.forEach(error => {
                if (error.field) {
                  backendErrors[error.field] = error.message
                }
              })
            }
            setErrors(backendErrors)
          } else if (data.message) {
            setErrors({ general: data.message })
          } else {
            setErrors({ general: 'Registration failed. Please try again.' })
          }
        }
      } catch (error) {
        console.error('Registration error:', error)
        setErrors({ 
          general: 'Network error. Please check your connection and try again.' 
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center justify-center w-12 h-12">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>
          <h1 className="text-white text-2xl font-bold mb-2">Create an account</h1>
        </div>

        <GoogleLogin />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-black px-4 text-gray-400 text-sm">or</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Error Message */}
          {errors.general && (
            <div className="bg-red-900/20 border border-red-500 rounded-md p-3 mb-4">
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Name */}
          <div>
            <div className="relative">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full bg-black border border-gray-600 rounded-md px-3 pt-6 pb-2 text-white text-lg focus:border-blue-500 focus:outline-none peer"
                placeholder=" "
              />
              <label className="absolute text-gray-400 text-sm transition-all duration-200 transform -translate-y-4 scale-75 top-2 left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4">
                Name
              </label>
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-black border border-gray-600 rounded-md px-3 pt-6 pb-2 text-white text-lg focus:border-blue-500 focus:outline-none peer"
                placeholder=" "
              />
              <label className="absolute text-gray-400 text-sm transition-all duration-200 transform -translate-y-4 scale-75 top-2 left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4">
                Email
              </label>
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Username */}
          <div>
            <div className="relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full bg-black border border-gray-600 rounded-md px-3 pt-6 pb-2 text-white text-lg focus:border-blue-500 focus:outline-none peer"
                placeholder=" "
              />
              <label className="absolute text-gray-400 text-sm transition-all duration-200 transform -translate-y-4 scale-75 top-2 left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4">
                Username
              </label>
            </div>
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-black border border-gray-600 rounded-md px-3 pt-6 pb-2 text-white text-lg focus:border-blue-500 focus:outline-none peer pr-12"
                placeholder=" "
              />
              <label className="absolute text-gray-400 text-sm transition-all duration-200 transform -translate-y-4 scale-75 top-2 left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <div className="relative">
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full bg-black border border-gray-600 rounded-md px-3 pt-6 pb-2 text-white text-lg focus:border-blue-500 focus:outline-none peer"
                placeholder=" "
              />
              <label className="absolute text-gray-400 text-sm transition-all duration-200 transform -translate-y-4 scale-75 top-2 left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4">
                Confirm password
              </label>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black font-bold py-3 px-4 rounded-full text-lg hover:bg-gray-200 transition duration-200 mt-6 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        {/* Sign In Link */}
        <div className="text-center mt-2">
          <p className="text-gray-400 text-sm">
            Have an account already?{' '}
            <Link to="/signin" className="text-blue-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Terms and Privacy */}
        <p className="text-gray-400 text-xs mt-4 leading-4">
          By signing up, you agree to the{' '}
          <a href="#" className="text-blue-400 hover:underline">Terms of Service</a>{' '}
          and{' '}
          <a href="#" className="text-blue-400 hover:underline">Privacy Policy</a>,
          including{' '}
          <a href="#" className="text-blue-400 hover:underline">Cookie Use</a>.
        </p>

        
      </div>
    </div>
  )
}

export default Signup