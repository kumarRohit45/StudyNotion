const SubSection = require("../models/SubSection")
const CourseProgress = require("../models/CourseProgress")


exports.updateCourseProgress = async(req,res)=>{
    const {courseId, subsectionId} = req.body

    const userId = req.user.id

    try {
        const subsection = await SubSection.findById(subsectionId)

        if(!subsection){
            return res.status(404).json({
                error:"Invalid subsection"

            })
        }

        console.log("h1")
        // Find the course progress document for the user and course
        let courseProgress = await CourseProgress.findOne({
            courseID:courseId,
            userId: userId,

        })

        console.log("h2",courseProgress)
        if(!courseProgress){
            return res.status(404).json({
                success:false,
                message:"Course progress does not exist"

            })
        } else{
            // if course progress exists, check if the subsection is already completed
            if(courseProgress.completedVideos.includes(subsectionId)){
                return res.status(404).json({error: "Subsection is already completed"})
            }
            // Push the subsection in to the completedVideos array
            courseProgress.completedVideos.push(subsectionId)

        }

        console.log("h3")
        await courseProgress.save()

        return res.status(200).json({message:"Course progress updated"})

    } catch (error) {
        console.log(error)
        return res.status(500).json({error:"Internal server in courseProgress"})
    }
}