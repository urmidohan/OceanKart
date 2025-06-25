const express = require("express");
const Checkout = require("../models/checkout");
const Cart = require("../models/Cart");
const Product = require("../models/product");
const Order = require("../models/order");
const {protect} = require("../middleware/authmiddleware");
const router = express.Router();
const crypto = require("crypto");
const Razorpay = require("razorpay");
const dotenv = require("dotenv");


dotenv.config();

// create razorpay instance









// route POST /api/checkout
// create a new checkout session
// access private

router.post("/", protect, async (req, res) => {
    const {checkoutItems, shippingAddress, paymentMethod, totalPrice} = req.body;
    if(!checkoutItems || checkoutItems.length === 0){
        return res.status(400).json({message: "no items in checkout"});
    }
    try {
        // create a new checkout session
        const newCheckout = await Checkout.create({
            user: req.user._id,
            checkoutItems: checkoutItems,
            shippingAddress,
            paymentMethod,
            totalPrice,
            paymentStatus: "Pending",
            isPaid: false,
        });
       
        res.status(201).json(newCheckout);
    } catch (error) {
        console.error("Error Creating checkout sessions", error);
        res.status(500).json({message:"Server error"})
        
    }
})

// route POST to create Razorpay order
// access private

router.post("/pay", protect, async (req, res) => {
   

  
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const {amount } = req.body;
    const options = {
        amount: amount * 100,
        currency: "INR",
        receipt: "order_rcptid_$",
        payment_capture: 1
    };
    try {
    const response = await razorpay.orders.create(options);
    res.status(200).json(
        {
            order_id: response.id,
            currency: response.currency,
            amount: response.amount,
            receipt: response.receipt,
        }
    );
    
} catch (error) {
    console.error(error);
    res.status(500).json({message: "Failed to create Razorpay order"});
}
});
// route PUT /api/checkout/:id/pay
// update checkout to mark as paid after succesful payment
// access private

router.put("/:id/pay", protect, async(req, res) => {
    const {razorpay_payment_id, razorpay_signature, razorpay_order_id } = req.body;
    try {
        const checkout = await Checkout.findById(req.params.id);
        if(!checkout){
            return res.status(404).json({message: "Checkout not found"});
        }
        // create expected signature
        const generatedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

        // verify signature
        if(generatedSignature !== razorpay_signature){
            return res.status(400).json({message: "Invalid signature"});
        }
      
            checkout.isPaid = true;
            checkout.paymentStatus = "paid";
            checkout.paymentDetails = {
                razorpay_payment_id,
                razorpay_signature,
                razorpay_order_id
            }
            checkout.paidAt = Date.now();
            await checkout.save();
            res.status(201).json(checkout);
       
    } catch (error) {
        console.error(error);
        res.status(500).json({message:"Server error"});
    }

})

// route POST /api/checkout/:id/finalize
// finalize checkout and convert to an order after payment connfirmed
// access private

router.post("/:id/finalize", protect, async (req, res) => {
    try {
        const checkout = await Checkout.findById(req.params.id);

            if(!checkout){
                return res.status(404).json({message: "Checkout not found"});
            }

            if(checkout.isPaid && !checkout.isFinalized){
                // create final order
                const finalOrder = await Order.create({
                    user: checkout.user,
                    orderItems: checkout.checkoutItems,
                    shippingAddress: checkout.shippingAddress,
                    paymentMethod: checkout.paymentMethod,
                    totalPrice: checkout.totalPrice,
                    isPaid: true,
                    paidAt: checkout.paidAt,
                    isDelivered: false,
                    paymentStatus: "paid",

                    paymentDetails: checkout.paymentDetails,
                });
                checkout.isFinalized = true;
                checkout.finalizedAt = Date.now();

                await checkout.save();
                await Cart.findOneAndDelete({ user: checkout.user});
                res.status(201).json(finalOrder);
            }
            else if (checkout.isFinalized){
                res.status(400).json({message: "Checkout already finalized"});
            }
            else{
                res.status(400).json({message: "Checkout is not paid"});
            }
    } catch (error) {
        console.error(error);
        res.status(500).json({message:"Server error"});
    }
})


module.exports = router;