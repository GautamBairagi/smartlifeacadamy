import { connection } from "../Config/dbConnect.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generatetoken } from "../Config/jwt.js";
import { v4 as uuidv4 } from "uuid"; // Import UUID for unique promo codes
import { config } from "dotenv";


// 1. Get All Users
export const getAllUsers = async (req, res) => {
    try {
        const mysqlQuery = "SELECT * FROM users";
        const [result] = await connection.query(mysqlQuery);
        if (result.length > 0) {
            return res.status(200).json({ message: "Users fetched successfully", data: result });
        } else {
            return res.status(404).json({ message: "No data found" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


export const signUp = async (req, res) => {
    try {
        const { firstname,  email, password, confirmpassword, promocode, selectedPlan } = req.body;
    console.log("req.body", req.body);

        // Validate required fields
        // if (!firstname || !lastname || !email || !password || !selectedPlan) {
        //     return res.status(400).json({ message: "All fields are required, including plan selection" });
        // }

        // Validate password match
        // if (password !== confirmpassword) {
        //     return res.status(400).json({ message: "Passwords do not match" });
        // }

        // Check if the email already exists
        const [existingUser] = await connection.query("SELECT id FROM users WHERE email=?", [email]);
        if (existingUser.length > 0) {
            return res.status(403).json({ message: "User already exists" });
        }

        // Fetch the selected subscription plan from the database
        const [subscription] = await connection.query("SELECT * FROM subscriptions WHERE plan_name = ?", [selectedPlan]);

        if (subscription.length === 0) {
            return res.status(400).json({ message: "Selected subscription plan does not exist" });
        }

        let referredBy = null;
        let discountApplied = false;
        let finalAmount = parseFloat(subscription[0].amount); // Default price from existing plan

        // Check if promo code is valid and apply discount
        if (promocode) {
            const [referrer] = await connection.query("SELECT id FROM users WHERE promocode = ? AND is_active = 1", [promocode]);

            if (referrer.length > 0) {
                referredBy = referrer[0].id;
                finalAmount *= 0.80; // Apply 20% discount
                discountApplied = true;
            } else {
                return res.status(400).json({ message: "Invalid or inactive promo code" });
            }
        }

        // Hash the password
        const hashPassword = await bcrypt.hash(password, 10);

        // Generate unique promo code for the new user
        const newPromoCode = uuidv4().slice(0, 8).toUpperCase();

        // Insert user data
        const [userResult] = await connection.query(
            "INSERT INTO users (firstname,  email, password, is_active, promocode, referred_by) VALUES (?, ?, ?, ?, ?, ?)", 
            [firstname,  email, hashPassword, 1, newPromoCode, referredBy]
        );

        const userId = userResult.insertId;

        // Update the existing subscription with the new user
        const startDate = new Date();
        let endDate = new Date();
        if (selectedPlan.toLowerCase() === "monthly") endDate.setMonth(endDate.getMonth() + 1);
        else if (selectedPlan.toLowerCase() === "6 months") endDate.setMonth(endDate.getMonth() + 6);
        else if (selectedPlan.toLowerCase() === "1 year") endDate.setFullYear(endDate.getFullYear() + 1);

        await connection.query(
            "UPDATE subscriptions SET user_id = ?, amount = ?, discount_applied = ?, referred_by = ?, promocode = ?, start_date = ?, end_date = ?, is_active = ? WHERE plan_name = ?",
            [userId, finalAmount, discountApplied, referredBy, newPromoCode, startDate, endDate, 1, selectedPlan]
        );

        return res.status(200).json({
            message: "User registered successfully",
            data: {
                id: userId,
                promocode: newPromoCode,
                referred_by: referredBy,
                subscription: {
                    user_id: userId,
                    plan_name: selectedPlan,
                    amount: finalAmount,
                    original_price: parseFloat(subscription[0].amount),
                    discount_applied: discountApplied,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    is_active: 1
                }
            }
        });

    } catch (error) {
        console.error("Signup Error:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};







// 3. Edit Profile
export const editProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstname, lastname, email, password } = req.body;
        const hashPassword = password ? await bcrypt.hash(password, 10) : null;

        const updateQuery = "UPDATE users SET firstname=?, lastname=?, email=?, password=COALESCE(?, password) WHERE id=?";
        const [result] = await connection.query(updateQuery, [firstname, lastname, email, hashPassword, id]);

        if (result.affectedRows > 0) {
            return res.status(200).json({ message: "Profile updated successfully" });
        } else {
            return res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};




export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("email passs", email, password);
        

        // Check if the email exists in the admin table
        const adminQuery = "SELECT * FROM admin WHERE email= ?";
        const [adminUser] = await connection.query(adminQuery, [email]);

        if (adminUser.length > 0) {
            const admin = adminUser[0];
            const comparePassword = await bcrypt.compare(password, admin.password);
            if (!comparePassword) {
                return res.status(403).json({ message: "Password is incorrect" });
            }

            const token = await generatetoken(admin.id, "admin"); // Optionally pass role
            return res.status(200).json({
                message: "Admin Login successfull",
             success: true,
                data: { id: admin.id, email: admin.email,},
                role: "admin" ,
                token
            });
        }

        // If not admin, check in the users table
        const userQuery = "SELECT * FROM users WHERE email= ?";
        const [existingUser] = await connection.query(userQuery, [email]);

        if (existingUser.length === 0) {
            return res.status(401).json({ message: "Please sign up first" });
        }

        const user = existingUser[0];
        const comparePassword = await bcrypt.compare(password, user.password);
        if (!comparePassword) {
            return res.status(403).json({ message: "Password is incorrect" });
        }

        await connection.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);
        const token = await generatetoken(user.id, "user");

        return res.status(200).json({
            message: "User Login Successfull",
            success: true,
            data: { id: user.id, firstname: user.firstname, lastname: user.lastname, email: user.email },
            role: "user", token 
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};



export const createCategory = async (req, res) => {
    try {
        const { category_name } = req.body;

        if (!category_name) {
            return res.status(400).json({ message: "Category name is required" });
        }

        // Check if category already exists
        const [existingCategory] = await connection.query(
            "SELECT * FROM bookcategory WHERE category_name = ?",
            [category_name]
        );

        if (existingCategory.length > 0) {
            return res.status(400).json({ message: "Category already exists" });
        }

        // Insert new category
        const [result] = await connection.query(
            "INSERT INTO bookcategory (category_name) VALUES (?)",
            [category_name]
        );

        return res.status(201).json({
            message: "Category created successfully",
            data: { id: result.insertId, category_name },
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getcategory = async(req,res) =>{
    try{
        const mysqlQuery = "SELECT * FROM bookcategory";
        const [result] = await connection.query(mysqlQuery);
    
        if (result.length > 0) {
            return res.status(200).json({ message: "Category fetched successfully", data: result });
        } else {
            return res.status(404).json({ message: "No Category data found" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


export const addBook = async (req, res) => {
    try {
        const {  category_id, book_name,  description, status, image, audio_book_url,
            flip_book_url, author} = req.body;
        console.log("addBook", req.body);

        // if (!user_id || !category_id || !book_name ) {
        //     return res.status(400).json({ message: "Missing required fields" });
        // }

        const statusValue = status || "not completed"; // Default status
        const [result] = await connection.query(
            "INSERT INTO book ( category_id, book_name,  description, status, image, audio_book_url, flip_book_url, author) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?)",
            [ category_id, book_name,  description, statusValue, image, audio_book_url,
                flip_book_url, author]
        );
        return res.status(201).json({
            message: "Book added successfully",
            data: {
                id: result.insertId,
                category_id,
                book_name,
                description,
                status: statusValue,
                image,
                audio_book_url,
                flip_book_url,
                 author
            }
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getbook = async(req, res) =>{
    try{
        const mysqlQuery = "SELECT * FROM book";
        const [result] =  await connection.query(mysqlQuery);
        if(result.length > 0){
            return res.status(200).json({
                message:"book fatch successfully", 
        data:result
            });
        }
        else{
             return res.status(404).json({ message: "No Category data found" }); 
        }
    }
    catch{
        return res.status(500).json({message:"Internal server error", error: error.message })

    }
}

export const getBookByid = async(req, res) =>{
    try{
        const {id} = req.params;
        const mysqlQuery = "SELECT * FROM book WHERE id =?";
        const [result] =  await connection.query(mysqlQuery, [id]);
        if(result.length > 0){
            return res.status(200).json({
                message: "single Book fetched successfully", 
        data:result
            });
        }
        else{
             return res.status(404).json({ message: "No Book found" }); 
        }
    }
    catch(error){
        return res.status(500).json({message:"Internal server error", error: error.message })

    }
}


export const getBookByCategoryId = async (req, res) => {
    try {  
        
        
        const { id } = req.params;
        console.log("Category ID received:", req.params);

        const mysqlQuery = "SELECT * FROM book WHERE category_id = ?";
        const [result] = await connection.query(mysqlQuery, [id]);

        console.log("Query Result:", result);

        if (result.length > 0) {
            return res.status(200).json({
                message: "Category-wise books fetched successfully",
                data: result
            });
        } else {
            return res.status(404).json({ message: "No books found for this category" });
        }
    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};



export const  deltebook = async(req, res) => {
    const {id} = req.params;
    const mysqlQuery = "SELECT * FROM  book WHERE id =?";
    const [result] = await connection.query(mysqlQuery, [id]);
    if(result){
        return res.status(200).json({
            message:"Book  Deleted successfully",
            data:result
        })
    }
    else{
        return res.status(404).json({
         message: "No Book found"

        })
    }
}

// getAllUsersWithPromo



export const getAllUsersWithPromo = async (req, res) => {
    try {
        const [users] = await connection.query("SELECT id, firstname, lastname, email, promocode, is_active FROM users WHERE promocode IS NOT NULL");

        if (users.length > 0) {
            return res.status(200).json({ message: "Users with promo codes fetched successfully", data: users });
        } else {
            return res.status(404).json({ message: "No users found with promo codes" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// Cancel Subscription 








export const cancelSubscription = async (req, res) => {
    try {
        const { user_id } = req.params;

        // Deactivate the subscription
        const [updateSubscription] = await connection.query(
            "UPDATE subscriptions SET is_active = 0 WHERE user_id = ?",
            [user_id]
        );

        if (updateSubscription.affectedRows > 0) {
            // Also deactivate the user's promo code
            await connection.query("UPDATE users SET is_active = 0 WHERE id = ?", [user_id]);

            return res.status(200).json({ message: "Subscription and promo code deactivated successfully" });
        } else {
            return res.status(404).json({ message: "No active subscription found" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};




export const createSubscriptionByAdmin = async (req, res) => {
    try {
        const { admin_id, user_id, plan_name, amount, promocode } = req.body;

        // Verify if the admin exists
        const [admin] = await connection.query("SELECT * FROM admin WHERE id = ?", [admin_id]);
        if (admin.length === 0) {
            return res.status(403).json({ message: "Admin not found or unauthorized" });
        }

        let finalAmount = amount;
        let discountApplied = false;
        let referredBy = null;

        // Check if promo code is valid and belongs to an active user
        if (promocode) {
            const [referrer] = await connection.query("SELECT id FROM users WHERE promocode = ? AND is_active = 1", [promocode]);

            if (referrer.length > 0) {
                // Apply 20% discount if a valid promo code is found
                finalAmount = amount * 0.80; // 20% discount
                discountApplied = true;
                referredBy = referrer[0].id; // Assign the referring user's ID
            }
        }

        // Calculate subscription period
        const startDate = new Date();
        let endDate = new Date();
        if (plan_name.toLowerCase() === "monthly") endDate.setMonth(endDate.getMonth() + 1);
        else if (plan_name.toLowerCase() === "6 months") endDate.setMonth(endDate.getMonth() + 6);
        else if (plan_name.toLowerCase() === "1 year") endDate.setFullYear(endDate.getFullYear() + 1);

        // Insert the new subscription into the database
        const [result] = await connection.query(
            "INSERT INTO subscriptions (user_id, plan_name, amount, original_price, discount_applied, referred_by, promocode, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [user_id, plan_name, finalAmount, amount, discountApplied, referredBy, promocode, startDate, endDate, 1]
        );

        return res.status(201).json({
            message: "Subscription created successfully by Admin",
            data: {
                id: result.insertId,
                user_id,
                plan_name,
                amount: finalAmount,
                original_price: amount,
                discount_applied: discountApplied,
                referred_by: referredBy,
                promocode,
                start_date: startDate,
                end_date: endDate,
                is_active: 1
            }
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


export const getsubscription = async (req, res) => {
try{
    const mysqlQuery = "SELECT * FROM subscriptions";
    const [result] = await connection.query(mysqlQuery);
    if (result.length > 0) {
        return res.status(200).json({ message: "subscription fatched successfully",
            data:result
         });
    } else {
        return res.status(404).json({ message: "subscription not found" });
    }
}
catch{
    return res.status(500).json({ message: "Internal Server error" , error: error.message });
}


 
}





export const changePassword = async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;

        // Validate required fields
        if (!email || !currentPassword || !newPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Fetch user data
        const [user] = await connection.query("SELECT id, password FROM users WHERE email = ?", [email]);

        if (user.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const userId = user[0].id;
        const hashedPassword = user[0].password;

        // Verify current password
        const passwordMatch = await bcrypt.compare(currentPassword, hashedPassword);
        if (!passwordMatch) {
            return res.status(400).json({ message: "Incorrect current password" });
        }

        // Hash the new password
        const newHashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in database
        await connection.query("UPDATE users SET password = ? WHERE id = ?", [newHashedPassword, userId]);

        return res.status(200).json({ message: "Password updated successfully" });

    } catch (error) {
        console.error("Password Change Error:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};










    





