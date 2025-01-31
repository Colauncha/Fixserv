from django.urls import path
from .views import BookArtisanView, MyBookingsView, ArtisanListView



urlpatterns = [
    path('book/', BookArtisanView.as_view(), name='book-artisan'),
    path('my-bookings/', MyBookingsView.as_view(), name='my-bookings'),
    path('list-bookings/', ArtisanListView.as_view(), name='artisan-list'),
]