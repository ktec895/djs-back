const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema({
    username: String,
    hostId: mongoose.SchemaTypes.ObjectId,
    roles: {
        host: {
            type: Boolean,
            default: false
        },
        admin: {
            type: Boolean,
            default: false
        }
    }
})

UserSchema.statics.findByUsername = async function(username) {
    return await this.findOne({ username }).exec()
}

module.exports = mongoose.model('User', UserSchema)