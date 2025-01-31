from django.contrib import admin

# Register your models here.


from .models import Artisan, Booking, Skill


class ArtisanAdmin(admin.ModelAdmin):
    # Display relevant fields in the admin list view
    list_display = ('name', 'get_skills', 'location', 'rating', 'is_available')

    # Enable filtering by skills
    list_filter = ('artisan_skills', 'is_available')

    # Allow searching by name and location
    search_fields = ('name', 'location')

    def get_skills(self, obj):
        """
        Display a comma-separated list of skills for the artisan.
        """
        return ", ".join([skill.name for skill in obj.artisan_skills.all()])
    get_skills.short_description = 'Skills'


# Register models in the admin site
admin.site.register(Artisan, ArtisanAdmin)
admin.site.register(Booking)
admin.site.register(Skill)
