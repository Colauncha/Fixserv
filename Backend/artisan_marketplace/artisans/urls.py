from django.urls import path
from .views import ArtisanBookingsView

urlpatterns = [    
    path('git /', ArtisanBookingsView.as_view(), name='artisan-bookings'),
]
