"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { updateOrderStatus } from "@/lib/products";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderNumber: number;
    userId: string;
    total: number;
    status: string;
    createdAt: any;
    customerName?: string;
    customerEmail?: string;
    items?: any[];
    shippingInfo?: any;
  } | null;
  onStatusUpdate?: () => void;
}

const OrderDetailsModal = ({ isOpen, onClose, order, onStatusUpdate }: OrderDetailsModalProps) => {
  const [status, setStatus] = useState(order?.status || "pending");
  const [isUpdating, setIsUpdating] = useState(false);

  // Helper function to get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Helper function to format order date
  const formatOrderDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown Date';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleStatusUpdate = async () => {
    if (!order || status === order.status) return;

    setIsUpdating(true);
    try {
      await updateOrderStatus(order.id, status);
      // Show success message (you can add toast here if available)
      alert(`Order #${order.orderNumber} status updated to ${status}`);
      onStatusUpdate?.(); // Call the callback to refresh parent
      onClose();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!order) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[600px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <span>Order #{order.orderNumber}</span>
            <Badge variant={getStatusBadgeVariant(order.status)}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Order Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Order Date:</span>
                <p className="font-medium">{formatOrderDate(order.createdAt)}</p>
              </div>
              <div>
                <span className="text-gray-600">Total Amount:</span>
                <p className="font-medium text-lg">{formatCurrency(order.total)}</p>
              </div>
              <div>
                <span className="text-gray-600">Customer ID:</span>
                <p className="font-medium">{order.userId}</p>
              </div>
              <div>
                <span className="text-gray-600">Order ID:</span>
                <p className="font-medium">{order.id}</p>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          {order.shippingInfo && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <p className="font-medium">{order.shippingInfo.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-medium">{order.shippingInfo.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <p className="font-medium">{order.shippingInfo.phone || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Address:</span>
                  <p className="font-medium">
                    {order.shippingInfo.address || 'N/A'}
                    {order.shippingInfo.apartment && `, ${order.shippingInfo.apartment}`}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">City:</span>
                  <p className="font-medium">{order.shippingInfo.city || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-600">State:</span>
                  <p className="font-medium">{order.shippingInfo.state || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-600">ZIP:</span>
                  <p className="font-medium">{order.shippingInfo.zip || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Country:</span>
                  <p className="font-medium">{order.shippingInfo.country || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Order Items */}
          {order.items && order.items.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">Order Items</h3>
              <div className="space-y-3">
                {order.items.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-600">IMG</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.price)}</p>
                      <p className="text-xs text-gray-600">Total: {formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Update */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-lg mb-3 text-blue-800">Update Order Status</h3>
            <div className="flex items-center gap-4">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleStatusUpdate}
                disabled={isUpdating || status === order.status}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUpdating ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
            {status !== order.status && (
              <p className="text-sm text-blue-700 mt-2">
                Status will change from <strong>{order.status}</strong> to <strong>{status}</strong>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button 
              onClick={handleStatusUpdate}
              disabled={isUpdating || status === order.status}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdating ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default OrderDetailsModal;
