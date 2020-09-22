const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const Schema = mongoose.Schema

const ShowSchema = new Schema({
    name: String,
    genre: String,
    imageUrl: String,
    description: String,
    times: [{
        start: {
            time: String,
            abbrev: {
                type: String,
                enum: ['AM', 'PM']
            }
        },
        end: {
            time: String,
            abbrev: {
                type: String,
                enum: ['AM', 'PM']
            }
        },
        days: [String]
    }],
    hosts: [mongoose.SchemaTypes.ObjectId],
    events: [mongoose.SchemaTypes.ObjectId]
})

ShowSchema.methods.getAllHosts = async function() {
    return await mongoose.model('Host').find({ _id: { $in: this.hosts }}).exec()
}


ShowSchema.methods.getAllEvents = async function() {
    return await mongoose.model('Event').find({ _id: { $in: this.events }}).exec()
}

ShowSchema.plugin(mongoosePaginate)

module.exports = mongoose.model('Show', ShowSchema)