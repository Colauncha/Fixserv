# users/serializers.py

from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth import authenticate
from .models import CustomUser

class UserRegistrationSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True)  # Field for confirming password

    class Meta:
        model = CustomUser
        fields = [
            'email', 'password', 'confirm_password', 'user_type',
            'full_name', 'business_name', 'skills_services'
        ]
        extra_kwargs = {
            'password': {'write_only': True},  # Prevent password from being included in response
        }

    def validate(self, data):
        """
        Ensure that passwords match and validate user-specific fields.
        """
        # Check if the passwords match
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match."})

        # Validate fields for artisans
        if data['user_type'] == 'artisan':
            if not data.get('business_name'):
                raise serializers.ValidationError({"business_name": "This field is required for artisans."})
            if not data.get('skills_services'):
                raise serializers.ValidationError({"skills_services": "This field is required for artisans."})

        # Validate fields for clients
        if data['user_type'] == 'client':
            # Clients don't need extra validation for now, but can be extended later
            pass

        return data

    def create(self, validated_data):
        """
        Create a user after removing unnecessary fields like confirm_password.
        """
        # Remove the confirm_password field since it's not part of the model
        validated_data.pop('confirm_password')

        # Use the custom manager to create the user
        return CustomUser.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        # Use Django's authenticate method to check credentials
        email = data.get('email')
        password = data.get('password')
        user = authenticate(username=email, password=password)

        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is inactive.")

        data['user'] = user
        return data