from rest_framework import serializers
from .models import Artisan

from .models import Artisan, Booking

class ArtisanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artisan
        fields = ['id', 'name', 'category', 'location', 'rating', 'profile_picture', 'is_available']
        
        
class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['id', 'client', 'artisan', 'status', 'service_date', 'service_time']
        extra_kwargs = {
            'client': {'read_only': True}  # client is automatically set
        }

    def validate(self, data):
        # Ensure the artisan is available
        artisan = data['artisan']
        if not artisan.is_available:
            raise serializers.ValidationError("This artisan is not currently available for booking.")

        # Check if the artisan already has a booking at the same date/time
        existing_booking = Booking.objects.filter(
            artisan=artisan,
            service_date=data['service_date'],
            service_time=data['service_time'],
            status__in=['pending', 'confirmed']
        )
        if existing_booking.exists():
            raise serializers.ValidationError("This artisan is already booked for the selected date and time.")

        return data

    def create(self, validated_data):
        # Create the booking
        booking = super().create(validated_data)

        # Update the artisan's availability status
        artisan = validated_data['artisan']
        artisan.is_available = False
        artisan.save()

        return booking
  
        
        