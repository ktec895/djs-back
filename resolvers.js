const Show = require('./models/Show')
const Host = require('./models/Host')
const Event = require('./models/Event')

module.exports = {
    Query: {
        shows: async () => await Show.find().exec(),
        show: async (_, {id}) => await Show.findOne({ _id: id }).exec(),
        host: async (_, {id}) => await Host.findOne({ _id: id }).exec(),
        event: async (_, {id}) => await Event.findOne({ _id: id}).exec()
    },
    Mutation: {
        createHost: async (_, {input}) => {
            const newHost = new Host({
                name: input.name,
                description: input.description,
                shows: []
            })

            return await newHost.save()
        },
        createEvent: async (_, {input}) => {
            const newEvent = new Event({
                name: input.name,
                description: input.description,
                date: new Date(input.date)
            })

            return await newEvent.save()
        },
        createShow: async (_, {input}) => {
            const newShow = new Show({
                name: input.name,
                genre: input.genre,
                description: input.description,
                hosts: input.hosts,
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
        updateAvatar: async (_, {hostId, imageUrl}) => await Host.findOneAndUpdate({ _id: hostId }, { avatarUrl: imageUrl }, { new: true }).exec(),
        updateShowImage: async (_, {showId, imageUrl}) => await Show.findOneAndUpdate({ _id: showId }, { imageUrl }, { new: true }).exec()
    },
    Host: {
        shows: (parent, args) => parent.getAllShows(),
    },
    Show: {
        hosts: (parent, args) => parent.getAllHosts(),
        events: (parent, args) => parent.getAllEvents()
    }
}