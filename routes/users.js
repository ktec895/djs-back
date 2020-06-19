const router = require('express').Router()
const AWS = require('aws-sdk')
const jwt = require('jsonwebtoken')
const cognito = new AWS.CognitoIdentityServiceProvider()

// create user
router.post('/', async (req, res) => {
  try {
    const params = {
      ClientId: process.env.AWS_CLIENT_ID,
      Password: req.body.password,
      Username: req.body.username,
      UserAttributes: [{
          Name: 'email',
          Value: req.body.email
      }]
    }

    const data = await cognito.signUp(params).promise()

    if (data.UserConfirmed !== true) throw { message: 'Error creating user' }
    else {
      res.status(201).send({
        message: 'User Created',
        data: {},
      })
    }
  } catch (err) {
    console.log(err)
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
    catch(err){
        res.status(400).send({
            message: err.message,
            data: {}
        })
    }
})

// login
router.post('/token', async (req, res) => {
    try {
        const params = {
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: process.env.AWS_CLIENT_ID,
            AuthParameters: {
                'USERNAME': req.body.user,
                'PASSWORD': req.body.password
            }
        }

        const { AuthenticationResult } = await cognito.initiateAuth(params).promise()

        const token = jwt.sign({
            access_token: AuthenticationResult.AccessToken,
            refresh_token: AuthenticationResult.RefreshToken
        }, process.env.JWT_SECRET, { expiresIn: '2 days'})
    } catch (err) {
        res.status(400).send({
            message: err.message,
            data: {}
        })
    }
})
// refresh token
// forgot password
// update forgotten password
// update password

module.exports = router
