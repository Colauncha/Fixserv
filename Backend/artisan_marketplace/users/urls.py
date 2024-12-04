from django.urls import path
from .views import UserRegistrationView, LoginView, TestAuthView, LogoutView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('test-auth/', TestAuthView.as_view(), name='test-auth'),
]