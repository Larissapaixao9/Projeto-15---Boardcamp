import Joi from 'joi'

const pattern="/^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/"
//birthday: Joi.string().regex(RegExp(pattern))
const authSchemaCustomer=Joi.object().keys({
    name:Joi.string().required().trim(),
    cpf:Joi.string().length(11),
    birthday: Joi.required(),
    phone:Joi.required()
})

export default authSchemaCustomer