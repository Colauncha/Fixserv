from rest_framework import serializers
from users.models import Skill
from artisans.models import Artisan, Booking


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name']

class ArtisanSerializer(serializers.ModelSerializer):
    artisan_skills = SkillSerializer(many=True)  # Include nested skill details

    class Meta:
        model = Artisan
        fields = ['id', 'name', 'location', 'rating', 'profile_picture', 'is_available', 'artisan_skills']
       



class BookingSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.full_name', read_only=True)
    artisan_name = serializers.CharField(source='artisan.name', read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'client_name', 'artisan_name', 'artisan', 'status', 'service_date', 'service_time']
        extra_kwargs = {
            'artisan': {'write_only': True},  # Artisan is set but not shown in response
            'client': {'read_only': True},   # Client is set automatically
        }

    def validate(self, data):
        # Ensure the artisan field is provided
        artisan = data.get('artisan')
        if not artisan:
            raise serializers.ValidationError({"artisan": "An artisan must be selected for this booking."})

        # Ensure the artisan is available
        if not artisan.is_available:
            raise serializers.ValidationError({"artisan": "This artisan is not currently available for booking."})

        # Check if the artisan already has a booking at the same date/time
        existing_booking = Booking.objects.filter(
            artisan=artisan,
            service_date=data['service_date'],
            service_time=data['service_time'],
            status__in=['pending', 'confirmed']
        )
        if existing_booking.exists():
            raise serializers.ValidationError(
                {"artisan": "This artisan is already booked for the selected date and time."}
            )

        return data

    def create(self, validated_data):
        # Create the booking
        booking = super().create(validated_data)

        # Update the artisan's availability status
        artisan = validated_data['artisan']
        artisan.is_available = False
        artisan.save()

        return booking
