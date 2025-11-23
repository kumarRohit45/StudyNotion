//Import the required modules
const express = require("express");
const router = express.Router();

//Import the Controlllers

//course Controllers Import
const {
    createCourse,
    editCourse,
    getAllCourses,
    getCoursesDetails,
    getInstructorCourses,
    getFullCourseDetails,
    deleteCourse,
   
} = require("../controllers/Course");


// course Progress
const {updateCourseProgress} = require("../controllers/courseProgress")
//categories Controllers Import 
const { 
    showAllCategories, 
    categoryPageDetails,
    createCategory 
}    = require("../controllers/Category");

//Sections Controllers import
const{
    createSection,
    updateSection,
    deleteSection,
} = require("../controllers/Section");

//sub-Sections Controllers Import
const{
    createSubSection,
    updatedSubSection,
    deleteSubSection,
}  = require("../controllers/SubSection");

//Rating Controller Import

const { 
    createRating, 
    getAllRating,
    getAverageRating
 } = require("../controllers/RatingAndReview");

//Importing Middlewares
const {auth, isAdmin,isInstructor, isStudent } = require("../middlewares/auth");

//                 Course Routes



///Courses can only be created by Instructors
router.post("/createCourse",auth,isInstructor,createCourse)
//Edit course
router.post("/editCourse",auth,isInstructor,editCourse)
//Add a section to a course
router.post("/addSection",auth,isInstructor,createSection)
//update a section
router.post("/updateSection",auth,isInstructor,updateSection)
//delete a section
router.post("/deleteSection",auth,isInstructor,deleteSection)
// Edit sub Section
router.post("/updateSubSection",auth,isInstructor,updatedSubSection)
//Delete a sub section
router.post("/deleteSubSection",auth,isInstructor,deleteSubSection)
//add a sub section to a section
router.post("/addSubSection",auth,isInstructor,createSubSection)
//get all registered Courses
router.get("/getAllCourses",getAllCourses),
// get all courses Under a specific Instructor
router.get("/getInstructorCourses",auth,isInstructor,getInstructorCourses)
//get Details for a Specific Courses
router.post("/getCourseDetails",getCoursesDetails);
router.post("/getFullCourseDetails",auth,getFullCourseDetails);
router.delete("/deleteCourse",deleteCourse);
router.post("/updateCourseProgress",auth,isStudent,updateCourseProgress)

//                 Category routes
//                        (ONLY by Admin)


//category can only be created by Admin

router.post("/createCategory",auth,isAdmin,createCategory)
router.get("/showAllCategories",showAllCategories)
router.post("/getCategoryPageDetails",categoryPageDetails);

//                           Rating and Review

router.post("/createRating",auth,isStudent,createRating)
router.get("/getAverageRating",getAverageRating)
router.get("/getReviews",getAllRating);

module.exports = router;