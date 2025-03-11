import express from "express";
import { 
    deltebook,
    getAllUsers, 
    signUp, 
    editProfile, 
    login ,
    createCategory,
    getcategory,
    addBook,
    getbook,
    getBookByid,
    getsubscription,
    createSubscriptionByAdmin,
getAllUsersWithPromo,
cancelSubscription,
changePassword
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
router.get("/getsubscription",getsubscription)

//add book
router.post("/book", addBook);
//get book
router.get("/getbook", getbook)

router.get("/getBookByid/:id", getBookByid)

router.get("/getAllUsersWithPromo",getAllUsersWithPromo)
router.post("/createSubscriptionByAdmin",createSubscriptionByAdmin)
router.put("/cancelSubscription/:user_id",cancelSubscription)

router.delete("/deltebook/:id", deltebook)





// Route to change password
router.post("/changepassword", changePassword);

export default router;
