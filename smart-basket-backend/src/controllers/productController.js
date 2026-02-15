import Product from '../models/Product.js';
import mongoose from 'mongoose';

// Helper function to transform MongoDB _id to id for frontend
const transformProduct = (product) => {
    if (!product) return null;
    const obj = product.toObject ? product.toObject() : product;
    return {
        ...obj,
        id: obj._id.toString(),
        _id: undefined
    };
};

const getProducts = async (req, res) => {
    try {
        const {
            categoryId, minPrice, maxPrice, inStock, search, sortBy, sortOrder, page = 1, pageSize = 12
        } = req.query;

        const filter = {};
        if (categoryId) filter.categoryId = categoryId;
        if (minPrice) filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
        if (maxPrice) filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };
        if (inStock !== undefined) filter.inStock = inStock === 'true';
        if (search) filter.name = { $regex: search, $options: 'i' };

        const sort = {};
        if (sortBy) sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const skip = (Number(page) - 1) * Number(pageSize);
        const total = await Product.countDocuments(filter);
        const products = await Product.find(filter).sort(sort).skip(skip).limit(Number(pageSize));

        // Transform products to include id field
        const data = products.map(transformProduct);

        res.json({ data, total, page: Number(page), pageSize: Number(pageSize), totalPages: Math.ceil(total / Number(pageSize)) });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ success: false, message: 'Error fetching products' });
    }
};

const getFeatured = async (req, res) => {
    try {
        const products = await Product.find({ featured: true }).limit(12);
        // Transform products to include id field
        const data = products.map(transformProduct);
        res.json(data);
    } catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({ success: false, message: 'Error fetching featured products' });
    }
};

const getProductById = async (req, res) => {
    try {
        const productId = req.params.id;

        // Validate product ID
        if (!productId || productId === 'undefined' || productId === 'null') {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        // Check if it's a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID format' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Transform product to include id field
        res.json(transformProduct(product));
    } catch (error) {
        console.error('Get product by ID error:', error);
        res.status(500).json({ success: false, message: 'Error fetching product' });
    }
};

const createProduct = async (req, res) => {
    try {
        const body = req.body;

        if (!body.name || !body.price) {
            return res.status(400).json({ success: false, message: 'Name and price are required' });
        }

        const product = await Product.create(body);
        res.json({ success: true, data: product, message: 'Product created successfully' });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ success: false, message: 'Error creating product' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID format' });
        }

        const product = await Product.findByIdAndUpdate(productId, req.body, { new: true });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, data: product, message: 'Product updated successfully' });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ success: false, message: 'Error updating product' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID format' });
        }

        const product = await Product.findByIdAndDelete(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ success: false, message: 'Error deleting product' });
    }
};

const uploadProductImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const productId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID format' });
        }

        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        const product = await Product.findByIdAndUpdate(productId, { image: imageUrl }, { new: true });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, data: { imageUrl }, product });
    } catch (error) {
        console.error('Upload product image error:', error);
        res.status(500).json({ success: false, message: 'Error uploading product image' });
    }
};

export { getProducts, getFeatured, getProductById, createProduct, updateProduct, deleteProduct, uploadProductImage };
