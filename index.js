const express = require('express')
const { ApolloServer } = require('apollo-server-express')
require('dotenv').config()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

const typeDefs = require('./schema')
const resolvers = require('./resolvers')

const fileRoutes = require('./routes/files')
const userRoutes = require('./routes/users')

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
    },
    context: ({ req }) => {
        if(req.headers.authorization == null)
            return null
        
        
    }
})

apollo.applyMiddleware({app})

app.use(bodyParser.json())
app.use('/api/files', fileRoutes)
app.use('/api/users', userRoutes)

app.listen(8080, () => console.log('Listening for requests on port 8080'))