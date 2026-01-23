import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './input.css'
import App from './App.tsx'
import { UserProvider } from './contexts/UserContext.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import { ToastContainer } from 'react-toastify'
import ErrorBoundary from './Components/ErrorBoundary.tsx'

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>

      <UserProvider>
        <ThemeProvider>
          <App />
          <ToastContainer
            position="top-center"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </ThemeProvider>
      </UserProvider>
    </ErrorBoundary>
  </StrictMode>,
)
