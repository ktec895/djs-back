const router = require('express').Router()
const AWS = require('aws-sdk')
const jwt = require('jsonwebtoken')
const Host = require('../models/Host')
const User = require('../models/User')
const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'us-west-2' })

/*

*/
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
      throw { message: 'Requires admin privilege' }

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
router.put('/:username/verification', async (req, res) => {
  try {
    const params = {
      ClientId: process.env.AWS_CLIENT_ID,
      ConfirmationCode: req.body.confirmation_code,
      Username: req.params.username
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

    const resData = await cognito.initiateAuth(params).promise()

    if(resData.ChallengeName)
      throw { message: 'Must create new password' }

    const { AuthenticationResult } = resData

    const user = await User.findOne({ username }).exec()

    if (!user)
      throw { message: 'User not found' }

    const token = jwt.sign({
      username: user.username,
      roles: user.roles,
      hostId: user.hostId,
      access_token: AuthenticationResult.AccessToken,
      refresh_token: AuthenticationResult.RefreshToken
    }, process.env.JWT_SECRET, { expiresIn: AuthenticationResult.ExpiresIn })

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

router.post('/token/temporary', async (req, res) => {
  try {
    const { username, temp_password, new_password } = req.body

    if (!username || !temp_password || !new_password)
      throw { message: 'Missing required parameters' }

    let params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.AWS_CLIENT_ID,
      AuthParameters: {
        'USERNAME': username,
        'PASSWORD': temp_password
      }
    }

    const { ChallengeName, Session } = await cognito.initiateAuth(params).promise()

    if(!ChallengeName || ChallengeName !== 'NEW_PASSWORD_REQUIRED')
      throw { message: 'Invalid authentication parameters' }
    
    params = {
      ChallengeName,
      Session,
      ClientId: process.env.AWS_CLIENT_ID,
      ChallengeResponses: {
        'USERNAME': username,
        'NEW_PASSWORD': new_password
      }
    }

    const { AuthenticationResult } = await cognito.respondToAuthChallenge(params).promise()

    const user = await User.findOne({ username }).exec()

    if (!user)
      throw { message: 'User not found' }

    const token = jwt.sign({
      username: user.username,
      roles: user.roles,
      access_token: AuthenticationResult.AccessToken,
      refresh_token: AuthenticationResult.RefreshToken
    }, process.env.JWT_SECRET, { expiresIn: AuthenticationResult.ExpiresIn })

    res.status(201).send({
      message: 'New user confirmed and password set',
      data: {
        token
      }
    })
  } catch(err) {
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

    res.status(200).send({
      message: 'Token refreshed',
      data: {
        token
      }
    })
  } catch(err) {
    res.status(400).send({
      message: err.message,
      data: {}
    })
  }
})

// forgot password
router.put('/:username/password/forgot', async (req, res) => {
  try {
    const params = {
      ClientId: process.env.AWS_CLIENT_ID,
      Username: req.params.username
    }

    await cognito.forgotPassword(params).promise()

    res.status(200).send({
      message: 'Forgot password message sent',
      data: {}
    })
  } catch(err) {
    res.status(400).send({
      message: err.message,
      data: {}
    })
  }
})

// update forgotten password
router.put('/:username/password/confirm', async (req, res) => {
  try {
    const { new_password, confirmation_code } = req.body

    const params = {
      ClientId: process.env.AWS_CLIENT_ID,
      ConfirmationCode: confirmation_code,
      Username: req.params.username,
      Password: new_password
    }

    await cognito.confirmForgotPassword(params).promise()

    res.status(200).send({
      message: 'Forgotten password updated',
      data: {}
    })
  } catch(err) {
    res.status(400).send({
      message: err.message,
      data: {}
    })
  }
})

// update password
router.put('/:username/password', async (req, res) => {
  try {
    const { previous_password, new_password, token } = req.body

    const { access_token } = jwt.verify(token, process.env.JWT_SECRET)

    if(!access_token)
      throw { message: 'Invalid access token' }
    
    const params = {
      AccessToken: access_token,
      PreviousPassword: previous_password,
      ProposedPassword: new_password
    }

    await cognito.changePassword(params).promise()

    res.status(200).send({
      message: 'Password updated',
      data: {}
    })
  } catch(err) {
    res.status(400).send({
      message: err.message,
      data: {}
    })
  }
})

router.put('/:username/roles', async (req, res) => {
  try {
    const { roles } = req.body
    const { username } = req.params

    const user = await User.findOne({ username }).exec()

    if(!user.roles.host && roles.host)
    {
      const newHost = new Host({ name: username })

      user.set('hostId', newHost._id)
      user.set('roles.host', true)

      await newHost.save()
    }
    else if(user.roles.host && !roles.host) {
      await Host.findByIdAndDelete({ _id: user.hostId }).exec()

      user.set('roles.host', false)
    }

    user.set('roles.admin', roles.admin)

    await user.save()

    res.status(200).send({
      message: 'User Roles Updated',
      data: {}
    })

  } catch(err) {
    res.status(400).send({
      message: err.message,
      data: {}
    })
  }
})

module.exports = router
