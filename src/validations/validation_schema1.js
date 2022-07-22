import Joi from 'joi'

const authSchema1=Joi.object().keys({
    name:Joi.string().required().trim()
    
})

export default authSchema1