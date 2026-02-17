import CartItem from '../models/CartItem.js';
import Product from '../models/Product.js';

const getCart = async (req, res) => {
    try {
        const items = await CartItem.find({ user: req.user.id }).populate('product');
        const mapped = items.map(i => ({
            id: i._id,
            product: i.product,
            quantity: i.quantity,
            subtotal: i.product ? i.product.price * i.quantity : 0
        }));
        res.json(mapped);
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ success: false, message: 'Error fetching cart' });
    }
};

const addToCart = async (req, res) => {
    try {
        console.log('Add to cart request:', { userId: req.user.id, body: req.body });

        const { productId, quantity = 1 } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const existing = await CartItem.findOne({ user: req.user.id, product: productId });
        if (existing) {
            existing.quantity += Number(quantity);
            await existing.save();
            console.log('Updated cart item:', existing);
            return res.json({ success: true, data: existing });
        }

        const item = await CartItem.create({ user: req.user.id, product: productId, quantity });
        console.log('Created cart item:', item);
        res.json({ success: true, data: item });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ success: false, message: 'Error adding to cart', error: error.message });
    }
};

const updateCartItem = async (req, res) => {
    try {
        const { quantity } = req.body;
        const item = await CartItem.findById(req.params.itemId);
        if (!item) return res.status(404).json({ success: false, message: 'Cart item not found' });
        if (String(item.user) !== String(req.user.id)) return res.status(403).json({ success: false, message: 'Not allowed' });
        item.quantity = Number(quantity);
        await item.save();
        res.json({ success: true, data: item });
    } catch (error) {
        console.error('Update cart item error:', error);
        res.status(500).json({ success: false, message: 'Error updating cart item' });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const item = await CartItem.findById(req.params.itemId);
        if (!item) return res.status(404).json({ success: false, message: 'Cart item not found' });
        if (String(item.user) !== String(req.user.id)) return res.status(403).json({ success: false, message: 'Not allowed' });
        await item.deleteOne();
        res.json({ success: true });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ success: false, message: 'Error removing from cart' });
    }
};

const clearCart = async (req, res) => {
    try {
        await CartItem.deleteMany({ user: req.user.id });
        res.json({ success: true });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ success: false, message: 'Error clearing cart' });
    }
};

export { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
