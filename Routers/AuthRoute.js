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
changePassword,
getBookByCategoryId
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

router.post("/book", addBook);
router.get("/book", getbook)
router.get("/book/:id", getBookByid)
router.delete("/book/:id", deltebook)
router.get("/getAllUsersWithPromo",getAllUsersWithPromo)
router.post("/createSubscriptionByAdmin",createSubscriptionByAdmin)
router.put("/cancelSubscription/:user_id",cancelSubscription)


router.get("/getBookByCategoryId/:id", getBookByCategoryId)




// Route to change password
router.post("/changepassword", changePassword);

export default router;
