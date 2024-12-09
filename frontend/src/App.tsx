import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import DefaultLayout from './components/layouts/DefaultLayout';
import HomePage from './pages/home';
import AuthLayout from './components/layouts/AuthLayout';
import SignupPage from './pages/auth/sign-up';
import GuestSignUpPage from './pages/auth/guest-sign-up';
import LoginPage from './pages/auth/login';
import { WelcomePage } from './pages/welcome-page';
import ClientLayout from './components/layouts/ClientLayout';
import ClientHomePage from './pages/clients/home';


const router = createBrowserRouter([
  {
    path: '/',
    element: <DefaultLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />
      },
      {
        path: '/welcome',
        element: <WelcomePage />
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
      },
      {
        path: '/auth/guest-sign-up',
        element: <GuestSignUpPage />
      },
      {
        path: '/auth/login',
        element: <LoginPage />
      },
    ]
  },
  {
    path: 'client',
    element: <ClientLayout />,
    children: [
      {
        path: '/client/home',
        element: <ClientHomePage />
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
