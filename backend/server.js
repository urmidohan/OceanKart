const express = require("express");
const cors = require("cors");
const app = express();
const connectDB = require("./config/connectDB");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const productRoutes= require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const orderRoutes = require("./routes/orderRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const subscribeRoute = require("./routes/subscribeRoute");
const adminRoutes = require("./routes/adminRoutes");
const productadminRoutes = require("./routes/productadminRoutes");
const adminorderRoutes = require("./routes/adminorderRoutes");


app.use(express.json());
app.use(cors());

dotenv.config();


const PORT = process.env.PORT || 5000;

// connecting database
connectDB();

app.get("/", (req, res) => {
    res.send("hello");

});

// api routes

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api", subscribeRoute);


app.use("/api/admin/users", adminRoutes);
app.use("/api/admin/products", productadminRoutes);
app.use("/api/admin/orders", adminorderRoutes);

app.listen(PORT, () => {
    console.log(`server is running on ${PORT}`);
});