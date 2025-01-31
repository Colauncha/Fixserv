from django.shortcuts import render

# Create your views here.


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from users.models import CustomUser
from artisans.models import Booking, Artisan
from .serializers import ArtisanSerializer, BookingSerializer
from django.db.models import Q

from django.shortcuts import get_object_or_404

class BookArtisanView(APIView):
    """
    Create a new booking for an artisan using the artisan's name.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        artisan_name = request.data.get('artisan_name')
        if not artisan_name:
            return Response({"error": "The 'artisan_name' field is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Find the artisan by name
        artisan = get_object_or_404(Artisan, name__iexact=artisan_name)

        # Prepare the data for the serializer
        request_data = request.data.copy()
        request_data['artisan'] = artisan.id  # Add the artisan ID to the data

        # Pass the data to the serializer
        serializer = BookingSerializer(data=request_data, context={'request': request})
        if serializer.is_valid():
            # Save the booking
            booking = serializer.save(client=request.user)
            return Response(
                {"message": "Booking successful!", "booking_id": booking.id},
                status=status.HTTP_201_CREATED
            )

        # Return validation errors
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)





class MyBookingsView(APIView):
    """
    Retrieve all bookings made by the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bookings = Booking.objects.filter(client=request.user)
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ArtisanListView(APIView):
    """
    Retrieve all artisans, with optional search and filtering.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = Artisan.objects.all()

        # Filter by skill
        skill = request.query_params.get('skill')
        if skill:
            queryset = queryset.filter(artisan_skills__name__icontains=skill)

        # Filter by availability
        is_available = request.query_params.get('is_available')
        if is_available is not None:
            queryset = queryset.filter(is_available=(is_available.lower() == 'true'))

        # Filter by top-rated artisans
        top_artisans = request.query_params.get('top_artisans')
        if top_artisans and top_artisans.lower() == 'true':
            queryset = queryset.filter(rating__gte=4.5)

        # Search by name or location
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(location__icontains=search)
            )

        # Serialize the data
        serializer = ArtisanSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)