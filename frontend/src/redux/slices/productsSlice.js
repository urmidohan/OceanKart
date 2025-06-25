import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import axios from "axios";
import qs from "qs";

// async thank for getting all products
export const fetchProductsByFilters = createAsyncThunk(
    "products/fetchByFilters",
    async ({ collection, size, color, gender,
        minPrice,
        maxPrice,
        sortBy,
        search,
        category,
        material,
        limit, }) => {
        const query = new URLSearchParams();
        if(collection){
            query.append("collection", collection);
        }
        if(size){
            query.append("size", size);
        }
        if(color){
            query.append("color", color);
        }
        if(gender){
            query.append("gender", gender);
        }
        if(minPrice){
            query.append("minPrice", minPrice);
        }
        if(category){
            query.append("category", category);
        }
        if(maxPrice){
            query.append("maxPrice", maxPrice);
        }
        if(sortBy){
            query.append("sortBy", sortBy);  
        }
        if(search){
            query.append("search", search);
        }
        if(material){
            query.append("material", material);
        }
        if(limit){
            query.append("limit", limit);
        }
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/products?${query.toString()}`);
       return response.data;
    })

    export const fetchProductDetails = createAsyncThunk("products/fetchProductDetails", async (id) => {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/products/${id}`);
        return response.data;
    });

    export const updateProduct = createAsyncThunk("products/updateProduct", async ({id, productData}) => {
        const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/products/${id}`, productData,
            {headers: {
                Authorization: `Bearer ${localStorage.getItem("userToken")}`,
            }});
        return response.data;
    });


    export const fetchSimilarProducts = createAsyncThunk("products/fetchSimilarProducts", async ({id}) => {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/products/similar/${id}`);
        return response.data;
    });

    const productsSlice = createSlice({
        name: "products",
        initialState: {
            products: [],
            loading: false,
            error: null,
            selectProduct: null,
            similarProducts: [],
            filters: {
                category: "",
                gender: "",
                color: "",
                size: "",
                material: "",
                minPrice: "",
                maxPrice: "",
                sortBy: "",
                search: "",
                collection: "",
            },
        },
        reducers: {
            setFilters : (state, action) => {
                state.filters = {...state.filters, ...action.payload};
            },
            clearFilters: (state) => {
                state.filters = {
                    category: "",
                    gender: "",
                    color: "",
                    size: "",
                    material: "",
                    minPrice: "",
                    maxPrice: "",
                    sortBy: "",
                    search: "",
                    collection: "",
                }
            }
        },
       extraReducers: (builder) => {
        builder
        .addCase(fetchProductsByFilters.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchProductsByFilters.fulfilled, (state, action) => {
            state.loading = false;
            state.products = Array.isArray(action.payload) ? action.payload : [];
        })
        .addCase(fetchProductsByFilters.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
        .addCase(fetchProductDetails.pending, (state) => {
            state.loading = true;
        state.error = null;
        })
        
        .addCase(fetchProductDetails.fulfilled, (state, action) => {
            state.loading = false;
            state.selectProduct = action.payload;
        })
        .addCase(fetchProductDetails.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        }) 


        .addCase(updateProduct.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(updateProduct.fulfilled, (state, action) => {
            state.loading = false;
            const updateProduct = action.payload;
            const index = state.products.findIndex((product) => product._id === updateProduct._id);
            if (index !== -1) {
                state.products[index] = updateProduct;
            }
        })
        .addCase(updateProduct.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })



        .addCase(fetchSimilarProducts.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchSimilarProducts.fulfilled, (state, action) => {
            state.loading = false;
            state.similarProducts = action.payload;
        })
        .addCase(fetchSimilarProducts.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
    }
    });
    
    export const {setFilters, clearFilters} = productsSlice.actions;
    export default productsSlice.reducer;