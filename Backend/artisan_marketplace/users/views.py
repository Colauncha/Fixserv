from django.shortcuts import render
from django.middleware.csrf import get_token
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, login, logout
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserRegistrationSerializer, LoginSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from users.models import Skill  # Import the Skill model
from artisans.models import Artisan  # Import the Artisan model

class UserRegistrationView(APIView):
    """
    Handle user registration for both artisans and clients.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            # Extract user type
            user_type = serializer.validated_data.get('user_type')

            # Validate skills_services for artisans
            if user_type == 'artisan':
                skills_services = request.data.get('skills_services', [])
                valid_skills = Skill.objects.values_list('name', flat=True)
                invalid_skills = [skill for skill in skills_services if skill not in valid_skills]

                if invalid_skills:
                    return Response(
                        {"skills_services": f"Unsupported skills: {', '.join(invalid_skills)}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Save the user
            user = serializer.save()

            # Return the response
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        # Return validation errors
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

        # Fetch the user's skills as a list of names
        user_skills = user.skills_services.all().values_list('name', flat=True)

        return Response({
            "email": user.email,
            "full_name": user.full_name,
            "user_type": user.user_type,
            "business_name": user.business_name,
            "skills_services": list(user_skills),  # Convert QuerySet to a list
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)  # Log the user out and clear the session
        return Response({"message": "Logout successful!"}, status=status.HTTP_200_OK)
