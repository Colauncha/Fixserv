import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import DefaultLayout from './components/layouts/DefaultLayout';
import HomePage from './pages/home';
import AuthLayout from './components/layouts/AuthLayout';
import SignupPage from './pages/auth/sign-up';


const router = createBrowserRouter([
  {
    path: '/',
    element: <DefaultLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />
      }
    ]
  },
  {
    path: 'auth',
    element: <AuthLayout />,
    children: [
      {
        path: '/auth/sign-up',
        element: <SignupPage />
      }
    ]
  }
])

function App() {
  return (
    <RouterProvider router={router} />
  )
}

export default App
