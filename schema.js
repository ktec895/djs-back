const { gql } = require('apollo-server-express')

module.exports = gql`
    type Show {
        id: ID
        name: String
        genre: String
        imageUrl: String
        description: String
        hosts: [Host]
        events: [Event]
    }

    type Host {
        id: ID
        name: String
        description: String
        avatarUrl: String
        shows: [Show]
    }

    type Event {
        id: ID
        name: String
        description: String
        date: Int
    }

    type Query {
        shows: [Show]
        show(id: ID): Show
        host(id: ID): Host
        event(id: ID): Event
    }

    input ShowInput {
        name: String
        genre: String
        description: String
        hosts: [ID]
    }

    input HostInput {
        name: String
        description: String
    }

    input EventInput {
        name: String
        description: String
        date: Int
    }

    type Mutation {
        createHost(input: HostInput): Host
        createEvent(input: EventInput): Event
        createShow(input: ShowInput): Show
        updateAvatar(hostId: ID, imageUrl: String): Host
        updateShowImage(showId: ID, imageUrl: String): Show
    }
`