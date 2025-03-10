import express from "express";
import { 
    getAllUsers, 
    signUp, 
    editProfile, 
    login ,
    createCategory,
    getcategory,
    addBook,
    getbook,
    getBookByid,
    createSubscriptionByAdmin,
getAllUsersWithPromo,
cancelSubscription
} from "../Controllers/AuthCtrl.js";

const router = express.Router();
// Get all users
router.get("/users", getAllUsers);

// User signup
router.post("/auth/signup", signUp);

// Edit user profile
router.put("/user/edit/:id", editProfile);

// Login (for Admin & Users)
router.post("/auth/login", login);

//crete  createCategory
router.post("/category", createCategory);

//get Category
router.get("/getcategory",getcategory)

//add book
router.post("/book", addBook);
//get book
router.get("/getbook", getbook)

router.get("/getBookByid/:id", getBookByid)

router.get("/getAllUsersWithPromo",getAllUsersWithPromo)
router.post("/createSubscriptionByAdmin",createSubscriptionByAdmin)
router.put("/cancelSubscription/:user_id",cancelSubscription)

createSubscriptionByAdmin

export default router;
