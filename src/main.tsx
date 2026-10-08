import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ApiError } from './lib/api'
import { AuthProvider } from './lib/auth'
import { ToastProvider } from './lib/toast'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (count, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
        count < 3,
    },
  },
})

const storage = (() => {
  try {
    const probe = '__gp_probe__'
    window.localStorage.setItem(probe, probe)
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    return undefined
  }
})()

const persister = createAsyncStoragePersister({ storage, key: 'gp.query-cache' })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        buster: 'v1',
        dehydrateOptions: {
          shouldDehydrateQuery: (q) => q.queryKey[0] === 'topics' && q.state.status === 'success',
        },
      }}
    >
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
)
