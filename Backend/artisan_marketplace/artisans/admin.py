from django.contrib import admin

# Register your models here.


from django.contrib import admin
from .models import Artisan

@admin.register(Artisan)
class ArtisanAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'location', 'rating', 'is_available')
    list_filter = ('category', 'is_available')
    search_fields = ('name', 'location')