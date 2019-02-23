const mongoose = require('mongoose')

const bingSchema = {
    // mock: {
    //     type: Number,
    //     default: Obj.mock
    // }
}
const schema = new mongoose.Schema(bingSchema, {
    createdAt: 'createdTs',
    updateAt: 'updateTs'
})

const TYPE = 'bing'

module.exports = {
    schema,
    TYPE
}