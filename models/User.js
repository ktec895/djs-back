const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema({
    username: String,
    hostId: String,
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

UserSchema.methods.setAsHost = async function(hostId) {
    return await mongoose.model('User').findOneAndUpdate({ _id: this._id }, { roles: { host: true}, hostId }).exec()
}

module.exports = mongoose.model('User', UserSchema)