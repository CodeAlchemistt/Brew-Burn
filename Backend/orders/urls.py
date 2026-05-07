# orders/urls.py
from django.urls import path
from .views import OrderCreateView, OrderHistoryView

urlpatterns = [
    path('create/', OrderCreateView.as_view(), name='order-create'),
    path('history/', OrderHistoryView.as_view(), name='order-history'), # ◀️ Add this line
]