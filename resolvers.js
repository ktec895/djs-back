const Show = require('./models/Show')
const Host = require('./models/Host')
const Event = require('./models/Event')
const { GraphQLDateTime } = require('graphql-iso-date')

module.exports = {
    Query: {
        shows: async (_, {page, limit}) => {
            if(page < 1 || limit < 1)
                return []

            const { docs } = await Show.paginate({}, { page, limit })
            
            return docs
        }, 
        show: async (_, {id}) => await Show.findOne({ _id: id }).exec(),
        hosts: async (_, {page, limit}) => {
            if(page < 1 || limit < 1)
                return []

            const { docs } = await Host.paginate({}, {page, limit})

            return docs
        },
        host: async (_, {id}) => await Host.findOne({ _id: id }).exec(),
        event: async (_, {id}) => await Event.findOne({ _id: id}).exec()
    },
    Mutation: {
        createHost: async (_, {input}, { user }) => {
            if(!user || !user.roles || !user.roles.admin)
                return null

            const newHost = new Host({
                name: input.name,
                description: input.description,
                shows: []
            })

            return await newHost.save()
        },
        createEvent: async (_, {input, showId}, { user }) => {
            if(!user || !user.roles || !(user.roles.host || user.roles.admin))
                return null

            const newEvent = new Event({
                name: input.name,
                description: input.description,
                date: new Date(input.date)
            })
            
            await Show.updateOne({ _id: showId}, { $push: { events: newEvent._id }}).exec()

            return await newEvent.save()
        },
        createShow: async (_, {input}, {user}) => {
            if(!user || !user.roles || !user.roles.admin)
                return null

            const newShow = new Show({
                name: input.name,
                genre: input.genre,
                description: input.description,
                hosts: input.hosts,
                times: input.times,
                events: []
            })

            const show = await newShow.save()

            input.hosts.forEach(async host => {
                await Host.findOneAndUpdate({ _id: host }, {
                    $push: { shows: show._id }
                }).exec()
            })

            return show
        },
        updateAvatar: async (_, {hostId, imageUrl}, {user}) => {
            if(!user || !user.roles || !user.roles.host)
                return null

            await Host.findOneAndUpdate({ _id: hostId }, { avatarUrl: imageUrl }, { new: true }).exec()
        },
        updateShowImage: async (_, {showId, imageUrl}, {user}) => {
            if(!user || !user.roles || !user.roles.host)
                return null

            await Show.findOneAndUpdate({ _id: showId }, { imageUrl }, { new: true }).exec()
        },
        updateShowDesc: async (_, {showId, desc}, {user}) => {
            if(!user || !user.roles || !user.roles.host)
                return null

            await Show.findOneAndUpdate({ _id: showId }, { description: desc }, { new: true }).exec()
        },
        updateShowTimes: async (_, {showId, times}, {user}) => {
            if(!user || !user.roles || !user.roles.host)
                return null

            await Show.findOneAndUpdate({ _id: showId }, { times }, { new: true }).exec()
        }
    },
    Host: {
        shows: (parent, args) => parent.getAllShows(),
    },
    Show: {
        hosts: (parent, args) => parent.getAllHosts(),
        events: (parent, args) => parent.getAllEvents()
    },
    DateTime: GraphQLDateTime
}