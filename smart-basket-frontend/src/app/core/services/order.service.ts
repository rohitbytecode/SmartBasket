import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, ApiResponse } from '@shared/models/interfaces';

export interface OrderResponse {
    id: string;
    orderNumber: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    items: Array<{
        product: {
            id: string;
            name: string;
        };
        quantity: number;
        price: number;
        subtotal: number;
    }>;
    total: number;
    status: 'pending' | 'processing' | 'delivered' | 'cancelled';
    shippingAddress?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    paymentMethod: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateOrderRequest {
    shippingAddress?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    paymentMethod?: string;
    notes?: string;
}

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private apiUrl = '/api/orders';

    constructor(private http: HttpClient) { }

    // Create a new order from cart items
    createOrder(orderData: CreateOrderRequest): Observable<ApiResponse<OrderResponse>> {
        return this.http.post<ApiResponse<OrderResponse>>(this.apiUrl, orderData);
    }

    // Get all orders (admin only)
    getAllOrders(): Observable<ApiResponse<OrderResponse[]>> {
        return this.http.get<ApiResponse<OrderResponse[]>>(`${this.apiUrl}/admin/all`);
    }

    // Get current user's orders
    getUserOrders(): Observable<ApiResponse<OrderResponse[]>> {
        return this.http.get<ApiResponse<OrderResponse[]>>(`${this.apiUrl}/user`);
    }

    // Get order by ID
    getOrderById(id: string): Observable<ApiResponse<OrderResponse>> {
        return this.http.get<ApiResponse<OrderResponse>>(`${this.apiUrl}/${id}`);
    }

    // Update order status (admin only)
    updateOrderStatus(id: string, status: 'pending' | 'processing' | 'delivered' | 'cancelled'): Observable<ApiResponse<OrderResponse>> {
        return this.http.put<ApiResponse<OrderResponse>>(`${this.apiUrl}/${id}/status`, { status });
    }

    // Delete order (admin only)
    deleteOrder(id: string): Observable<ApiResponse<{ message: string }>> {
        return this.http.delete<ApiResponse<{ message: string }>>(`${this.apiUrl}/${id}`);
    }
}
