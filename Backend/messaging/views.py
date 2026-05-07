# messaging/views.py
from rest_framework import generics
from .models import ContactSubmission
from .serializers import ContactSubmissionSerializer

class ContactSubmissionView(generics.CreateAPIView):
    queryset = ContactSubmission.objects.all()
    serializer_class = ContactSubmissionSerializer