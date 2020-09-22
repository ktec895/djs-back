const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const Schema = mongoose.Schema

const HostSchema = new Schema({
    name: String,
    description: String,
    avatarUrl: String,
    shows: [mongoose.SchemaTypes.ObjectId]
})

HostSchema.methods.getAllShows = async function() {
    return await mongoose.model('Show').find({ _id: { $in: this.shows }}).exec()
}

HostSchema.plugin(mongoosePaginate)

module.exports = mongoose.model('Host', HostSchema)