const elastic       = require('@elastic/elasticsearch'),
      express       = require('express'),
      morgan        = require('morgan'),
      passport      = require('passport'),
      bodyParser    = require('body-parser'),
      cookieParser  = require('cookie-parser'),
      cookieSession = require('cookie-session'),
      auth          = require('./auth'),
      config        = require('./config')

global.es = new elastic.Client(config.elastic)

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
app.use(bodyParser.json())
app.use(express.static('public'))

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

app.all('/data/:id?', async (req, res) => {
    try {
        if (req.method != 'GET' && !req.session.passport) {
            res.status(403).set('Content-Type', 'text/plain').send('Access forbidden')
        }
        switch (req.method) {
            case 'POST': {
                const data = await es.index({
                    index: config.elastic.index.data,
                    id: req.params.id,
                    body: Object.assign({ user: { name: req.session.passport.user.profile.displayName, time: new Date() }}, req.body),
                    refresh: 'wait_for'
                })
                res.json({ id: data.body._id, result: data.body.result })
                break
            }
            case 'PUT': {
                req.body.user = { name: req.session.passport.user.profile.displayName, time: new Date() }
                const data = await es.update({
                    index: config.elastic.index.data,
                    id: req.params.id,
                    body: {
                        doc: Object.assign({ user: { name: req.session.passport.user.profile.displayName, time: new Date() }}, req.body),
                        doc_as_upsert: true
                    },
                    refresh: 'wait_for'
                })
                res.json({ id: data.body._id, result: data.body.result })
                break
            }
            case 'GET': {
                if (req.params.id) {
                    const data = await es.get({ index: config.elastic.index.data, id: req.params.id })
                    res.json(data.body._source)
                } else {
                    const data = await es.search({ index: config.elastic.index.data, q: req.query.q, size: req.query.size })
                    res.json(data.body.hits.hits.reduce(function(map, hit) {
                        map[hit._id] = hit._source
                        return map
                    }, {}))
                }
                break
            }
            case 'DELETE': {
                const data = await es.delete({ index: config.elastic.index.data, id: req.params.id, refresh: 'wait_for' })
                res.json({ id: data.body._id, result: data.body.result })
                break
            }
        }
    } catch(error) {
        //console.log(error.toString())
        res.status(500).set('Content-Type', 'text/plain').send(error.stack)
    }
})

app.listen(config.daemon.port, config.daemon.host)

module.exports = app
