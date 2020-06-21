const AWS = require('aws-sdk')
const router = require('express').Router()
const multer = require('multer')
const multers3 = require('multer-s3')
const path = require('path')

const s3 = new AWS.S3({
    params: {
        Bucket: process.env.AWS_BUCKET
    }
})

const imageUpload = multer({
    storage: multers3({
        s3,
        bucket: process.env.AWS_BUCKET,
        acl: 'public-read',
        key: (req, file, cb) => {
            cb(null, path.basename(file.originalname, path.extname(file.originalname) + '-' + Date.now() + path.extname(file.originalname)))
        }
    }),
    limits: {
        fileSize: 2000000
    },
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb)
    }
}).single('file')

const checkFileType = (file, cb) => {
    const fileTypes = /jpeg|jpg|png/
    const extname = fileTypes.test(path.extname( file.originalname ).toLowerCase())
    const mimetype = fileTypes.test(file.mimetype)

    if(mimetype && extname) 
        return cb(null, true)
    else
        cb('Error: images only')
}

router.post('/images', (req, res) => {
    imageUpload(req, res, (error) => {
        if (error)
            res.json({
                success: false,
                error
            })
        else {
            if(!req.file)
                res.json({
                    success: false,
                    message: 'Error: no file found'
                })
            else {
                const filename = req.file.key
                const location = req.file.location

                res.json({
                    success: true,
                    filename,
                    location
                })
            }
        }
    })
})

module.exports = router