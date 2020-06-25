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
        times: [TimeSig]
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
        date: DateTime
    }

    type TimeSig {
        start: Time
        end: Time
        days: [String]
    }

    type Time {
        time: String
        abbrev: String
    }

    type Query {
        shows(page: Int, limit: Int): [Show]
        show(id: ID): Show
        hosts(page: Int, limit: Int): [Host]
        host(id: ID): Host
        event(id: ID): Event
    }

    input ShowInput {
        name: String
        genre: String
        description: String
        hosts: [ID]
        times: [TimeSigInput]
    }

    input TimeSigInput {
        start: TimeInput
        end: TimeInput
        days: [String]
    }

    input TimeInput {
        time: String
        abbrev: String
    }

    input HostInput {
        name: String
        description: String
    }

    input EventInput {
        name: String
        description: String
        date: DateTime
    }

    type Mutation {
        createHost(input: HostInput): Host
        createEvent(input: EventInput, showId: ID): Event
        createShow(input: ShowInput): Show
        updateAvatar(hostId: ID, imageUrl: String): Host
        updateShowImage(showId: ID, imageUrl: String): Show
        updateShowDesc(showId: ID, desc: String): Show
        updateShowTimes(showId: ID, times: [TimeSigInput]): Show
    }

    scalar DateTime
`