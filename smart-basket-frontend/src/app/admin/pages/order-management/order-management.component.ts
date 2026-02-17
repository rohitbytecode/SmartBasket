import { Component, OnInit } from '@angular/core';
import { OrderService, OrderResponse } from '@core/services/order.service';

@Component({
    selector: 'app-order-management',
    templateUrl: './order-management.component.html',
    styleUrls: ['./order-management.component.scss']
})
export class OrderManagementComponent implements OnInit {
    orders: OrderResponse[] = [];
    displayedColumns: string[] = ['orderNumber', 'customer', 'items', 'total', 'status', 'date', 'actions'];
    isLoading = false;
    errorMessage: string | null = null;
    successMessage: string | null = null;

    constructor(private orderService: OrderService) { }

    ngOnInit(): void {
        this.loadOrders();
    }

    loadOrders(): void {
        this.isLoading = true;
        this.errorMessage = null;
        this.successMessage = null;

        this.orderService.getAllOrders().subscribe({
            next: (response) => {
                if (response.success) {
                    this.orders = response.data;
                    console.log('Orders loaded from API:', this.orders);
                    if (this.orders.length > 0) {
                        console.log('First order structure:', this.orders[0]);
                        console.log('First order ID:', this.orders[0].id);
                    }
                    if (this.orders.length === 0) {
                        this.successMessage = 'No orders found. Orders will appear here once customers place them.';
                    }
                } else {
                    this.errorMessage = response.message || 'Failed to load orders';
                }
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading orders:', error);
                if (error.status === 403) {
                    this.errorMessage = 'Access denied. Only admins can view all orders.';
                } else if (error.status === 401) {
                    this.errorMessage = 'Your session has expired. Please log in again.';
                } else {
                    this.errorMessage = error.error?.message || 'An error occurred while loading orders. Please try again.';
                }
                this.isLoading = false;
            }
        });
    }

    updateOrderStatus(order: OrderResponse, newStatus: string): void {
        const status = newStatus as 'pending' | 'processing' | 'delivered' | 'cancelled';

        console.log('=== UPDATE ORDER STATUS DEBUG ===');
        console.log('Order object:', order);
        console.log('Order ID:', order.id);
        console.log('New status:', status);

        if (!order.id) {
            this.errorMessage = 'ERROR: Order ID is missing or undefined!';
            console.error(this.errorMessage);
            return;
        }

        this.orderService.updateOrderStatus(order.id, status).subscribe({
            next: (response) => {
                if (response.success) {
                    const index = this.orders.findIndex(o => o.id === order.id);
                    if (index > -1) {
                        this.orders[index].status = status;
                    }
                    this.successMessage = 'Order status updated successfully';
                    setTimeout(() => this.successMessage = null, 3000);
                } else {
                    this.errorMessage = response.message || 'Failed to update order status';
                }
            },
            error: (error) => {
                console.error('Error updating order status:', error);
                this.errorMessage = error.error?.message || 'An error occurred while updating order status';
            }
        });
    }

    getStatusClass(status: string): string {
        return `status-${status}`;
    }

    getItemCount(order: OrderResponse): number {
        return order.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    deleteOrder(orderId: string): void {
        if (confirm('Are you sure you want to delete this order?')) {
            this.orderService.deleteOrder(orderId).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.orders = this.orders.filter(o => o.id !== orderId);
                        this.successMessage = 'Order deleted successfully';
                        setTimeout(() => this.successMessage = null, 3000);
                    } else {
                        this.errorMessage = response.message || 'Failed to delete order';
                    }
                },
                error: (error) => {
                    console.error('Error deleting order:', error);
                    this.errorMessage = error.error?.message || 'An error occurred while deleting order';
                }
            });
        }
    }

    refreshOrders(): void {
        this.loadOrders();
    }
}
