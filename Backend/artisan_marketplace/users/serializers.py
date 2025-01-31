# users/serializers.py

from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth import authenticate
from .models import CustomUser, Skill
from artisans.models import Artisan  # Import the Artisan model

class UserRegistrationSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True)
    skills_services = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True
    )  # Accept a list of skill names during registration

    class Meta:
        model = CustomUser
        fields = [
            'email', 'password', 'confirm_password', 'user_type',
            'full_name', 'business_name', 'skills_services'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def validate(self, data):
        # Ensure passwords match
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match."})

        # Additional validation for artisans
        if data['user_type'] == 'artisan':
            if not data.get('business_name'):
                raise serializers.ValidationError({"business_name": "This field is required for artisans."})
            if not data.get('skills_services'):
                raise serializers.ValidationError({"skills_services": "This field is required for artisans."})
            
            # Validate skills_services
            valid_skills = Skill.objects.values_list('name', flat=True)
            invalid_skills = [skill for skill in data['skills_services'] if skill not in valid_skills]
            if invalid_skills:
                raise serializers.ValidationError({"skills_services": f"Unsupported skills: {', '.join(invalid_skills)}"})

        # Prevent clients from providing `skills_services`
        if data['user_type'] == 'client' and data.get('skills_services'):
            raise serializers.ValidationError({"skills_services": "This field is not applicable for clients."})

        return data

    def create(self, validated_data):
        # Extract and handle skills_services
        skills_services = validated_data.pop('skills_services', [])
        validated_data.pop('confirm_password')  # Remove confirm_password as it's not part of the model

        # Create the user
        user = CustomUser.objects.create_user(**validated_data)

        # If the user is an artisan, create an artisan profile
        if user.user_type == 'artisan':
            artisan = Artisan.objects.create(
                user=user,
                name=user.full_name,
                location="Unknown",  # Placeholder, can be updated later
                rating=0.0,          # Initial rating
                is_available=True,
            )
            # Assign skills to the artisan profile
            skill_objects = Skill.objects.filter(name__in=skills_services)
            artisan.artisan_skills.add(*skill_objects)

        return user

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