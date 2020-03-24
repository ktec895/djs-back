const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ShowSchema = new Schema({
    name: String,
    genre: String,
    imageUrl: String,
    description: String,
    hosts: [mongoose.SchemaTypes.ObjectId],
    events: [mongoose.SchemaTypes.ObjectId]
})

ShowSchema.methods.getAllHosts = async function() {
    return await mongoose.model('Host').find({ _id: { $in: this.hosts }}).exec()
}


ShowSchema.methods.getAllEvents = async function() {
    return await mongoose.model('Event').find({ _id: { $in: this.events }}).exec()
}

module.exports = mongoose.model('Show', ShowSchema)