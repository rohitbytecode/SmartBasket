import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    orderNumber: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        subtotal: { type: Number, required: true }
    }],
    total: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'processing', 'delivered', 'cancelled'], default: 'pending' },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    paymentMethod: { type: String, default: 'credit-card' },
    notes: String
}, { timestamps: true });

// Create unique index for orderNumber (only on non-null values)
orderSchema.index({ orderNumber: 1 }, { unique: true, sparse: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;
