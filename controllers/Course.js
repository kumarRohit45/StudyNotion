const { populate } = require("dotenv");
const Course = require("../models/Course");
const Category= require("../models/Category");
const User = require("../models/User");
const Section = require("../models/Section")
const {uploadImageToCloudinary} = require('../utils/imageUploader');
const SubSection = require("../models/SubSection");
const CourseProgress = require("../models/CourseProgress");
const { convertSecondsToDuration } = require("../utils/secToDuration");

//create Course handler function
exports.createCourse = async(req,res)=>{
    try{
        //Get user ID from request object
        const userId= req.user.id;

        //fetch data
        let{
            courseName,
            courseDescription,
            whatYouWillLearn,
            price,
            tag: _tag,
            category,
            status,
            instructions: _instructions
        } = req.body;

    //get thumbnail
    console.log("ok")
    const thumbnail = req.files.thumbnailImage;
    console.log("thumbnail",thumbnail)
    console.log("OK1")
    
    const tag = JSON.parse(_tag)
    console.log("tag",tag)
    const instructions = JSON.parse(_instructions)

    console.log("first",instructions)

    //validation
    if(!courseName || !courseDescription || !whatYouWillLearn ||
    !price || 
    !tag.length||  
    !thumbnail ||
    !category||
    !instructions.length
){
        return res.status(400).json({
            success:false,
            message:"All fields are required",
        });
    }

    console.log("OK2")
    if(!status || status === undefined){
        status = "Draft";
    }
    //check if the user is an instructor
    const instructorDetails = await User.findById(userId,{
        accountType:"Instructor",
    });
    console.log("Instructor Details" , instructorDetails);

    if(!instructorDetails){
        return res.status(404).json({
            success:false,
            message:"Instructor Details not found",
        })
    }
    console.log("hhhh")

    //check given category is valid or not
    const categoryDetails = await Category.findById(category);
    // console.log("categoryDetails",categoryDetails)
    if(!categoryDetails){
        return res.status(404).json({
            success:false,
            message:"Category Details not found"
        });
    }

    //Upload Image to Cloudinary
    const thumbnailImage = await uploadImageToCloudinary(thumbnail,process.env.FOLDER_NAME);

    console.log(thumbnailImage);
    //create an entry for new course
    const newCourse = await Course.create({
        courseName,
        courseDescription,
        instructor:instructorDetails._id,
        whatYouWillLearn:whatYouWillLearn,
        price,
        tag,
        category:categoryDetails._id,
        thumbnail:thumbnailImage.secure_url,
        status:status,
        instructions
    })

    //add the new course to the user schema of istructor
    await User.findByIdAndUpdate(
        {_id: instructorDetails._id},
        {
            $push:{
                courses:newCourse._id,
            }

        },
        {new:true},

        )
     //Add the new course to the categories
     await Category.findByIdAndUpdate(
        { _id:category},
        {
            $push:{
                courses:newCourse._id,
            },

        },
        {new:true}
     );

        //return response
        return res.status(200).json({
            success:true,
            message:"Course Created Successfully",
            data:newCourse,
        })
    }
    catch(error){

        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Error while creating course"
        })
    }
}
//Edit Course Details

exports.editCourse = async(req,res)=>{
    try {
        const {courseId} = req.body;
        const updates = req.body;
        const course = await Course.findById(courseId);
    
        if(!course){
            return res.status(404).json({
                error:"Couldn't found"
            })
        }
    
        console.log("updates",updates);
        console.log("course",course);
        if(req.files){
            const thumbnail = req.files.thumbnailImage
            const thumbnailImage = await uploadImageToCloudinary(thumbnail,process.env.FOLDER_NAME)
            course.thumbnail = thumbnail.secure_url
        }
    
            //updates only the fields that are present in the request body
            for(const key in updates){

                if(updates.hasOwnProperty(key)){
                    console.log("key",key)
                    if(key === "tag" || key === "instructions"){
                        course[key] = updates[key]
                    }
                    else{
                        console.log("elseCase in key updares")
                        course[key] = updates[key]
                    }
                }
            }
            await course.save();
    
            const updatedCourse = await Course.findOne({_id:courseId})
            .populate({
                path:"instructor",
                populate:{
                    path:"additionalDetails",
    
                }
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path:"courseContent",
                populate:{
                    path:"subSection"
                }
            })
            .exec()
            console.log("updated course details",updatedCourse)
    
            res.json({
                success:true,
                message: "Course updated Successfully",
                data:updatedCourse
            })
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Intenal server error in edit Course API"
        })
    }
    
}
//getAllCourses handler function
exports.getAllCourses = async(req,res)  =>{
    try{
        const allCourses = await Course.find({} ,{courseName:true,
        price:true,
        thumbnail:true,
        instructor:true,
        ratingAndReviews:true,
        studentEnrolled:true,}
        )
        .populate("instructor")
        .exec();


        return res.status(200).json({
            success:true,
            message:"Data for all courses fetched successfully",
            data:allCourses,
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Cannot fetch course Data",
            error:error.message,
        })
    }
}

