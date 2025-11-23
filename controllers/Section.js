const Section = require("../models/Section");
const Course = require("../models/Course");
const SubSection = require("../models/SubSection")

exports.createSection = async(req,res)=>{
    try{
        //data fetch
        const {sectionName,courseId} = req.body;
        //data validation
        if(!sectionName || !courseId){
            return res.status(400).json({
                success:false,
                message:"Missing Properties",

            });
        }
        //create section
        const newSection = await Section.create({sectionName});
        //update course witg section ObjectId
        const updatedCourseDetails = await Course.findByIdAndUpdate(courseId,
            {
                $push:{
                    courseContent:newSection._id,
                }

            },
            {new:true},
            )
            //HW:use populate to replace sections/subsections both in the updatedCourseDetails
            .populate({
                path:"courseContent",
                populate:{
                    path:"subSection",
                }
            })
            .exec();

            //return response
            return res.status(200).json({
                success:true,
                message:"Section Created Successfully",
                updatedCourseDetails,
            })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Error in Section Creation",
            error:error.message,
        })
    }
}

//updateSection
exports.updateSection  = async (req,res)=>{
    try{
        //data input
        const{sectionName,sectionId,courseId} = req.body;
        //data validation
        // if(!sectionName 
        //     || !sectionId){
        //         return res.status(400).json({
        //             success:false,
        //             message:"Missing Properties",
        //         });
        //     }

            //update data
            const section = await Section.findByIdAndUpdate(sectionId,{sectionName},{new:true});

            const course = await Course.findById(courseId)
            .populate({
                path:"courseContent",
                populate:{
                    path:"subSection",
                }
            })
            .exec();

            //return response
            return res.status(200).json({
                success:true,
                message:section,
                data:course
                
            });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Error in updating the Section",
        })
    }
}

exports.deleteSection = async (req,res)=>{
    try{

        //find Id
        const {sectionId,courseId} = req.body;
        // const {sectionId} = req.params;
        await Course.findByIdAndUpdate(courseId,{
            $pull:{
                courseContent:sectionId
            }
        })

        //DeleteandUpdate
       const section = await Section.findById(sectionId);
        //hw ->while testing Course ko bhi update karo

        if(!section){
            return res.status(404).json({
                success:false,
                message:"Section not found",
            })
        }

        //delete a subsection
        await SubSection.deleteMany({_id:{$in:section.subSection}});
         
        await Section.findByIdAndDelete(sectionId);

        //find the updated course and return 
        const course = await Course.findById(courseId).
        populate({
            path:"courseContent",
            populate:{
                path:"subSection"
            }
        })
        .exec();
        //return response
        return res.status(200).json({
            success:true,
            message:"Section Deleted Successfully",
            data:course
                })
    }

    catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Unable to Delete Section, please try again later",
        })
    }


}