from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q  # Correctly import Q for complex queries
from .models import Artisan, Booking
from rest_framework.exceptions import NotFound
from .serializers import ArtisanSerializer, BookingSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated

class ArtisanListView(APIView):
    """
    Retrieve all artisans, with optional search and filtering.
    Query Parameters:
        - category: Filter by category (e.g., Television, Refrigerator).
        - is_available: Filter by availability (true/false).
        - search: Search by name or location.
        - top_artisans: Filter to show only top-rated artisans (4.5+).
        - booked_artisans: Show artisans who have active bookings (true or false).
    """
    
    permission_classes = [AllowAny]  # Allow public access to this endpoint

    def get(self, request):
        queryset = Artisan.objects.all()

        # Filter by category
        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        # Filter by availability
        is_available = request.query_params.get('is_available')
        if is_available is not None:
            queryset = queryset.filter(is_available=(is_available.lower() == 'true'))

        # Filter by top-rated artisans
        top_artisans = request.query_params.get('top_artisans')
        if top_artisans and top_artisans.lower() == 'true':
            queryset = queryset.filter(rating__gte=4.5)

        # Filter by booked artisans
        booked_artisans = request.query_params.get('booked_artisans')
        if booked_artisans is not None:
            if booked_artisans.lower() == 'true':
                queryset = queryset.filter(bookings__status__in=['pending', 'confirmed']).distinct()
            elif booked_artisans.lower() == 'false':
                queryset = queryset.exclude(bookings__status__in=['pending', 'confirmed']).distinct()

        # Search by name or location
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(location__icontains=search)
            )

        # Serialize the data
        serializer = ArtisanSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class BookArtisanView(APIView):
    """
    Create a new booking for an artisan using the artisan's name.
    """

    permission_classes = [IsAuthenticated]  # Ensure the client is authenticated

    def post(self, request):
        # Extract artisan name from the request data
        artisan_name = request.data.get('artisan_name')
        if not artisan_name:
            return Response({"error": "The 'artisan_name' field is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Find the artisan by name (case-insensitive)
        try:
            artisan = Artisan.objects.get(name__iexact=artisan_name)
        except Artisan.DoesNotExist:
            return Response({"error": "No artisan found with the provided name."}, status=status.HTTP_404_NOT_FOUND)
        except Artisan.MultipleObjectsReturned:
            return Response({"error": "Multiple artisans found with this name. Please be more specific."}, status=status.HTTP_400_BAD_REQUEST)

        # Prepare the data for the serializer
        request_data = request.data.copy()
        request_data['artisan'] = artisan.id  # Assign the artisan ID to the request data

        # Pass the authenticated user as the client
        serializer = BookingSerializer(data=request_data, context={'request': request})
        if serializer.is_valid():
            booking = serializer.save(client=request.user)  # Automatically link the client to the booking
            return Response(
                {"message": "Booking successful!", "booking_id": booking.id},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class MyBookingsView(APIView):
    """
    Retrieve all bookings made by the authenticated user.
    """
    permission_classes = [IsAuthenticated]  # Ensure the user is logged in

    def get(self, request):
        # Get bookings where the client is the currently authenticated user
        bookings = Booking.objects.filter(client=request.user)

        # Serialize the data
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)