//getCoursesDetails
exports.getCoursesDetails = async (req,res)=>{
    try{
        //get id
        const {courseId} =req.body;
  
        //find course details
        const courseDetails = await Course.findById(
            {_id:courseId}
        )
        .populate(
            {path:"instructor",
            populate:{
                path:"additionalDetails",
                
            },

        }
        )
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
            path:"courseContent",
            populate:{
                path:"subSection",
                select:"-videoUrl",
            },
        })
        .exec();

     

        //validation
        if(!courseDetails){
            return res.status(400).json({
                success:false,
                message:`Could not find the course  with id: ${courseId}`
            });
        }
        return res.status(200).json({
            success:true,
            // message:"course details fetched successfully",
            data: courseDetails
        })
    }

    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        });
    }
}

// get a list of course for a given Instructor
exports.getInstructorCourses = async(req,res)=>{
    try{
        const instructorId = req.user.id

        const instructorCourses = await Course.find({
            instructor: instructorId
        }).sort({createdAt:-1})

        res.status(200).json({
            success:true,
            data:instructorCourses
        })

    }catch(error){
        console.log(error)
        res.status(500).json({
            success:false,
            message:"Failed to retrieve instructor courses",
            error:error.message
        })
    }
}

exports.getFullCourseDetails = async(req,res)=>{
    try {
        const {courseId} = req.body
        const userId = req.user.id
        const courseDetails = await Course.findOne({
            _id:courseId,
        })
        .populate({
            path:"instructor",
            populate:{
                path:"additionalDetails",
            },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
            path:"courseContent",
            populate:{
                path:"subSection",
            }
        })
        .exec()

        let courseProgressCount = await CourseProgress.findOne({
            courseID: courseId,
            userId:userId
        })

        if(!courseDetails){
            return res.status(400).json({
                success:false,
                message:`Could not find course with id:${courseId}`
            })
        }

        let totalDurationInSeconds = 0 
        courseDetails.courseContent.forEach((content)=>{
            content.subSection.forEach((subSection)=>{
                const timeDurationInSeconds = parseInt(subSection.timeDuration)
                totalDurationInSeconds += timeDurationInSeconds
            })
        })

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

        return res.status(200).json({
            success:true,
            data:{
                courseDetails,
                totalDuration,
                completedVideos: courseProgressCount?.completedVideos
                ? courseProgressCount?.completedVideos
                : []

            }
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}
// Delete the course
exports.deleteCourse = async(req,res)=>{
    try {
        const {courseId} = req.body

        const course = await Course.findById(courseId)
        if(!course){
            return res.status(404).json({message:"Course not found"})
        }

        //unenroll students from the course
        const studentsEnrolled = course.studentEnrolled
        for(const studentId of studentsEnrolled){
            await User.findByIdAndUpdate(studentId,{
                $pull:{courses:courseId}
            })
        }
        // delete sections and subsection
        const courseSections = course.courseContent
        for(const sectionId of courseSections){
            //Delete the sub-sections of the section
            const section  = await Section.findById(sectionId)
            if(section){
                const subSections = section.subSection
                for(const subSectionId of subSections){
                    await SubSection.findByIdAndDelete(subSectionId)
                }

            }

            //Delete the section
            await Section.findByIdAndDelete(sectionId)
        
        }
        // Delete the course
        await Course.findByIdAndDelete(courseId)
        return res.status(200).json({
            success:true,
            message:"Course deleted successfully"
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Server error in Delete course ",
            error:error.message
        })
    }
}