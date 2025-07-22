import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider 
      clientId='949837499823-28oj87rftsu46bo16bvm1mlpb83s3s0f.apps.googleusercontent.com'
    >
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
