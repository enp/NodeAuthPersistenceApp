const express       = require('express'),
      morgan        = require('morgan'),
      passport      = require('passport'),
      cookieParser  = require('cookie-parser'),
      cookieSession = require('cookie-session'),
      auth          = require('./auth'),
      config        = require('./config')

const app = express()

auth(passport)

app.use(passport.initialize())
app.use(morgan('dev'))

app.use(cookieSession({
    name: config.session.name,
    keys: [ config.session.key ],
    maxAge: 24 * 60 * 60 * 1000
}))
app.use(cookieParser())

app.get('/auth/logout', (req, res) => {
    req.logout()
    req.session = null
    res.redirect('/')
})

app.get('/auth/login', passport.authenticate('google', {
    scope: ['https://www.googleapis.com/auth/userinfo.profile']
}))

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
        res.redirect('/')
    }
)

app.get('/auth/session', (req, res) => {
    res.json(req.session)
})

//app.route('/api/:action').get((req,res) => { res.json({ action: req.params.action, session: req.session }) })

app.listen(config.daemon.port, config.daemon.host)

module.exports = app
