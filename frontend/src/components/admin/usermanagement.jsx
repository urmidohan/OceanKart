import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { addUser, deleteUser, updateUser, fetchUsers } from "../../redux/slices/adminSlice";
const UserManageMent = () => {
const dispatch = useDispatch();
const navigate = useNavigate();
const {user} = useSelector((state) => state.auth);
const {users, loading, error} = useSelector((state) => state.admin);

useEffect(() => {
  if(user && user.role !== "admin"){
    navigate("/");
  }
}, [user, navigate]);

useEffect(() => {
    if(user && user.role === "admin"){
        dispatch(fetchUsers());
    }
},[dispatch, user])

const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role:"customer",
});

const handleChange =(e) =>{
setFormData({
    ...formData,
    [e.target.name]: e.target.value,
})
};

const handlleSubmit = (e) => {
    e.preventDefault();
 dispatch(addUser(formData));


    setFormData({name: "", email: "", password: "", role:"customer"});
}

const handleDeleteUser = (userId) => {
    if(window.confirm("Are you sure you want to delete this user?")){
        dispatch(deleteUser(userId));
    }
}
const handleRoleChange = (userId, newRole) => {
    dispatch(updateUser({id: userId, role: newRole}));
}
    return (
        <div className="max-w-7xl mx-auto p-6">
            <h2 className="text-2xl mb-4 font-bold">User management</h2>
            {loading && <p>Loading...</p>}
            {error && <p className="text-red-500">Error: {error}</p>}
            {/* Add new user form   */}
            <div className="p-6 rounded-lg mb-6">
                <h3 className="font-bold texb-4"></h3>
                <form onSubmit={handlleSubmit}>
                <div className="mb-4">
                <label className="block text-gray-700">Name</label>
                <input type="text" name="name"  
                value={formData.name} 
                onChange={handleChange}
                className="w-full p-2 border rounded" required={true}/>
                </div>
                <div className="mb-4">
                <label className="block text-gray-700">Email</label>
                <input type="email" name="email"  
                value={formData.email} 
                onChange={handleChange}
                className="w-full p-2 border rounded" required/>
                </div>
                <div className="mb-4">
                <label className="block text-gray-700">Password</label>
                <input type="password" name="password"  
                value={formData.password} 
                onChange={handleChange}
                className="w-full p-2 border rounded" required/>
                </div>
                <div className="mb-4">
                <label className="block text-gray-700">Role</label>
                <select name="role" value={formData.role}
                onChange={handleChange}
                className="w-full p-2 border rounded">
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                </select>
                </div>
<button type="submit" 
className="bg-green-500 text-white py-2 px--4 rounded  hover:bg-green-700">Add User</button>
                </form>
                
            </div>


            {/* user list managemnet */}
            <div className="overflow-x-auto shadow-md sm:rounded-lg">
                <table className="min-w-full text-left text-gray-500">
                    <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                        <tr>
                        <th className="py-3 px-4"> Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4"> Role</th>
                        <th className="py-3 px-4"> Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user._id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-medium text-gray-900 whitespace-nowrap">{user.name}</td>
                                <td className="p-4">{user.email}</td>
                                <td className="p-4">
                                <select
                                value={user.role}
                                 onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                 className="p-2 border rounded"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="customer">Customer</option>
                                    </select>
                                </td>
                               <td>
                                <button onClick={() =>handleDeleteUser(user._id)}
                                    className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
                                    >Delete</button>
                               </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
};
export default UserManageMent;

