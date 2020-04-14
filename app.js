const express = require('express'),
      morgan  = require('morgan'),
      config  = require('./config')

const app = express()

app.use(morgan('dev'))

app.route('/api/:action').get((req,res) => { res.json({ action: req.params.action }) })

app.listen(config.port, config.host)

module.exports = app
