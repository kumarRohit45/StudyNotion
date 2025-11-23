const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const{uploadImageToCloudinary} = require("../utils/imageUploader");
require("dotenv").config();

exports.createSubSection  = async(req,res) =>{
    try{
        //fetch data from the req body
        const {sectionId, title , description } = req.body;

        //extract files 
        const video = req.files.video;
        //validation
        if(!sectionId || !title || !video|| !description){
            return res.status(400).json({
                success:false,
                message:"All fiels are required",
            });
        }
        console.log(video);

        //upload to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video,process.env.FOLDER_NAME);

        //create a sub-section
        const subSectionDetails = await SubSection.create({
            title:title,
            timeDuration:`${uploadDetails.duration}`,
            description:description,
            videoUrl:uploadDetails.secure_url,
        })
        //update section with this subSection ObjectId 
        const updatedSection = await Section.findByIdAndUpdate({_id:sectionId},{
            $push:{
                subSection:subSectionDetails._id
            }},
            {new:true} )
            //HW:log updated section here, after adding populate query
            .populate("subSection")

            //return response
            return res.status(200).json({
                success:true,
                message:"SubSection Created Successfully",
                data:updatedSection

            });

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Internal Server Error",
            error:error.message,
        })
    }
}


// HW

// 1.update SUbSection 
exports.updatedSubSection = async (req,res)=>{
    try{
        const {sectionId,subSectionId,title,description} = req.body;
       const subSection = await SubSection.findById(subSectionId);

       if(!subSection){
        return res.status(404).json({
            success:false,
            message:"SubSection not found",
        })
       }
       if(title !== undefined){
        subSection.title = title;
       }
       if(description !== undefined){
        subSection.description = description;
       }
       if(req.files && req.files.video !== undefined){
        const video = req.files.video;
        const uploadDetails  = await uploadImageToCloudinary(
            video,
            process.env.FOLDER_NAME,
        )
        subSection.videoUrl = uploadDetails.secure_url;
        subSection.timeDuration  = `${uploadDetails.duration}`
       }
       await subSection.save();

       //find updated section and return it
       const updatedSection = await Section.findById(sectionId).
       populate("subSection")
       return res.json({
        success:true,
        message:"subSection updated successfully",
        data:updatedSection
       })
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:"An errro occurred while updating the subsection",
        })
    }
}
// 2.Delete SubSection

exports.deleteSubSection = async (req,res)=>{
    try{
        const{subSectionId, sectionId} = req.body;
        await Section.findByIdAndUpdate(
            {_id:sectionId},
            {
                $pull:{
                    subSection:subSectionId,
                },
            }
        )
        const subSection = await SubSection.findByIdAndDelete
        ({_id:subSectionId})

        if(!subSection){
            return res.status(404).json({
                success:false,
                message:"SubSection not fount"
            })
        }

        const updatedSubSection = await Section.findById(sectionId).populate("subSection")
        return res.json({
            success:true,
            message:"SubSection deleted successfully",
            data:updatedSubSection
        })
    }
    catch(error){
        console.error(error)
        return res.status(500).json({
            success:false,
            message:"An error occurred while deleting the subsection",
        })
    }
}