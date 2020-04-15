const config = require('./config')

const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy

const cleanup = (user) => {
    const data = JSON.parse(JSON.stringify(user))
    delete data.profile._raw
    delete data.profile._json
    return data
}

module.exports = (passport) => {
    passport.serializeUser(async (user, done) => {
        const data = cleanup(user)
        const id = `${data.profile.provider}-${data.profile.id}`
        console.log({ action: 'serialize', user: data })
        await es.index({ index: config.elastic.index.auth, id: id, body: data })
        done(null, user)
    })
    passport.deserializeUser((user, done) => {
        console.log({ action: 'deserialize', user: cleanup(user) })
        done(null, user)
    })
    passport.use(new GoogleStrategy({
        clientID: config.auth.google.id,
        clientSecret: config.auth.google.secret,
        callbackURL: config.auth.google.url
    }, (token, refreshToken, profile, done) => {
        return done(null, {
            profile: profile,
            token: token
        })
    }))
}