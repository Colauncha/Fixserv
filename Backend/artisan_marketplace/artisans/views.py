from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from .models import Artisan, Booking
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import  BookingSerializer
import logging

logger = logging.getLogger(__name__)


class ArtisanBookingsView(APIView):
    """
    Retrieve all bookings for the authenticated artisan.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Ensure the user is an artisan
        if not hasattr(request.user, 'artisan'):
            logger.error(f"User {request.user.username} is not an artisan.")
            return Response(
                {"detail": "Only artisans can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get bookings for the logged-in artisan
        bookings = Booking.objects.filter(artisan=request.user.artisan).order_by('-service_date')

        # Serialize the data
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
