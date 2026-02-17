import Order from '../models/Order.js';
import CartItem from '../models/CartItem.js';

// Transform order to match expected response format
const transformOrder = (order) => {
    try {
        if (!order) {
            console.error('Transform Error: Order is null or undefined');
            return null;
        }

        if (!order._id) {
            console.error('Transform Error: Order._id is missing', order);
            // For raw objects without _id, return as-is
            return order;
        }

        const transformed = {
            id: order._id.toString(),
            orderNumber: order.orderNumber,
            user: order.user ? {
                id: order.user._id ? order.user._id.toString() : order.user.id,
                name: order.user.name,
                email: order.user.email
            } : null,
            items: order.items && Array.isArray(order.items) ? order.items.map(item => ({
                product: item.product ? {
                    id: item.product._id ? item.product._id.toString() : item.product.id,
                    name: item.product.name
                } : null,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal
            })) : [],
            total: order.total,
            status: order.status,
            shippingAddress: order.shippingAddress,
            paymentMethod: order.paymentMethod,
            notes: order.notes,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        };

        console.log('Transform successful, transformed object:', JSON.stringify(transformed, null, 2));
        return transformed;
    } catch (error) {
        console.error('Transform Error:', error);
        return order;
    }
};

// Generate unique order number
const generateOrderNumber = async () => {
    try {
        const count = await Order.countDocuments();
        return `ORD-${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
        console.error('Error generating order number:', error);
        // Fallback to timestamp-based order number
        return `ORD-${Date.now()}`;
    }
};

// Create a new order from cart items
export const createOrder = async (req, res) => {
    try {
        const { shippingAddress, paymentMethod, notes } = req.body;
        const userId = req.user.id;

        console.log('Creating order for user:', userId);
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        // Get all cart items for the user
        const cartItems = await CartItem.find({ user: userId }).populate('product');
        console.log(`Found ${cartItems.length} items in cart`);

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Calculate total and prepare order items
        let total = 0;
        const orderItems = [];

        for (const cartItem of cartItems) {
            const itemTotal = cartItem.product.price * cartItem.quantity;
            total += itemTotal;

            orderItems.push({
                product: cartItem.product._id,
                quantity: cartItem.quantity,
                price: cartItem.product.price,
                subtotal: itemTotal
            });
        }

        // Generate order number
        const orderNumber = await generateOrderNumber();
        console.log('Generated order number:', orderNumber);

        // Create order
        const orderData = {
            orderNumber,
            user: userId,
            items: orderItems,
            total,
            shippingAddress: shippingAddress || { country: 'India' },
            paymentMethod: paymentMethod || 'credit-card',
            notes,
            status: 'pending'
        };

        console.log('Order data to save:', JSON.stringify(orderData, null, 2));

        const order = new Order(orderData);
        
        console.log('Order object created, attempting to save...');
        await order.save();
        console.log('Order saved successfully:', order._id, order.orderNumber);

        // Clear user's cart after order creation
        await CartItem.deleteMany({ user: userId });
        console.log('User cart cleared');

        // Populate user details before sending response
        await order.populate('user', 'name email');
        await order.populate('items.product', 'name price');

        // Transform the response
        const plain = order.toObject ? order.toObject() : order;
        const transformedOrder = {
            id: plain._id.toString(),
            orderNumber: plain.orderNumber,
            user: plain.user ? {
                id: plain.user._id.toString(),
                name: plain.user.name,
                email: plain.user.email
            } : null,
            items: plain.items.map(item => ({
                product: item.product ? {
                    id: item.product._id.toString(),
                    name: item.product.name
                } : null,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal
            })),
            total: plain.total,
            status: plain.status,
            shippingAddress: plain.shippingAddress,
            paymentMethod: plain.paymentMethod,
            notes: plain.notes,
            createdAt: plain.createdAt,
            updatedAt: plain.updatedAt
        };

        res.status(201).json({ success: true, data: transformedOrder });
    } catch (error) {
        console.error('Error creating order:', error);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            errors: error.errors,
            stack: error.stack
        });
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all orders (for admin)
export const getAllOrders = async (req, res) => {
    try {
        console.log('Fetching all orders for admin');
        const orders = await Order.find()
            .populate('user', 'name email')
            .populate('items.product', 'name price')
            .sort({ createdAt: -1 });

        console.log(`Found ${orders.length} orders`);
        
        // Transform orders to ensure 'id' property exists
        const transformedOrders = orders.map(order => {
            const plain = order.toObject ? order.toObject() : order;
            return {
                id: plain._id.toString(),
                orderNumber: plain.orderNumber,
                user: plain.user ? {
                    id: plain.user._id.toString(),
                    name: plain.user.name,
                    email: plain.user.email
                } : null,
                items: plain.items.map(item => ({
                    product: item.product ? {
                        id: item.product._id.toString(),
                        name: item.product.name
                    } : null,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.subtotal
                })),
                total: plain.total,
                status: plain.status,
                shippingAddress: plain.shippingAddress,
                paymentMethod: plain.paymentMethod,
                notes: plain.notes,
                createdAt: plain.createdAt,
                updatedAt: plain.updatedAt
            };
        });

        if (transformedOrders.length > 0) {
            console.log('First transformed order:', JSON.stringify(transformedOrders[0], null, 2));
        }
        
        res.status(200).json({ success: true, data: transformedOrders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get user's orders
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const orders = await Order.find({ user: userId })
            .populate('items.product', 'name price')
            .sort({ createdAt: -1 });

        // Transform orders to ensure 'id' property exists
        const transformedOrders = orders.map(order => {
            const plain = order.toObject ? order.toObject() : order;
            return {
                id: plain._id.toString(),
                orderNumber: plain.orderNumber,
                user: plain.user ? {
                    id: plain.user._id.toString(),
                    name: plain.user.name,
                    email: plain.user.email
                } : null,
                items: plain.items.map(item => ({
                    product: item.product ? {
                        id: item.product._id.toString(),
                        name: item.product.name
                    } : null,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.subtotal
                })),
                total: plain.total,
                status: plain.status,
                shippingAddress: plain.shippingAddress,
                paymentMethod: plain.paymentMethod,
                notes: plain.notes,
                createdAt: plain.createdAt,
                updatedAt: plain.updatedAt
            };
        });
        
        res.status(200).json({ success: true, data: transformedOrders });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get order by ID
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id)
            .populate('user', 'name email')
            .populate('items.product', 'name price');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Transform the response
        const plain = order.toObject ? order.toObject() : order;
        const transformedOrder = {
            id: plain._id.toString(),
            orderNumber: plain.orderNumber,
            user: plain.user ? {
                id: plain.user._id.toString(),
                name: plain.user.name,
                email: plain.user.email
            } : null,
            items: plain.items.map(item => ({
                product: item.product ? {
                    id: item.product._id.toString(),
                    name: item.product.name
                } : null,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal
            })),
            total: plain.total,
            status: plain.status,
            shippingAddress: plain.shippingAddress,
            paymentMethod: plain.paymentMethod,
            notes: plain.notes,
            createdAt: plain.createdAt,
            updatedAt: plain.updatedAt
        };

        res.status(200).json({ success: true, data: transformedOrder });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update order status (admin only)
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        console.log('=== UPDATE ORDER STATUS DEBUG ===');
        console.log('Received params:', { id, status });

        if (!['pending', 'processing', 'delivered', 'cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        if (!id || id === 'undefined') {
            console.error('ERROR: Order ID is missing or undefined!');
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }

        const order = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        ).populate('user', 'name email').populate('items.product', 'name price');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        console.log('Order status updated successfully:', order._id, status);

        // Transform the response
        const plain = order.toObject ? order.toObject() : order;
        const transformedOrder = {
            id: plain._id.toString(),
            orderNumber: plain.orderNumber,
            user: plain.user ? {
                id: plain.user._id.toString(),
                name: plain.user.name,
                email: plain.user.email
            } : null,
            items: plain.items.map(item => ({
                product: item.product ? {
                    id: item.product._id.toString(),
                    name: item.product.name
                } : null,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal
            })),
            total: plain.total,
            status: plain.status,
            shippingAddress: plain.shippingAddress,
            paymentMethod: plain.paymentMethod,
            notes: plain.notes,
            createdAt: plain.createdAt,
            updatedAt: plain.updatedAt
        };

        console.log('Returning transformed order:', JSON.stringify(transformedOrder, null, 2));
        res.status(200).json({ success: true, data: transformedOrder });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete order (admin only)
export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findByIdAndDelete(id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.status(200).json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
