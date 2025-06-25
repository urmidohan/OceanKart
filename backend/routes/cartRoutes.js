const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/product");
const {protect} = require("../middleware/authmiddleware");
const router = express.Router();


// helper function to get a cart by user if or guestId
const getCart = async (userId, guestId) => {
    if(userId) {
        return await Cart.findOne({ user: userId});
    } else if(guestId){
        return await Cart.findOne({ guestId});
    }
    return null;
}




// route POST /api/cart
// add a product to the cart for a guest or logged in user
// access public

router.post("/", async (req, res) => {
    const {productId, quantity, size, color, userId, guestId} = req.body;
    try {
        const product = await Product.findById(productId);
        if(!product) return res.status(404).json({message: "Product not found"});

        // determine if the user is logged in or guest
        let cart = await getCart(userId, guestId);
        
        if(cart){
            const productIndex = cart.products.findIndex(
                (p) => 
                    p.productId.toString() === productId &&
                p.size === size &&
                p.color === color
            );
            if(productIndex > -1){
                cart.products[productIndex].quantity += quantity;
            } else{
                //  add new product
                cart.products.push({
                    productId,
                    name: product.name,
                    image: product.images[0].url,
                    price: product.price,
                    quantity,
                    size,
                    color,
                });
            }

            cart.totalPrice = cart.products.reduce((acc, item) => acc + item.price * item.quantity, 0);
            await cart.save();
            return res.status(201).json(cart);
        } else {
            const newCart = await Cart.create({
                user: userId ? userId : undefined,
                guestId: guestId ? guestId : "guest_" + new Date().getTime(),
                products: [
                    {
                        productId,
                        name: product.name,
                        image: product.images[0].url,
                        price: product.price,
                        quantity,
                        size,
                        color,    
                    },
                ],

                totalPrice: product.price * quantity,
            });
            return res.status(201).json(newCart);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Server error"});
    }
}); 

// route PUT /api/cart
// update product quantity in the cart 
// public

router.put("/", async (req, res) => {
    const {productId, quantity, size, color, guestId, userId} = req.body;
    try{
        let cart = await getCart(userId, guestId);
        if(!cart) return res.status(404).json({message: "Cart not found"});
        const productIndex = cart.products.findIndex(
            (p) => p.productId.toString() === productId && p.size === size
            && p.color === color
        );
        if(productIndex > -1){
            if(quantity > 0){
                cart.products[productIndex].quantity = quantity;
            } else{
                cart.products.splice(productIndex, 1);
            }
            cart.totalPrice = cart.products.reduce((acc, item) => acc + item.price * item.quantity, 0);
            await cart.save();
            return res.status(200).json(cart);
        }
        else{
            return res.status(404).json({message: "Product not found in cart"})
        }
    }
    catch(error){
        console.error(error);
        return res.status(500).json({message: "Server error"});
    }
})


// route delete api/cart
// remove a product from the cart
// access public
router.delete("/", async (req, res) => {
    const {productId, size, color, guestId, userId } = req.body;
    try {
        let cart = await getCart(userId, guestId);
        if(!cart) return res.status(400).json({message: "Cart not found"});
        const productIndex = cart.products.findIndex( (p) => p.productId.toString() === productId && p.size === size
        && p.color === color );
        if(productIndex > -1){
            cart.products.splice(productIndex,1);
            cart.totalPrice = cart.products.reduce((acc, item) => acc + item.price * item.quantity, 0);
            await cart.save();
            return res.status(200).json(cart);
        }
        else{
            return res.status(400).json({message: "Product not found in cart"})
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Server error"})
        
    }
})


// GET api/cart
// get logged in user's cart or guest cart
// access public

router.get("/", async (req, res) => {
    const {userId, guestId} = req.query;
    try {
        const cart = await getCart(userId, guestId);
        if(cart){
            res.json(cart);
        }
        else{
            res.status(404).json({message: "Cart not found"});
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Server error"})
    }
})

// route POST /api/cart/merge
// merge guest cart into user cart on login
// access private

router.post("/merge", protect, async (req, res) => {
    const {guestId} = req.body;
    try {
        const guestCart = await Cart.findOne({guestId});
        const userCart = await Cart.findOne({user: req.user._id});

        if(guestCart){
            if(guestCart.products.length === 0){
                return res.status(400).json({message: "Guest cart is empty"})
            }

            if(userCart){
                guestCart.products.forEach((guestItem) => {
                    const productIndex = userCart.products.findIndex(
                        (item) => 
                            item.productId.toString() === guestItem.productId.toString() &&
                        item.size === guestItem.size && item.color === guestItem.color
                    );

                    if(productIndex > -1){
                        user.Cart.products[productIndex].quantity += guestItem.quantity;
                    }
                    else{
                        userCart.products.push(guestItem);
                    }
                });

                userCart.totalPrice =  userCart.products.reduce((acc, item) => acc + item.price * item.quantity, 0);
                await userCart.save();
                try {
                    await Cart.findOneAndDelete({ guestId});
                } catch (error) {
                    console.error("Error deleting guest cart", error)
                }
                res.status(200).json(userCart);
            }else{
                guestCart.user = req.user._id;
                guestCart.guestId = undefined;
                await guestCart.save();
                res.status(200).json(guestCart);
            }
        } else{
            if(userCart){
                return res.status(200).json(userCart);
            }
            res.status(404).json({message: "guest cart not found"});
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Server error"})
    }
})

module.exports = router;