const router = require('express').Router()
const AWS = require('aws-sdk')
const jwt = require('jsonwebtoken')
const Host = require('../models/Host')
const User = require('../models/User')
const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'us-west-2' })

// create user
router.post('/', async (req, res) => {
  try {
    const { username, password, email } = req.body

    if (username === undefined || password == undefined || email === undefined)
      throw { message: 'Missing required attributes' }

    const params = {
      ClientId: process.env.AWS_CLIENT_ID,
      Password: password,
      Username: username,
      UserAttributes: [{
        Name: 'email',
        Value: email
      }]
    }

    await cognito.signUp(params).promise()

    const newUser = new User({ username })

    await newUser.save()

    res.status(201).send({
      message: 'Success! User Created',
      data: {},
    })

  } catch (err) {
    res.status(400).send({
      message: err.message,
      data: {},
    })
  }
})

router.post('/admin', async (req, res) => {
  try {
    const { username, email, roles, token } = req.body

    const token_data = jwt.verify(token, process.env.JWT_SECRET)

    if(!token_data.roles.admin)
      throw { message: 'Requires admin privilige' }
      
    if (username === undefined || email === undefined || roles == undefined)
      throw { message: 'Missing required attributes' }

    const params = {
      UserPoolId: process.env.AWS_USER_POOL_ID,
      Username: username,
      UserAttributes: [{
        Name: 'email',
        Value: email
      }],
      DesiredDeliveryMediums: ["EMAIL"]
    }

    await cognito.adminCreateUser(params).promise()

    const newUser = new User({ username })

    newUser.set("roles.host", roles.host)
    newUser.set("roles.admin", roles.admin)

    if (roles.host) {
      const newHost = new Host({ name: username })

      newUser.set("hostId", newHost._id)

      await newHost.save()
    }

    await newUser.save()

    res.status(201).send({
      message: 'Success! User Created',
      data: {},
    })

  } catch (err) {
    res.status(400).send({
      message: err.message,
      data: {},
    })
  }
})

// verify email
router.put('/:user/verification', async (req, res) => {
  try {
    const params = {
      ClientId: process.env.AWS_CLIENT_ID,
      ConfirmationCode: req.body.confirmation_code,
      Username: req.params.user
    }

    await cognito.confirmSignUp(params).promise()

    res.status(200).send({
      message: 'User Verified',
      data: {}
    })
  }
  catch (err) {
    res.status(400).send({
      message: err.message,
      data: {}
    })
  }
})

// login
router.post('/token', async (req, res) => {
  try {
    const { username, password } = req.body

    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.AWS_CLIENT_ID,
      AuthParameters: {
        'USERNAME': username,
        'PASSWORD': password
      }
    }

    const { AuthenticationResult } = await cognito.initiateAuth(params).promise()

    const user = await User.findOne({ username }).exec()

    if (!user)
      throw { message: 'User not found' }

    const token = jwt.sign({
      username: user.username,
      roles: user.roles,
      access_token: AuthenticationResult.AccessToken,
      refresh_token: AuthenticationResult.RefreshToken
    }, process.env.JWT_SECRET, { expiresIn: '2 days' })

    res.status(201).send({
      message: 'User authenticated',
      data: {
        token
      }
    })
  } catch (err) {
    res.status(400).send({
      message: err.message,
      data: {}
    })
  }
})

// refresh token
router.put('/token', async (req, res) => {
  try {
    const { token } = req.body

    const { refresh_token } = jwt.verify(token, process.env.JWT_SECRET)

    if(!refresh_token)
      throw { message: 'Missing refresh token' }

    const params = {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: process.env.AWS_CLIENT_ID,
      AuthParameters: {
        'REFRESH_TOKEN': refresh_token
      }
    }

    const { AuthenticationResult } = await cognito.initiateAuth(params).promise()
    
    token.access_token = AuthenticationResult.AccessToken

    res.send({
      message: 'Token refreshed',
      data: {
        token
      }
    })
  } catch(err) {
    res.send({
      message: err.message,
      data: {}
    })
  }
})

// forgot password
// update forgotten password
// update password

const createUserWithRoles = async (name, roles) => {
  const newUser = new User({ username: name })

  newUser.set("roles.host", roles.host)
  newUser.set("roles.admin", roles.admin)

  if (roles.host) {
    const newHost = new Host({ name })

    newUser.set("hostId", newHost._id)

    await newHost.save()
  }
  await newUser.save()
}

module.exports = router
