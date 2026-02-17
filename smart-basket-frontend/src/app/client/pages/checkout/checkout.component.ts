import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrderService } from '@core/services/order.service';
import { CartService } from '@core/services/cart.service';
import { AuthService } from '@core/services/auth.service';
import { CartItem } from '@shared/models/interfaces';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  address = 'Home - Mumbai';
  slot = 'Today, 6 PM - 8 PM';
  payment = 'cod';
  
  cartItems: CartItem[] = [];
  isLoading = false;
  cartTotal = 0;

  constructor(
    private snackBar: MatSnackBar,
    private orderService: OrderService,
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load cart items
    this.cartService.cartItems$.subscribe({
      next: (items) => {
        this.cartItems = items;
        this.calculateTotal();
      }
    });

    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      this.snackBar.open('Please log in to place an order', 'Close', { duration: 3000 });
      this.router.navigate(['/auth/login']);
    }
  }

  calculateTotal(): void {
    this.cartTotal = this.cartItems.reduce((total, item) => total + item.subtotal, 0);
  }

  placeOrder(): void {
    // Validate cart is not empty
    if (this.cartItems.length === 0) {
      this.snackBar.open('Your cart is empty. Add items before placing order.', 'Close', { duration: 3000 });
      return;
    }

    // Validate user is logged in
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.snackBar.open('Please log in to place an order', 'Close', { duration: 3000 });
      this.router.navigate(['/auth/login']);
      return;
    }

    this.isLoading = true;

    // Parse address to shipping address object
    const shippingAddress = {
      street: this.address,
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400000',
      country: 'India'
    };

    // Create order request
    const orderRequest = {
      shippingAddress,
      paymentMethod: this.payment,
      notes: `Delivery Slot: ${this.slot}`
    };

    // Call order service
    this.orderService.createOrder(orderRequest).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Order placed successfully!', 'Close', { duration: 2500 });
          console.log('Order created:', response.data);
          
          // Clear cart from local service (backend already cleared it)
          this.cartItems = [];
          this.cartTotal = 0;
          
          // Navigate to order confirmation page
          setTimeout(() => {
            this.router.navigate(['/client/home']);
          }, 2500);
        } else {
          this.snackBar.open(response.message || 'Failed to place order', 'Close', { duration: 3000 });
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error placing order:', error);
        const errorMessage = error.error?.message || 'An error occurred while placing order. Please try again.';
        this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }
}
