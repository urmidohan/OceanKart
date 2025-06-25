import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import axios from "axios";
import { createCheckout } from "../../redux/slices/checkoutSlice";
import { initializePayment } from "./razorpay"; // Import our new Razorpay integration

const Checkout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const {cart, loading, error} = useSelector((state) => state.cart);
    const {user } = useSelector((state) => state.auth);

    const [checkoutId, setCheckoutId] = useState(null);
    const [shippingAddress, setShippingAddress] = useState({
        firstName: "",
        lastName: "",
        address: "",
        city: "",
        postalCode: "", // Fixed: was postalcode
        country: "",
        phone: "",
    });

    // ensure cart is loaded before proceeding
    useEffect(() => {
        if (!cart || !cart.products || cart.products.length === 0) {
            navigate("/");
        }
    }, [cart, navigate]);

    // Fixed handlePaymentSuccess - removed since it's now handled in razorpay.js
    // The payment success is handled automatically by our Razorpay integration

    const handleCreateCheckout = async (e) => {
        e.preventDefault();
        if(cart && cart.products.length > 0){
            const res = await dispatch(createCheckout({
                checkoutItems: cart.products,
                shippingAddress,
                paymentMethod: "UPI",
                totalPrice: cart.totalPrice,
            }));

            if(res.payload && res.payload._id){
                setCheckoutId(res.payload._id);
            }
        }
    }

    const handleFinalizeCheckout = async (checkoutId) => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/checkout/${checkoutId}/finalize`, {}, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("userToken")}`,
                }
            });
            
            console.log("Checkout finalized successfully");
          
            // Navigation is handled by the Razorpay success handler
            
        } catch (error) {
            console.error("Error finalizing checkout:", error);
        }
    }

    // New payment handler using our Razorpay integration
    const handlePayment = async () => {
        if (!checkoutId) {
            alert("Please create checkout first");
            return;
        }

        await initializePayment({
            amount: cart.totalPrice,
            checkoutId: checkoutId,
            navigate: navigate,
            handleFinalizeCheckout: handleFinalizeCheckout,
            customerDetails: {
                name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
                email: user?.email || "customer@example.com",
                phone: shippingAddress.phone || ""
            }
        });
    };

    if(loading) return <p>Loading...</p>;
    if(error) return <p>Error: {error}</p>;
    if(!cart || !cart.products || cart.products.length === 0) return <p>Your cart is empty</p>;

    return(
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto py-10 px-6 tracking-tighter">
            {/* left section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl uppercase mb-6">Checkout</h2>
                <form onSubmit={handleCreateCheckout} >
                    <h3 className="text-lg mb-4">Contact Details</h3>
                    <div className="mb-4">
                        <label className="block text-gray-700">Email</label>
                        <input type="email" value={user?.email} className="w-full p-2 border rounded"
                        disabled />
                    </div>
                    <h3 className="text-lg mb-4">Delivery</h3>
                    <div className="mb-4 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700">First Name</label>
                            <input type="text" className="w-full p-2 border rounded"
                            value={shippingAddress.firstName}
                            onChange={(e) => setShippingAddress({...shippingAddress, firstName: e.target.value})}
                            required />
                        </div>
                        <div>
                            <label className="block text-gray-700">Last Name</label>
                            <input type="text" className="w-full p-2 border rounded"
                            value={shippingAddress.lastName}
                            onChange={(e) => setShippingAddress({...shippingAddress, lastName: e.target.value})}
                            required />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Address</label>
                        <input type="text" className="w-full p-2 border rounded"
                        value={shippingAddress.address}
                        onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                        required />
                    </div>
                    <div className="mb-4 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700">City</label>
                            <input type="text" className="w-full p-2 border rounded"
                            value={shippingAddress.city}
                            onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                            required />
                        </div>
                        <div>
                            <label className="block text-gray-700">Pincode</label>
                            <input type="text" className="w-full p-2 border rounded"
                            value={shippingAddress.postalCode}
                            onChange={(e) => setShippingAddress({...shippingAddress, postalCode: e.target.value})}
                            required />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Country</label>
                        <input type="text" className="w-full p-2 border rounded"
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                        required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Phone</label>
                        <input type="text" className="w-full p-2 border rounded"
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                        required />
                    </div>
                    <div className="mt-6">
                        {!checkoutId ? (
                            <button type="submit" className="w-full bg-black text-white py-3 rounded">
                            Continue to Payment
                            </button>
                        ) : (
                            <div>
                                <h3 className="text-lg mb-4">Pay with UPI/Card</h3>
                                <button 
                                    type="button"
                                    onClick={handlePayment} 
                                    disabled={!checkoutId}
                                    className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                    Pay ₹{cart.totalPrice}
                                </button>
                            </div>
                        )}
                    </div>
                </form>
            </div>
            {/* ORDER SUMMARY */}
            <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="mb-4 text-lg">Order Summary</h3>
                <div className="border-t py-4 mb-4">
                    {cart.products.map((product, index) => (
                        <div key={index} className="flex items-start justify-between py-2 border-b">
                            <div className="flex items-start">
                                <img src={product.image} alt={product.name} className="w-20 h-24 object-cover mr-4" />
                                <div>
                                    <h3 className="text-md">{product.name}</h3>
                                    <p className="text-gray-500">Size: {product.size}</p>
                                    <p className="text-gray-500">Color: {product.color}</p>
                                </div>
                            </div>
                            <p className="text-xl">₹{product.price?.toLocaleString()}</p>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between items-center text-lg mb-4">
                    <p>Subtotal</p>
                    <p>₹{cart.totalPrice?.toLocaleString()}</p>
                </div>
                <div className="flex justify-between items-center text-lg ">
                    <p>Shipping</p>
                    <p>Free</p>
                </div>
                <div className="flex justify-between items-center text-lg mt-4 pt-4 border-t">
                    <p>Total</p>
                    <p>₹{cart.totalPrice?.toLocaleString()}</p>             
               </div>
            </div>
        </div>
    )
};

export default Checkout;