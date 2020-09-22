const express = require('express')
const { ApolloServer } = require('apollo-server-express')
require('dotenv').config()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const ip = require('ip')

const extractToken = require('./extractToken')

const typeDefs = require('./schema')
const resolvers = require('./resolvers')

const fileRoutes = require('./routes/files')
const userRoutes = require('./routes/users')

const port = process.env.PORT || 8000

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
})

mongoose.connection.on('connected', () => console.log('MongoDB connected'))

const app = express()

const apollo = new ApolloServer({
  typeDefs,
  resolvers,
  playground: {
    endpoint: '/graphql',
  },
  context: ({ req }) => {
    try {
      token = extractToken(req.headers.authorization)

      if (token == null) return null

      return { user: jwt.verify(token, process.env.JWT_SECRET) }
    } catch (err) {
      return null
    }
  },
})

apollo.applyMiddleware({ app })

app.use(bodyParser.json())
app.use('/api/files', fileRoutes)
app.use('/api/users', userRoutes)
app.use(express.static('public'))

app.listen(port, () => {
  console.log(`Open locally at: http://localhost:${port}`)
  console.log(`Or on network at: http://${ip.address()}:${port}`)
})
