const config = require('./config')

const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy

module.exports = function (passport) {
    passport.serializeUser((user, done) => {
        console.log({ action: 'serialize', user: user })
        done(null, user)
    })
    passport.deserializeUser((user, done) => {
        console.log({ action: 'deserialize', user: user })
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