from django.shortcuts import render

# Create your views here.

from django.middleware.csrf import get_token
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils.decorators import method_decorator
from django.contrib.auth import login, logout
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserRegistrationSerializer, LoginSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated

class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    
class LoginView(APIView):
    """
    Login the user and return JWT tokens (access and refresh) in headers.
    """
    permission_classes = [AllowAny]  # Allow public access to this endpoint

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        # Authenticate the user
        user = authenticate(request, username=email, password=password)

        if user is not None:
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            # Prepare response
            response = Response(
                {"message": "Login successful!"},
                status=status.HTTP_200_OK
            )

            # Add tokens to response headers
            response["Authorization"] = f" {access_token}"
            response["Refresh-Token"] = str(refresh)

            return response
        else:
            return Response({
                "message": "Invalid email or password."
            }, status=status.HTTP_400_BAD_REQUEST)
    
class TestAuthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"message": f"Hello, {request.user.full_name}!"})
      
    

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "email": user.email,
            "full_name": user.full_name,
            "user_type": user.user_type,
            "business_name": user.business_name,
            "skills_services": user.skills_services,
        })
        
class LogoutView(APIView):
    def post(self, request):
        logout(request)  # Log the user out and clear the session
        return Response({"message": "Logout successful!"}, status=status.HTTP_200_OK)
    
    
