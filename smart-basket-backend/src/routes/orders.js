import express from 'express';
import {
    createOrder,
    getAllOrders,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authmiddleware.js';

const router = express.Router();

// Get all orders (admin only) - must be before /:id
router.get('/admin/all', protect, authorize('admin'), getAllOrders);

// Create a new order (authenticated users)
router.post('/', protect, createOrder);

// Get user's orders
router.get('/user', protect, getUserOrders);

// Get order by ID
router.get('/:id', protect, getOrderById);

// Update order status (admin only)
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);

// Delete order (admin only)
router.delete('/:id', protect, authorize('admin'), deleteOrder);

export default router;
