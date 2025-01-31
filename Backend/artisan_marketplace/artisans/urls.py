from django.urls import path
from .views import ArtisanListView, BookArtisanView, MyBookingsView

urlpatterns = [
    path('list/', ArtisanListView.as_view(), name='artisan-list'),
    path('book/', BookArtisanView.as_view(), name='book-artisan'),
    path('my-bookings/', MyBookingsView.as_view(), name='my-bookings'),
]
