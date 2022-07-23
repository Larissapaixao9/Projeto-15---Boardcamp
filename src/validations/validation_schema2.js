import Joi from 'joi'

const authSchema2=Joi.object().keys({
    name:Joi.string().required().trim(),
    stockTotal:Joi.number().min(1),
    image:Joi.required(),
    categoryId:Joi.required(),
    pricePerDay:Joi.number().min(1),
})

export default authSchema2
