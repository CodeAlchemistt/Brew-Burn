# orders/serializers.py
from rest_framework import serializers
from .models import Order, OrderItem
from products.models import Product

# A simple serializer to just show the product name
class ProductSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['name']

class OrderItemSerializer(serializers.ModelSerializer):
    # We now use the simple serializer to display the product name
    product = ProductSimpleSerializer(read_only=True)
    # We also need a write-only field for creating orders
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source='product', write_only=True)

    class Meta:
        model = OrderItem
        fields = ['product', 'product_id', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'created_at', 'total_price', 'shipping_address', 'items']
        read_only_fields = ['user']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        return order