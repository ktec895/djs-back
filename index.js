const express = require('express')
const { ApolloServer } = require('apollo-server-express')
require('dotenv').config()
const mongoose = require('mongoose')

const typeDefs = require('./schema')
const resolvers = require('./resolvers')
const fileUpload = require('./fileUpload')

mongoose.connect(process.env.MONGO_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    useFindAndModify: false 
})

mongoose.connection.on('connected', () => console.log('MongoDB connected'))

const app = express()

const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    playground: {
        endpoint: '/graphql'
    }
})

apollo.applyMiddleware({app})

app.use('/api', fileUpload)

app.listen(8080, () => console.log('Listening for requests on port 8080'))