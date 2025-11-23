const Category = require("../models/Category");
function getRandomInt(max) {
    return Math.floor(Math.random() * max)
  }

//create Tag's handler function

exports.createCategory = async (req,res)=>{
    try{
        //fetch data
        const {name,description} = req.body;
        //validation
        if(!name || !description){
            return res.status(400).json({
                success:false,
                message:"All fiels are required",
            })

        }
        //create entry in DB
        const categoryDetails = await Category.create({
            name:name,
            description:description,
        });
        console.log(categoryDetails);
        //return response
        return res.status(200).json({
            success:true,
            message:"Category Created Successfully",
        })
    }

    catch(error){
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}

//getAllTags handler function
exports.showAllCategories= async(req,res)=>{
    try{
    const allCategories = await Category.find({});
    res.status(200).json({
        success:true,
        message:"All Categories returned successfully",
        data:allCategories,
    })
    }
    catch(error){
      return res.status(500).json({
        success:false,
        message:error.message,
      })
    }
}

//categoryPageDetails
exports.categoryPageDetails = async (req,res)=>{
    try{
        //get categoryId
        const {categoryId} = req.body;
        //get courses for specfied categoryId
        const selectedCategory = await Category.findById(categoryId)
        .populate(
            {
                path:"courses",
            match:{status:"Published"},
        populate:"ratingAndReviews",
    })
        .exec();

        //validation
        if(!selectedCategory){
            return res.status(404).json({
                success:false,
                message:"category not found",
            });
        }

        // Handle the case when there are no courses
        if(selectedCategory.courses.length === 0){
            console.log("No courses found for the selected category")
            return res.status(404).json({
                success:false,
                message:"No courses found for the selected category."
            })
        }
        //get course for different categories
        const categoriesExceptSelected = await Category.find({
            _id:{$ne:categoryId}
        })
     
      let differentCategory = await Category.findOne(
        categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]
        ._id
      )
        .populate({
            path:"courses",
        match:{status:"Published"},
    })
        .exec();

        // HW : get top selling courses
        const allCategories = await Category.find()
        .populate({
            path:"courses",
            match:{status:"Published"},
            populate:{
                path:"instructor"
            }
        }).exec()

        const allCourses = allCategories.flatMap((category)=> category.courses)
        const mostSellingCourses = allCourses.sort((a,b)=> b.sold-a.sold)
        .slice(0,10)



        return res.status(200).json({
            success:true,
            data:{
                selectedCategory,
                differentCategory,
                mostSellingCourses
            }
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
         message:"Internal server error in category page details",
         error:error.message
        })
    }
}
