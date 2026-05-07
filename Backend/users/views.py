# users/views.py

from django.contrib.auth import authenticate
from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .serializers import UserSerializer, UserProfileSerializer, ChangePasswordSerializer

class RegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": "User created successfully!",
                "user": user.username
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)
        if user:
            token, created = Token.objects.get_or_create(user=user)
            # This line must return a key named "token"
            return Response({"token": token.key, "username": user.username})
        return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            request.user.auth_token.delete()
            return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # The 'request.user' is automatically available because of the token
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

         # 👇 Add this new method for updating
    def put(self, request, *args, **kwargs):
        user = request.user
        # We pass partial=True to allow for partial updates
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            # Note: We are updating the username field with the 'full name' from the form
            user.username = request.data.get('username', user.username)
            user.email = request.data.get('email', user.email)
            user.save()
            # We need to re-serialize the user to send the updated data back
            updated_serializer = UserProfileSerializer(user)
            return Response(updated_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = self.request.user

        # Check old password
        if not user.check_password(serializer.data.get("old_password")):
            return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)

        # set_password hashes the password
        user.set_password(serializer.data.get("new_password"))
        user.save()
        return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)